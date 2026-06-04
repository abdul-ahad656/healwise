"""Cancel, reschedule, completion, and consultation duration tracking."""
from datetime import datetime

from bson.objectid import ObjectId
from flask import jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity

from app.controllers.appointment_controller import (
    _serialize_appointment_for_response,
)
from app.extensions import mongo
from app.utils.appointment_scheduling import (
    MIN_CONSULTATION_MINUTES_AUTO_COMPLETE,
    filter_future_slots,
    is_past_day,
    is_past_slot,
    now_local,
    recompute_overlap_duration_seconds,
)
from app.utils.slot_locking import (
    get_unavailable_slots_for_doctor,
    has_active_appointment,
    release_slot_lock,
)

_CANCELLABLE = {"pending", "accepted", "confirmed", "in_progress"}
_RESCHEDULABLE = {"pending", "accepted", "confirmed"}
_ACTIVE_BOOKING = {"pending", "accepted", "confirmed", "in_progress"}


def _find_appointment(appointment_id: str):
    try:
        oid = ObjectId(appointment_id)
    except Exception:
        return None, jsonify({"error": "Invalid appointment ID"}), 400
    doc = mongo.db.appointments.find_one({"_id": oid})
    if not doc:
        return None, jsonify({"error": "Appointment not found"}), 404
    return doc, None, None


def _user_may_access(appointment, user_id: str, role: str):
    if role == "patient" and str(appointment.get("patientId")) == str(user_id):
        return True
    if role == "doctor" and str(appointment.get("doctorId")) == str(user_id):
        return True
    return False


def _consultation_minutes(appointment) -> float:
    seconds = int(appointment.get("consultationDurationSeconds") or 0)
    return seconds / 60.0


def _finalize_completion(appointment_id, completion_type: str, extra=None):
    update = {
        "status": "completed",
        "completedAt": datetime.utcnow(),
        "completionType": completion_type,
        "updatedAt": datetime.utcnow(),
    }
    if extra:
        update.update(extra)
    mongo.db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": update},
    )


def try_auto_complete_appointment(appointment) -> dict:
    """Mark completed when overlap duration >= threshold."""
    if appointment.get("status") in ("completed", "cancelled", "rejected"):
        return appointment

    duration_seconds = recompute_overlap_duration_seconds(appointment)
    if duration_seconds > 0 and appointment.get("consultationDurationSeconds") != duration_seconds:
        mongo.db.appointments.update_one(
            {"_id": appointment["_id"]},
            {"$set": {"consultationDurationSeconds": duration_seconds}},
        )
        appointment["consultationDurationSeconds"] = duration_seconds

    if _consultation_minutes(appointment) >= MIN_CONSULTATION_MINUTES_AUTO_COMPLETE:
        _finalize_completion(
            str(appointment["_id"]),
            "auto_duration",
            {"autoCompletedAt": datetime.utcnow()},
        )
        appointment = mongo.db.appointments.find_one({"_id": appointment["_id"]})

    return appointment


def enrich_and_auto_complete_list(appointments: list) -> list:
    out = []
    for doc in appointments:
        doc = try_auto_complete_appointment(doc)
        out.append(_serialize_appointment_for_response(doc))
    return out


def cancel_appointment(appointment_id: str):
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    appointment, err_resp, err_code = _find_appointment(appointment_id)
    if err_resp:
        return err_resp, err_code

    if role not in ("patient", "doctor"):
        return jsonify({"error": "Unauthorized"}), 403

    if not _user_may_access(appointment, user_id, role):
        return jsonify({"error": "You cannot cancel this appointment"}), 403

    if appointment.get("status") not in _CANCELLABLE:
        return jsonify({
            "error": f"Cannot cancel appointment with status {appointment.get('status')}"
        }), 400

    mongo.db.appointments.update_one(
        {"_id": appointment["_id"]},
        {
            "$set": {
                "status": "cancelled",
                "cancelledAt": datetime.utcnow(),
                "cancelledBy": role,
                "updatedAt": datetime.utcnow(),
            }
        },
    )

    release_slot_lock(
        str(appointment.get("doctorId")),
        appointment.get("appointmentDate"),
        appointment.get("appointmentTime"),
    )

    return jsonify({"message": "Appointment cancelled", "status": "cancelled"}), 200


def reschedule_appointment(appointment_id: str):
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")
    data = request.json or {}

    new_date = data.get("appointmentDate") or data.get("date")
    new_time = data.get("appointmentTime") or data.get("time")

    if not new_date or not new_time:
        return jsonify({"error": "appointmentDate and appointmentTime are required"}), 400

    appointment, err_resp, err_code = _find_appointment(appointment_id)
    if err_resp:
        return err_resp, err_code

    if role not in ("patient", "doctor"):
        return jsonify({"error": "Unauthorized"}), 403

    if not _user_may_access(appointment, user_id, role):
        return jsonify({"error": "You cannot reschedule this appointment"}), 403

    if appointment.get("status") not in _RESCHEDULABLE:
        return jsonify({
            "error": f"Cannot reschedule appointment with status {appointment.get('status')}"
        }), 400

    if is_past_day(new_date) or is_past_slot(new_date, new_time):
        return jsonify({"error": "Cannot reschedule to a past date or time"}), 400

    doctor_id = str(appointment.get("doctorId"))
    slot_doc = mongo.db.doctor_availability.find_one({
        "doctorId": doctor_id,
        "day": new_date,
        "slots": {"$in": [new_time]},
    })
    if not slot_doc:
        return jsonify({"error": "Selected slot is not available for this doctor"}), 400

    if has_active_appointment(
        doctor_id,
        new_date,
        new_time,
        exclude_appointment_id=appointment["_id"],
    ):
        return jsonify({"error": "Doctor is already booked at this time"}), 409

    unavailable = get_unavailable_slots_for_doctor(doctor_id)
    old_slot = (appointment.get("appointmentDate"), appointment.get("appointmentTime"))
    unavailable.discard(old_slot)
    if (new_date, new_time) in unavailable:
        return jsonify({
            "error": "Selected slot is not available (booked or payment in progress)"
        }), 409

    mongo.db.appointments.update_one(
        {"_id": appointment["_id"]},
        {
            "$set": {
                "appointmentDate": new_date,
                "appointmentTime": new_time,
                "status": "accepted",
                "rescheduledAt": datetime.utcnow(),
                "rescheduledBy": role,
                "updatedAt": datetime.utcnow(),
            }
        },
    )

    release_slot_lock(doctor_id, old_slot[0], old_slot[1])

    return jsonify({
        "message": "Appointment rescheduled",
        "appointmentDate": new_date,
        "appointmentTime": new_time,
    }), 200


def mark_appointment_complete(appointment_id: str):
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    appointment, err_resp, err_code = _find_appointment(appointment_id)
    if err_resp:
        return err_resp, err_code

    if role not in ("patient", "doctor"):
        return jsonify({"error": "Unauthorized"}), 403

    if not _user_may_access(appointment, user_id, role):
        return jsonify({"error": "You cannot update this appointment"}), 403

    if appointment.get("status") in ("completed", "cancelled", "rejected"):
        return jsonify({"error": "Appointment is already closed"}), 400

    appointment = try_auto_complete_appointment(appointment)
    if appointment.get("status") == "completed":
        return jsonify({
            "message": "Appointment already completed",
            "status": "completed",
            "completionType": appointment.get("completionType"),
        }), 200

    minutes = _consultation_minutes(appointment)
    update = {"updatedAt": datetime.utcnow()}

    if role == "patient":
        update["patientMarkedComplete"] = True
    else:
        update["doctorMarkedComplete"] = True
        if minutes < MIN_CONSULTATION_MINUTES_AUTO_COMPLETE and not appointment.get(
            "patientMarkedComplete"
        ):
            return jsonify({
                "error": (
                    "Cannot mark complete yet. Either the patient must confirm completion, "
                    f"or the consultation must be recorded for at least "
                    f"{MIN_CONSULTATION_MINUTES_AUTO_COMPLETE} minutes."
                ),
                "consultationDurationMinutes": round(minutes, 1),
            }), 400

    mongo.db.appointments.update_one({"_id": appointment["_id"]}, {"$set": update})
    appointment = mongo.db.appointments.find_one({"_id": appointment["_id"]})

    patient_marked = bool(appointment.get("patientMarkedComplete"))
    doctor_marked = bool(appointment.get("doctorMarkedComplete"))
    minutes = _consultation_minutes(appointment)

    if minutes >= MIN_CONSULTATION_MINUTES_AUTO_COMPLETE or (patient_marked and doctor_marked):
        completion_type = "mutual" if patient_marked and doctor_marked else "manual"
        if minutes >= MIN_CONSULTATION_MINUTES_AUTO_COMPLETE and completion_type == "manual":
            completion_type = "duration_or_manual"
        _finalize_completion(str(appointment["_id"]), completion_type)
        appointment = mongo.db.appointments.find_one({"_id": appointment["_id"]})
    else:
        appointment = try_auto_complete_appointment(appointment)

    payload = _serialize_appointment_for_response(appointment)
    return jsonify({
        "message": "Completion recorded",
        "appointment": payload,
    }), 200


def record_consultation_join(appointment_id: str):
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    appointment, err_resp, err_code = _find_appointment(appointment_id)
    if err_resp:
        return err_resp, err_code

    if role not in ("patient", "doctor"):
        return jsonify({"error": "Unauthorized"}), 403

    if not _user_may_access(appointment, user_id, role):
        return jsonify({"error": "Forbidden"}), 403

    if appointment.get("status") in ("cancelled", "rejected", "completed"):
        return jsonify({"error": "Appointment is not active"}), 400

    join_field = "patientJoinedAt" if role == "patient" else "doctorJoinedAt"
    update = {
        join_field: datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    if not appointment.get("consultationStartedAt"):
        update["consultationStartedAt"] = datetime.utcnow()
    if appointment.get("status") in ("accepted", "confirmed"):
        update["status"] = "in_progress"

    mongo.db.appointments.update_one({"_id": appointment["_id"]}, {"$set": update})

    return jsonify({"message": "Consultation join recorded"}), 200


def record_consultation_leave(appointment_id: str):
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    appointment, err_resp, err_code = _find_appointment(appointment_id)
    if err_resp:
        return err_resp, err_code

    if role not in ("patient", "doctor"):
        return jsonify({"error": "Unauthorized"}), 403

    if not _user_may_access(appointment, user_id, role):
        return jsonify({"error": "Forbidden"}), 403

    leave_field = "patientLeftAt" if role == "patient" else "doctorLeftAt"
    join_field = "patientJoinedAt" if role == "patient" else "doctorJoinedAt"

    update = {
        leave_field: datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    mongo.db.appointments.update_one({"_id": appointment["_id"]}, {"$set": update})
    appointment = mongo.db.appointments.find_one({"_id": appointment["_id"]})

    duration_seconds = recompute_overlap_duration_seconds(appointment)
    if duration_seconds > 0:
        mongo.db.appointments.update_one(
            {"_id": appointment["_id"]},
            {"$set": {"consultationDurationSeconds": duration_seconds}},
        )
        appointment["consultationDurationSeconds"] = duration_seconds

    appointment = try_auto_complete_appointment(appointment)
    payload = _serialize_appointment_for_response(appointment)

    return jsonify({
        "message": "Consultation leave recorded",
        "consultationDurationSeconds": appointment.get("consultationDurationSeconds", 0),
        "consultationDurationMinutes": round(_consultation_minutes(appointment), 1),
        "status": payload.get("status"),
        "autoCompleted": payload.get("status") == "completed",
    }), 200

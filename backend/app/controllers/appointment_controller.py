from flask import request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity
from app.extensions import mongo
from bson.objectid import ObjectId
from datetime import datetime, timedelta
import re
import pytz
from app.models.user_model import find_user_by_id


TZ = pytz.timezone('Asia/Karachi')


def _parse_appointment_start(appointment_date, appointment_time):
    date_match = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", str(appointment_date).strip())
    if not date_match:
        raise ValueError("Invalid appointment date")

    time_text = str(appointment_time).strip()
    start_match = re.match(r"^(\d{1,2}):(\d{2})", time_text)
    if not start_match:
        raise ValueError("Invalid appointment time")

    year, month, day = map(int, date_match.groups())
    hours, minutes = map(int, start_match.groups())
    return datetime(year, month, day, hours, minutes)


def _parse_appointment_end(appointment_date, appointment_time):
    time_text = str(appointment_time).strip()
    range_match = re.match(r"^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})", time_text)
    start = _parse_appointment_start(appointment_date, appointment_time)

    if not range_match:
        return start.replace(second=0, microsecond=0) + timedelta(hours=1)

    end_match = re.match(r"^(\d{1,2}):(\d{2})", range_match.group(2))
    if not end_match:
        return start.replace(second=0, microsecond=0) + timedelta(hours=1)

    date_match = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", str(appointment_date).strip())
    year, month, day = map(int, date_match.groups())
    hours, minutes = map(int, end_match.groups())
    return datetime(year, month, day, hours, minutes)


def book_appointment():
    patient_id = get_jwt_identity()
    data = request.json

    doctor_id = data.get("doctorId")
    date = data.get("date")
    time = data.get("time")

    doctor = mongo.db.users.find_one({"_id": ObjectId(doctor_id)})
    if not doctor or doctor.get("active") is False:
        return {"error": "Doctor is not available"}, 403

    now = datetime.now(TZ).replace(tzinfo=None)
    now_date = now.strftime('%Y-%m-%d')
    now_time = now.strftime('%H:%M')

    if date < now_date or (date == now_date and time < now_time):
        return jsonify({"error": "Cannot book slot in the past"}), 400

    slot_result = mongo.db.schedules.find_one_and_update(
        {
            "doctorId": doctor_id,
            "date": date,
            "startTime": time,
            "status": "available"
        },
        {
            "$set": {
                "status": "booked",
                "patientId": patient_id,
                "bookedAt": datetime.utcnow()
            }
        }
    )

    if not slot_result:
        existing = mongo.db.schedules.find_one({
            "doctorId": doctor_id,
            "date": date,
            "startTime": time
        })
        if existing and existing.get("status") == "booked":
            return jsonify({"error": "Slot already booked"}), 409
        else:
            return jsonify({"error": "Selected slot not available for doctor"}), 400

    appointment = {
        "scheduleId": str(slot_result["_id"]),
        "patientId": patient_id,
        "doctorId": doctor_id,
        "symptomId": data.get("symptomId"),
        "appointmentDate": date,
        "appointmentTime": time,
        "status": "pending",
        "createdAt": datetime.utcnow()
    }

    mongo.db.appointments.insert_one(appointment)

    return jsonify({"message": "Appointment booked successfully"}), 201


def get_my_appointments():
    user_id = get_jwt_identity()
    appointments = list(
        mongo.db.appointments.find({"patientId": user_id})
    )

    now = datetime.now(TZ).replace(tzinfo=None)
    now_date = now.strftime('%Y-%m-%d')
    now_time = now.strftime('%H:%M')

    for a in appointments:
        a["_id"] = str(a["_id"])
        if "scheduleId" in a:
            a["scheduleId"] = str(a["scheduleId"])
        doctor = find_user_by_id(a.get("doctorId"))
        if doctor:
            a["doctorName"] = doctor.get("name") or doctor.get("email")

    return jsonify(appointments), 200


def doctor_appointments():
    doctor_id = get_jwt_identity()
    appointments = list(
        mongo.db.appointments.find({"doctorId": doctor_id})
    )

    for a in appointments:
        a["_id"] = str(a["_id"])
        if "scheduleId" in a:
            a["scheduleId"] = str(a["scheduleId"])
        patient = find_user_by_id(a.get("patientId"))
        if patient:
            a["patientName"] = patient.get("name") or patient.get("email")
        a["hasPrescription"] = (
            mongo.db.prescriptions.find_one({"appointmentId": a["_id"]}) is not None
        )

    return jsonify(appointments), 200


def update_appointment_status(appointment_id):
    data = request.json
    status = data.get("status")

    if status not in ["accepted", "rejected", "completed", "in_progress"]:
        return jsonify({"error": "Invalid status"}), 400

    mongo.db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": status, "updatedAt": datetime.utcnow()}}
    )

    return jsonify({"message": f"Appointment {status}"}), 200


def start_consultation(appointment_id):
    doctor_id = get_jwt_identity()

    try:
        appointment_id_obj = ObjectId(appointment_id)
        appointment = mongo.db.appointments.find_one({"_id": appointment_id_obj})
    except Exception:
        return jsonify({"error": "Invalid appointment ID"}), 400

    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    if str(appointment.get("doctorId")) != doctor_id:
        return jsonify({"error": "You are not assigned to this appointment"}), 403

    status = appointment.get("status")
    allowed_statuses = {"accepted", "confirmed", "in_progress"}
    if status not in allowed_statuses:
        return jsonify({
            "error": (
                f"Appointment must be accepted or confirmed to start consultation. "
                f"Current status: {status}"
            )
        }), 400

    try:
        appt_start = _parse_appointment_start(
            appointment["appointmentDate"],
            appointment["appointmentTime"],
        )
        appt_end = _parse_appointment_end(
            appointment["appointmentDate"],
            appointment["appointmentTime"],
        )
        now = datetime.now()
        time_until = (appt_start - now).total_seconds() / 60

        if time_until > 5:
            return jsonify({
                "error": (
                    f"Consultation opens 5 minutes before the booked slot "
                    f"({appointment['appointmentTime']})"
                ),
                "minutesUntilStart": int(time_until),
            }), 400

        if now > appt_end:
            return jsonify({
                "error": "This consultation window has ended",
            }), 400
    except Exception as e:
        current_app.logger.warning(f"Could not parse appointment time: {str(e)}")
        return jsonify({"error": "Invalid appointment date or time"}), 400

    try:
        mongo.db.appointments.update_one(
            {"_id": appointment_id_obj},
            {
                "$set": {
                    "status": "in_progress",
                    "consultationStartedAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
    except Exception as e:
        return jsonify({"error": f"Failed to start consultation: {str(e)}"}), 500

    return jsonify({
        "message": "Consultation started",
        "appointmentId": appointment_id,
        "patientId": str(appointment.get("patientId")),
        "status": "in_progress",
    }), 200

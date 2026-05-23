from flask import request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity
from app.extensions import mongo
from bson.objectid import ObjectId
from datetime import datetime
from app.models.user_model import find_user_by_id


def book_appointment():
    patient_id = get_jwt_identity()
    data = request.json

    doctor_id = data.get("doctorId")
    date = data.get("date")
    time = data.get("time")
    symptom_id = data.get("symptomId")

    # 🔴 1. CHECK DOCTOR SLOT EXISTS
    slot_exists = mongo.db.doctor_availability.find_one({
        "doctorId": doctor_id,
        "day": date,
        "slots": time
    })

    doctor = mongo.db.users.find_one({"_id": ObjectId(doctor_id)})
    if not doctor or doctor.get("active") is False:
        return {"error": "Doctor is not available"}, 403

    if not slot_exists:
        return jsonify({
            "error": "Selected slot not available for doctor"
        }), 400

    existing = mongo.db.appointments.find_one({
        "doctorId": doctor_id,
        "appointmentDate": date,
        "appointmentTime": time,
        "status": {"$in": ["pending", "accepted"]}
    })

    if existing:
        return jsonify({
            "error": "Doctor is already booked at this time"
        }), 409

    appointment = {
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

    for a in appointments:
        a["_id"] = str(a["_id"])

    return jsonify(appointments), 200


def doctor_appointments():
    doctor_id = get_jwt_identity()
    appointments = list(
        mongo.db.appointments.find({"doctorId": doctor_id})
    )

    for a in appointments:
        a["_id"] = str(a["_id"])
        patient = find_user_by_id(a.get("patientId"))
        if patient:
            a["patientName"] = patient.get("name") or patient.get("email")

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
    """Doctor starts a consultation for an appointment."""
    doctor_id = get_jwt_identity()

    try:
        appointment_id_obj = ObjectId(appointment_id)
        appointment = mongo.db.appointments.find_one({"_id": appointment_id_obj})
    except:
        return jsonify({"error": "Invalid appointment ID"}), 400

    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    # Verify doctor owns this appointment
    if str(appointment.get("doctorId")) != doctor_id:
        return jsonify({"error": "You are not assigned to this appointment"}), 403

    # Check if appointment is confirmed
    if appointment.get("status") != "confirmed":
        return jsonify({"error": f"Appointment must be confirmed to start consultation. Current status: {appointment.get('status')}"}), 400

    # Check if it's time to start (within 5 minutes before or anytime after)
    try:
        appt_datetime = datetime.fromisoformat(f"{appointment['appointmentDate']}T{appointment['appointmentTime']}")
        now = datetime.utcnow()
        time_until = (appt_datetime - now).total_seconds() / 60

        if time_until > 5:
            return jsonify({
                "error": f"Consultation will start at {appointment['appointmentTime']}",
                "minutesUntilStart": int(time_until)
            }), 400
    except Exception as e:
        current_app.logger.warning(f"Could not parse appointment time: {str(e)}")

    # Mark appointment as in progress
    try:
        mongo.db.appointments.update_one(
            {"_id": appointment_id_obj},
            {
                "$set": {
                    "status": "in_progress",
                    "consultationStartedAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
            }
        )
    except Exception as e:
        return jsonify({"error": f"Failed to start consultation: {str(e)}"}), 500

    return jsonify({
        "message": "Consultation started",
        "appointmentId": appointment_id,
        "patientId": str(appointment.get("patientId")),
        "status": "in_progress"
    }), 200

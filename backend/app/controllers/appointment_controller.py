from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.extensions import mongo
from bson.objectid import ObjectId
from datetime import datetime


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

    return jsonify(appointments), 200


def update_appointment_status(appointment_id):
    data = request.json
    status = data.get("status")

    if status not in ["accepted", "rejected", "completed"]:
        return jsonify({"error": "Invalid status"}), 400

    mongo.db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": status}}
    )

    return jsonify({"message": f"Appointment {status}"}), 200

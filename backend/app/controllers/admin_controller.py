from flask import jsonify,request
from app.extensions import mongo
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash
from datetime import datetime

def get_doctors():
    doctors = list(mongo.db.users.find({"role": "doctor"}))
    for d in doctors:
        d["_id"] = str(d["_id"])
        d.pop("password", None)
    return jsonify(doctors), 200


def toggle_doctor_status(doctor_id):
    doctor = mongo.db.users.find_one({"_id": ObjectId(doctor_id)})
    if not doctor:
        return {"error": "Doctor not found"}, 404

    new_status = not doctor.get("active", True)

    mongo.db.users.update_one(
        {"_id": ObjectId(doctor_id)},
        {"$set": {"active": new_status}}
    )

    return jsonify({
        "message": "Doctor status updated",
        "active": new_status
    }), 200


def create_doctor():
    data = request.json

    # Basic validation
    if not all(k in data for k in ["name", "email", "password"]):
        return jsonify({"error": "Missing required fields"}), 400

    # Check if email exists
    if mongo.db.users.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already exists"}), 409

    doctor = {
        "name": data["name"],
        "email": data["email"],
        "password": generate_password_hash(data["password"]),
        "role": "doctor",
        "language": data.get("language", "en"),
        "specialization": data.get("specialization"),
        "experience": data.get("experience"),
        "hospital": data.get("hospital"),
        "consultationFee": data.get("consultationFee"),
        "active": True,
        "createdAt": datetime.utcnow()
    }

    result = mongo.db.users.insert_one(doctor)
    doctor_id = str(result.inserted_id)

    return jsonify({
        "message": "Doctor created successfully",
        "doctorId": doctor_id
    }), 201
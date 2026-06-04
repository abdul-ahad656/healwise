from flask import jsonify,request
from app.extensions import mongo
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash
from datetime import datetime
from app.models.user_model import normalize_consultation_fee_for_storage
from app.utils.email_validator import validate_email
from app.utils.password_validator import validate_password_strength

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
    data = request.json or {}

    # Basic validation
    if not all(k in data for k in ["name", "email", "password"]):
        return jsonify({"error": "Missing required fields"}), 400

    if not str(data.get("name", "")).strip():
        return jsonify({"error": "Doctor name is required"}), 400

    is_email_valid, email_error = validate_email(data.get("email"))
    if not is_email_valid:
        return jsonify({"error": email_error}), 400

    is_password_valid, password_error = validate_password_strength(
        data.get("password")
    )
    if not is_password_valid:
        return jsonify({"error": password_error}), 400

    normalized_email = str(data["email"]).strip().lower()

    # Check if email exists
    if mongo.db.users.find_one({"email": normalized_email}):
        return jsonify({"error": "Email already exists"}), 409

    consultation_fee = normalize_consultation_fee_for_storage(
        data.get("consultationFee")
    )
    if consultation_fee is None:
        return jsonify({
            "error": "Consultation fee (PKR) is required when creating a doctor"
        }), 400

    doctor = {
        "name": str(data["name"]).strip(),
        "email": normalized_email,
        "password": generate_password_hash(data["password"]),
        "role": "doctor",
        "language": data.get("language", "en"),
        "specialization": data.get("specialization"),
        "experience": data.get("experience"),
        "hospital": data.get("hospital"),
        "consultationFee": consultation_fee,
        "active": True,
        "createdAt": datetime.utcnow()
    }

    result = mongo.db.users.insert_one(doctor)
    doctor_id = str(result.inserted_id)

    return jsonify({
        "message": "Doctor created successfully",
        "doctorId": doctor_id
    }), 201


def update_doctor(doctor_id):
    data = request.json or {}

    doctor = mongo.db.users.find_one({"_id": ObjectId(doctor_id), "role": "doctor"})
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    update_fields = {}

    for field in ["name", "language", "specialization", "experience", "hospital"]:
        if field in data:
            update_fields[field] = data[field]

    if "name" in update_fields:
        update_fields["name"] = str(update_fields["name"]).strip()
        if not update_fields["name"]:
            return jsonify({"error": "Doctor name is required"}), 400

    if "email" in data:
        is_email_valid, email_error = validate_email(data.get("email"))
        if not is_email_valid:
            return jsonify({"error": email_error}), 400
        normalized_email = str(data["email"]).strip().lower()
        existing = mongo.db.users.find_one({"email": normalized_email})
        if existing and str(existing["_id"]) != str(doctor_id):
            return jsonify({"error": "Email already exists"}), 409
        update_fields["email"] = normalized_email

    if "consultationFee" in data:
        update_fields["consultationFee"] = normalize_consultation_fee_for_storage(
            data.get("consultationFee")
        )

    if "password" in data and data["password"]:
        is_password_valid, password_error = validate_password_strength(
            data["password"]
        )
        if not is_password_valid:
            return jsonify({"error": password_error}), 400
        update_fields["password"] = generate_password_hash(data["password"])

    if "active" in data:
        update_fields["active"] = bool(data["active"])

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    mongo.db.users.update_one(
        {"_id": ObjectId(doctor_id)},
        {"$set": update_fields}
    )

    doctor = mongo.db.users.find_one({"_id": ObjectId(doctor_id)})
    doctor["_id"] = str(doctor["_id"])
    doctor.pop("password", None)

    return jsonify(doctor), 200


def delete_doctor(doctor_id):
    result = mongo.db.users.delete_one(
        {"_id": ObjectId(doctor_id), "role": "doctor"}
    )

    if result.deleted_count == 0:
        return jsonify({"error": "Doctor not found"}), 404

    return jsonify({"message": "Doctor deleted"}), 200

from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.extensions import mongo
from datetime import datetime

from bson.objectid import ObjectId

def upsert_profile():
    doctor_id = get_jwt_identity()
    data = request.json

    # Update User collection for shared fields
    mongo.db.users.update_one(
        {"_id": ObjectId(doctor_id)},
        {
            "$set": {
                "specialization": data.get("specialization"),
                "experience": data.get("experience"),
                "hospital": data.get("hospital"),
                "consultationFee": data.get("consultationFee"),
            }
        }
    )

    # Keep qualification in profile for now if needed, or deprecate
    # For now, we sync the profile just in case, or we can remove it.
    # But since the user said "not in doctor profile", I will assume they want these fields in users.
    # I will still update the profile collection for qualification if provided,
    # but I won't rely on it for the main fields anymore.
    
    mongo.db.doctor_profiles.update_one(
        {"doctorId": doctor_id},
        {
            "$set": {
                "qualification": data.get("qualification"),
                "updatedAt": datetime.utcnow()
            }
        },
        upsert=True
    )

    return jsonify({"message": "Doctor profile updated"}), 200

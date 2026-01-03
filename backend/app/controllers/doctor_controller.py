from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.extensions import mongo
from bson.objectid import ObjectId
from datetime import datetime

def get_pending_cases():
    cases = list(mongo.db.symptoms.find(
        {"doctorReview": {"$exists": False}}
    ))

    for c in cases:
        c["_id"] = str(c["_id"])

    return jsonify(cases), 200


def review_case(symptom_id):
    doctor_id = get_jwt_identity()
    data = request.json

    review = {
        "doctorId": doctor_id,
        "diagnosis": data.get("diagnosis"),
        "notes": data.get("notes"),
        "prescription": data.get("prescription"),
        "reviewedAt": datetime.utcnow()
    }

    mongo.db.symptoms.update_one(
        {"_id": ObjectId(symptom_id)},
        {"$set": {"doctorReview": review}}
    )

    return jsonify({"message": "Case reviewed successfully"}), 200

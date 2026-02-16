from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.extensions import mongo


def set_availability():
    doctor_id = get_jwt_identity()
    data = request.json

    mongo.db.doctor_availability.update_one(
        {
            "doctorId": doctor_id,
            "day": data.get("day")
        },
        {
            "$set": {
                "slots": data.get("slots")
            }
        },
        upsert=True
    )

    return jsonify({"message": "Availability updated"}), 200


def get_availability(doctor_id):
    availability = list(
        mongo.db.doctor_availability.find({"doctorId": doctor_id})
    )

    for a in availability:
        a["_id"] = str(a["_id"])

    return jsonify(availability), 200


def delete_availability_day(day):
    doctor_id = get_jwt_identity()
    mongo.db.doctor_availability.delete_one(
        {
            "doctorId": doctor_id,
            "day": day
        }
    )
    return jsonify({"message": "Availability day deleted"}), 200

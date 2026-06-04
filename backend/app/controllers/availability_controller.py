from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.extensions import mongo
from datetime import datetime
import pytz


TZ = pytz.timezone('Asia/Karachi')


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
    now = datetime.now(TZ).replace(tzinfo=None)
    now_date = now.strftime('%Y-%m-%d')
    now_time = now.strftime('%H:%M')

    availability = list(
        mongo.db.doctor_availability.find({
            "doctorId": doctor_id,
            "$or": [
                {"day": {"$gt": now_date}},
                {
                    "day": now_date,
                    "slots": {"$not": {"$elemMatch": {"$lte": now_time}}}
                }
            ]
        })
    )

    for a in availability:
        a["_id"] = str(a["_id"])
        if a.get("day") == now_date:
            a["slots"] = [slot for slot in a.get("slots", []) if slot > now_time]

    filtered_availability = [a for a in availability if a.get("slots")]

    return jsonify(filtered_availability), 200


def delete_availability_day(day):
    doctor_id = get_jwt_identity()
    mongo.db.doctor_availability.delete_one(
        {
            "doctorId": doctor_id,
            "day": day
        }
    )
    return jsonify({"message": "Availability day deleted"}), 200

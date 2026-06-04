from flask import request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity
from app.extensions import mongo
from bson.objectid import ObjectId
from datetime import datetime, timedelta
import pytz
from app.models.user_model import find_user_by_id


TZ = pytz.timezone('Asia/Karachi')


def _now_tz():
    return datetime.now(TZ).replace(tzinfo=None)


def _parse_datetime(date_str, time_str):
    try:
        date_obj = datetime.strptime(date_str.strip(), '%Y-%m-%d')
        time_parts = time_str.strip().split(':')
        hour, minute = int(time_parts[0]), int(time_parts[1])
        return datetime(date_obj.year, date_obj.month, date_obj.day, hour, minute)
    except Exception as e:
        raise ValueError(f"Invalid date/time format: {str(e)}")


def create_schedule():
    doctor_id = get_jwt_identity()
    data = request.json

    try:
        date = data.get('date')
        start_time = data.get('startTime')
        end_time = data.get('endTime')

        slot_start = _parse_datetime(date, start_time)
        slot_end = _parse_datetime(date, end_time)
        now = _now_tz()

        if slot_end <= now:
            return jsonify({"error": "Slot end time must be in the future"}), 400

        if slot_start >= slot_end:
            return jsonify({"error": "Start time must be before end time"}), 400

        existing = mongo.db.schedules.find_one({
            "doctorId": doctor_id,
            "date": date,
            "$or": [
                {"startTime": {"$lt": end_time, "$gte": start_time}},
                {"endTime": {"$gt": start_time, "$lte": end_time}},
                {"$and": [{"startTime": {"$lte": start_time}}, {"endTime": {"$gte": end_time}}]}
            ]
        })

        if existing:
            return jsonify({"error": "Overlapping schedule already exists"}), 409

        schedule = {
            "doctorId": doctor_id,
            "date": date,
            "startTime": start_time,
            "endTime": end_time,
            "status": "available",
            "patientId": None,
            "createdAt": datetime.utcnow()
        }

        result = mongo.db.schedules.insert_one(schedule)
        schedule["_id"] = str(result.inserted_id)

        return jsonify(schedule), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Schedule creation error: {str(e)}")
        return jsonify({"error": "Failed to create schedule"}), 500


def get_doctor_schedules(doctor_id):
    try:
        now = _now_tz()
        schedules = list(mongo.db.schedules.find({
            "doctorId": doctor_id,
            "endTime": {"$gt": now.strftime('%H:%M')}
        }).sort("date", 1))

        for s in schedules:
            s["_id"] = str(s["_id"])

        return jsonify(schedules), 200

    except Exception as e:
        current_app.logger.error(f"Get doctor schedules error: {str(e)}")
        return jsonify({"error": "Failed to fetch schedules"}), 500


def get_available_slots(doctor_id):
    try:
        now = _now_tz()
        now_date = now.strftime('%Y-%m-%d')
        now_time = now.strftime('%H:%M')

        schedules = list(mongo.db.schedules.find({
            "doctorId": doctor_id,
            "status": "available",
            "$or": [
                {"date": {"$gt": now_date}},
                {
                    "date": now_date,
                    "endTime": {"$gt": now_time}
                }
            ]
        }).sort("date", 1).sort("startTime", 1))

        for s in schedules:
            s["_id"] = str(s["_id"])

        return jsonify(schedules), 200

    except Exception as e:
        current_app.logger.error(f"Get available slots error: {str(e)}")
        return jsonify({"error": "Failed to fetch available slots"}), 500


def book_slot():
    patient_id = get_jwt_identity()
    data = request.json

    try:
        schedule_id = data.get("scheduleId")
        doctor_id = data.get("doctorId")

        doctor = mongo.db.users.find_one({"_id": ObjectId(doctor_id)})
        if not doctor or doctor.get("active") is False:
            return jsonify({"error": "Doctor is not available"}), 403

        schedule = mongo.db.schedules.find_one({"_id": ObjectId(schedule_id)})
        if not schedule:
            return jsonify({"error": "Schedule not found"}), 404

        if schedule["status"] != "available":
            return jsonify({"error": "Schedule slot already booked"}), 409

        now = _now_tz()
        slot_end = _parse_datetime(schedule["date"], schedule["endTime"])

        if slot_end <= now:
            return jsonify({"error": "Schedule slot has expired"}), 410

        result = mongo.db.schedules.find_one_and_update(
            {
                "_id": ObjectId(schedule_id),
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

        if not result:
            return jsonify({"error": "Schedule slot already booked"}), 409

        appointment = {
            "scheduleId": schedule_id,
            "patientId": patient_id,
            "doctorId": doctor_id,
            "appointmentDate": schedule["date"],
            "appointmentTime": schedule["startTime"],
            "status": "pending",
            "createdAt": datetime.utcnow()
        }

        mongo.db.appointments.insert_one(appointment)

        return jsonify({
            "message": "Appointment booked successfully",
            "scheduleId": schedule_id
        }), 201

    except Exception as e:
        current_app.logger.error(f"Booking error: {str(e)}")
        return jsonify({"error": "Failed to book appointment"}), 500


def cancel_schedule():
    doctor_id = get_jwt_identity()
    data = request.json
    schedule_id = data.get("scheduleId")

    try:
        schedule = mongo.db.schedules.find_one({
            "_id": ObjectId(schedule_id),
            "doctorId": doctor_id
        })

        if not schedule:
            return jsonify({"error": "Schedule not found"}), 404

        if schedule["status"] == "booked":
            mongo.db.appointments.delete_one({
                "scheduleId": schedule_id,
                "status": "pending"
            })

        mongo.db.schedules.delete_one({"_id": ObjectId(schedule_id)})

        return jsonify({"message": "Schedule cancelled"}), 200

    except Exception as e:
        current_app.logger.error(f"Cancel schedule error: {str(e)}")
        return jsonify({"error": "Failed to cancel schedule"}), 500

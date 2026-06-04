from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.extensions import mongo
from app.utils.appointment_scheduling import (
    filter_future_slots,
    is_past_day,
    is_past_slot,
    now_local,
    slot_start_string,
    time_to_minutes,
)
from app.utils.slot_locking import filter_slots_for_public_view


def set_availability():
    doctor_id = get_jwt_identity()
    data = request.json or {}
    day = str(data.get("day", "")).strip()
    slots = data.get("slots") or []

    if not day:
        return jsonify({"error": "Day is required (YYYY-MM-DD)"}), 400

    if is_past_day(day):
        return jsonify({"error": "Cannot add availability for a past date"}), 400

    future_slots = filter_future_slots(day, slots)
    if not future_slots:
        return jsonify({
            "error": "No valid future time slots. Past times are not allowed."
        }), 400

    for slot in future_slots:
        if is_past_slot(day, slot):
            return jsonify({"error": f"Slot {slot} is in the past"}), 400

    mongo.db.doctor_availability.update_one(
        {
            "doctorId": doctor_id,
            "day": day,
        },
        {
            "$set": {
                "slots": future_slots,
            }
        },
        upsert=True,
    )

    return jsonify({"message": "Availability updated", "slots": future_slots}), 200


def get_availability(doctor_id):
    now = now_local()
    now_date = now.strftime("%Y-%m-%d")
    now_minutes = time_to_minutes(now.strftime("%H:%M"))

    availability = list(
        mongo.db.doctor_availability.find({
            "doctorId": doctor_id,
            "day": {"$gte": now_date},
        })
    )

    filtered_availability = []
    for a in availability:
        a["_id"] = str(a["_id"])
        day = a.get("day")
        if is_past_day(day, now):
            continue
        slots = []
        for slot in a.get("slots", []):
            if day == now_date:
                if time_to_minutes(slot_start_string(slot)) > now_minutes:
                    slots.append(slot)
            else:
                slots.append(slot)
        if slots:
            a["slots"] = filter_slots_for_public_view(doctor_id, day, slots)
        if a.get("slots"):
            filtered_availability.append(a)

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

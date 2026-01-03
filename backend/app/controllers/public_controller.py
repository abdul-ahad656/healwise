from flask import jsonify
from app.extensions import mongo

def list_doctors():
    doctors = list(mongo.db.users.find({"role": "doctor"}))

    result = []

    for d in doctors:
        doctor_id = str(d["_id"])

        result.append({
            "id": doctor_id,
            "name": d["name"],
            "email": d["email"],
            "specialization": d.get("specialization"),
            "experience": d.get("experience"),
            "hospital": d.get("hospital"),
            "consultationFee": d.get("consultationFee")
        })

    return jsonify(result), 200

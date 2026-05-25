# from flask import request, jsonify
# from app.services.symptom_service import process_and_store_symptom, fetch_symptom
# from app.models.symptom_model import get_user_symptoms
# from bson.objectid import ObjectId

# def submit_symptoms():
#     """
#     POST /api/symptoms/submit
#     body: { "userId": "<id>", "text": "<symptom text>", "language": "en" }
#     """
#     data = request.get_json(force=True)
#     user_id = data.get("userId")
#     text = data.get("text")
#     language = data.get("language", "en")

#     if not user_id or not text:
#         return jsonify({"error": "userId and text are required"}), 400

#     symptom_id = process_and_store_symptom(user_id, text, language)
#     return jsonify({
#         "success": True,
#         "symptomId": symptom_id,
#         "message": "Symptoms submitted; AI analysis running (synchronously)."
#     }), 201

# def get_symptom(symptom_id):
#     doc = fetch_symptom(symptom_id)
#     if not doc:
#         return jsonify({"error": "not found"}), 404
#     # ensure aiAnalysis present, or if still processing show status
#     return jsonify(doc), 200

# def history(user_id):
#     docs = get_user_symptoms(user_id)
#     # convert _id to str
#     for d in docs:
#         d["_id"] = str(d["_id"])
#     return jsonify(docs), 200

from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from bson.objectid import ObjectId
from app.extensions import mongo
from app.models.user_model import find_user_by_id
from app.models.symptom_model import get_user_symptoms
from app.services.symptom_service import process_and_store_symptom, SymptomServiceError
from app.services.hf_service import HFServiceError


def submit_symptoms():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Symptoms text is required"}), 400

    user = find_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    language = user.get("language", "en")

    try:
        result = process_and_store_symptom(
            user_id=user_id,
            text=text,
            language=language,
        )
    except HFServiceError as exc:
        return jsonify({"error": str(exc)}), 503
    except SymptomServiceError as exc:
        return jsonify({"error": str(exc)}), 503

    return jsonify({
        "message": "Symptoms analyzed successfully",
        "data": result
    }), 200


def get_my_symptom_history():
    """Patient's own symptom analysis history."""
    user_id = get_jwt_identity()
    history = get_user_symptoms(user_id)

    for item in history:
        item["_id"] = str(item["_id"])
        if item.get("createdAt"):
            item["createdAt"] = item["createdAt"].isoformat()

    return jsonify(history), 200


def get_patient_history_for_appointment(appointment_id: str):
    doctor_id = get_jwt_identity()

    appointment = mongo.db.appointments.find_one(
        {"_id": ObjectId(appointment_id)}
    )

    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    if str(appointment.get("doctorId")) != str(doctor_id):
        return jsonify({"error": "Not allowed"}), 403

    patient_id = appointment.get("patientId")
    if not patient_id:
        return jsonify({"error": "Patient not found"}), 404

    history = get_user_symptoms(patient_id)

    for item in history:
        item["_id"] = str(item["_id"])

    return jsonify(history), 200

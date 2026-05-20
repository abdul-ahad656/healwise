"""
POST /predict — symptom → disease prediction (public contract).
"""

from flask import jsonify, request

from app.services.hf_service import HFServiceError, predict_disease
from app.services.symptom_service import SymptomServiceError, save_patient_prediction


def predict():
    """
    POST /predict

    Request JSON:
        { "client_id": "...", "symptoms": "..." }

    Response JSON:
        { "client_id": "...", "disease": "...", "confidence": 0.xx }
    """
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400

    data = request.get_json(silent=True) or {}

    client_id = (data.get("client_id") or "").strip()
    symptoms = (data.get("symptoms") or "").strip()

    if not client_id:
        return jsonify({"error": "client_id is required"}), 400

    if not symptoms:
        return jsonify({"error": "symptoms cannot be empty"}), 400

    if len(symptoms) < 3:
        return jsonify({"error": "symptoms must be at least 3 characters"}), 400

    try:
        result = predict_disease(symptoms)
    except HFServiceError as exc:
        return jsonify({"error": str(exc)}), 503

    disease = result["disease"]
    confidence = result["confidence"]

    try:
        save_patient_prediction(
            client_id=client_id,
            symptoms=symptoms,
            disease=disease,
            confidence=confidence,
        )
    except SymptomServiceError as exc:
        return jsonify({"error": str(exc)}), 503

    return (
        jsonify(
            {
                "client_id": client_id,
                "disease": disease,
                "confidence": confidence,
            }
        ),
        200,
    )


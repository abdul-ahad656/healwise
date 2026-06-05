"""POST /api/suggest-symptoms — tree-based symptom suggestions."""

from flask import jsonify, request

from app.services.symptom_suggestion_service import (
    SymptomSuggestionError,
    suggest_symptoms,
)
from app.utils.symptom_normalization import normalize_symptoms_list


def suggest_symptoms_handler():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400

    data = request.get_json(silent=True) or {}
    raw_symptoms = data.get("symptoms")

    if raw_symptoms is None:
        return jsonify({"error": "symptoms is required"}), 400

    if not isinstance(raw_symptoms, list):
        return jsonify({"error": "symptoms must be an array"}), 400

    normalized = normalize_symptoms_list(raw_symptoms)
    if not normalized:
        return jsonify({"error": "At least one valid symptom is required"}), 400

    try:
        result = suggest_symptoms(normalized)
    except SymptomSuggestionError as exc:
        return jsonify({"error": str(exc)}), 503

    return jsonify(result), 200

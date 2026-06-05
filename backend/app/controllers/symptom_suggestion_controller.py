"""POST /api/suggest-symptoms — tree-based symptom suggestions."""

from flask import jsonify, request

from app.services.symptom_suggestion_service import (
    SymptomSuggestionError,
    suggest_symptoms,
)
from app.utils.symptom_translation import collect_raw_symptom_inputs, resolve_symptoms_to_english


def resolve_symptoms_handler():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400

    data = request.get_json(silent=True) or {}
    raw_parts = collect_raw_symptom_inputs(data)

    if not raw_parts:
        return jsonify({"error": "Provide text or symptoms (at least one required)"}), 400

    mappings = resolve_symptoms_to_english(raw_parts)
    if not mappings:
        return jsonify({"error": "Could not recognize any symptoms. Try common Urdu or English terms."}), 400

    tokens = [item["token"] for item in mappings]
    return jsonify(
        {
            "symptoms": tokens,
            "mappings": mappings,
        }
    ), 200


def suggest_symptoms_handler():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400

    data = request.get_json(silent=True) or {}
    raw_parts = collect_raw_symptom_inputs(data)

    if not raw_parts:
        return jsonify({"error": "Provide text or symptoms (at least one required)"}), 400

    mappings = resolve_symptoms_to_english(raw_parts)
    normalized = [item["token"] for item in mappings]
    if not normalized:
        return jsonify({"error": "Could not recognize any symptoms. Try common Urdu or English terms."}), 400

    try:
        result = suggest_symptoms(normalized)
    except SymptomSuggestionError as exc:
        return jsonify({"error": str(exc)}), 503

    result["mappings"] = mappings
    return jsonify(result), 200

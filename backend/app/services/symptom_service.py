import logging
from datetime import datetime
from typing import Any, Dict

from flask import current_app
from pymongo.errors import PyMongoError

from app.extensions import mongo
from app.models.symptom_model import create_symptom_record
from app.services.hf_service import HFServiceError, predict_disease

logger = logging.getLogger(__name__)


class SymptomServiceError(Exception):
    """Raised when symptom operations fail."""


def get_patients_collection():
    """Return the patients collection, verifying DB connectivity."""
    if mongo.db is None:
        raise SymptomServiceError("MongoDB is not initialized")

    try:
        return mongo.db.patients
    except Exception as exc:
        raise SymptomServiceError(f"MongoDB connection error: {exc}") from exc


def save_patient_prediction(
    client_id: str,
    symptoms: str,
    disease: str,
    confidence: float,
) -> str:
    """Store one prediction document in the `patients` collection."""
    client_id = (client_id or "").strip()
    symptoms = (symptoms or "").strip()
    disease = (disease or "").strip()

    if not client_id:
        raise SymptomServiceError("client_id is required for storage")
    if not symptoms:
        raise SymptomServiceError("symptoms are required for storage")
    if not disease:
        raise SymptomServiceError("disease is required for storage")

    document: Dict[str, Any] = {
        "client_id": client_id,
        "symptoms": symptoms,
        "disease": disease,
        "confidence": float(confidence),
        "timestamp": datetime.utcnow(),
    }

    try:
        collection = get_patients_collection()
        result = collection.insert_one(document)
        logger.info(
            "Saved prediction for client_id=%s disease=%s", client_id, disease
        )
        return str(result.inserted_id)
    except PyMongoError as exc:
        logger.exception("MongoDB insert failed for patients collection")
        raise SymptomServiceError(f"Failed to save prediction: {exc}") from exc


def ensure_patients_indexes() -> None:
    """Create indexes for faster lookups by client_id (idempotent)."""
    try:
        collection = get_patients_collection()
        collection.create_index("client_id")
        collection.create_index([("timestamp", -1)])
    except Exception as exc:
        logger.warning("Could not create patients indexes: %s", exc)


def process_and_store_symptom(user_id: str, text: str, language: str):
    """
    Run HF Gradio prediction, persist to `patients` and `symptoms` collections,
    return result compatible with existing /api/symptoms/submit response.
    """
    text = (text or "").strip()
    if not text:
        raise HFServiceError("Symptoms text cannot be empty")

    prediction = predict_disease(text)
    disease = prediction["disease"]
    confidence = prediction["confidence"]

    # patients collection (required by architecture)
    try:
        save_patient_prediction(
            client_id=str(user_id),
            symptoms=text,
            disease=disease,
            confidence=confidence,
        )
    except SymptomServiceError as exc:
        raise SymptomServiceError(
            f"Prediction succeeded but could not be saved: {exc}"
        ) from exc

    ai_result = [{"label": disease, "score": confidence}]

    record = {
        "userId": user_id,
        "text": text,
        "language": language,
        "aiPrediction": disease,
        "confidence": round(confidence, 4),
        "allPredictions": ai_result,
    }

    res = create_symptom_record(record)

    return {
        "symptomId": str(res.inserted_id),
        "prediction": disease,
        "confidence": confidence,
        "allPredictions": ai_result,
    }

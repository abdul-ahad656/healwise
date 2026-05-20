"""
Backward-compatible wrapper around HF Gradio inference.

Existing imports of predict_symptoms() continue to work without changes.
"""

from app.services.hf_service import HFServiceError, predict_disease


def predict_symptoms(text: str, top_k: int = 3):
    """
    Returns list of {label, score} sorted by score desc.
    Uses HF Gradio Space via predict_disease().
    """
    result = predict_disease(text)
    predictions = [
        {"label": result["disease"], "score": result["confidence"]},
    ]
    return predictions[:top_k]

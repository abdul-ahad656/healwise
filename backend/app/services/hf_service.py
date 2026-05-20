"""
Hugging Face Gradio Space inference via gradio_client.
Single global client; all prediction logic goes through predict_disease().
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, Optional, Tuple

from flask import current_app

logger = logging.getLogger(__name__)

_client = None


class HFServiceError(Exception):
    """Raised when the HF Space is unavailable or returns invalid data."""


def _get_hf_config() -> Tuple[str, str, int]:
    url = current_app.config.get("HF_SPACE_URL", "") or ""
    api_name = current_app.config.get("HF_API_NAME", "/predict") or "/predict"
    timeout = int(current_app.config.get("HF_PREDICT_TIMEOUT", 90))
    return url.strip(), api_name, timeout


def get_hf_client():
    """Lazy singleton Gradio client."""
    global _client
    if _client is not None:
        return _client

    space_url, _, _ = _get_hf_config()
    if not space_url:
        raise HFServiceError(
            "HF_SPACE_URL is not configured. Set it in your .env file."
        )

    try:
        from gradio_client import Client

        logger.info("Initializing Gradio client for HF Space: %s", space_url)
        _client = Client(space_url)
        return _client
    except Exception as exc:
        logger.exception("Failed to create Gradio client")
        raise HFServiceError(f"Could not connect to Hugging Face Space: {exc}") from exc


def reset_hf_client() -> None:
    """Reset client (useful after config change or connection errors)."""
    global _client
    _client = None


def _parse_confidence(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(max(0.0, min(1.0, value)))
    text = str(value).strip().replace("%", "")
    try:
        num = float(text)
        return num / 100.0 if num > 1.0 else max(0.0, min(1.0, num))
    except ValueError:
        return 0.0


def _parse_prediction_result(raw: Any) -> Dict[str, Any]:
    """
    Normalize Gradio return values to {disease, confidence}.
    Supports tuple/list, dict, JSON string, or plain label string.
    """
    if raw is None:
        raise HFServiceError("HF Space returned empty prediction")

    if isinstance(raw, dict):
        disease = (
            raw.get("disease")
            or raw.get("label")
            or raw.get("prediction")
            or raw.get("diagnosis")
        )
        confidence = raw.get("confidence") or raw.get("score") or raw.get("probability")
        if disease:
            return {
                "disease": str(disease).strip(),
                "confidence": _parse_confidence(confidence),
            }

    if isinstance(raw, (list, tuple)):
        if len(raw) == 0:
            raise HFServiceError("HF Space returned empty prediction list")
        if len(raw) >= 2 and not isinstance(raw[0], (list, tuple, dict)):
            return {
                "disease": str(raw[0]).strip(),
                "confidence": _parse_confidence(raw[1]),
            }
        return _parse_prediction_result(raw[0])

    if isinstance(raw, str):
        text = raw.strip()
        if not text:
            raise HFServiceError("HF Space returned blank disease label")

        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return _parse_prediction_result(parsed)
        except json.JSONDecodeError:
            pass

        # "Disease Name (0.85)" or "Disease Name - 85%"
        match = re.match(
            r"^(?P<disease>.+?)\s*[\(\-:]\s*(?P<conf>[\d.]+%?)\s*\)?$",
            text,
            re.IGNORECASE,
        )
        if match:
            return {
                "disease": match.group("disease").strip(),
                "confidence": _parse_confidence(match.group("conf")),
            }

        return {"disease": text, "confidence": 0.0}

    return {
        "disease": str(raw).strip(),
        "confidence": 0.0,
    }


def predict_disease(symptoms: str) -> Dict[str, float]:
    """
    Call the HF Gradio Space and return primary prediction.

    Returns:
        {"disease": str, "confidence": float}
    """
    text = (symptoms or "").strip()
    if not text:
        raise HFServiceError("Symptoms text cannot be empty")

    space_url, api_name, timeout = _get_hf_config()
    if not space_url:
        raise HFServiceError("HF_SPACE_URL is not configured")

    client = get_hf_client()

    try:
        # submit + result supports timeout; fall back to predict if needed
        try:
            job = client.submit(text, api_name=api_name)
            raw = job.result(timeout=timeout)
        except (AttributeError, TypeError):
            raw = client.predict(text, api_name=api_name)
    except TimeoutError as exc:
        reset_hf_client()
        raise HFServiceError(
            f"Prediction timed out after {timeout}s. HF Space may be busy."
        ) from exc
    except Exception as exc:
        err_msg = str(exc).lower()
        if "timeout" in err_msg or "timed out" in err_msg:
            reset_hf_client()
            raise HFServiceError(
                f"Prediction timed out after {timeout}s. HF Space may be busy."
            ) from exc
        logger.exception("HF Space prediction failed")
        raise HFServiceError(f"HF Space prediction failed: {exc}") from exc

    parsed = _parse_prediction_result(raw)
    if not parsed.get("disease"):
        raise HFServiceError("Could not parse disease from HF Space response")

    return {
        "disease": parsed["disease"],
        "confidence": round(float(parsed["confidence"]), 4),
    }

"""Tree-based symptom suggestions from the disease_symptoms MongoDB collection."""

from __future__ import annotations

import logging
import random
from collections import Counter
from typing import Any

from pymongo.errors import PyMongoError

from app.extensions import mongo
from app.utils.symptom_normalization import (
    normalize_symptom,
    normalize_symptoms_list,
    symptom_match_variants,
)

logger = logging.getLogger(__name__)

MAX_SUGGESTIONS = 10
SUGGESTION_POOL_SIZE = 40


class SymptomSuggestionError(Exception):
    """Raised when suggestion lookup fails."""


def get_disease_symptoms_collection():
    if mongo.db is None:
        raise SymptomSuggestionError("Database is not available")
    return mongo.db.disease_symptoms


def ensure_disease_symptoms_indexes() -> None:
    """Idempotent index for $all queries on symptom arrays."""
    try:
        collection = get_disease_symptoms_collection()
        collection.create_index("symptoms")
    except PyMongoError as exc:
        logger.warning("disease_symptoms index warning: %s", exc)

    try:
        from app.utils.symptom_vocabulary import refresh_symptom_vocabulary

        refresh_symptom_vocabulary()
    except Exception as exc:
        logger.debug("Symptom vocabulary refresh skipped: %s", exc)


def _pick_diverse_suggestions(counter: Counter[str], limit: int = MAX_SUGGESTIONS) -> list[str]:
    """Weighted random sample so co-occurring symptoms vary between requests."""
    if not counter:
        return []

    ranked = counter.most_common()
    if len(ranked) <= limit:
        return [name for name, _ in ranked]

    pool = ranked[:SUGGESTION_POOL_SIZE]
    names = [name for name, _ in pool]
    weights = [float(count) for _, count in pool]

    chosen: list[str] = []
    remaining_names = names[:]
    remaining_weights = weights[:]

    for _ in range(min(limit, len(remaining_names))):
        index = random.choices(range(len(remaining_names)), weights=remaining_weights, k=1)[0]
        chosen.append(remaining_names.pop(index))
        remaining_weights.pop(index)

    return chosen


def suggest_symptoms(selected: list[str]) -> dict[str, Any]:
    """
    Find diseases whose symptom sets contain all selected symptoms,
    then return the most frequent remaining symptoms (up to MAX_SUGGESTIONS).
    """
    normalized = normalize_symptoms_list(selected)
    if not normalized:
        raise SymptomSuggestionError("At least one symptom is required")

    try:
        collection = get_disease_symptoms_collection()
        query = {
            "$and": [
                {"symptoms": {"$in": symptom_match_variants(symptom)}}
                for symptom in normalized
            ]
        }
        cursor = collection.find(query, {"symptoms": 1, "_id": 0})
    except PyMongoError as exc:
        logger.exception("disease_symptoms query failed")
        raise SymptomSuggestionError(f"Failed to query symptom data: {exc}") from exc

    selected_set = set(normalized)
    counter: Counter[str] = Counter()

    for doc in cursor:
        for symptom in doc.get("symptoms") or []:
            if not isinstance(symptom, str):
                continue
            s = normalize_symptom(symptom)
            if s and s not in selected_set:
                counter[s] += 1

    suggestions = _pick_diverse_suggestions(counter, MAX_SUGGESTIONS)

    return {
        "selected_symptoms": normalized,
        "suggestions": suggestions,
        "can_analyze": len(normalized) >= 3,
    }

"""Symptom phrases loaded from the training dataset CSV (and MongoDB when available)."""

from __future__ import annotations

import csv
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

DATASET_CSV = Path(__file__).resolve().parent.parent.parent / "clean_dataset_no_duplicates.csv"

_DATASET_SYMPTOMS: frozenset[str] | None = None
_SEGMENT_VOCABULARY: list[str] | None = None

ENGLISH_STOP_WORDS = frozenset(
    {
        "a",
        "an",
        "and",
        "at",
        "in",
        "of",
        "on",
        "or",
        "the",
        "to",
        "with",
        "my",
        "your",
        "is",
        "are",
        "was",
        "have",
        "has",
    }
)


def _clean_phrase(text: str) -> str:
    return " ".join((text or "").strip().lower().replace("_", " ").split())


def _load_symptoms_from_csv() -> set[str]:
    phrases: set[str] = set()
    if not DATASET_CSV.is_file():
        logger.warning("Symptom dataset CSV not found at %s", DATASET_CSV)
        return phrases

    try:
        with DATASET_CSV.open(encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                text = (row.get("text") or "").strip()
                if not text:
                    continue
                for part in text.split(","):
                    cleaned = _clean_phrase(part)
                    if cleaned:
                        phrases.add(cleaned)
    except OSError as exc:
        logger.warning("Failed to read symptom dataset CSV: %s", exc)

    return phrases


def _load_symptoms_from_mongo() -> set[str]:
    try:
        from app.extensions import mongo

        if mongo.db is None:
            return set()

        collection = mongo.db.disease_symptoms
        phrases: set[str] = set()
        for doc in collection.find({}, {"symptoms": 1, "_id": 0}):
            for symptom in doc.get("symptoms") or []:
                if isinstance(symptom, str):
                    cleaned = _clean_phrase(symptom)
                    if cleaned:
                        phrases.add(cleaned)
        return phrases
    except Exception as exc:
        logger.debug("MongoDB symptom vocabulary unavailable: %s", exc)
        return set()


def get_dataset_symptoms(*, refresh: bool = False) -> frozenset[str]:
    """All known symptom phrases (spaces, lowercase)."""
    global _DATASET_SYMPTOMS
    if _DATASET_SYMPTOMS is not None and not refresh:
        return _DATASET_SYMPTOMS

    phrases = _load_symptoms_from_csv()
    phrases.update(_load_symptoms_from_mongo())

    _DATASET_SYMPTOMS = frozenset(phrases)
    return _DATASET_SYMPTOMS


def is_known_symptom(text: str) -> bool:
    key = _clean_phrase(text)
    if not key:
        return False
    return key in get_dataset_symptoms()


def is_segment_stop_word(text: str) -> bool:
    return _clean_phrase(text) in ENGLISH_STOP_WORDS


def build_segment_vocabulary(extra_phrases: set[str] | frozenset[str] | None = None) -> list[str]:
    """Longest multi-word phrases first for greedy voice / free-text splitting."""
    phrases: set[str] = set(get_dataset_symptoms())
    if extra_phrases:
        phrases.update(_clean_phrase(p) for p in extra_phrases if _clean_phrase(p))

    return sorted(
        phrases,
        key=lambda phrase: (len(phrase.split()), len(phrase)),
        reverse=True,
    )


def get_segment_vocabulary(extra_phrases: set[str] | frozenset[str] | None = None) -> list[str]:
    global _SEGMENT_VOCABULARY
    if _SEGMENT_VOCABULARY is None or extra_phrases:
        vocabulary = build_segment_vocabulary(extra_phrases)
        if extra_phrases is None:
            _SEGMENT_VOCABULARY = vocabulary
        return vocabulary
    return _SEGMENT_VOCABULARY


def refresh_symptom_vocabulary() -> None:
    """Reload vocabulary from CSV / MongoDB (e.g. after dataset import)."""
    global _DATASET_SYMPTOMS, _SEGMENT_VOCABULARY
    _DATASET_SYMPTOMS = None
    _SEGMENT_VOCABULARY = None
    get_dataset_symptoms(refresh=True)
    get_segment_vocabulary()

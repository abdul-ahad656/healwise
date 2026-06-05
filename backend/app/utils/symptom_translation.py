"""Map Urdu / roman-Urdu symptom input to English for MongoDB and the HF model."""

from __future__ import annotations

import re
from typing import Iterable, List

from app.utils.translate_utils import translate_to_english
from app.utils.symptom_normalization import normalize_symptom

# Urdu script → English (common terms from the training dataset)
URDU_SCRIPT_SYMPTOM_MAP = {
    "سر درد": "headache",
    "بخار": "fever",
    "تیز بخار": "high fever",
    "ہلکا بخار": "mild fever",
    "متلی": "nausea",
    "قے": "vomiting",
    "الٹی": "vomiting",
    "کھانسی": "cough",
    "بھوک کی کمی": "loss of appetite",
    "بھوک نہ لگنا": "loss of appetite",
    "کمزوری": "fatigue",
    "تھکاوٹ": "fatigue",
    "سستی": "lethargy",
    "چکر": "dizziness",
    "چکر آنا": "dizziness",
    "سانس کی تنگی": "breathlessness",
    "سانس پھولنا": "breathlessness",
    "پیٹ درد": "abdominal pain",
    "پیٹ میں درد": "abdominal pain",
    "سینے میں درد": "chest pain",
    "سینہ درد": "chest pain",
    "جوڑوں کا درد": "joint pain",
    "پٹھوں میں درد": "muscle pain",
    "جسم میں درد": "muscle pain",
    "خارش": "itching",
    "کھجلی": "itching",
    "جھری": "skin rash",
    "پھنسی": "skin rash",
    "پسینہ": "sweating",
    "پسینہ آنا": "sweating",
    "سردی لگنا": "chills",
    "لرز": "chills",
    "بدہضمی": "indigestion",
    "اسہال": "diarrhoea",
    "دست": "diarrhoea",
    "وزن کم ہونا": "weight loss",
    "پیلیا": "yellowish skin",
    "آنکھوں کا پیلا پن": "yellowing of eyes",
    "پیلے پیشاب": "dark urine",
    "بے چینی": "restlessness",
    "پریشانی": "irritability",
    "اداسی": "depression",
    "بے ہوشی": "malaise",
}

# Roman Urdu / voice transliteration → English
ROMAN_URDU_SYMPTOM_MAP = {
    "sar dard": "headache",
    "sir dard": "headache",
    "sardard": "headache",
    "sar ka dard": "headache",
    "bukhar": "fever",
    "bukhhar": "fever",
    "tez bukhar": "high fever",
    "high bukhar": "high fever",
    "halka bukhar": "mild fever",
    "mild bukhar": "mild fever",
    "matli": "nausea",
    "ulti": "vomiting",
    "qay": "vomiting",
    "qay ana": "vomiting",
    "khansi": "cough",
    "zukam": "cough",
    "kamzori": "fatigue",
    "thakawat": "fatigue",
    "susti": "lethargy",
    "chakkar": "dizziness",
    "chakkar ana": "dizziness",
    "sans ki tangi": "breathlessness",
    "sans phoolna": "breathlessness",
    "saans ki takleef": "breathlessness",
    "pet dard": "abdominal pain",
    "pait dard": "abdominal pain",
    "pet mein dard": "abdominal pain",
    "sina dard": "chest pain",
    "sine mein dard": "chest pain",
    "chest dard": "chest pain",
    "joint dard": "joint pain",
    "joron ka dard": "joint pain",
    "jism dard": "muscle pain",
    "pathon mein dard": "muscle pain",
    "kharish": "itching",
    "khujli": "itching",
    "dast": "diarrhoea",
    "ishaal": "diarrhoea",
    "bhook kam": "loss of appetite",
    "bhook na lagna": "loss of appetite",
    "wazan kam": "weight loss",
    "wazan kam hona": "weight loss",
    "pasina": "sweating",
    "pasina ana": "sweating",
    "pasine": "sweating",
    "thand lagna": "chills",
    "larz": "chills",
    "sardi lagna": "chills",
    "jhurri": "skin rash",
    "phansi": "skin rash",
    "skin phansi": "skin rash",
    "ziyada bhook": "excessive hunger",
    "zada bhook": "excessive hunger",
    "motapa": "obesity",
    "be chaini": "restlessness",
    "pareshani": "irritability",
    "udasi": "depression",
    "peelia": "yellowish skin",
    "ankhon ka peela pan": "yellowing of eyes",
    "pila peshab": "dark urine",
    "peela peshab": "dark urine",
}

URDU_CHAR_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]")

# English symptom phrases from the training dataset (supports voice: "headache fever")
COMMON_ENGLISH_SYMPTOMS = frozenset(
    {
        "fatigue",
        "vomiting",
        "high fever",
        "loss of appetite",
        "nausea",
        "headache",
        "abdominal pain",
        "yellowish skin",
        "yellowing of eyes",
        "chills",
        "skin rash",
        "malaise",
        "chest pain",
        "joint pain",
        "itching",
        "sweating",
        "dark urine",
        "cough",
        "diarrhoea",
        "irritability",
        "muscle pain",
        "excessive hunger",
        "weight loss",
        "lethargy",
        "breathlessness",
        "mild fever",
        "phlegm",
        "swelled lymph nodes",
        "blurred and distorted vision",
        "loss of balance",
        "dizziness",
        "abnormal menstruation",
        "depression",
        "red spots over body",
        "fast heart rate",
        "muscle weakness",
        "restlessness",
        "obesity",
        "family history",
        "stiff neck",
        "indigestion",
        "back pain",
        "constipation",
        "fever",
        "runny nose",
        "continuous sneezing",
        "throat irritation",
        "redness of eyes",
        "sinus pressure",
        "congestion",
    }
)

_SEGMENT_VOCABULARY: list[str] | None = None


def _get_segment_vocabulary() -> list[str]:
    """Phrases longest-first for greedy voice / free-text splitting."""
    global _SEGMENT_VOCABULARY
    if _SEGMENT_VOCABULARY is not None:
        return _SEGMENT_VOCABULARY

    phrases: set[str] = set(COMMON_ENGLISH_SYMPTOMS)
    phrases.update(_clean_english_phrase(v) for v in URDU_SCRIPT_SYMPTOM_MAP.values())
    phrases.update(_clean_english_phrase(v) for v in ROMAN_URDU_SYMPTOM_MAP.values())
    phrases.update(URDU_SCRIPT_SYMPTOM_MAP.keys())
    phrases.update(ROMAN_URDU_SYMPTOM_MAP.keys())
    phrases.discard("")

    _SEGMENT_VOCABULARY = sorted(
        phrases,
        key=lambda p: (len(p.split()), len(p)),
        reverse=True,
    )
    return _SEGMENT_VOCABULARY


def _phrase_in_vocabulary(candidate: str) -> bool:
    key = _lookup_key(candidate)
    if not key:
        return False
    if key in URDU_SCRIPT_SYMPTOM_MAP or key in ROMAN_URDU_SYMPTOM_MAP:
        return True
    if key in COMMON_ENGLISH_SYMPTOMS:
        return True
    return False


def _segment_phrase_greedy(phrase: str) -> List[str]:
    """Split space-separated speech like 'headache fever' or 'high fever headache'."""
    normalized = _lookup_key(phrase)
    if not normalized:
        return []

    if _phrase_in_vocabulary(normalized):
        return [normalized]

    words = normalized.split()
    if len(words) <= 1:
        return [normalized]

    result: List[str] = []
    i = 0
    while i < len(words):
        matched: str | None = None
        for j in range(len(words), i, -1):
            candidate = " ".join(words[i:j])
            if _phrase_in_vocabulary(candidate):
                matched = candidate
                i = j
                break
        if matched:
            result.append(matched)
        else:
            result.append(words[i])
            i += 1
    return result


def split_user_symptom_text(text: str) -> List[str]:
    """
    Split typed or spoken free text into individual symptom phrases.
    Commas separate symptoms; spaces use longest-match against known phrases.
    """
    if not text or not str(text).strip():
        return []

    parts: List[str] = []
    for chunk in re.split(r"[,;]+", str(text)):
        chunk = chunk.strip()
        if not chunk:
            continue
        parts.extend(_segment_phrase_greedy(chunk))
    return parts


def collect_raw_symptom_inputs(data: dict) -> List[str]:
    """Accept { text: \"headache fever\" } or { symptoms: [\"a\", \"b\"] }."""
    text = data.get("text")
    if isinstance(text, str) and text.strip():
        return split_user_symptom_text(text)

    raw_symptoms = data.get("symptoms")
    if isinstance(raw_symptoms, list):
        expanded: List[str] = []
        for item in raw_symptoms:
            if isinstance(item, str) and item.strip():
                expanded.extend(split_user_symptom_text(item))
        return expanded

    return []


def contains_urdu_script(text: str) -> bool:
    return bool(URDU_CHAR_RE.search(text or ""))


def _lookup_key(text: str) -> str:
    return " ".join((text or "").strip().lower().replace("_", " ").split())


def _clean_english_phrase(text: str) -> str:
    s = (text or "").strip().lower()
    s = s.rstrip(".")
    s = " ".join(s.split())
    return s


def _map_static(text: str) -> str | None:
    raw = (text or "").strip()
    if not raw:
        return None

    if raw in URDU_SCRIPT_SYMPTOM_MAP:
        return URDU_SCRIPT_SYMPTOM_MAP[raw]

    key = _lookup_key(raw)
    if key in ROMAN_URDU_SYMPTOM_MAP:
        return ROMAN_URDU_SYMPTOM_MAP[key]

    # Voice often title-cases each word: "Sar Dard"
    if key in ROMAN_URDU_SYMPTOM_MAP:
        return ROMAN_URDU_SYMPTOM_MAP[key]

    return None


def _looks_like_dataset_english(text: str) -> bool:
    """Already Latin/English symptom text — skip remote translation."""
    if contains_urdu_script(text):
        return False
    cleaned = _clean_english_phrase(text)
    if not cleaned:
        return False
    # Allow letters, spaces, hyphens only
    return bool(re.fullmatch(r"[a-z0-9\s\-]+", cleaned))


def translate_symptom_to_english(text: str) -> str:
    """
    Convert one symptom phrase to English for MongoDB / HF inference.
    Falls back to the cleaned input if translation fails.
    """
    raw = (text or "").strip()
    if not raw:
        return ""

    mapped = _map_static(raw)
    if mapped:
        return mapped

    if _looks_like_dataset_english(raw):
        return _clean_english_phrase(raw)

    source = "ur" if contains_urdu_script(raw) else "auto"
    translated = translate_to_english(raw, source=source)
    cleaned = _clean_english_phrase(translated)
    return cleaned or _clean_english_phrase(raw)


def resolve_symptoms_to_english(values: Iterable[str]) -> List[dict]:
    """
    Resolve user-entered symptoms to English normalized tokens.
    Returns list of { input, english, token } preserving order.
    """
    results: List[dict] = []
    seen_tokens: set[str] = set()

    for value in values:
        raw = (value or "").strip()
        if not raw:
            continue

        english = translate_symptom_to_english(raw)
        token = normalize_symptom(english)
        if not token or token in seen_tokens:
            continue

        seen_tokens.add(token)
        results.append(
            {
                "input": raw,
                "english": english.replace("_", " "),
                "token": token,
            }
        )

    return results

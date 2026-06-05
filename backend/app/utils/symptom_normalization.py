"""Shared symptom string normalization for suggestion queries and dataset import."""


def normalize_symptom(value: str) -> str:
    """Lowercase, trim, collapse spaces, replace spaces with underscores."""
    if not isinstance(value, str):
        return ""
    s = value.strip().lower()
    if not s:
        return ""
    s = " ".join(s.split())
    return s.replace(" ", "_")


def symptom_match_variants(value: str) -> list[str]:
    """Forms that may appear in disease_symptoms (underscore or space)."""
    normalized = normalize_symptom(value)
    if not normalized:
        return []
    spaced = normalized.replace("_", " ")
    return list(dict.fromkeys([normalized, spaced]))


def normalize_symptoms_list(values) -> list[str]:
    """Normalize a list of symptom strings; drop empties and preserve order."""
    if not isinstance(values, list):
        return []
    seen: set[str] = set()
    result: list[str] = []
    for raw in values:
        normalized = normalize_symptom(str(raw) if raw is not None else "")
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result

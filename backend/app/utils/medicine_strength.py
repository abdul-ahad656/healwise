import re
from typing import Optional


def normalize_strength(value: Optional[str]) -> str:
    """Normalize potency for comparison (e.g. '50 MG' -> '50mg')."""
    if not value:
        return ""
    text = str(value).strip().lower()
    text = re.sub(r"\s+", "", text)
    return text


def strengths_match(stored: Optional[str], requested: Optional[str]) -> bool:
    return normalize_strength(stored) == normalize_strength(requested)

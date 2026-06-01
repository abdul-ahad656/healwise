"""Reject MongoDB query-operator injection via JSON request bodies."""

from typing import Any


def contains_mongo_operators(value: Any) -> bool:
    """Return True if nested dict keys use MongoDB operators (e.g. $gt, $where)."""
    if isinstance(value, dict):
        for key, nested in value.items():
            if isinstance(key, str) and key.startswith("$"):
                return True
            if contains_mongo_operators(nested):
                return True
    elif isinstance(value, list):
        for item in value:
            if contains_mongo_operators(item):
                return True
    return False


def reject_mongo_operators_in_json(data: Any) -> bool:
    """True when payload is safe (no operator keys)."""
    return not contains_mongo_operators(data)

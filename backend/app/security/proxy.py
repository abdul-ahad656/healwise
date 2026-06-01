"""Client IP resolution behind Google Cloud Run / reverse proxies."""

from flask import request
from flask_limiter.util import get_remote_address


def get_real_client_ip() -> str:
    """
    Prefer the first hop in X-Forwarded-For (Cloud Run sets this).
    Fall back to Werkzeug's remote address for local development.
    """
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address()

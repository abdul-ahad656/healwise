"""Flask-Limiter configuration for Cloud Run and sensitive auth routes."""

from flask import jsonify
from flask_limiter import Limiter

from app.security.proxy import get_real_client_ip
from app.security.security_log import log_rate_limit_exceeded

# Default limits applied to all routes unless overridden
DEFAULT_LIMITS = ["200 per hour", "60 per minute"]

limiter = Limiter(
    key_func=get_real_client_ip,
    default_limits=DEFAULT_LIMITS,
    storage_uri="memory://",
    strategy="fixed-window",
)


def init_limiter(app) -> Limiter:
    """Attach limiter to app and register 429 JSON handler."""
    limiter.init_app(app)

    @app.errorhandler(429)
    def ratelimit_handler(e):
        log_rate_limit_exceeded(
            endpoint=getattr(e, "description", "unknown"),
            client_ip=get_real_client_ip(),
        )
        retry_after = getattr(e, "retry_after", None)
        body = {
            "error": "Too many requests. Please try again later.",
        }
        if retry_after is not None:
            body["retry_after"] = retry_after
        response = jsonify(body)
        response.status_code = 429
        if retry_after is not None:
            response.headers["Retry-After"] = str(retry_after)
        return response

    return limiter


# Route-specific limits (applied in auth_routes)
LOGIN_LIMIT = "5 per minute"
REGISTER_LIMIT = "3 per minute"
RESET_PASSWORD_LIMIT = "2 per minute"
OTP_LIMIT = "3 per 10 minutes"

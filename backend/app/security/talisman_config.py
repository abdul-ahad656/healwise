"""HTTP security headers via Flask-Talisman."""

from flask_talisman import Talisman


def init_talisman(app) -> None:
    """
    Apply security headers. HTTPS is forced only in production so local/mobile dev keeps working.
    CSP is disabled for JSON API responses (mobile clients are not browsers).
    """
    is_production = app.config.get("IS_PRODUCTION", False)

    Talisman(
        app,
        force_https=is_production,
        strict_transport_security=is_production,
        strict_transport_security_max_age=31536000,
        strict_transport_security_include_subdomains=True,
        frame_options="SAMEORIGIN",
        x_content_type_options=True,
        referrer_policy="strict-origin-when-cross-origin",
        content_security_policy=False,
        session_cookie_secure=is_production,
    )

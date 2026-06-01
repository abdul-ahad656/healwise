"""Structured security event logging — never log secrets or credentials."""

import logging

security_logger = logging.getLogger("healwise.security")


def log_failed_login(email: str, reason: str, client_ip=None) -> None:
    security_logger.warning(
        "failed_login",
        extra={
            "event": "failed_login",
            "email_domain": _email_domain(email),
            "reason": reason,
            "client_ip": client_ip,
        },
    )


def log_account_lockout(email: str, client_ip=None) -> None:
    security_logger.warning(
        "account_lockout",
        extra={
            "event": "account_lockout",
            "email_domain": _email_domain(email),
            "client_ip": client_ip,
        },
    )


def log_permission_denied(user_id, role, path: str) -> None:
    security_logger.warning(
        "permission_denied",
        extra={
            "event": "permission_denied",
            "user_id": user_id,
            "role": role,
            "path": path,
        },
    )


def log_rate_limit_exceeded(endpoint: str, client_ip=None) -> None:
    security_logger.warning(
        "rate_limit_exceeded",
        extra={
            "event": "rate_limit_exceeded",
            "endpoint": endpoint,
            "client_ip": client_ip,
        },
    )


def _email_domain(email: str) -> str:
    """Log only domain part of email to reduce PII in logs."""
    if not email or "@" not in email:
        return "unknown"
    return email.split("@", 1)[-1].lower()

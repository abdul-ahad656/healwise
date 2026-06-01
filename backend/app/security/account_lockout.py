"""Account lockout after repeated failed login attempts."""

from datetime import datetime, timedelta

from app.extensions import mongo
from app.models.user_model import find_user_by_email
from app.security.security_log import log_account_lockout, log_failed_login
from bson.objectid import ObjectId

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def _utcnow() -> datetime:
    return datetime.utcnow()


def is_account_locked(user: dict) -> bool:
    locked_until = user.get("locked_until")
    if not locked_until:
        return False
    if isinstance(locked_until, datetime) and locked_until > _utcnow():
        return True
    return False


def record_failed_login(email: str, client_ip=None) -> None:
    """Increment failed_attempts; set locked_until after threshold."""
    user = find_user_by_email(email)
    if not user:
        log_failed_login(email, "unknown_user", client_ip)
        return

    failed = int(user.get("failed_attempts") or 0) + 1
    update_fields: dict = {"failed_attempts": failed}

    if failed >= MAX_FAILED_ATTEMPTS:
        update_fields["locked_until"] = _utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
        log_account_lockout(email, client_ip)

    mongo.db.users.update_one({"_id": user["_id"]}, {"$set": update_fields})
    log_failed_login(email, "bad_password", client_ip)


def clear_login_lockout(user_id) -> None:
    """Reset counters after successful authentication."""
    mongo.db.users.update_one(
        {"_id": ObjectId(user_id) if isinstance(user_id, str) else user_id},
        {"$set": {"failed_attempts": 0, "locked_until": None}},
    )

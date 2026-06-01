from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from bson.objectid import ObjectId

from app.models.user_model import create_user, find_user_by_email
from app.utils.password_validator import validate_password_strength
from app.utils.email_validator import validate_email
from app.utils.jwt_verification import validate_verification_token
from app.extensions import mongo
from app.security.account_lockout import (
    clear_login_lockout,
    is_account_locked,
    record_failed_login,
)
from app.security.proxy import get_real_client_ip


def register_user(name, email, password, language="en", role="patient", verification_token=None):
    email = (email or "").strip().lower()
    name = (name or "").strip()

    if not verification_token:
        return {"error": "Email verification required. Please verify OTP first."}, 400

    token_ok, token_error = validate_verification_token(verification_token, email)
    if not token_ok:
        return {"error": token_error}, 401

    if not name:
        return {"error": "Name is required"}, 400

    is_email_valid, email_error = validate_email(email)
    if not is_email_valid:
        return {"error": email_error}, 400

    if find_user_by_email(email):
        return {"error": "Email already exists"}, 400

    is_valid, error_message = validate_password_strength(password)
    if not is_valid:
        return {"error": error_message}, 400

    user = {
        "name": name,
        "email": email,
        "password": generate_password_hash(password),
        "language": language,
        "role": role,
        "failed_attempts": 0,
        "locked_until": None,
    }

    result = create_user(user)
    user_id = str(result.inserted_id)

    token = create_access_token(
        identity=user_id,
        additional_claims={"role": role},
    )

    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "language": language,
        },
    }, 201


def login_user(email, password):
    """
    Authenticate user. Always returns generic 'Invalid credentials' on failure
    to avoid email enumeration and lockout disclosure.
    """
    email = (email or "").strip().lower()
    client_ip = get_real_client_ip()
    user = find_user_by_email(email)

    if not user:
        record_failed_login(email, client_ip)
        return {"error": "Invalid credentials"}, 401

    if is_account_locked(user):
        record_failed_login(email, client_ip)
        return {"error": "Invalid credentials"}, 401

    if not check_password_hash(user["password"], password):
        record_failed_login(email, client_ip)
        return {"error": "Invalid credentials"}, 401

    clear_login_lockout(user["_id"])

    role = user.get("role", "patient")
    access_token = create_access_token(
        identity=str(user["_id"]),
        additional_claims={"role": role},
    )

    return {
        "token": access_token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "language": user.get("language", "en"),
            "role": role,
        },
    }, 200


def reset_password(email, password, verification_token):
    """Reset password after OTP verification."""
    email = (email or "").strip().lower()

    token_ok, token_error = validate_verification_token(verification_token, email)
    if not token_ok:
        return {"error": token_error}, 401

    is_email_valid, email_error = validate_email(email)
    if not is_email_valid:
        return {"error": email_error}, 400

    user = find_user_by_email(email)
    if not user:
        return {"error": "Unable to reset password"}, 400

    is_valid, error_message = validate_password_strength(password)
    if not is_valid:
        return {"error": error_message}, 400

    mongo.db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {
            "$set": {
                "password": generate_password_hash(password),
                "failed_attempts": 0,
                "locked_until": None,
            }
        },
    )

    return {"message": "Password reset successfully"}, 200

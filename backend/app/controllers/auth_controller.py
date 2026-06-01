from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId

from app.extensions import mongo
from app.services.auth_service import register_user, login_user, reset_password
from app.utils.request_validation import validate_json
from app.security.schemas import (
    LoginSchema,
    RegisterSchema,
    ResetPasswordSchema,
    LanguageSchema,
    normalize_email_in_data,
)


@validate_json(RegisterSchema())
def register(data):
    data = normalize_email_in_data(data)

    if data.get("role") == "doctor":
        return jsonify({"error": "Doctor registration not allowed"}), 403

    result, status = register_user(
        name=data.get("name"),
        email=data.get("email"),
        password=data.get("password"),
        language=data.get("language", "en"),
        role=data.get("role", "patient"),
        verification_token=data.get("verification_token"),
    )
    return jsonify(result), status


@validate_json(LoginSchema())
def login(data):
    data = normalize_email_in_data(data)
    result, status = login_user(data["email"], data["password"])
    return jsonify(result), status


@validate_json(ResetPasswordSchema())
def reset_password_handler(data):
    data = normalize_email_in_data(data)
    result, status = reset_password(
        email=data.get("email"),
        password=data.get("password"),
        verification_token=data.get("verification_token"),
    )
    return jsonify(result), status


@jwt_required()
@validate_json(LanguageSchema())
def set_language(data):
    user_id = get_jwt_identity()
    language = data.get("language")

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"language": language}},
    )

    return jsonify({"message": "Language updated", "language": language}), 200

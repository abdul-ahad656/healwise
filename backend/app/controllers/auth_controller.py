# from flask import request, jsonify
# from app.services.auth_service import register_user, login_user

# def register():
#     data = request.json
#     return register_user(data["name"], data["email"], data["password"])

# def login():
#     data = request.json
#     return login_user(data["email"], data["password"])


from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from app.extensions import mongo
from app.services.auth_service import register_user, login_user, reset_password

def register():
    data = request.json

    role = data.get("role", "patient")  # default patient
    if data.get("role") == "doctor":
        return {"error": "Doctor registration not allowed"}, 403


    return register_user(
        name=data.get("name"),
        email=data.get("email"),
        password=data.get("password"),
        language=data.get("language", "en"),
        role=role,
        verification_token=data.get("verification_token"),
    )

def login():
    data = request.json
    return login_user(
        data["email"],
        data["password"]
    )


def reset_password_handler():
    data = request.json or {}
    return reset_password(
        email=data.get("email"),
        password=data.get("password"),
        verification_token=data.get("verification_token"),
    )


@jwt_required()
def set_language():
    user_id = get_jwt_identity()
    data = request.json or {}
    language = data.get("language")

    if language not in ["en", "ur"]:
        return {"error": "Invalid language"}, 400

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"language": language}}
    )

    return {"message": "Language updated", "language": language}, 200

# from flask import request, jsonify
# from app.services.auth_service import register_user, login_user

# def register():
#     data = request.json
#     return register_user(data["name"], data["email"], data["password"])

# def login():
#     data = request.json
#     return login_user(data["email"], data["password"])


from flask import request
from app.services.auth_service import register_user, login_user

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
        role=role
    )

def login():
    data = request.json
    return login_user(
        data["email"],
        data["password"]
    )

# from werkzeug.security import generate_password_hash, check_password_hash
# from app.models.user_model import create_user, find_user_by_email
# from flask_jwt_extended import create_access_token

# def register_user(name, email, password):
#     if find_user_by_email(email):
#         return {"error": "Email already registered"}, 400

#     hashed_pw = generate_password_hash(password)
    

#     user = {
#         "name": name,
#         "email": email,
#         "password": hashed_pw 
#     }

#     res = create_user(user)
#     return {"message": "User created successfully", "userId": str(res.inserted_id)}, 201


# def login_user(email, password):
#     user = find_user_by_email(email)
#     if not user:
#         return {"error": "Invalid credentials"}, 401

#     if not check_password_hash(user["password"], password):
#         return {"error": "Invalid credentials"}, 401

#     token = create_access_token(identity=str(user["_id"]))

#     return {
#         "token": token,
#         "userId": str(user["_id"]),
#         "user": {"name": user["name"], "email": user["email"]},
#     }, 200


from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app.models.user_model import create_user, find_user_by_email

# def register_user(name, email, password, language="en"):
#     if find_user_by_email(email):
#         return {"error": "Email already exists"}, 400

#     user = {
#         "name": name,
#         "email": email,
#         "password": generate_password_hash(password),
#         "language": language  # ✅ store language
#     }

#     create_user(user)
#     return {"message": "User registered successfully"}, 201


# def register_user(name, email, password, language="en"):
#     if find_user_by_email(email):
#         return {"error": "Email already exists"}, 400

#     user = {
#         "name": name,
#         "email": email,
#         "password": generate_password_hash(password),
#         "language": language
#     }

#     result = create_user(user)
#     user_id = str(result.inserted_id)

#     # ✅ Generate token immediately after registration
#     access_token = create_access_token(identity=user_id)

#     return {
#         "message": "User registered successfully",
#         "token": access_token,
#         "user": {
#             "id": user_id,
#             "name": name,
#             "email": email,
#             "language": language
#         }
#     }, 201


def register_user(name, email, password, language="en", role="patient"):
    if find_user_by_email(email):
        return {"error": "Email already exists"}, 400

    user = {
        "name": name,
        "email": email,
        "password": generate_password_hash(password),
        "language": language,
        "role": role  # patient | doctor
    }

    result = create_user(user)
    user_id = str(result.inserted_id)

    token = create_access_token(
        identity=user_id,
        additional_claims={"role": role}
    )

    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "language": language
        }
    }, 201


def login_user(email, password):
    user = find_user_by_email(email)
    if not user or not check_password_hash(user["password"], password):
        return {"error": "Invalid credentials"}, 401

    role = user.get("role", "patient")

    # ✅ Put userId inside token
    access_token = create_access_token(
        identity=str(user["_id"]),
        additional_claims={"role": role}
    )

    return {
        "token": access_token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "language": user.get("language", "en"),
            "role": role
        }
    }, 200

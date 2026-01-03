from flask_jwt_extended import get_jwt

def doctor_required():
    claims = get_jwt()
    if claims.get("role") != "doctor":
        return False
    return True


def admin_required():
    from flask_jwt_extended import get_jwt
    return get_jwt().get("role") == "admin"

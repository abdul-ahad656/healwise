from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.doctor_profile_controller import upsert_profile
from app.utils.role_guard import doctor_required

doctor_profile_bp = Blueprint("doctor_profile_bp", __name__)

@doctor_profile_bp.post("/profile")
@jwt_required()
def profile():
    if not doctor_required():
        return {"error": "Doctor only"}, 403
    return upsert_profile()

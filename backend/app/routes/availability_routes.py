from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.availability_controller import (
    set_availability,
    get_availability
)
from app.utils.role_guard import doctor_required

availability_bp = Blueprint("availability_bp", __name__)

@availability_bp.post("/set")
@jwt_required()
def set_slots():
    if not doctor_required():
        return {"error": "Doctor only"}, 403
    return set_availability()

@availability_bp.get("/<doctor_id>")
@jwt_required()
def view_slots(doctor_id):
    return get_availability(doctor_id)

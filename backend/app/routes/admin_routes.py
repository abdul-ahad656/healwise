from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.admin_controller import (
    get_doctors,
    create_doctor,
    toggle_doctor_status
)
from app.utils.role_guard import admin_required

admin_bp = Blueprint("admin_bp", __name__)


@admin_bp.post("/doctor")
@jwt_required()
def add_doctor():
    if not admin_required():
        return {"error": "Admin only"}, 403
    return create_doctor()


@admin_bp.get("/doctors")
@jwt_required()
def doctors():
    if not admin_required():
        return {"error": "Admin only"}, 403
    return get_doctors()

@admin_bp.put("/doctor/<doctor_id>/status")
@jwt_required()
def status(doctor_id):
    if not admin_required():
        return {"error": "Admin only"}, 403
    return toggle_doctor_status(doctor_id)

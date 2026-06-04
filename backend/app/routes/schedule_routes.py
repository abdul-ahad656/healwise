from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.schedule_controller import (
    create_schedule,
    get_doctor_schedules,
    get_available_slots,
    book_slot,
    cancel_schedule
)
from app.utils.role_guard import doctor_required

schedule_bp = Blueprint("schedule_bp", __name__)


@schedule_bp.post("/create")
@jwt_required()
def create():
    if not doctor_required():
        return {"error": "Doctor only"}, 403
    return create_schedule()


@schedule_bp.get("/doctor")
@jwt_required()
def doctor_schedules():
    if not doctor_required():
        return {"error": "Doctor only"}, 403
    from flask_jwt_extended import get_jwt_identity
    return get_doctor_schedules(get_jwt_identity())


@schedule_bp.get("/available/<doctor_id>")
@jwt_required()
def available_slots(doctor_id):
    return get_available_slots(doctor_id)


@schedule_bp.post("/book")
@jwt_required()
def book():
    return book_slot()


@schedule_bp.delete("/cancel")
@jwt_required()
def cancel():
    if not doctor_required():
        return {"error": "Doctor only"}, 403
    return cancel_schedule()

# app/routes/appointment_routes.py

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.controllers.appointment_controller import (
    book_appointment,
    get_my_appointments,
    doctor_appointments,
    update_appointment_status,
    start_consultation,
)
from app.controllers.appointment_actions import (
    cancel_appointment,
    reschedule_appointment,
    mark_appointment_complete,
    record_consultation_join,
    record_consultation_leave,
)
from app.utils.role_guard import doctor_required

appointment_bp = Blueprint("appointment_bp", __name__)

# Patient books appointment
@appointment_bp.post("/book")
@jwt_required()
def book():
    return book_appointment()

# Patient views own appointments
@appointment_bp.get("/my")
@jwt_required()
def my_appointments():
    return get_my_appointments()

# Doctor views assigned appointments
@appointment_bp.get("/doctor")
@jwt_required()
def doctor_view():
    if not doctor_required():
        return jsonify({"error": "Doctor only"}), 403
    return doctor_appointments()

# Doctor updates appointment status
@appointment_bp.put("/update/<appointment_id>")
@jwt_required()
def update(appointment_id):
    if not doctor_required():
        return jsonify({"error": "Doctor only"}), 403
    return update_appointment_status(appointment_id)


# Doctor starts consultation
@appointment_bp.post("/start-consultation/<appointment_id>")
@jwt_required()
def start_consult(appointment_id):
    if not doctor_required():
        return jsonify({"error": "Doctor only"}), 403
    return start_consultation(appointment_id)


@appointment_bp.post("/<appointment_id>/cancel")
@jwt_required()
def cancel_appt(appointment_id):
    return cancel_appointment(appointment_id)


@appointment_bp.post("/<appointment_id>/reschedule")
@jwt_required()
def reschedule_appt(appointment_id):
    return reschedule_appointment(appointment_id)


@appointment_bp.post("/<appointment_id>/mark-complete")
@jwt_required()
def mark_complete_appt(appointment_id):
    return mark_appointment_complete(appointment_id)


@appointment_bp.post("/<appointment_id>/consultation-join")
@jwt_required()
def consultation_join(appointment_id):
    return record_consultation_join(appointment_id)


@appointment_bp.post("/<appointment_id>/consultation-leave")
@jwt_required()
def consultation_leave(appointment_id):
    return record_consultation_leave(appointment_id)

from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.prescription_controller import (
    upload_prescription,
    get_prescription,
    get_patient_prescriptions
)

prescription_bp = Blueprint("prescription_bp", __name__)

@prescription_bp.post("/upload/<appointment_id>")
@jwt_required()
def upload(appointment_id):
    return upload_prescription(appointment_id)

@prescription_bp.get("/<appointment_id>")
@jwt_required()
def get(appointment_id):
    return get_prescription(appointment_id)

@prescription_bp.get("")
@jwt_required()
def list_prescriptions():
    return get_patient_prescriptions()

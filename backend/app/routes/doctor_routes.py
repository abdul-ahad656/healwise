from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.controllers.doctor_controller import (
    get_pending_cases,
    review_case
)
from app.utils.role_guard import doctor_required

doctor_bp = Blueprint("doctor_bp", __name__)

@doctor_bp.get("/cases")
@jwt_required()
def cases():
    if not doctor_required():
        return jsonify({"error": "Doctor access only"}), 403
    return get_pending_cases()

@doctor_bp.post("/review/<symptom_id>")
@jwt_required()
def review(symptom_id):
    if not doctor_required():
        return jsonify({"error": "Doctor access only"}), 403
    return review_case(symptom_id)

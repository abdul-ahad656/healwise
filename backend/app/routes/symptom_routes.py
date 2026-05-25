# from flask import Blueprint
# from app.controllers.symptom_controller import submit_symptoms, get_symptom, history

# symptom_bp = Blueprint("symptom_bp", __name__)

# symptom_bp.post("/submit")(submit_symptoms)
# symptom_bp.get("/<symptom_id>")(get_symptom)
# symptom_bp.get("/history/<user_id>")(history)

from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.symptom_controller import (
    submit_symptoms,
    get_my_symptom_history,
    get_patient_history_for_appointment,
)
from app.utils.role_guard import doctor_required

symptom_bp = Blueprint("symptom_bp", __name__)

symptom_bp.post("/submit")(jwt_required()(submit_symptoms))

@symptom_bp.get("/history")
@jwt_required()
def my_symptom_history():
    return get_my_symptom_history()

@symptom_bp.get("/history/appointment/<appointment_id>")
@jwt_required()
def history_for_appointment(appointment_id):
    if not doctor_required():
        return {"error": "Doctor only"}, 403
    return get_patient_history_for_appointment(appointment_id)

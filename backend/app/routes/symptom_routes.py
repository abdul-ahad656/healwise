# from flask import Blueprint
# from app.controllers.symptom_controller import submit_symptoms, get_symptom, history

# symptom_bp = Blueprint("symptom_bp", __name__)

# symptom_bp.post("/submit")(submit_symptoms)
# symptom_bp.get("/<symptom_id>")(get_symptom)
# symptom_bp.get("/history/<user_id>")(history)

from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.symptom_controller import submit_symptoms

symptom_bp = Blueprint("symptom_bp", __name__)

symptom_bp.post("/submit")(jwt_required()(submit_symptoms))

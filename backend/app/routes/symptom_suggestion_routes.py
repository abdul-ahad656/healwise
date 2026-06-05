from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.symptom_suggestion_controller import (
    resolve_symptoms_handler,
    suggest_symptoms_handler,
)

symptom_suggestion_bp = Blueprint("symptom_suggestion_bp", __name__)

symptom_suggestion_bp.post("/suggest-symptoms")(
    jwt_required()(suggest_symptoms_handler)
)
symptom_suggestion_bp.post("/symptoms/resolve-english")(
    jwt_required()(resolve_symptoms_handler)
)

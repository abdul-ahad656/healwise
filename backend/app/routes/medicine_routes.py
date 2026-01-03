# app/routes/medicine_routes.py

from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.medicine_controller import MedicineController

medicine_bp = Blueprint("medicine_bp", __name__)

medicine_bp.route("/compare", methods=["POST"])(jwt_required()(MedicineController.compare_medicines))
medicine_bp.route("/history", methods=["GET"])(jwt_required()(MedicineController.get_history))

from flask import Blueprint

from app.controllers.predict_controller import predict

predict_bp = Blueprint("predict_bp", __name__)

predict_bp.add_url_rule("/predict", view_func=predict, methods=["POST"])

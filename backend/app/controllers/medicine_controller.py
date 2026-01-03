# app/controllers/medicine_controller.py

from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.services.medicine_service import MedicineService

class MedicineController:

    @staticmethod
    def compare_medicines():
        user_id = get_jwt_identity()
        data = request.get_json()

        query = data.get("name") or data.get("salt")

        if not query:
            return jsonify({"error": "Medicine name or salt is required"}), 400

        result, status = MedicineService.compare_medicines(query, user_id)
        return jsonify(result), status

    @staticmethod
    def get_history():
        user_id = get_jwt_identity()
        history = MedicineService.get_history(user_id)
        return jsonify(history), 200

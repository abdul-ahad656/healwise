# app/controllers/medicine_controller.py

from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.services.medicine_service import MedicineService


class MedicineController:

    @staticmethod
    def compare_medicines():
        user_id = get_jwt_identity()
        data = request.get_json() or {}

        name = (data.get("name") or "").strip()
        strength = (data.get("strength") or data.get("potency") or "").strip()

        if not name or not strength:
            return jsonify({
                "error": "Medicine name and strength (potency) are required."
            }), 400

        result, status = MedicineService.compare_medicines(name, strength, user_id)
        return jsonify(result), status

    @staticmethod
    def get_history():
        user_id = get_jwt_identity()
        history = MedicineService.get_history(user_id)
        return jsonify(history), 200

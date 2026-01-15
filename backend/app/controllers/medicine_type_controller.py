from flask import request, jsonify
from app.services.medicine_type_service import MedicineTypeService


class MedicineTypeController:

    @staticmethod
    def awareness(medicine_type):
        result, status = MedicineTypeService.get_awareness(medicine_type)
        return jsonify(result), status

    @staticmethod
    def create_awareness():
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is required"}), 400

        result, status = MedicineTypeService.create_or_update_awareness(data)
        return jsonify(result), status

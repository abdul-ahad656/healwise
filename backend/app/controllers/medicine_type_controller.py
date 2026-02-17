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

    @staticmethod
    def list_awareness():
        from app.models.medicine_type_model import MedicineTypeModel

        docs = MedicineTypeModel.get_all()
        return jsonify(docs), 200

    @staticmethod
    def delete_awareness(medicine_type):
        from app.models.medicine_type_model import MedicineTypeModel

        result = MedicineTypeModel.delete_by_type(medicine_type)
        if result.deleted_count == 0:
            return jsonify({"error": "Medicine type not found"}), 404
        return jsonify({"message": "Medicine awareness deleted"}), 200

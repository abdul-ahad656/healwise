from flask import request, jsonify
from app.services.medicine_type_service import MedicineTypeService
from app.utils.translate_utils import translate_to_urdu, translate_list_to_urdu


class MedicineTypeController:

    @staticmethod
    def awareness(medicine_type):
        lang = request.args.get("lang")
        result, status = MedicineTypeService.get_awareness(medicine_type)

        # If translation requested and the base call succeeded, translate fields to Urdu
        if lang == "ur" and status == 200 and isinstance(result, dict) and "error" not in result:
            result = result.copy()
            result["description"] = translate_to_urdu(result.get("description", ""))
            result["common_uses"] = translate_list_to_urdu(result.get("common_uses"))
            result["how_to_use"] = translate_list_to_urdu(result.get("how_to_use"))
            result["precautions"] = translate_list_to_urdu(result.get("precautions"))
            result["side_effects"] = translate_list_to_urdu(result.get("side_effects"))
            result["warnings"] = translate_list_to_urdu(result.get("warnings"))
            # disclaimer is static English text; translate too for consistency
            result["disclaimer"] = translate_to_urdu(result.get("disclaimer", ""))

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

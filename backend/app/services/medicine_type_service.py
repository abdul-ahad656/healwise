from app.models.medicine_type_model import MedicineTypeModel


class MedicineTypeService:

    @staticmethod
    def get_awareness(medicine_type):
        """
        Returns awareness info for a medicine type
        """
        data = MedicineTypeModel.get_by_type(medicine_type)

        if not data:
            return {"error": "Medicine type not found"}, 404

        return {
            "medicine_type": data["medicine_type"],
            "description": data["description"],
            "common_uses": data["common_uses"],
            "how_to_use": data["how_to_use"],
            "precautions": data["precautions"],
            "side_effects": data["side_effects"],
            "warnings": data["warnings"],
            "otc": data["otc"],
            "disclaimer": "This information is for awareness only. Consult a healthcare professional before use."
        }, 200

    @staticmethod
    def create_or_update_awareness(payload: dict):
        """
        Create or update medicine awareness content
        """
        medicine_type = payload.get("medicine_type")
        description = payload.get("description")

        if not medicine_type or not description:
            return {"error": "medicine_type and description are required"}, 400

        MedicineTypeModel.upsert_awareness(payload)

        return {"message": "Medicine awareness saved successfully"}, 201

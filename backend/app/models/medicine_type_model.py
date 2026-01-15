from app.extensions import mongo


class MedicineTypeModel:

    @staticmethod
    def get_by_type(medicine_type):
        """
        Fetch awareness info by medicine type
        """
        return mongo.db.medicine_types.find_one(
            {"medicine_type": {"$regex": f"^{medicine_type}$", "$options": "i"}},
            {"_id": 0}
        )

    @staticmethod
    def upsert_awareness(data: dict):
        """
        Create or update awareness info for a medicine type
        """
        doc = {
            "medicine_type": data["medicine_type"],
            "description": data.get("description"),
            "common_uses": data.get("common_uses"),
            "how_to_use": data.get("how_to_use"),
            "precautions": data.get("precautions"),
            "side_effects": data.get("side_effects"),
            "warnings": data.get("warnings"),
            "otc": data.get("otc"),
        }

        return mongo.db.medicine_types.update_one(
            {"medicine_type": {"$regex": f"^{data['medicine_type']}$", "$options": "i"}},
            {"$set": doc},
            upsert=True
        )

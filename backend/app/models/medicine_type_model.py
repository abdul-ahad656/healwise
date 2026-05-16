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
    def get_all():
        docs = list(mongo.db.medicine_types.find({}))
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs

    @staticmethod
    def get_type_names():
        """Distinct medicine_type values for patient dropdown (always from DB)."""
        cursor = mongo.db.medicine_types.find(
            {"medicine_type": {"$exists": True, "$ne": ""}},
            {"medicine_type": 1, "_id": 0},
        )
        names = []
        seen = set()
        for doc in cursor:
            name = (doc.get("medicine_type") or "").strip()
            if not name:
                continue
            key = name.lower()
            if key in seen:
                continue
            seen.add(key)
            names.append(name)
        return sorted(names, key=str.lower)

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

    @staticmethod
    def delete_by_type(medicine_type):
        return mongo.db.medicine_types.delete_one(
            {"medicine_type": {"$regex": f"^{medicine_type}$", "$options": "i"}}
        )

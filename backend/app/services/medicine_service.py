# app/services/medicine_service.py

from app.models.medicine_model import MedicineModel
from app.models.medicine_history_model import MedicineHistoryModel
from app.utils.medicine_strength import normalize_strength


class MedicineService:

    @staticmethod
    def compare_medicines(name, strength, user_id=None):
        name = (name or "").strip()
        strength = (strength or "").strip()

        if not name or not strength:
            return {"error": "Medicine name and strength (potency) are required."}, 400

        med = MedicineModel.get_by_name_and_strength(name, strength)

        if not med:
            return {
                "error": (
                    f"No medicine found for '{name}' at strength '{strength}'. "
                    "Check the name and potency (e.g. 50mg)."
                )
            }, 404

        salt = med.get("salt")
        if not salt:
            return {"error": "Salt not found for this medicine."}, 400

        alternatives = MedicineModel.get_by_salt_and_strength(salt, strength)

        if not alternatives:
            return {
                "error": (
                    f"No alternatives found for salt '{salt}' at strength '{strength}'."
                )
            }, 404

        alternatives_sorted = sorted(alternatives, key=lambda x: x.get("price", 999999))
        top_3_alternatives = alternatives_sorted[:3]

        normalized_strength = normalize_strength(strength)
        output = []
        for item in top_3_alternatives:
            output.append({
                "name": item.get("name"),
                "salt": item.get("salt"),
                "manufacturer": item.get("manufacturer"),
                "strength": item.get("strength"),
                "price": item.get("price"),
            })

        result_data = {
            "input_medicine": name,
            "input_strength": strength,
            "normalized_strength": normalized_strength,
            "salt": salt,
            "alternatives": output,
        }

        if user_id:
            history_record = {
                "userId": user_id,
                "query": f"{name} ({strength})",
                "name": name,
                "strength": strength,
                "result": result_data,
            }
            MedicineHistoryModel.create_history(history_record)

        return result_data, 200

    @staticmethod
    def get_history(user_id):
        history = MedicineHistoryModel.get_user_history(user_id)
        for item in history:
            item["_id"] = str(item["_id"])
            if item.get("createdAt"):
                item["createdAt"] = item["createdAt"].isoformat()
        return history

# app/services/medicine_service.py

from app.models.medicine_model import MedicineModel
from app.models.medicine_history_model import MedicineHistoryModel

class MedicineService:

    @staticmethod
    def compare_medicines(query, user_id=None):

        salt = None
        alternatives = []

        # Step 1: Try to find by name
        med = MedicineModel.get_by_name(query)

        if med:
            salt = med.get("salt")
            if not salt:
                return {"error": "Salt not found for this medicine."}, 400
            # Step 2: Find all medicines with same salt
            alternatives = MedicineModel.get_by_salt(salt)
        else:
            # Step 1b: If not found by name, check if input is a salt
            alternatives = MedicineModel.get_by_salt(query)
            if alternatives:
                salt = query
            else:
                return {"error": f"Medicine or Salt '{query}' not found."}, 404

        # Step 3: Sort by price (ascending)
        alternatives_sorted = sorted(alternatives, key=lambda x: x.get("price", 999999))

        # Step 3b: Keep only top 3 cheapest
        top_3_alternatives = alternatives_sorted[:3]

        # Step 4: Build clean output
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
            "input_medicine": query,
            "salt": salt,
            "alternatives": output
        }

        # Step 5: Save history if user_id is provided
        if user_id:
            history_record = {
                "userId": user_id,
                "query": query,
                "result": result_data
            }
            MedicineHistoryModel.create_history(history_record)

        return result_data, 200

    @staticmethod
    def get_history(user_id):
        history = MedicineHistoryModel.get_user_history(user_id)
        # Convert ObjectId to string for JSON serialization
        for item in history:
            item["_id"] = str(item["_id"])
        return history

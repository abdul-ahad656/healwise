# app/models/medicine_model.py

from app.extensions import mongo

class MedicineModel:

    @staticmethod
    def get_by_name(name):
        return mongo.db.medicines.find_one({
            "name": {"$regex": f"^{name}$", "$options": "i"}
        })

    @staticmethod
    def get_by_salt(salt):
        return list(mongo.db.medicines.find({
            "salt": {"$regex": f"^{salt}$", "$options": "i"}
        }))

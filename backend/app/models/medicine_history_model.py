from app.extensions import mongo
from datetime import datetime
from bson.objectid import ObjectId

class MedicineHistoryModel:
    @staticmethod
    def create_history(record: dict):
        record["createdAt"] = datetime.utcnow()
        return mongo.db.medicine_history.insert_one(record)

    @staticmethod
    def get_user_history(user_id, limit=50):
        return list(mongo.db.medicine_history.find({"userId": user_id}).sort("createdAt", -1).limit(limit))

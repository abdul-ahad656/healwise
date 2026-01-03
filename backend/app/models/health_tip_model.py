from datetime import datetime
from bson.objectid import ObjectId
from app.extensions import mongo


class HealthTipModel:
    COLLECTION = "health_tips"

    @staticmethod
    def create_tip(
        title,
        description,
        tip_type,
        language,
        created_by,
        disease=None,
        image=None,
        video=None
    ):
        tip = {
            "title": title,
            "description": description,
            "type": tip_type,        # general | disease
            "disease": disease,      # None if general
            "language": language,

            "media": {
                "image": image,
                "video": video
            },

            "active": True,
            "createdBy": created_by,
            "createdAt": datetime.utcnow()
        }

        return mongo.db[HealthTipModel.COLLECTION].insert_one(tip)

    @staticmethod
    def get_active_tips(language="en", disease=None):
        query = {
            "active": True,
            "language": language
        }

        if disease:
            query["$or"] = [
                {"type": "general"},
                {"type": "disease", "disease": disease}
            ]
        else:
            query["type"] = "general"

        tips = list(mongo.db[HealthTipModel.COLLECTION].find(query))

        for tip in tips:
            tip["_id"] = str(tip["_id"])

        return tips

    @staticmethod
    def deactivate_tip(tip_id):
        return mongo.db[HealthTipModel.COLLECTION].update_one(
            {"_id": ObjectId(tip_id)},
            {"$set": {"active": False}}
        )

    @staticmethod
    def get_tip_by_id(tip_id):
        tip = mongo.db[HealthTipModel.COLLECTION].find_one(
            {"_id": ObjectId(tip_id)}
        )
        if tip:
            tip["_id"] = str(tip["_id"])
        return tip

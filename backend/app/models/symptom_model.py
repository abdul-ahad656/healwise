from app.extensions import mongo
from datetime import datetime
from bson.objectid import ObjectId

def create_symptom_record(record: dict):
    record["createdAt"] = datetime.utcnow()
    record["updatedAt"] = datetime.utcnow()
    # aiStatus: "processing" | "done" | "error"
    return mongo.db.symptoms.insert_one(record)

def get_symptom_by_id(symptom_id):
    try:
        return mongo.db.symptoms.find_one({"_id": ObjectId(symptom_id)})
    except:
        return None

def get_user_symptoms(user_id, limit=50):
    # user_id is string
    return list(mongo.db.symptoms.find({"userId": user_id}).sort("createdAt", -1).limit(limit))

def update_symptom(symptom_id, update_fields: dict):
    update_fields["updatedAt"] = datetime.utcnow()
    mongo.db.symptoms.update_one({"_id": ObjectId(symptom_id)}, {"$set": update_fields})
    return get_symptom_by_id(symptom_id)

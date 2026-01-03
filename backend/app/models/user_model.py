from app.extensions import mongo
from bson.objectid import ObjectId

def create_user(data):
    return mongo.db.users.insert_one(data)

def find_user_by_email(email):
    return mongo.db.users.find_one({"email": email})

# def find_user_by_id(user_id):
#     try:
#         return mongo.db.users.find_one(
#             {"_id": ObjectId(user_id)}
#         )
#     except Exception:
#         return None

def find_user_by_id(user_id):
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})

    return user

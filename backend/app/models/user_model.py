from app.extensions import mongo
from bson.objectid import ObjectId


def create_user(data):
    return mongo.db.users.insert_one(data)


def find_user_by_email(email):
    return mongo.db.users.find_one({"email": email})


def find_user_by_id(user_id):
    try:
        oid = ObjectId(user_id) if isinstance(user_id, str) else user_id
    except Exception:
        return None
    return mongo.db.users.find_one({"_id": oid})


def find_doctor_by_id(doctor_id):
    """Load a doctor from the users collection (role=doctor)."""
    try:
        oid = ObjectId(doctor_id) if isinstance(doctor_id, str) else doctor_id
    except Exception:
        return None
    return mongo.db.users.find_one({"_id": oid, "role": "doctor"})


def parse_consultation_fee_pkr(doctor):
    """
    Read consultation fee set by admin on the doctor user record.
    Supports consultationFee (camelCase) and consultation_fee (snake_case).
    Fee is stored in PKR (e.g. 1500 = PKR 1,500).
    """
    if not doctor:
        return None

    raw = doctor.get("consultationFee")
    if raw is None:
        raw = doctor.get("consultation_fee")

    if raw is None or raw == "":
        return None

    try:
        fee = float(raw)
    except (TypeError, ValueError):
        return None

    if fee <= 0:
        return None

    return fee


def normalize_consultation_fee_for_storage(value):
    """Coerce admin/API input to a number suitable for MongoDB, or None."""
    if value is None or value == "":
        return None
    try:
        fee = float(value)
    except (TypeError, ValueError):
        return None
    if fee <= 0:
        return None
    return int(fee) if fee == int(fee) else fee

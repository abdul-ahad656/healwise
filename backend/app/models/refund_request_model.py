from datetime import datetime

from bson.objectid import ObjectId
from pymongo.errors import PyMongoError

from app.extensions import mongo


def create_refund_request(data: dict):
    doc = {
        **data,
        "status": "pending",
        "requestedAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    try:
        result = mongo.db.refund_requests.insert_one(doc)
        return result.inserted_id
    except PyMongoError as e:
        raise Exception(f"Failed to create refund request: {str(e)}") from e


def find_refund_request_by_id(refund_id):
    try:
        oid = ObjectId(refund_id)
    except Exception:
        return None
    doc = mongo.db.refund_requests.find_one({"_id": oid})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


def find_pending_refund_for_appointment(appointment_id: str):
    return mongo.db.refund_requests.find_one({
        "appointmentId": str(appointment_id),
        "status": {"$in": ["pending", "approved"]},
    })


def get_patient_refund_requests(patient_id: str):
    rows = list(
        mongo.db.refund_requests.find({"patientId": str(patient_id)}).sort(
            "requestedAt", -1
        )
    )
    for row in rows:
        row["_id"] = str(row["_id"])
    return rows


def get_pending_refund_requests():
    rows = list(
        mongo.db.refund_requests.find({"status": "pending"}).sort("requestedAt", 1)
    )
    for row in rows:
        row["_id"] = str(row["_id"])
    return rows


def approve_refund_request(refund_id, admin_id, proof_url, admin_notes=None):
    try:
        oid = ObjectId(refund_id)
    except Exception:
        raise ValueError("Invalid refund request ID") from None
    update = {
        "status": "approved",
        "refundProofUrl": proof_url,
        "processedAt": datetime.utcnow(),
        "processedBy": str(admin_id),
        "updatedAt": datetime.utcnow(),
    }
    if admin_notes:
        update["adminNotes"] = admin_notes
    mongo.db.refund_requests.update_one({"_id": oid}, {"$set": update})


def reject_refund_request(refund_id, admin_id, admin_notes=None):
    try:
        oid = ObjectId(refund_id)
    except Exception:
        raise ValueError("Invalid refund request ID") from None
    update = {
        "status": "rejected",
        "processedAt": datetime.utcnow(),
        "processedBy": str(admin_id),
        "updatedAt": datetime.utcnow(),
    }
    if admin_notes:
        update["adminNotes"] = admin_notes
    mongo.db.refund_requests.update_one({"_id": oid}, {"$set": update})

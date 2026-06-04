from app.extensions import mongo
from bson.objectid import ObjectId
from datetime import datetime
from pymongo.errors import PyMongoError


def _is_object_id(value) -> bool:
    """Check if value is a valid MongoDB ObjectId."""
    if value is None:
        return False
    try:
        # A valid ObjectId is exactly 24 hexadecimal characters
        if not isinstance(value, str) or len(str(value)) != 24:
            return False
        # Try to create it - if it fails, it's not valid
        ObjectId(str(value))
        return True
    except Exception:
        return False


def _appointment_ref_filter(appointment_ref: str) -> dict:
    """
    Match payments by client tracking id (appt_...) or MongoDB appointment _id.
    Payments store the tracking id in appointmentId / appointmentTrackingId until
    a real appointment row exists (appointmentRecordId).
    """
    clauses = [
        {"appointmentId": appointment_ref},
        {"appointmentTrackingId": appointment_ref},
    ]
    if _is_object_id(appointment_ref):
        oid = ObjectId(appointment_ref)
        clauses.extend([
            {"appointmentId": oid},
            {"appointmentRecordId": oid},
        ])
    if len(clauses) == 1:
        return clauses[0]
    return {"$or": clauses}


def create_payment(payment_data):
    """Insert a new payment record."""
    try:
        result = mongo.db.payments.insert_one(payment_data)
        return result.inserted_id
    except PyMongoError as e:
        raise Exception(f"Failed to create payment: {str(e)}")


def find_payment_by_intent_id(stripe_intent_id):
    """Find payment by Stripe PaymentIntent ID."""
    try:
        return mongo.db.payments.find_one({"stripePaymentIntentId": stripe_intent_id})
    except PyMongoError as e:
        raise Exception(f"Failed to find payment: {str(e)}")


def find_payment_by_id(payment_id):
    """Find payment by MongoDB ID."""
    try:
        return mongo.db.payments.find_one({"_id": ObjectId(payment_id)})
    except (PyMongoError, Exception) as e:
        raise Exception(f"Failed to find payment: {str(e)}")


def update_payment_status(payment_id, status, update_data=None):
    """Update payment status and optional additional fields."""
    try:
        update_dict = {"status": status, "updatedAt": datetime.utcnow()}
        if update_data:
            update_dict.update(update_data)

        result = mongo.db.payments.update_one(
            {"_id": ObjectId(payment_id)},
            {"$set": update_dict}
        )
        return result.modified_count > 0
    except (PyMongoError, Exception) as e:
        raise Exception(f"Failed to update payment status: {str(e)}")


def get_user_payments(user_id, limit=50):
    """Get all payments for a user, sorted by creation date (newest first)."""
    try:
        payments = list(
            mongo.db.payments.find({"userId": user_id})
            .sort("createdAt", -1)
            .limit(limit)
        )

        for payment in payments:
            payment["_id"] = str(payment["_id"])
            for key in ("appointmentId", "appointmentRecordId", "appointmentTrackingId"):
                if key in payment and payment[key] is not None:
                    payment[key] = str(payment[key])

        return payments
    except PyMongoError as e:
        raise Exception(f"Failed to retrieve payments: {str(e)}")


def find_appointment_payment(appointment_ref):
    """Find payment associated with a tracking id or booked appointment id."""
    try:
        return mongo.db.payments.find_one(_appointment_ref_filter(appointment_ref))
    except (PyMongoError, Exception) as e:
        raise Exception(f"Failed to find appointment payment: {str(e)}")


def update_payment_with_refund(payment_id, refund_id, refund_status="succeeded"):
    """Update payment record with refund information."""
    try:
        result = mongo.db.payments.update_one(
            {"_id": ObjectId(payment_id)},
            {
                "$set": {
                    "refundId": refund_id,
                    "status": "refunded",
                    "refundedAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0
    except (PyMongoError, Exception) as e:
        raise Exception(f"Failed to update refund: {str(e)}")


def check_active_payment_for_appointment(appointment_ref):
    """Check if this booking reference already has an active payment."""
    try:
        payment = mongo.db.payments.find_one({
            **_appointment_ref_filter(appointment_ref),
            "status": {"$in": ["pending", "pending_review", "paid"]},
        })
        return payment is not None
    except (PyMongoError, Exception) as e:
        raise Exception(f"Failed to check active payment: {str(e)}")


def submit_payment_proof(payment_id, proof_data):
    """Store proof for Easypaisa payment (screenshot or transaction ID)."""
    try:
        update_dict = {
            "status": "pending_review",
            "updatedAt": datetime.utcnow()
        }

        if proof_data.get("proof_type") == "screenshot":
            update_dict["easypaisa_proof_url"] = proof_data.get("proof")
        elif proof_data.get("proof_type") == "transaction_id":
            update_dict["easypaisa_transaction_id"] = proof_data.get("proof")

        update_dict["proof_submitted_at"] = datetime.utcnow()

        result = mongo.db.payments.update_one(
            {"_id": ObjectId(payment_id)},
            {"$set": update_dict}
        )
        return result.modified_count > 0
    except (PyMongoError, Exception) as e:
        raise Exception(f"Failed to submit payment proof: {str(e)}")


def update_payment_to_paid(payment_id, admin_notes=None):
    """Update Easypaisa payment from pending_review to paid."""
    try:
        update_dict = {
            "status": "paid",
            "paid_at": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }

        if admin_notes:
            update_dict["admin_notes"] = admin_notes

        update_dict["admin_approved_at"] = datetime.utcnow()

        result = mongo.db.payments.update_one(
            {"_id": ObjectId(payment_id)},
            {"$set": update_dict}
        )
        return result.modified_count > 0
    except (PyMongoError, Exception) as e:
        raise Exception(f"Failed to update payment to paid: {str(e)}")


def _serialize_payment_doc(payment: dict) -> dict:
    """Normalize ids and datetimes for JSON responses."""
    payment["_id"] = str(payment["_id"])
    for key in ("appointmentId", "appointmentRecordId", "appointmentTrackingId"):
        if key in payment and payment[key] is not None:
            payment[key] = str(payment[key])
    if "userId" in payment and payment["userId"] is not None:
        payment["userId"] = str(payment["userId"])

    for field, value in list(payment.items()):
        if isinstance(value, datetime):
            payment[field] = value.isoformat()
    return payment


def get_pending_easypaisa_payments(limit=50):
    """Get all Easypaisa payments pending admin review."""
    try:
        payments = list(
            mongo.db.payments.find({
                "payment_method": "easypaisa",
                "status": "pending_review"
            })
            .sort("createdAt", -1)
            .limit(limit)
        )

        return [_serialize_payment_doc(p) for p in payments]
    except PyMongoError as e:
        raise Exception(f"Failed to retrieve pending payments: {str(e)}")


def get_admin_approved_payments(limit=100):
    """Easypaisa (and similar) payments confirmed by an admin."""
    try:
        payments = list(
            mongo.db.payments.find(
                {
                    "status": "paid",
                    "admin_approved_at": {"$exists": True},
                }
            )
            .sort("admin_approved_at", -1)
            .limit(limit)
        )
        return [_serialize_payment_doc(p) for p in payments]
    except PyMongoError as e:
        raise Exception(f"Failed to retrieve approved payments: {str(e)}")


def update_payment_to_rejected(payment_id, admin_notes=None):
    """Mark Easypaisa payment as rejected after admin review."""
    try:
        update_dict = {
            "status": "rejected",
            "rejected_at": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        if admin_notes:
            update_dict["admin_notes"] = admin_notes
        update_dict["admin_rejected_at"] = datetime.utcnow()

        result = mongo.db.payments.update_one(
            {"_id": ObjectId(payment_id)},
            {"$set": update_dict},
        )
        return result.modified_count > 0
    except (PyMongoError, Exception) as e:
        raise Exception(f"Failed to reject payment: {str(e)}")


def find_payment_by_stripe_intent(stripe_intent_id):
    """Find payment by Stripe PaymentIntent ID (for webhook)."""
    try:
        return mongo.db.payments.find_one({"stripe_payment_intent_id": stripe_intent_id})
    except (PyMongoError, Exception) as e:
        raise Exception(f"Failed to find payment: {str(e)}")


def payment_has_booked_appointment(payment) -> bool:
    """True if payment is already linked to a row in appointments collection."""
    if not payment:
        return False

    record_id = payment.get("appointmentRecordId")
    if record_id and _is_object_id(record_id):
        return mongo.db.appointments.find_one({"_id": ObjectId(record_id)}) is not None

    legacy_id = payment.get("appointmentId")
    if legacy_id and _is_object_id(legacy_id):
        return mongo.db.appointments.find_one({"_id": ObjectId(legacy_id)}) is not None

    return False

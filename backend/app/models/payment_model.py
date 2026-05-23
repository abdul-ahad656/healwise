from app.extensions import mongo
from bson.objectid import ObjectId
from datetime import datetime
from pymongo.errors import PyMongoError


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

        # Serialize ObjectIds to strings
        for payment in payments:
            payment["_id"] = str(payment["_id"])
            if "appointmentId" in payment and payment["appointmentId"]:
                payment["appointmentId"] = str(payment["appointmentId"])

        return payments
    except PyMongoError as e:
        raise Exception(f"Failed to retrieve payments: {str(e)}")


def find_appointment_payment(appointment_id):
    """Find payment associated with an appointment."""
    try:
        return mongo.db.payments.find_one({"appointmentId": ObjectId(appointment_id)})
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


def check_active_payment_for_appointment(appointment_id):
    """Check if appointment already has an active payment (pending or paid)."""
    try:
        payment = mongo.db.payments.find_one({
            "appointmentId": ObjectId(appointment_id),
            "status": {"$in": ["pending", "pending_review", "paid"]}
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

        # Store proof based on type
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

        # Serialize ObjectIds
        for payment in payments:
            payment["_id"] = str(payment["_id"])
            if "appointmentId" in payment and payment["appointmentId"]:
                payment["appointmentId"] = str(payment["appointmentId"])
            if "userId" in payment:
                payment["userId"] = str(payment["userId"])

        return payments
    except PyMongoError as e:
        raise Exception(f"Failed to retrieve pending payments: {str(e)}")


def find_payment_by_stripe_intent(stripe_intent_id):
    """Find payment by Stripe PaymentIntent ID (for webhook)."""
    try:
        return mongo.db.payments.find_one({"stripe_payment_intent_id": stripe_intent_id})
    except (PyMongoError, Exception) as e:
        raise Exception(f"Failed to find payment: {str(e)}")


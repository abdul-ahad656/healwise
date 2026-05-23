from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.payment_controller import (
    create_payment_handler,
    submit_proof_handler,
    admin_confirm_payment_handler,
    handle_webhook,
    get_payment_history,
    refund_payment_handler,
    get_pending_easypaisa_for_admin,
)

payment_bp = Blueprint("payment_bp", __name__)


@payment_bp.post("/create-payment")
@jwt_required()
def create_payment():
    """Create payment for appointment (supports Stripe and Easypaisa)."""
    return create_payment_handler()


@payment_bp.post("/webhook")
def webhook():
    """Handle Stripe webhook events. No auth required, signature verified instead."""
    return handle_webhook()


@payment_bp.post("/submit-proof")
@jwt_required()
def submit_proof():
    """Submit payment proof for Easypaisa payments."""
    return submit_proof_handler()


@payment_bp.post("/admin/confirm-payment")
@jwt_required()
def admin_confirm():
    """Admin endpoint to confirm Easypaisa payments."""
    return admin_confirm_payment_handler()


@payment_bp.get("/admin/pending-easypaisa")
@jwt_required()
def admin_pending():
    """Admin endpoint to view pending Easypaisa payments."""
    return get_pending_easypaisa_for_admin()


@payment_bp.get("/history")
@jwt_required()
def payment_history():
    """Get payment history for authenticated user."""
    return get_payment_history()


@payment_bp.post("/refund")
@jwt_required()
def refund():
    """Request a refund for a payment."""
    return refund_payment_handler()

import stripe
from flask import current_app
from bson.objectid import ObjectId
import os


class StripeServiceError(Exception):
    """Custom exception for Stripe service errors."""
    pass


class PaymentMethodError(Exception):
    """Custom exception for payment method errors."""
    pass


def init_stripe():
    """Initialize Stripe with API key from config."""
    api_key = current_app.config.get("STRIPE_SECRET_KEY")
    if not api_key:
        raise StripeServiceError("STRIPE_SECRET_KEY is not configured")
    stripe.api_key = api_key


def create_payment_intent(amount, currency, user_id, appointment_data):
    """
    Create a Stripe PaymentIntent.

    Args:
        amount: Amount in smallest currency unit (cents for USD)
        currency: Currency code (e.g., 'usd')
        user_id: Patient/user ID
        appointment_data: Dict with appointmentDate, doctorId, doctorName

    Returns:
        Stripe PaymentIntent object
    """
    try:
        init_stripe()

        metadata = {
            "userId": str(user_id),
            "appointmentDate": appointment_data.get("appointmentDate", ""),
            "doctorId": appointment_data.get("doctorId", ""),
            "doctorName": appointment_data.get("doctorName", ""),
        }

        intent = stripe.PaymentIntent.create(
            amount=int(amount),
            currency=currency.lower(),
            metadata=metadata,
            description=f"Consultation appointment - {appointment_data.get('doctorName', 'Doctor')}",
        )

        return intent

    except stripe.error.StripeError as e:
        raise StripeServiceError(f"Stripe API error: {str(e)}")
    except Exception as e:
        raise StripeServiceError(f"Failed to create payment intent: {str(e)}")


def get_payment_intent(intent_id):
    """Retrieve a PaymentIntent from Stripe."""
    try:
        init_stripe()
        intent = stripe.PaymentIntent.retrieve(intent_id)
        return intent
    except stripe.error.StripeError as e:
        raise StripeServiceError(f"Failed to retrieve payment intent: {str(e)}")


def verify_webhook_signature(request_data, stripe_signature):
    """
    Verify Stripe webhook signature.

    Args:
        request_data: Raw request body
        stripe_signature: Stripe-Signature header value

    Returns:
        Stripe event object if valid

    Raises:
        StripeServiceError if signature is invalid
    """
    try:
        webhook_secret = current_app.config.get("STRIPE_WEBHOOK_SECRET")
        if not webhook_secret:
            raise StripeServiceError("STRIPE_WEBHOOK_SECRET is not configured")

        event = stripe.Webhook.construct_event(
            request_data,
            stripe_signature,
            webhook_secret
        )
        return event

    except stripe.error.SignatureVerificationError as e:
        raise StripeServiceError(f"Webhook signature verification failed: {str(e)}")
    except Exception as e:
        raise StripeServiceError(f"Failed to verify webhook: {str(e)}")


def refund_payment(payment_intent_id, amount=None):
    """
    Create a refund for a payment.

    Args:
        payment_intent_id: Stripe PaymentIntent ID
        amount: Optional refund amount (in smallest unit). If None, refunds full amount

    Returns:
        Stripe Refund object
    """
    try:
        init_stripe()

        refund_data = {"payment_intent": payment_intent_id}
        if amount:
            refund_data["amount"] = int(amount)

        refund = stripe.Refund.create(**refund_data)
        return refund

    except stripe.error.StripeError as e:
        raise StripeServiceError(f"Failed to create refund: {str(e)}")
    except Exception as e:
        raise StripeServiceError(f"Refund error: {str(e)}")


def get_doctor_consultation_price(doctor_id, mongo_db=None):
    """
    Fetch consultation fee from the doctor's user document (set by admin).

    Never trust frontend price input.

    Returns:
        (amount_minor, currency, fee_pkr, doctor)
        - amount_minor: smallest currency unit (paisa for PKR)
        - currency: "pkr"
        - fee_pkr: fee in Pakistani Rupees as float
    """
    try:
        from app.models.user_model import find_doctor_by_id, parse_consultation_fee_pkr

        doctor = find_doctor_by_id(doctor_id)
        if not doctor:
            raise PaymentMethodError("Doctor not found or is not a doctor")

        fee_pkr = parse_consultation_fee_pkr(doctor)
        if fee_pkr is None:
            raise PaymentMethodError(
                "Doctor consultation fee is not set. "
                "Ask an admin to set it when creating or editing the doctor."
            )

        amount_minor = int(round(fee_pkr * 100))
        currency = "pkr"

        return amount_minor, currency, fee_pkr, doctor

    except PaymentMethodError:
        raise
    except Exception as e:
        raise PaymentMethodError(f"Failed to fetch doctor consultation price: {str(e)}")


def validate_payment_method(payment_method, doctor_id=None):
    """
    Validate if payment method is supported.

    Args:
        payment_method: "stripe" or "easypaisa"
        doctor_id: Optional, for future per-doctor method support

    Returns:
        True if valid

    Raises:
        PaymentMethodError if invalid
    """
    valid_methods = ["stripe", "easypaisa"]

    if payment_method not in valid_methods:
        raise PaymentMethodError(
            f"Invalid payment method: {payment_method}. "
            f"Supported methods: {', '.join(valid_methods)}"
        )

    return True


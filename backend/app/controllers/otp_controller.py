from flask import request
from app.services.otp_service import send_otp, verify_otp


def send_otp_handler():
    """POST /api/auth/send-otp - Send OTP to email."""
    data = request.json or {}
    email = data.get("email")
    purpose = data.get("purpose", "register")

    return send_otp(email, purpose)


def verify_otp_handler():
    """POST /api/auth/verify-otp - Verify OTP and return temp token."""
    data = request.json or {}
    email = data.get("email")
    otp = data.get("otp")

    return verify_otp(email, otp)

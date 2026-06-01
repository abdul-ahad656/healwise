from flask import jsonify

from app.services.otp_service import send_otp, verify_otp
from app.utils.request_validation import validate_json
from app.security.schemas import SendOtpSchema, VerifyOtpSchema, normalize_email_in_data


@validate_json(SendOtpSchema())
def send_otp_handler(data):
    """POST /api/auth/send-otp - Send OTP to email."""
    data = normalize_email_in_data(data)
    result, status = send_otp(data["email"], data.get("purpose", "register"))
    return jsonify(result), status


@validate_json(VerifyOtpSchema())
def verify_otp_handler(data):
    """POST /api/auth/verify-otp - Verify OTP and return temp token."""
    data = normalize_email_in_data(data)
    result, status = verify_otp(data["email"], data["otp"])
    return jsonify(result), status

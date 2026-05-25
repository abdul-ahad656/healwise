from flask_jwt_extended import decode_token


def validate_verification_token(token, email):
    """
    Validate temp JWT from verify-otp (15 min, type=otp_verification).
    Returns (is_valid, error_message).
    """
    if not token:
        return False, "Email verification required"

    try:
        decoded = decode_token(token)
    except Exception:
        return False, "Invalid or expired verification. Please verify OTP again."

    token_email = str(decoded.get("sub", "")).strip().lower()
    expected = str(email or "").strip().lower()

    if not expected or token_email != expected:
        return False, "Verification does not match this email"

    if decoded.get("type") != "otp_verification":
        return False, "Invalid verification token"

    return True, None

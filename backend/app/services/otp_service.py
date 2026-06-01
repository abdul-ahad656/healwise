import random
import string
from datetime import datetime, timedelta
from flask import current_app
from flask_jwt_extended import create_access_token
from flask_mail import Message
from app.extensions import mongo, mail
from app.models.user_model import find_user_by_email
from app.utils.email_validator import validate_email

OTP_EXPIRY_MINUTES = 10


def generate_otp():
    """Generate a random 6-digit OTP."""
    return ''.join(random.choices(string.digits, k=6))


def _otp_html(otp: str) -> str:
    return f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Your OTP Code</h2>
            <p style="color: #666; font-size: 16px; text-align: center;">
                Please use the code below to verify your email address. This code will expire in 10 minutes.
            </p>
            <div style="background-color: #f0f0f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h1 style="color: #2563eb; letter-spacing: 8px; margin: 0; font-size: 32px;">{otp}</h1>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center;">
                Do not share this code with anyone. If you did not request this, please ignore this email.
            </p>
        </div>
        """


def send_otp_email(email, otp):
    """Send OTP via Gmail SMTP (Flask-Mail)."""
    if current_app.config.get("OTP_DEV_MODE"):
        print(f"[OTP_DEV_MODE] Send to {email}: {otp}")
        return

    username = current_app.config.get("MAIL_USERNAME")
    password = current_app.config.get("MAIL_PASSWORD")

    if not username or not password:
        raise ValueError(
            "Gmail not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env"
        )

    try:
        msg = Message(
            subject="Your OTP Code for HealWise",
            recipients=[email],
            html=_otp_html(otp),
        )
        mail.send(msg)
    except Exception as e:
        err = str(e)
        if "535" in err or "BadCredentials" in err or "5.7.8" in err:
            raise Exception(
                "Gmail login failed. Use a Google App Password (not your normal password) at "
                "https://myaccount.google.com/apppasswords — 2-Step Verification required."
            ) from e
        raise Exception(f"Failed to send OTP email: {err}") from e


def send_otp(email, purpose="register"):
    """
    Generate and send OTP to email.
    purpose: 'register' | 'reset_password'
    Rate limit: max 1 OTP per 60 seconds per email.
    """
    email = (email or "").strip().lower()
    if not email:
        return {"error": "Email is required"}, 400

    is_valid, email_error = validate_email(email)
    if not is_valid:
        return {"error": email_error}, 400

    if purpose == "register":
        if find_user_by_email(email):
            return {"error": "Email already registered"}, 400
    elif purpose == "reset_password":
        # Do not reveal whether the email is registered
        if not find_user_by_email(email):
            return {
                "message": "If an account exists for this email, an OTP has been sent.",
            }, 200
    else:
        return {"error": "Invalid OTP purpose"}, 400

    # Check rate limiting
    otp_record = mongo.db.otps.find_one({"email": email})

    if otp_record:
        last_sent = otp_record.get('lastSentAt')
        if last_sent:
            elapsed = (datetime.utcnow() - last_sent).total_seconds()
            if elapsed < 60:
                remaining = 60 - int(elapsed)
                return {
                    "error": "OTP already sent. Please wait before requesting another.",
                    "retry_after": remaining
                }, 429

    # Generate OTP
    otp = generate_otp()
    now = datetime.utcnow()

    # Upsert OTP record
    mongo.db.otps.update_one(
        {"email": email},
        {
            "$set": {
                "otp": otp,
                "email": email,
                "createdAt": now,
                "lastSentAt": now,
                "attempts": 0
            }
        },
        upsert=True
    )

    # Send email
    try:
        send_otp_email(email, otp)
        return {
            "message": "OTP sent successfully",
            "email": email
        }, 200
    except Exception:
        mongo.db.otps.delete_one({"email": email})
        current_app.logger.exception("otp_email_send_failed")
        return {"error": "Unable to send OTP. Please try again later."}, 500


def verify_otp(email, otp):
    """
    Verify OTP and return temporary JWT token if valid.
    """
    email = (email or "").strip().lower()
    otp = (otp or "").strip()

    if not email or not otp:
        return {"error": "Email and OTP are required"}, 400

    is_valid, email_error = validate_email(email)
    if not is_valid:
        return {"error": email_error}, 400

    # Find OTP record
    otp_record = mongo.db.otps.find_one({"email": email})

    if not otp_record:
        return {"error": "No OTP found for this email"}, 400

    created_at = otp_record.get("createdAt")
    if created_at:
        age = (datetime.utcnow() - created_at).total_seconds()
        if age > OTP_EXPIRY_MINUTES * 60:
            mongo.db.otps.delete_one({"email": email})
            return {"error": "OTP expired. Please request a new code."}, 400

    # Check attempts limit
    attempts = otp_record.get('attempts', 0)
    if attempts >= 3:
        mongo.db.otps.delete_one({"email": email})
        return {"error": "Too many attempts. Please request a new OTP."}, 403

    # Verify OTP
    if otp_record.get('otp') != otp:
        mongo.db.otps.update_one(
            {"email": email},
            {"$inc": {"attempts": 1}}
        )
        remaining_attempts = 3 - (attempts + 1)
        return {
            "error": "Invalid OTP",
            "remaining_attempts": remaining_attempts
        }, 400

    # OTP is correct - delete record and generate temp token
    mongo.db.otps.delete_one({"email": email})

    # Create 15-minute temporary token
    expires = timedelta(minutes=15)
    temp_token = create_access_token(
        identity=email,
        additional_claims={"type": "otp_verification"},
        expires_delta=expires
    )

    return {
        "temp_token": temp_token,
        "email": email,
        "expires_in": 900  # 15 minutes in seconds
    }, 200

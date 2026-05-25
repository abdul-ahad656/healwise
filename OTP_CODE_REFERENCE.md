# Email OTP Implementation - Code Reference

## 1. Environment Configuration

### Update `.env` file
Add this line:
```
RESEND_API_KEY=your_resend_api_key_here
```

### Update `app/config.py`
Add after Stripe configuration:
```python
# Resend Email Service
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
```

---

## 2. OTP Service (`app/services/otp_service.py`)

```python
import random
import string
from datetime import datetime, timedelta
from flask import current_app
from flask_jwt_extended import create_access_token
from app.extensions import mongo
from resend import Resend


def generate_otp():
    """Generate a random 6-digit OTP."""
    return ''.join(random.choices(string.digits, k=6))


def send_otp_email(email, otp):
    """Send OTP via Resend email service."""
    try:
        api_key = current_app.config.get('RESEND_API_KEY')
        if not api_key:
            raise ValueError("RESEND_API_KEY not configured")

        client = Resend(api_key=api_key)

        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Your OTP Code</h2>
            <p style="color: #666; font-size: 16px; text-align: center;">
                Please use the code below to verify your email address. This code will expire in 10 minutes.
            </p>
            <div style="background-color: #f0f0f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h1 style="color: #2563eb; letter-spacing: 8px; margin: 0; font-size: 32px;">{otp}</h1>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center;">
                If you didn't request this code, please ignore this email.
            </p>
        </div>
        """

        response = client.emails.send({
            "from": "onboarding@resend.dev",
            "to": email,
            "subject": "Your OTP Code for HealWise",
            "html": html_content
        })

        return response
    except Exception as e:
        raise Exception(f"Failed to send OTP email: {str(e)}")


def send_otp(email):
    """
    Generate and send OTP to email.
    Validates rate limiting (max 1 OTP per 60 seconds).
    """
    if not email:
        return {"error": "Email is required"}, 400

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
    except Exception as e:
        # Delete OTP record if email sending fails
        mongo.db.otps.delete_one({"email": email})
        return {"error": str(e)}, 500


def verify_otp(email, otp):
    """
    Verify OTP and return temporary JWT token if valid.
    """
    if not email or not otp:
        return {"error": "Email and OTP are required"}, 400

    # Find OTP record
    otp_record = mongo.db.otps.find_one({"email": email})

    if not otp_record:
        return {"error": "No OTP found for this email"}, 400

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
```

---

## 3. OTP Controller (`app/controllers/otp_controller.py`)

```python
from flask import request
from app.services.otp_service import send_otp, verify_otp


def send_otp_handler():
    """POST /api/auth/send-otp - Send OTP to email."""
    data = request.json or {}
    email = data.get("email")

    return send_otp(email)


def verify_otp_handler():
    """POST /api/auth/verify-otp - Verify OTP and return temp token."""
    data = request.json or {}
    email = data.get("email")
    otp = data.get("otp")

    return verify_otp(email, otp)
```

---

## 4. Updated Auth Routes (`app/routes/auth_routes.py`)

Replace the existing file with:

```python
from flask import Blueprint
from app.controllers.auth_controller import register, login, set_language
from app.controllers.otp_controller import send_otp_handler, verify_otp_handler

auth_bp = Blueprint("auth_bp", __name__)

auth_bp.post("/register")(register)
auth_bp.post("/login")(login)
auth_bp.put("/language")(set_language)
auth_bp.post("/send-otp")(send_otp_handler)
auth_bp.post("/verify-otp")(verify_otp_handler)
```

---

## 5. MongoDB Indexes (Optional but Recommended)

Run in MongoDB compass or mongosh:

```javascript
// Create unique email index
db.otps.createIndex({"email": 1}, {unique: true})

// Create TTL index to auto-delete after 10 minutes
db.otps.createIndex({"createdAt": 1}, {expireAfterSeconds: 600})
```

---

## Files Summary

| File | Action | Location |
|------|--------|----------|
| `.env` | Add RESEND_API_KEY | `e:/FYP/backend/.env` |
| `config.py` | Add RESEND_API_KEY config | `e:/FYP/backend/app/config.py` |
| `otp_service.py` | CREATE | `e:/FYP/backend/app/services/otp_service.py` |
| `otp_controller.py` | CREATE | `e:/FYP/backend/app/controllers/otp_controller.py` |
| `auth_routes.py` | UPDATE imports | `e:/FYP/backend/app/routes/auth_routes.py` |

---

## Verification Checklist

- [ ] RESEND_API_KEY added to `.env`
- [ ] RESEND_API_KEY added to `app/config.py`
- [ ] `otp_service.py` created in `app/services/`
- [ ] `otp_controller.py` created in `app/controllers/`
- [ ] `auth_routes.py` updated with new imports and endpoints
- [ ] Resend package installed (already in requirements.txt)
- [ ] Test send-otp endpoint
- [ ] Test verify-otp endpoint
- [ ] Test rate limiting (429 response)
- [ ] Test attempt limiting (403 after 3 failures)

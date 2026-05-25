# Email OTP Feature - Implementation Guide

## Overview
Secure email OTP (One-Time Password) authentication system for HealWise using Resend email service and MongoDB.

## Configuration Updates

### 1. Environment Variables (.env)
```
RESEND_API_KEY=your_resend_api_key_here
```

### 2. Config File (app/config.py)
```python
# Resend Email Service
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
```

**Status**: ✅ Already added to config.py

---

## New Files Created

### 1. OTP Service (`app/services/otp_service.py`)
Handles all OTP business logic:
- `generate_otp()` - Generates random 6-digit OTP
- `send_otp_email(email, otp)` - Sends OTP via Resend
- `send_otp(email)` - Main send endpoint logic
- `verify_otp(email, otp)` - Main verify endpoint logic

### 2. OTP Controller (`app/controllers/otp_controller.py`)
Handles HTTP request/response:
- `send_otp_handler()` - POST /api/auth/send-otp handler
- `verify_otp_handler()` - POST /api/auth/verify-otp handler

### 3. Updated Routes (`app/routes/auth_routes.py`)
Added two new endpoints to auth blueprint.

---

## API Endpoints

### Endpoint 1: POST /api/auth/send-otp
**Purpose**: Send OTP to user's email

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response Success (200)**:
```json
{
  "message": "OTP sent successfully",
  "email": "user@example.com"
}
```

**Response Error (400)** - Missing email:
```json
{
  "error": "Email is required"
}
```

**Response Error (429)** - Rate limited (OTP sent within 60 seconds):
```json
{
  "error": "OTP already sent. Please wait before requesting another.",
  "retry_after": 45
}
```

**Response Error (500)** - Email sending failed:
```json
{
  "error": "Failed to send OTP email: [error details]"
}
```

**Implementation Details**:
- ✅ Validates email is present
- ✅ Checks rate limiting (60-second cooldown)
- ✅ Generates 6-digit random OTP
- ✅ Upserts OTP record with: `otp`, `email`, `createdAt`, `lastSentAt`, `attempts: 0`
- ✅ Sends HTML-formatted email from "onboarding@resend.dev"
- ✅ Deletes OTP record if email send fails

---

### Endpoint 2: POST /api/auth/verify-otp
**Purpose**: Verify OTP and return 15-minute temporary JWT token

**Request**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response Success (200)**:
```json
{
  "temp_token": "eyJhbGc...",
  "email": "user@example.com",
  "expires_in": 900
}
```

**Response Error (400)** - Missing email/OTP:
```json
{
  "error": "Email and OTP are required"
}
```

**Response Error (400)** - No OTP record found:
```json
{
  "error": "No OTP found for this email"
}
```

**Response Error (400)** - Invalid OTP:
```json
{
  "error": "Invalid OTP",
  "remaining_attempts": 2
}
```

**Response Error (403)** - Too many attempts:
```json
{
  "error": "Too many attempts. Please request a new OTP."
}
```

**Implementation Details**:
- ✅ Validates email and OTP present
- ✅ Finds OTP record in MongoDB
- ✅ Returns 400 if no record found
- ✅ Checks attempt limit (max 3)
- ✅ Returns 403 and deletes record if attempts >= 3
- ✅ Increments attempts if OTP incorrect
- ✅ Generates 15-minute temporary JWT token if correct
- ✅ Deletes OTP record on verification
- ✅ Token includes `additional_claims: {"type": "otp_verification"}`

---

## MongoDB Collection: `otps`

### Schema
```javascript
{
  "_id": ObjectId,
  "email": "user@example.com",
  "otp": "123456",
  "createdAt": ISODate("2026-05-25T12:00:00Z"),
  "lastSentAt": ISODate("2026-05-25T12:00:00Z"),
  "attempts": 0
}
```

### Indexes (Recommended)
```javascript
db.otps.createIndex({"email": 1}, {unique: true})
db.otps.createIndex({"createdAt": 1}, {expireAfterSeconds: 600})  // Auto-delete after 10 mins
```

---

## Security Considerations

1. **Rate Limiting**: 60-second cooldown between OTP requests
2. **Attempt Limiting**: 3 failed verification attempts before deletion
3. **Token Expiration**: Temporary tokens expire after 15 minutes
4. **Email Sender**: Uses Resend's verified domain (onboarding@resend.dev)
5. **Secret Storage**: RESEND_API_KEY stored only in environment variables
6. **JWT Claims**: Temporary tokens marked with `type: "otp_verification"`

---

## Code Style Match

✅ Uses existing patterns:
- Error responses: `{"error": "message"}, status_code`
- Controller → Service separation
- Blueprint registration pattern
- MongoDB `update_one()` with `upsert=True`
- Current app's JWT implementation

---

## Testing the Endpoints

### Test 1: Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Test 2: Verify OTP (within 10 minutes)
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456"}'
```

### Test 3: Rate Limit (send OTP again within 60 seconds)
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```
Expected: 429 status with retry_after field

### Test 4: Multiple Failed Attempts
```bash
# 1st attempt: wrong OTP
# 2nd attempt: wrong OTP
# 3rd attempt: wrong OTP (will be deleted)
# 4th attempt: 403 error
```

---

## Files Modified/Created

| File | Type | Status |
|------|------|--------|
| `.env` | Config | ✅ Updated |
| `app/config.py` | Config | ✅ Updated |
| `app/services/otp_service.py` | New Service | ✅ Created |
| `app/controllers/otp_controller.py` | New Controller | ✅ Created |
| `app/routes/auth_routes.py` | Routes | ✅ Updated |

---

## Next Steps for Frontend Integration

1. Create `/api/auth/send-otp` call in authService
2. Create OTP input screen with email field
3. Show OTP input screen after email verification
4. Store temp_token from verify-otp response
5. Use temp_token for password reset or account activation

---

## Quick Reference

| Item | Value |
|------|-------|
| OTP Length | 6 digits |
| Rate Limit | 60 seconds |
| Attempt Limit | 3 attempts |
| Token Expiry | 15 minutes |
| OTP TTL | 10 minutes (auto-delete) |
| Email Service | Resend |
| From Email | onboarding@resend.dev |

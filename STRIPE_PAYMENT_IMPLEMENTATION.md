# Stripe Payment Integration - Complete Implementation Guide

## Overview

This guide covers the complete Stripe payment integration for HealWise telemedicine appointments. The system is production-ready with security best practices, webhook handling, and refund support.

## Architecture Summary

### Payment Flow
1. **User initiates appointment booking** → Doctor selection + date/time selection
2. **Navigate to payment screen** → Display appointment details and amount
3. **User enters card details** → Secure card input (Stripe test mode)
4. **Create PaymentIntent** → Backend creates Stripe PaymentIntent
5. **Confirm Payment** → Frontend confirms payment with clientSecret
6. **Webhook Processing** → Stripe sends `payment_intent.succeeded` event
7. **Appointment Created** → Backend creates appointment on successful payment
8. **Success Confirmation** → User sees confirmation screen

### Security Measures
✅ Secret keys never exposed in frontend
✅ Webhook signature verification (prevents spoofing)
✅ JWT authentication on payment endpoints
✅ Server-side amount verification (prevents fraud)
✅ Payment status confirmed via webhook (not frontend-only)
✅ Idempotency checks (prevents duplicate payments)
✅ User can only access their own payments

## Backend Setup

### 1. Configuration Files

**File: `backend/app/config.py`**
- Added Stripe API keys: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Added appointment fee: `APPOINTMENT_CONSULTATION_FEE` (in cents)
- All loaded from environment variables

**File: `backend/.env` (Add these)**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APPOINTMENT_CONSULTATION_FEE=5000
```

**File: `backend/.env.example`**
- Template for setting up Stripe credentials

### 2. New Backend Files

**File: `backend/app/models/payment_model.py`**
- `create_payment()` - Insert payment record
- `find_payment_by_intent_id()` - Lookup by Stripe ID
- `find_payment_by_id()` - Lookup by MongoDB ID
- `update_payment_status()` - Update after payment
- `get_user_payments()` - Fetch user's payment history
- `find_appointment_payment()` - Get payment for appointment
- `update_payment_with_refund()` - Record refund information

**File: `backend/app/services/payment_service.py`**
- `StripeServiceError` - Custom exception class
- `init_stripe()` - Initialize Stripe SDK
- `create_payment_intent()` - Create Stripe PaymentIntent
- `get_payment_intent()` - Retrieve payment status
- `verify_webhook_signature()` - Verify Stripe webhook authenticity
- `refund_payment()` - Process refund

**File: `backend/app/controllers/payment_controller.py`**
- `create_payment_intent_handler()` - POST /api/payments/create-payment-intent
  - Validates doctor exists and has availability
  - Creates Stripe PaymentIntent
  - Saves payment record to MongoDB
- `handle_webhook()` - POST /api/payments/webhook
  - Verifies webhook signature
  - Processes payment_intent.succeeded event
  - Creates appointment if payment succeeded
  - Handles payment_intent.payment_failed event
- `get_payment_history()` - GET /api/payments/history
  - Returns user's payments with appointment details
- `refund_payment_handler()` - POST /api/payments/refund
  - Validates user owns payment
  - Creates Stripe refund
  - Cancels appointment

**File: `backend/app/routes/payment_routes.py`**
- Blueprint with 4 endpoints:
  - POST /api/payments/create-payment-intent
  - POST /api/payments/webhook (no auth, signature verified)
  - GET /api/payments/history
  - POST /api/payments/refund

**File: `backend/app/__init__.py`**
- Added payment_bp import and registration

**File: `backend/requirements.txt`**
- Added `stripe==10.3.0`

### 3. Database Schema

**New `payments` Collection**
```json
{
  "_id": ObjectId,
  "userId": String,                 // Patient ID
  "appointmentId": ObjectId,        // Created after payment
  "stripePaymentIntentId": String,
  "stripeClientSecret": String,
  "amount": Number,                 // In cents
  "currency": String,               // "usd"
  "status": String,                 // "pending", "succeeded", "failed", "refunded"
  "paymentMethod": String,          // "card"
  "cardLast4": String,              // For display
  "refundId": String,               // If refunded
  "failureReason": String,          // If failed
  "metadata": {
    "appointmentDate": String,
    "appointmentTime": String,
    "doctorId": String,
    "doctorName": String,
    "symptomId": String
  },
  "createdAt": DateTime,
  "succeededAt": DateTime,
  "refundedAt": DateTime,
  "updatedAt": DateTime
}
```

**Modified `appointments` Collection**
- Added `paymentId` (reference to payment)
- Added `paymentStatus` ("pending", "paid", "refunded")
- Added `requiresPayment` (Boolean)

## Frontend Setup

### 1. Dependencies

**File: `healwise-frontend/package.json`**
- Added `@stripe/stripe-react-native": "^0.18.0"`

### 2. Environment Configuration

**File: `healwise-frontend/.env`**
```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**File: `healwise-frontend/app.json`**
- Added extra section with Stripe publishable key config

### 3. New Frontend Files

**File: `healwise-frontend/services/paymentService.ts`**
- `createPaymentIntent()` - Request payment intent from backend
- `getPaymentHistory()` - Fetch user's payments
- `refundPayment()` - Request refund
- `pollPaymentStatus()` - Poll for webhook confirmation
- `formatPaymentAmount()` - Currency formatting utility

**File: `healwise-frontend/app/(patient)/payment.tsx`**
- Complete payment screen component
- Shows appointment details and payment amount
- Card input fields (test mode - hardcoded test cards)
- Success/failure UI
- Loading and processing states
- Automatic webhook confirmation polling

### 4. Integration Points

**File: `healwise-frontend/app/(patient)/consult-doctor/booking.tsx`**
- Modified `handleBook()` to navigate to payment screen instead of calling bookAppointment directly
- Passes appointment details (date, time, doctor) to payment screen

**File: `healwise-frontend/app/_layout.tsx`**
- Added StripeProvider wrapper
- Loads publishable key from environment

## API Endpoints

### 1. Create Payment Intent
```
POST /api/payments/create-payment-intent
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
  "appointmentDate": "2026-05-25",
  "appointmentTime": "14:30",
  "doctorId": "507f1f77bcf86cd799439011",
  "symptomId": "507f1f77bcf86cd799439012" (optional)
}

Response (200):
{
  "clientSecret": "pi_1234_secret_...",
  "paymentId": "507f1f77bcf86cd799439013",
  "amount": 5000,
  "currency": "usd",
  "message": "Payment intent created successfully"
}

Error Responses:
- 400: Missing required fields or invalid format
- 403: User not a patient
- 409: Doctor already booked at this time
- 503: Stripe service error
```

### 2. Stripe Webhook
```
POST /api/payments/webhook
Stripe-Signature: <signature>
Content-Type: application/json

Request: Raw Stripe Event
{
  "id": "evt_...",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234",
      "status": "succeeded",
      ...
    }
  }
}

Response (200):
{
  "status": "received"
}

Processing:
- Verifies webhook signature
- Updates payment status
- Creates appointment if payment succeeded
- Handles payment failures
```

### 3. Get Payment History
```
GET /api/payments/history
Authorization: Bearer <jwt_token>

Response (200):
[
  {
    "paymentId": "507f1f77bcf86cd799439013",
    "amount": 5000,
    "currency": "usd",
    "status": "succeeded",
    "cardLast4": "4242",
    "appointmentDate": "2026-05-25",
    "appointmentTime": "14:30",
    "createdAt": "2026-05-22T10:30:00Z"
  }
]

Error: 403 if not a patient
```

### 4. Refund Payment
```
POST /api/payments/refund
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
  "paymentId": "507f1f77bcf86cd799439013"
}

Response (200):
{
  "refundId": "re_1234",
  "status": "succeeded",
  "amount": 5000,
  "message": "Refund processed successfully"
}

Error Responses:
- 400: Missing paymentId or not a succeeded payment
- 403: User doesn't own this payment
- 404: Payment not found
- 503: Stripe refund failed
```

## Testing

### Setup

1. **Get Stripe Test Keys**
   - Go to https://dashboard.stripe.com/apikeys
   - Copy test mode keys (starts with `sk_test_` and `pk_test_`)
   - Add to `.env` files in backend and frontend

2. **Get Webhook Secret**
   - Go to https://dashboard.stripe.com/webhooks
   - Create webhook endpoint: `http://your-backend/api/payments/webhook`
   - Copy webhook secret (starts with `whsec_`)
   - Add to backend `.env`

3. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt

   # Frontend
   cd healwise-frontend
   npm install
   ```

### Test Scenarios

#### Test 1: Successful Payment
```
Test Card: 4242 4242 4242 4242
Expiry: Any future month/year (e.g., 12/28)
CVC: Any 3 digits (e.g., 123)
Zip: Any 5 digits (e.g., 12345)

Expected Flow:
1. Create payment intent → Get clientSecret
2. Confirm payment with card details
3. Stripe sends payment_intent.succeeded webhook
4. Backend creates appointment
5. Frontend shows success screen
6. Appointment appears in patient's appointment list
```

#### Test 2: Payment Declined
```
Test Card: 4000 0000 0000 0002

Expected Flow:
1. Create payment intent
2. Confirm payment with card
3. Stripe sends payment_intent.payment_failed webhook
4. Backend updates payment status to "failed"
5. Frontend shows error message
6. No appointment created
```

#### Test 3: 3D Secure Authentication
```
Test Card: 4000 0025 0000 3155

Expected Flow:
1. Create payment intent
2. Confirm payment
3. Stripe redirects to 3D Secure confirmation page
4. Complete authentication
5. Payment succeeds
6. Appointment created
```

#### Test 4: Refund
```
1. Complete a successful payment
2. Go to Payment History
3. Click Refund on a succeeded payment
4. Confirm refund request
5. Appointment status changes to "cancelled"
6. Payment status changes to "refunded"
```

### Manual API Testing

Use cURL or Postman to test endpoints:

```bash
# 1. Create payment intent
curl -X POST http://localhost:5000/api/payments/create-payment-intent \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentDate": "2026-05-25",
    "appointmentTime": "14:30",
    "doctorId": "507f1f77bcf86cd799439011"
  }'

# 2. Get payment history
curl -X GET http://localhost:5000/api/payments/history \
  -H "Authorization: Bearer <your_jwt_token>"

# 3. Refund a payment
curl -X POST http://localhost:5000/api/payments/refund \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "507f1f77bcf86cd799439013"}'
```

## Deployment

### Backend (Flask)

1. **Set Environment Variables**
   ```bash
   export STRIPE_SECRET_KEY=sk_live_...
   export STRIPE_PUBLISHABLE_KEY=pk_live_...
   export STRIPE_WEBHOOK_SECRET=whsec_...
   export APPOINTMENT_CONSULTATION_FEE=5000
   ```

2. **Update Stripe Webhook Endpoint**
   - Go to https://dashboard.stripe.com/webhooks
   - Update webhook URL to production backend
   - Update webhook secret in `.env`

3. **Use Live Keys**
   - Replace test keys with live keys (no `_test_`)
   - Live keys start with `sk_live_` and `pk_live_`

### Frontend (Expo)

1. **Build Production App**
   ```bash
   npx expo build:android --release
   npx expo build:ios --release
   ```

2. **Set Stripe Publishable Key**
   - Update `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` with live key
   - Rebuild app

3. **Update Backend URL**
   - Change `EXPO_PUBLIC_API_BASE_URL` to production backend

## Security Checklist

- [x] Stripe secret key never exposed in frontend
- [x] Webhook endpoint signature verification implemented
- [x] JWT authentication on all payment endpoints
- [x] Server-side amount calculation (not from frontend)
- [x] Payment status confirmed via webhook (not frontend claim)
- [x] User can only access their own payments
- [x] Idempotency check (no duplicate appointments)
- [x] Proper error handling and logging
- [x] HTTPS only in production
- [x] Request validation and sanitization
- [x] Appointment only created after successful payment
- [x] Refund cancels appointment

## Troubleshooting

### Issue: Webhook not being called

**Solution:**
1. Verify webhook URL in Stripe dashboard matches your backend URL
2. Check that webhook secret is correct in `.env`
3. Verify webhook signature verification is enabled in code
4. Check backend logs for webhook errors
5. Test webhook manually in Stripe dashboard → Events

### Issue: Payment intent creation fails

**Solution:**
1. Verify Stripe API key is correct
2. Check that doctor exists and is active
3. Verify appointment slot availability
4. Check for conflicting appointments at that time
5. Review error message from Stripe API

### Issue: Appointment not created after payment

**Solution:**
1. Check if appointment already exists (idempotency)
2. Verify webhook was received and processed
3. Check MongoDB connection
4. Review backend logs for appointment creation errors
5. Manually trigger webhook from Stripe dashboard

### Issue: Frontend payment screen shows error

**Solution:**
1. Verify JWT token is valid
2. Check that doctor ID is valid ObjectId format
3. Verify appointment date/time format (YYYY-MM-DD HH:MM)
4. Check network connection
5. Review browser console for detailed error

## Future Enhancements

1. **Async Task Queue** - Add Celery for async webhook processing
2. **Multiple Payment Methods** - Support Apple Pay, Google Pay, bank transfers
3. **Invoicing** - Generate and email invoices
4. **Payment Analytics** - Dashboard for payment metrics
5. **Recurring Payments** - Subscription model for unlimited consultations
6. **Payment Retry** - Automatic retry for failed payments
7. **Partial Refunds** - Support partial refund amounts
8. **Payment Disputes** - Handle Stripe disputes/chargebacks
9. **Tax Calculation** - Support regional tax rates
10. **Currency Support** - Handle multiple currencies

## Support

For Stripe integration issues:
- Stripe Documentation: https://stripe.com/docs
- Stripe API Reference: https://stripe.com/docs/api
- Stripe React Native: https://github.com/stripe/stripe-react-native
- Contact: support@stripe.com

For HealWise payment implementation issues:
- Review this guide
- Check backend logs: `docker logs healwise-backend`
- Check frontend console: Browser Developer Tools
- Check MongoDB: Verify payments collection has data

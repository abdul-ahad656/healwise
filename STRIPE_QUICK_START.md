# Stripe Payment Integration - Quick Start Guide

## 5-Minute Setup

### Step 1: Get Stripe Test Keys (2 min)
1. Go to https://dashboard.stripe.com/apikeys
2. Ensure "Test mode" is enabled (toggle in top left)
3. Copy your test keys:
   - **Secret Key** (sk_test_...): Never share this!
   - **Publishable Key** (pk_test_...): Safe to share

### Step 2: Set Up Webhook (2 min)
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter webhook URL: `http://localhost:5000/api/payments/webhook`
4. Select Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy **Signing Secret** (whsec_...)

### Step 3: Add Credentials to Backend (1 min)

**File: `backend/.env`**
```
STRIPE_SECRET_KEY=sk_test_51234567890...
STRIPE_PUBLISHABLE_KEY=pk_test_51234567890...
STRIPE_WEBHOOK_SECRET=whsec_test_51234567890...
APPOINTMENT_CONSULTATION_FEE=5000
```

### Step 4: Add Credentials to Frontend (0 min)

**File: `healwise-frontend/.env`**
```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890...
```

## Testing Payment Flow

### 1. Start Backend
```bash
cd backend
python run.py
# Backend runs on http://localhost:5000
```

### 2. Start Frontend
```bash
cd healwise-frontend
npx expo start
# Press 'i' for iOS or 'a' for Android
```

### 3. Test Payment

#### Step A: Register/Login
- Create test user account
- Role should be "patient"

#### Step B: Book Appointment
- Go to "Consult Doctor"
- Select a doctor
- Select appointment date/time
- Click "Book Appointment"
- **Should redirect to payment screen**

#### Step C: Make Test Payment
- Use test card: **4242 4242 4242 4242**
- Expiry: Any future date (e.g., 12/28)
- CVC: Any 3 digits (e.g., 123)
- Click "Confirm Payment"
- **Should show success screen**

#### Step D: Verify Appointment Created
- Go to "My Appointments"
- **Should see the appointment with status "pending"**

#### Step E: Test Refund
- Go to profile → Payment History
- Click refund on the payment
- Confirm refund
- Go to appointments
- **Appointment should be "cancelled"**

## Test Cards

| Card Number | Purpose | Result |
|-------------|---------|--------|
| 4242 4242 4242 4242 | Standard test | Success ✓ |
| 4000 0000 0000 0002 | Decline | Decline ✗ |
| 4000 0025 0000 3155 | 3D Secure | 3D Auth Required |

## Troubleshooting Quick Fixes

### ❌ "Stripe API key not configured"
**Fix:** Check `backend/.env` has `STRIPE_SECRET_KEY`

### ❌ "Payment creation failed"
**Fix:** Verify doctor exists and is active

### ❌ "Webhook failed"
**Fix:** Check webhook URL in Stripe dashboard matches your backend

### ❌ "Appointment not created"
**Fix:** Check Stripe dashboard → Events for webhook calls

### ❌ Payment screen not showing
**Fix:** Check browser console for errors, verify publishable key in frontend `.env`

## What's New

### Backend Files Created
- `app/models/payment_model.py` - Database operations
- `app/services/payment_service.py` - Stripe SDK integration
- `app/controllers/payment_controller.py` - Request handlers
- `app/routes/payment_routes.py` - API endpoints

### Backend Files Modified
- `app/config.py` - Added Stripe config
- `app/__init__.py` - Registered payment routes
- `requirements.txt` - Added stripe package
- `.env.example` - Added Stripe variables

### Frontend Files Created
- `services/paymentService.ts` - Payment API calls
- `app/(patient)/payment.tsx` - Payment screen UI

### Frontend Files Modified
- `app/(patient)/consult-doctor/booking.tsx` - Navigate to payment
- `app/_layout.tsx` - Added StripeProvider
- `package.json` - Added @stripe/stripe-react-native
- `app.json` - Added Stripe config
- `.env` - Added publishable key

## API Endpoints Available

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/payments/create-payment-intent` | JWT | Create payment |
| POST | `/api/payments/webhook` | Signature | Handle events |
| GET | `/api/payments/history` | JWT | Get payments |
| POST | `/api/payments/refund` | JWT | Refund payment |

## Environment Variables Reference

### Backend `.env`
```
# Required for Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional (defaults to 5000 cents = $50)
APPOINTMENT_CONSULTATION_FEE=5000
```

### Frontend `.env`
```
# Required for Stripe UI
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Next Steps

1. ✅ Set up credentials (steps 1-4 above)
2. ✅ Test payment flow (steps in "Testing Payment Flow")
3. ⏭️ Get Live Keys from Stripe for production
4. ⏭️ Deploy backend with live keys
5. ⏭️ Deploy frontend with live keys
6. ⏭️ Monitor payments in Stripe dashboard

## Support & Resources

- **Full Implementation Guide:** See `STRIPE_PAYMENT_IMPLEMENTATION.md`
- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Test Mode Indicator:** Toggle in top-left of Stripe dashboard

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React Native)          │
│                                                      │
│  1. User selects appointment → 2. Redirects to     │
│     Payment Screen → 3. Enters card details →      │
│     4. Calls backend /create-payment-intent →      │
│     5. Gets clientSecret → 6. Confirms payment     │
│                                                      │
└──────────────────┬──────────────────────────────────┘
                   │ API Call
                   ▼
┌─────────────────────────────────────────────────────┐
│                   BACKEND (Flask)                    │
│                                                      │
│  1. Validate JWT & Doctor exists                   │
│  2. Create Stripe PaymentIntent                    │
│  3. Save payment to MongoDB                        │
│  4. Return clientSecret to frontend                │
│                                                      │
│  When payment confirmed:                           │
│  ↓                                                   │
│  Stripe webhook → /api/payments/webhook            │
│  ↓                                                   │
│  Verify signature → Update payment status          │
│  ↓                                                   │
│  Create appointment → Notify user                  │
│                                                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              Stripe (Payment Processor)              │
│                                                      │
│  - Processes card payment                          │
│  - Calls webhook with status                       │
│  - Handles 3D Secure authentication                │
│                                                      │
└─────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              MongoDB (Database)                      │
│                                                      │
│  - Stores payment records                          │
│  - Stores appointments                             │
│  - Maintains payment history                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Payment Status Flow

```
User initiates payment
        ↓
Creates PaymentIntent (status: pending)
        ↓
Stripe processes card
        ↓
┌─────────────────────────────────┐
│   Payment Succeeded?             │
├─────────────────────────────────┤
│  YES → payment_intent.succeeded │  NO → payment_intent.payment_failed
│         ↓                       │  ↓
│   Update to "succeeded"         │   Update to "failed"
│   Create Appointment ✓          │   No appointment created ✗
│   Show success screen           │   Show error screen
└─────────────────────────────────┘
```

## Common Questions

**Q: Is this production-ready?**
A: Yes! It includes webhook verification, error handling, idempotency checks, and security best practices.

**Q: What about real card payments?**
A: Use live Stripe keys. Follow the same flow - Stripe handles everything securely.

**Q: Can users cancel appointments?**
A: Yes! Click "Refund" in Payment History to cancel and refund.

**Q: What if the webhook fails?**
A: The payment is still recorded. You can manually trigger webhook from Stripe dashboard or re-query payment status.

**Q: How much does Stripe charge?**
A: ~2.9% + $0.30 per transaction in the US. Varies by country/card type.

**Q: Can I use other payment providers?**
A: Yes, the architecture is modular. Create new service file and controller for alternative provider.

---

**Ready to test?** Start with Step 1 above! 🚀

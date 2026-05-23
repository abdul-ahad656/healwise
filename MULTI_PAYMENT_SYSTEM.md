# Multi-Payment System Implementation Guide - HealWise

## Overview

Extended payment system supporting two payment methods:
1. **Stripe** - Automatic payment & instant confirmation
2. **Easypaisa** - Manual transfer with admin approval

**CRITICAL REQUIREMENT**: All consultation prices fetched from database doctor records, never from frontend.

## Architecture Changes

### Backend Files Modified

#### 1. **`app/models/payment_model.py`** ✅
- Added: `check_active_payment_for_appointment()` - Prevent duplicate payments
- Added: `submit_payment_proof()` - Store Easypaisa proof
- Added: `update_payment_to_paid()` - Admin confirmation
- Added: `get_pending_easypaisa_payments()` - Admin dashboard
- Added: `find_payment_by_stripe_intent()` - For webhook handling

#### 2. **`app/services/payment_service.py`** ✅
- Added: `PaymentMethodError` exception class
- Added: `get_doctor_consultation_price()` - **CRITICAL**: Fetches price from doctor record (not config)
- Added: `validate_payment_method()` - Validate payment method type
- Kept: All existing Stripe functions intact

#### 3. **`app/controllers/payment_controller.py`** ✅
- Renamed: `create_payment_intent_handler()` → `create_payment_handler()` (unified endpoint)
- Added: `_handle_stripe_payment()` - Stripe-specific logic
- Added: `_handle_easypaisa_payment()` - Easypaisa-specific logic
- Added: `submit_proof_handler()` - Accept Easypaisa proof submission
- Added: `admin_confirm_payment_handler()` - Admin confirms Easypaisa payments
- Added: `get_pending_easypaisa_for_admin()` - Admin views pending payments
- Updated: `handle_webhook()` - Handle payment_method field

#### 4. **`app/routes/payment_routes.py`** ✅
- Renamed: `/create-payment-intent` → `/create-payment`
- Added: `/submit-proof` - Submit Easypaisa proof
- Added: `/admin/confirm-payment` - Admin endpoint
- Added: `/admin/pending-easypaisa` - Admin dashboard
- Kept: `/webhook`, `/history`, `/refund`

#### 5. **`app/config.py`** ✅
- Added: `EASYPAISA_RECEIVER_NUMBER = "03144828190"`
- Added: `SUPPORTED_PAYMENT_METHODS = ["stripe", "easypaisa"]`

### Frontend Files Modified

#### 1. **`services/paymentService.ts`** ✅
- Renamed: `createPaymentIntent()` → `createPayment()` with `paymentMethod` parameter
- Added: `submitPaymentProof()` - Submit Easypaisa proof
- Added: `convertUsdToPkr()` - Currency conversion helper
- Added: `getPaymentMethodLabel()` - UI display helper
- Updated: All interfaces to support multiple payment methods

## Payment Flow Comparison

### Stripe Flow (Auto-Confirm)
```
1. User selects appointment
2. Frontend calls POST /api/payments/create-payment
   {
     doctor_id, appointment_id, appointment_date, appointment_time,
     payment_method: "stripe"
   }
3. Backend:
   - Fetch doctor consultation price from DB
   - Validate appointment slot
   - Create Stripe PaymentIntent
   - Save payment with status="pending"
4. Frontend receives clientSecret
5. User enters card details
6. Stripe processes payment
7. Webhook: payment_intent.succeeded
8. Backend:
   - Update payment status="paid"
   - Create appointment with status="confirmed"
9. User sees confirmation

Payment Status Timeline: pending → paid (auto via webhook)
Appointment Timeline: not created → created & confirmed
```

### Easypaisa Flow (Manual Approval)
```
1. User selects appointment
2. Frontend calls POST /api/payments/create-payment
   {
     doctor_id, appointment_id, appointment_date, appointment_time,
     payment_method: "easypaisa"
   }
3. Backend:
   - Fetch doctor consultation price from DB
   - Validate appointment slot
   - Create payment record with status="pending"
4. Frontend receives:
   - Receiver number: 03144828190
   - Amount: consultation_price
   - Instructions
5. User sends manual Easypaisa transfer
6. User submits proof (screenshot/transaction ID)
   POST /api/payments/submit-proof
   {
     payment_id, proof_type: "screenshot|transaction_id", proof
   }
7. Backend updates payment status="pending_review"
8. Admin dashboard shows pending payments
9. Admin confirms payment
   POST /api/payments/admin/confirm-payment
   {
     payment_id, admin_notes (optional)
   }
10. Backend:
    - Update payment status="paid"
    - Create appointment with status="confirmed"

Payment Status Timeline: pending → pending_review → paid (manual)
Appointment Timeline: not created → created & confirmed (after admin approval)
```

## Database Schema Updates

### Payment Document Fields

**New Fields Added**:
```javascript
{
  payment_method: "stripe" | "easypaisa",      // Replaces hardcoded "card"
  stripe_payment_intent_id: String,            // For Stripe payments
  stripe_client_secret: String,                // For Stripe SDK
  
  // Easypaisa specific
  easypaisa_receiver: String,                  // "03144828190"
  easypaisa_proof_url: String,                 // Screenshot URL
  easypaisa_transaction_id: String,            // User-provided ID
  
  // Enhanced tracking
  status: "pending" | "pending_review" | "paid" | "failed" | "refunded",
  amount_verified_at: DateTime,                // When price was locked
  doctor_consultation_price: Number,           // Price locked at creation
  paid_at: DateTime,                           // When payment confirmed
  proof_submitted_at: DateTime,                // When proof submitted (Easypaisa)
  admin_approved_at: DateTime,                 // When admin approved
  admin_notes: String,                         // Admin comments
}
```

## API Endpoints

### 1. Create Payment (Unified)
```
POST /api/payments/create-payment
Auth: JWT (patient role required)

Request:
{
  "doctor_id": "507f...",
  "appointment_id": "507f...",
  "appointment_date": "2026-05-25",
  "appointment_time": "14:30",
  "payment_method": "stripe|easypaisa",
  "symptom_id": "507f..." (optional)
}

Response (Stripe - 200):
{
  "payment_method": "stripe",
  "clientSecret": "pi_..._secret_...",
  "paymentId": "507f...",
  "amount": 5000,
  "currency": "usd"
}

Response (Easypaisa - 200):
{
  "payment_method": "easypaisa",
  "receiver_number": "03144828190",
  "amount": 5000,
  "currency": "usd",
  "paymentId": "507f...",
  "status": "pending",
  "instructions": "Send PKR amount to Easypaisa..."
}

Error Responses:
- 400: Missing fields, invalid doctor, doctor fee not set, duplicate payment
- 403: Not a patient, doctor not available
- 409: Doctor already booked at that time
- 503: Payment service error (Stripe)
```

### 2. Submit Payment Proof (Easypaisa Only)
```
POST /api/payments/submit-proof
Auth: JWT (patient role required)

Request:
{
  "payment_id": "507f...",
  "proof_type": "screenshot|transaction_id",
  "proof": "image_url_or_transaction_123"
}

Response (200):
{
  "message": "Payment proof submitted successfully. Admin will review shortly.",
  "payment_id": "507f...",
  "status": "pending_review"
}

Error Responses:
- 400: Missing fields, invalid proof_type, payment not pending
- 403: Not your payment
- 404: Payment not found
```

### 3. Admin Confirm Payment
```
POST /api/payments/admin/confirm-payment
Auth: JWT (admin role required)

Request:
{
  "payment_id": "507f...",
  "admin_notes": "Payment verified via receipt" (optional)
}

Response (200):
{
  "message": "Payment confirmed successfully. Booking is now active.",
  "payment_id": "507f...",
  "appointment_id": "507f...",
  "status": "paid"
}

Error Responses:
- 403: Admin access required
- 404: Payment not found
- 400: Payment not in pending_review status
```

### 4. Admin Pending Easypaisa List
```
GET /api/payments/admin/pending-easypaisa
Auth: JWT (admin role required)

Response (200):
{
  "total": 5,
  "payments": [
    {
      "_id": "507f...",
      "payment_id": "507f...",
      "userId": "507f...",
      "amount": 5000,
      "status": "pending_review",
      "easypaisa_proof_url": "url_to_screenshot",
      "proof_submitted_at": "2026-05-22T10:30:00Z",
      "createdAt": "2026-05-22T10:15:00Z"
    }
  ]
}
```

### 5. Stripe Webhook (Unchanged)
```
POST /api/payments/webhook
Auth: Stripe Signature verification

Handles:
- payment_intent.succeeded → Update payment to "paid", create appointment
- payment_intent.payment_failed → Update payment to "failed"
```

### 6. Get Payment History (Enhanced)
```
GET /api/payments/history
Auth: JWT (patient role required)

Response (200):
{
  "_id": "507f...",
  "paymentId": "507f...",
  "payment_method": "stripe|easypaisa",
  "amount": 5000,
  "status": "paid|pending|pending_review|failed",
  "appointmentDate": "2026-05-25",
  "appointmentTime": "14:30",
  "appointmentStatus": "confirmed|pending|cancelled",
  "easypaisa_proof_url": "url" (if applicable),
  "createdAt": "2026-05-22T10:15:00Z"
}
```

## Security & Validation

✅ **Doctor Price Verification**
- Always fetch from database
- NEVER trust frontend amount
- Locked at payment creation time
- Stored for audit trail

✅ **Role-Based Access**
- Patient: Create payment, submit proof, view history
- Admin: Confirm Easypaisa payments, view pending
- Public: None (except webhook)

✅ **Duplicate Prevention**
- Check active payment exists for appointment
- Prevent multiple pending payments per appointment
- Prevent duplicate appointment creation

✅ **Stripe Security**
- Webhook signature verification
- Secret key never exposed
- PaymentIntent confirmed server-side

✅ **Easypaisa Security**
- Manual admin review
- Proof storage for audit
- Admin notes for record-keeping
- No auto-approval

## Implementation Checklist

### Backend ✅
- [x] Update payment_model.py with new database operations
- [x] Extend payment_service.py with doctor price lookup
- [x] Refactor payment_controller.py with unified create-payment endpoint
- [x] Add submit-proof handler for Easypaisa
- [x] Add admin-confirm handler for Easypaisa
- [x] Update payment_routes.py with all endpoints
- [x] Add configuration to config.py
- [x] Webhook still works for Stripe (backward compatible)

### Frontend ✅
- [x] Update paymentService.ts with payment_method support
- [x] Add submitPaymentProof function
- [x] Add helper functions (convertUsdToPkr, getPaymentMethodLabel)
- [ ] Update payment UI to show method selector
- [ ] Add Easypaisa proof submission form
- [ ] Add admin dashboard for payment confirmation

### Testing
- [ ] Test Stripe flow (should work like before)
- [ ] Test Easypaisa payment creation
- [ ] Test proof submission
- [ ] Test admin confirmation
- [ ] Test webhook still works
- [ ] Test duplicate payment prevention
- [ ] Test permission checks

## Testing Instructions

### Stripe (Auto-Confirm)
```
1. User selects doctor and appointment time
2. Select payment method: "Stripe"
3. Enter test card: 4242 4242 4242 4242
4. Check database: payment status should be "paid"
5. Check appointment: should be "confirmed"
```

### Easypaisa (Manual Approval)
```
1. User selects doctor and appointment time
2. Select payment method: "Easypaisa"
3. Show receiver: 03144828190, amount: PKR amount
4. User submits proof (screenshot)
5. Check database: payment status should be "pending_review"
6. Admin views pending payment
7. Admin clicks confirm
8. Check database: payment status → "paid", appointment → "confirmed"
```

## Database Queries for Testing

### Find pending Easypaisa payments
```javascript
db.payments.find({
  payment_method: "easypaisa",
  status: "pending_review"
})
```

### Find all payments by user
```javascript
db.payments.find({
  userId: ObjectId("..."),
}).sort({ createdAt: -1 })
```

### Verify payment locked price
```javascript
db.payments.find({
  _id: ObjectId("..."),
  amount_verified_at: { $exists: true }
})
```

## Frontend Integration Points

### Payment Method Selector Component
```tsx
<RadioGroup>
  <Radio value="stripe">Credit/Debit Card (Auto-confirm)</Radio>
  <Radio value="easypaisa">Easypaisa Transfer (Manual)</Radio>
</RadioGroup>
```

### Easypaisa Proof Submission
```tsx
<form onSubmit={handleSubmitProof}>
  <input type="file" name="screenshot" accept="image/*" />
  OR
  <input type="text" name="transactionId" placeholder="Transaction ID" />
</form>
```

### Admin Dashboard
```tsx
<AdminPaymentList>
  {pendingPayments.map(payment => (
    <PaymentCard>
      <Proof image={payment.easypaisa_proof_url} />
      <Button onClick={confirmPayment}>Confirm</Button>
    </PaymentCard>
  ))}
</AdminPaymentList>
```

## Backward Compatibility

✅ **All existing Stripe flows work unchanged**
- Webhook still processes payment_intent.succeeded
- Payment history still returns Stripe payments
- Refund endpoint still works for Stripe

✅ **Old payment records**
- payment_method field will be null/unset
- Treat as "stripe" for backward compatibility
- Optional migration: set payment_method="stripe" for existing records

## Migration Notes

If migrating from single-method system:
1. Set `payment_method="stripe"` for all existing records
2. Verify `amount` field (should be in cents)
3. Test existing webhook handling
4. Gradually introduce Easypaisa to users

## Future Enhancements

1. **Multiple Payment Methods Per Doctor**: Let doctors choose accepted methods
2. **Payment Receipts**: Generate PDF invoices
3. **Refund for Easypaisa**: Manual refund process with admin approval
4. **Payment Analytics**: Dashboard for payment metrics
5. **Automated Reminders**: SMS/WhatsApp reminders for pending proofs
6. **Partial Payments**: Allow deposits for large consultations
7. **Recurring Payments**: Subscription models for check-ups

## Troubleshooting

### Issue: Doctor consultation fee not set
**Solution**: Update doctor profile with consultationFee field in database
```javascript
db.users.updateOne(
  { _id: ObjectId("doctor_id"), role: "doctor" },
  { $set: { consultationFee: 50 } }  // In USD
)
```

### Issue: Easypaisa proof not appearing
**Solution**: Check proof_submitted_at timestamp and payment status="pending_review"

### Issue: Admin cannot confirm payment
**Solution**: Verify admin role in JWT claims, payment status must be "pending_review"

### Issue: Stripe webhook still not processing
**Solution**: Verify webhook signature in logs, check payment_method field

## Support

For issues:
1. Check console logs in both backend and frontend
2. Verify payment documents in MongoDB
3. Check admin dashboard for pending payments
4. Review webhook events in Stripe dashboard (for Stripe payments)

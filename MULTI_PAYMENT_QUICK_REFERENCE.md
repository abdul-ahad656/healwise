# Multi-Payment System - Quick Reference

## 🎯 Key Changes at a Glance

| Component | Change | Impact |
|-----------|--------|--------|
| Endpoint | `/create-payment-intent` → `/create-payment` | Accept `payment_method` parameter |
| Payment Methods | Stripe only → Stripe + Easypaisa | Dual payment support |
| Price Source | Config `APPOINTMENT_CONSULTATION_FEE` → Doctor record `consultationFee` | Dynamic per-doctor pricing |
| Admin Capability | None → Confirm Easypaisa payments | Manual payment approval |
| Approval | Automatic (webhook) → Two types (auto/manual) | Both flows supported |

## 🔧 Backend API Changes

### OLD: Create Payment
```typescript
POST /api/payments/create-payment-intent
{
  appointmentDate, appointmentTime, doctorId, symptomId
}
→ Returns Stripe clientSecret only
```

### NEW: Create Payment (Unified)
```typescript
POST /api/payments/create-payment
{
  doctor_id,              // Required
  appointment_id,         // Required
  appointment_date,       // Required
  appointment_time,       // Required
  payment_method: "stripe" | "easypaisa",  // NEW
  symptom_id              // Optional
}

// Stripe response
→ { payment_method, clientSecret, paymentId, amount, currency }

// Easypaisa response  
→ { payment_method, receiver_number, amount, paymentId, status, instructions }
```

## 🆕 New Endpoints

### 1. Submit Easypaisa Proof
```typescript
POST /api/payments/submit-proof
{
  payment_id,
  proof_type: "screenshot" | "transaction_id",
  proof: "url_or_transaction_id"
}
→ { message, payment_id, status }
```

### 2. Admin Confirm Payment
```typescript
POST /api/payments/admin/confirm-payment  (Admin only)
{
  payment_id,
  admin_notes: "optional notes"
}
→ { message, payment_id, appointment_id, status }
```

### 3. Admin View Pending
```typescript
GET /api/payments/admin/pending-easypaisa  (Admin only)
→ { total, payments: [...] }
```

## 📊 Status Flow Comparison

**Stripe**:
```
pending → paid (webhook) → appointment created
```

**Easypaisa**:
```
pending → pending_review (user proof) → paid (admin) → appointment created
```

## 🔐 Critical Security Features

1. **Doctor Price Lock**
   ```python
   # Backend ALWAYS does this:
   price = doctor.consultationFee * 100  # From database, never frontend
   
   # Frontend CANNOT override:
   # Backend ignores any frontend "amount" field
   ```

2. **Role-Based Admin Access**
   ```python
   if claims.get("role") != "admin":
       return 403 Forbidden
   ```

3. **Duplicate Prevention**
   ```python
   if check_active_payment_for_appointment(appointment_id):
       return 409 Conflict  # Already has active payment
   ```

## 💰 Price Calculation

```python
# Backend (ALWAYS):
doctor = db.users.find_one({"_id": doctor_id})
price_in_cents = int(doctor.consultationFee * 100)

# Example:
# doctor.consultationFee = 50 USD
# price_in_cents = 5000
# Frontend displays: $50 USD or PKR 13,900

# Frontend conversion helper:
convertUsdToPkr(5000)  // Returns PKR amount based on exchange rate
```

## 📱 Frontend TypeScript Usage

### Create Payment
```typescript
import { createPayment, PaymentResponse } from '@/services/paymentService';

// Stripe
const response = await createPayment(
  appointmentId, appointmentDate, appointmentTime,
  doctorId, "stripe", symptomId
);
// response.clientSecret for Stripe SDK

// Easypaisa
const response = await createPayment(
  appointmentId, appointmentDate, appointmentTime,
  doctorId, "easypaisa", symptomId
);
// response.receiver_number, response.instructions
```

### Submit Proof
```typescript
import { submitPaymentProof } from '@/services/paymentService';

await submitPaymentProof(
  paymentId,
  "screenshot",  // or "transaction_id"
  "image_url_or_transaction_123"
);
```

## 🗄️ Database Query Examples

### Find pending Easypaisa payments
```javascript
db.payments.find({
  payment_method: "easypaisa",
  status: "pending_review"
})
```

### Find all payments for user
```javascript
db.payments.find({
  userId: ObjectId("user_id"),
  payment_method: "stripe"  // or "easypaisa"
}).sort({ createdAt: -1 })
```

### Check if appointment has active payment
```javascript
db.payments.findOne({
  appointmentId: ObjectId("appointment_id"),
  status: { $in: ["pending", "pending_review", "paid"] }
})
```

## ✅ Backward Compatibility

All existing functionality works:
- ✅ Webhook still processes Stripe payments
- ✅ Refund endpoint works same way
- ✅ Payment history endpoint returns both methods
- ✅ No breaking changes to existing data

## 🧪 Test Scenarios

### Scenario 1: Stripe Auto-Confirm
```
1. createPayment(..., "stripe")
2. Frontend: Process card with clientSecret
3. Webhook: payment_intent.succeeded
4. Backend: Update payment to "paid", create appointment
5. Result: Immediate booking confirmation
```

### Scenario 2: Easypaisa Manual
```
1. createPayment(..., "easypaisa")
2. User: Send Easypaisa transfer
3. User: Submit screenshot/transaction ID
4. Admin: See pending payment in dashboard
5. Admin: Click "Confirm"
6. Backend: Update payment to "paid", create appointment
7. Result: Manual booking confirmation
```

### Scenario 3: Duplicate Prevention
```
1. createPayment(..., appointmentId)
2. getStatus → status="pending"
3. User tries: createPayment(..., appointmentId) again
4. Backend: Checks active payment exists
5. Result: 409 Conflict error
```

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Doctor fee not set | Update doctor: `db.users.updateOne({_id}, {$set: {consultationFee: 50}})` |
| Easypaisa proof not appearing | Check proof_submitted_at field, status must be "pending_review" |
| Admin can't confirm | Verify admin role, payment status must be "pending_review" |
| Stripe webhook not triggering | Check STRIPE_WEBHOOK_SECRET in config, verify endpoint URL |
| Price mismatch | Always fetch from doctor record, never frontend price |

## 📚 Full Documentation

See `MULTI_PAYMENT_SYSTEM.md` for:
- Complete API specifications
- Database schema
- Detailed test instructions
- Troubleshooting guide
- Migration notes
- Future enhancements

---

**Implementation**: ✅ Complete
**Status**: Ready for frontend UI + testing
**Next**: Add payment method selector & Easypaisa UI

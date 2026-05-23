# Stripe Payment API - Request/Response Examples

## API Request Examples

### 1. Create Payment Intent

**Endpoint:** `POST /api/payments/create-payment-intent`

**Request:**
```bash
curl -X POST http://localhost:5000/api/payments/create-payment-intent \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentDate": "2026-05-25",
    "appointmentTime": "14:30",
    "doctorId": "507f1f77bcf86cd799439011",
    "symptomId": "507f1f77bcf86cd799439012"
  }'
```

**Success Response (200):**
```json
{
  "clientSecret": "pi_1ABC1234567890abcdefghij_secret_XYZ1234567890abcdefghij",
  "paymentId": "507f1f77bcf86cd799439013",
  "amount": 5000,
  "currency": "usd",
  "message": "Payment intent created successfully"
}
```

**Error Response (400 - Missing Fields):**
```json
{
  "error": "Missing required fields: doctorId, appointmentDate, appointmentTime"
}
```

**Error Response (403 - Not a Patient):**
```json
{
  "error": "Only patients can initiate payments"
}
```

**Error Response (409 - Doctor Already Booked):**
```json
{
  "error": "Doctor is already booked at this time"
}
```

**Error Response (503 - Stripe Service Error):**
```json
{
  "error": "Stripe API error: Your card has insufficient funds"
}
```

---

### 2. Get Payment History

**Endpoint:** `GET /api/payments/history`

**Request:**
```bash
curl -X GET http://localhost:5000/api/payments/history \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "paymentId": "507f1f77bcf86cd799439013",
    "amount": 5000,
    "currency": "usd",
    "status": "succeeded",
    "cardLast4": "4242",
    "appointmentDate": "2026-05-25",
    "appointmentTime": "14:30",
    "createdAt": "2026-05-22T10:30:00Z",
    "succeededAt": "2026-05-22T10:31:00Z"
  },
  {
    "_id": "507f1f77bcf86cd799439014",
    "paymentId": "507f1f77bcf86cd799439014",
    "amount": 5000,
    "currency": "usd",
    "status": "failed",
    "failureReason": "Your card was declined",
    "createdAt": "2026-05-21T15:20:00Z"
  }
]
```

**Error Response (403 - Not Authenticated):**
```json
{
  "error": "Only patients can view their payments"
}
```

---

### 3. Request Refund

**Endpoint:** `POST /api/payments/refund`

**Request:**
```bash
curl -X POST http://localhost:5000/api/payments/refund \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "507f1f77bcf86cd799439013"
  }'
```

**Success Response (200):**
```json
{
  "refundId": "re_1ABC1234567890abcdefghij",
  "status": "succeeded",
  "amount": 5000,
  "message": "Refund processed successfully"
}
```

**Error Response (400 - Already Refunded):**
```json
{
  "error": "Payment is already refunded"
}
```

**Error Response (400 - Not Succeeded):**
```json
{
  "error": "Only succeeded payments can be refunded"
}
```

**Error Response (403 - Not Your Payment):**
```json
{
  "error": "You can only refund your own payments"
}
```

**Error Response (404 - Not Found):**
```json
{
  "error": "Payment not found"
}
```

**Error Response (503 - Stripe Error):**
```json
{
  "error": "Failed to create refund: Your account does not support this request"
}
```

---

### 4. Stripe Webhook Event

**Endpoint:** `POST /api/payments/webhook`

**Stripe Sends (Event: payment_intent.succeeded):**
```json
{
  "id": "evt_1234567890abcdefghij",
  "object": "event",
  "api_version": "2023-10-16",
  "created": 1685883600,
  "data": {
    "object": {
      "id": "pi_1ABC1234567890abcdefghij",
      "object": "payment_intent",
      "amount": 5000,
      "amount_capturable": 0,
      "amount_received": 5000,
      "capture_method": "automatic",
      "client_secret": "pi_1ABC1234567890abcdefghij_secret_XYZ1234567890abcdefghij",
      "confirmation_method": "automatic",
      "created": 1685883600,
      "currency": "usd",
      "customer": null,
      "description": "Consultation appointment - Dr. Smith",
      "last_payment_error": null,
      "livemode": false,
      "metadata": {
        "userId": "507f1f77bcf86cd799439010",
        "appointmentDate": "2026-05-25",
        "doctorId": "507f1f77bcf86cd799439011",
        "doctorName": "Dr. Smith"
      },
      "next_action": null,
      "payment_method": "pm_1ABC1234567890abcdefghij",
      "payment_method_types": ["card"],
      "receipt_email": null,
      "setup_future_usage": null,
      "statement_descriptor": null,
      "statement_descriptor_suffix": null,
      "status": "succeeded",
      "transfer_data": null
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": null,
    "idempotency_key": null
  },
  "type": "payment_intent.succeeded"
}
```

**Backend Webhook Handler Response (200):**
```json
{
  "status": "received"
}
```

**Stripe Sends (Event: payment_intent.payment_failed):**
```json
{
  "id": "evt_1234567890abcdefghij",
  "object": "event",
  "type": "payment_intent.payment_failed",
  "data": {
    "object": {
      "id": "pi_1ABC1234567890abcdefghij",
      "status": "requires_payment_method",
      "last_payment_error": {
        "charge": "ch_1ABC1234567890abcdefghij",
        "code": "insufficient_funds",
        "decline_code": "insufficient_funds",
        "message": "Your card has insufficient funds",
        "payment_method": "pm_1ABC1234567890abcdefghij",
        "type": "card_error"
      }
    }
  }
}
```

---

## Frontend Integration Examples

### TypeScript/React Native Examples

**Example 1: Create Payment and Handle Response**
```typescript
import { createPaymentIntent, PaymentIntent } from '@/services/paymentService';

async function handlePayment() {
  try {
    const intent: PaymentIntent = await createPaymentIntent(
      '2026-05-25',      // appointmentDate
      '14:30',           // appointmentTime
      'doctor-id-123',   // doctorId
      'symptom-id-456'   // optional symptomId
    );

    console.log('Payment Intent Created');
    console.log('Amount:', formatPaymentAmount(intent.amount, intent.currency));
    console.log('ClientSecret:', intent.clientSecret);
    
    // Now pass clientSecret to Stripe SDK
    
  } catch (error) {
    console.error('Failed to create payment:', error.message);
  }
}
```

**Example 2: Fetch Payment History**
```typescript
import { getPaymentHistory, PaymentHistory } from '@/services/paymentService';

async function loadPaymentHistory() {
  try {
    const payments: PaymentHistory[] = await getPaymentHistory();
    
    payments.forEach(payment => {
      console.log(`Payment ${payment.paymentId}:`);
      console.log(`  Amount: ${formatPaymentAmount(payment.amount)}`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Card: ****${payment.cardLast4}`);
      console.log(`  Date: ${payment.createdAt}`);
    });
  } catch (error) {
    console.error('Failed to load payments:', error.message);
  }
}
```

**Example 3: Process Refund**
```typescript
import { refundPayment } from '@/services/paymentService';

async function handleRefund(paymentId: string) {
  try {
    const refund = await refundPayment(paymentId);
    
    console.log('Refund successful:');
    console.log('  Refund ID:', refund.refundId);
    console.log('  Status:', refund.status);
    console.log('  Amount:', refund.amount);
    
    // Show success message
  } catch (error) {
    console.error('Refund failed:', error.message);
    // Show error to user
  }
}
```

---

## Backend Integration Examples

### Python/Flask Examples

**Example 1: Verify Payment Status**
```python
from app.models.payment_model import find_payment_by_intent_id
from app.services.payment_service import get_payment_intent

def verify_payment_status(intent_id):
    try:
        # Get from our DB
        payment = find_payment_by_intent_id(intent_id)
        
        if not payment:
            return {'error': 'Payment not found'}, 404
            
        # Optionally verify with Stripe
        stripe_intent = get_payment_intent(intent_id)
        
        return {
            'status': payment['status'],
            'amount': payment['amount'],
            'currency': payment['currency'],
            'created_at': payment['createdAt']
        }, 200
        
    except Exception as e:
        return {'error': str(e)}, 500
```

**Example 2: List User Payments**
```python
from app.models.payment_model import get_user_payments
from bson.objectid import ObjectId

def get_user_payment_summary(user_id):
    try:
        payments = get_user_payments(user_id)
        
        summary = {
            'total_payments': len(payments),
            'total_amount': sum(p.get('amount', 0) for p in payments),
            'succeeded': len([p for p in payments if p['status'] == 'succeeded']),
            'failed': len([p for p in payments if p['status'] == 'failed']),
            'refunded': len([p for p in payments if p['status'] == 'refunded']),
            'payments': payments
        }
        
        return summary, 200
        
    except Exception as e:
        return {'error': str(e)}, 500
```

**Example 3: Process Refund with Logging**
```python
from app.models.payment_model import find_payment_by_id, update_payment_with_refund
from app.services.payment_service import refund_payment
import logging

logger = logging.getLogger(__name__)

def refund_payment_with_logging(payment_id_str):
    try:
        payment_id = ObjectId(payment_id_str)
        payment = find_payment_by_id(payment_id)
        
        if not payment:
            logger.warning(f'Refund requested for non-existent payment: {payment_id}')
            return {'error': 'Payment not found'}, 404
            
        if payment['status'] == 'refunded':
            logger.info(f'Payment already refunded: {payment_id}')
            return {'error': 'Already refunded'}, 400
            
        # Create Stripe refund
        stripe_refund = refund_payment(payment['stripePaymentIntentId'])
        
        # Update our DB
        update_payment_with_refund(payment_id, stripe_refund.id)
        
        logger.info(f'Refund successful: {stripe_refund.id} for payment {payment_id}')
        
        return {
            'refundId': stripe_refund.id,
            'status': stripe_refund.status,
            'amount': stripe_refund.amount
        }, 200
        
    except Exception as e:
        logger.error(f'Refund failed: {str(e)}')
        return {'error': str(e)}, 500
```

---

## cURL Command Cheat Sheet

```bash
# Set variables
TOKEN="your-jwt-token"
DOCTOR_ID="507f1f77bcf86cd799439011"
PAYMENT_ID="507f1f77bcf86cd799439013"
BASE_URL="http://localhost:5000"

# 1. Create payment
curl -X POST $BASE_URL/api/payments/create-payment-intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentDate": "2026-05-25",
    "appointmentTime": "14:30",
    "doctorId": "'$DOCTOR_ID'"
  }' | jq .

# 2. Get payment history
curl -X GET $BASE_URL/api/payments/history \
  -H "Authorization: Bearer $TOKEN" | jq .

# 3. Refund payment
curl -X POST $BASE_URL/api/payments/refund \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "'$PAYMENT_ID'"}' | jq .
```

---

## Response Status Codes Reference

| Code | Meaning | Example Scenario |
|------|---------|-------------------|
| 200 | Success | Payment history retrieved, refund processed |
| 201 | Created | Payment intent created |
| 400 | Bad Request | Missing fields, already refunded |
| 403 | Forbidden | Not authenticated, not your payment |
| 404 | Not Found | Payment doesn't exist |
| 409 | Conflict | Doctor already booked at that time |
| 503 | Service Unavailable | Stripe API error |

---

## MongoDB Document Examples

**Payment Document (Succeeded):**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "userId": "user-123",
  "appointmentId": ObjectId("507f1f77bcf86cd799439014"),
  "stripePaymentIntentId": "pi_1ABC1234567890abcdefghij",
  "stripeClientSecret": "pi_1ABC1234567890abcdefghij_secret_XYZ",
  "amount": 5000,
  "currency": "usd",
  "status": "succeeded",
  "paymentMethod": "card",
  "cardLast4": "4242",
  "refundId": null,
  "failureReason": null,
  "metadata": {
    "appointmentDate": "2026-05-25",
    "appointmentTime": "14:30",
    "doctorId": "507f1f77bcf86cd799439011",
    "doctorName": "Dr. Smith",
    "symptomId": "507f1f77bcf86cd799439012"
  },
  "createdAt": ISODate("2026-05-22T10:30:00Z"),
  "succeededAt": ISODate("2026-05-22T10:31:00Z"),
  "refundedAt": null,
  "updatedAt": ISODate("2026-05-22T10:31:00Z")
}
```

**Payment Document (Refunded):**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "userId": "user-123",
  "appointmentId": ObjectId("507f1f77bcf86cd799439014"),
  "stripePaymentIntentId": "pi_1ABC1234567890abcdefghij",
  "stripeClientSecret": "pi_1ABC1234567890abcdefghij_secret_XYZ",
  "amount": 5000,
  "currency": "usd",
  "status": "refunded",
  "paymentMethod": "card",
  "cardLast4": "4242",
  "refundId": "re_1ABC1234567890abcdefghij",
  "failureReason": null,
  "metadata": { /* same as above */ },
  "createdAt": ISODate("2026-05-22T10:30:00Z"),
  "succeededAt": ISODate("2026-05-22T10:31:00Z"),
  "refundedAt": ISODate("2026-05-22T11:45:00Z"),
  "updatedAt": ISODate("2026-05-22T11:45:00Z")
}
```

---

## Postman Collection

Import this into Postman for easy API testing:

```json
{
  "info": {
    "name": "HealWise Stripe Payments",
    "description": "Stripe payment integration API endpoints"
  },
  "item": [
    {
      "name": "Create Payment Intent",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/payments/create-payment-intent",
          "host": ["{{base_url}}", "api", "payments"],
          "path": ["create-payment-intent"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\n  \"appointmentDate\": \"2026-05-25\",\n  \"appointmentTime\": \"14:30\",\n  \"doctorId\": \"507f1f77bcf86cd799439011\"\n}"
        }
      }
    },
    {
      "name": "Get Payment History",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/payments/history",
          "host": ["{{base_url}}", "api", "payments"],
          "path": ["history"]
        }
      }
    },
    {
      "name": "Refund Payment",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/payments/refund",
          "host": ["{{base_url}}", "api", "payments"],
          "path": ["refund"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\n  \"paymentId\": \"507f1f77bcf86cd799439013\"\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000"
    },
    {
      "key": "jwt_token",
      "value": "your-jwt-token-here"
    }
  ]
}
```

from flask import request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity, get_jwt
from app.extensions import mongo
from bson.objectid import ObjectId
from datetime import datetime
from app.models.payment_model import (
    create_payment,
    find_payment_by_intent_id,
    find_payment_by_stripe_intent,
    update_payment_status,
    get_user_payments,
    update_payment_with_refund,
    check_active_payment_for_appointment,
    submit_payment_proof,
    update_payment_to_paid,
    get_pending_easypaisa_payments,
    find_payment_by_id,
)
from app.models.user_model import find_user_by_id
from app.services.payment_service import (
    StripeServiceError,
    PaymentMethodError,
    create_payment_intent as stripe_create_payment_intent,
    verify_webhook_signature,
    refund_payment as stripe_refund_payment,
    get_payment_intent,
    get_doctor_consultation_price,
    validate_payment_method,
)


def create_payment_handler():
    """
    Unified payment creation endpoint supporting multiple payment methods.

    CRITICAL: Always fetches consultation price from doctor record, never from frontend.

    Expected JSON body:
    {
        "doctor_id": "...",
        "appointment_id": "...",
        "appointment_date": "2026-05-25",
        "appointment_time": "14:30",
        "payment_method": "stripe" | "easypaisa",
        "symptom_id": "..." (optional)
    }

    Returns:
    - Stripe: { payment_method, clientSecret, amount, currency, paymentId }
    - Easypaisa: { payment_method, receiver_number, amount, status, paymentId, instructions }
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()

        if claims.get("role") != "patient":
            return jsonify({"error": "Only patients can initiate payments"}), 403

        data = request.json or {}
        doctor_id = data.get("doctor_id")
        appointment_id = data.get("appointment_id")
        appointment_date = data.get("appointment_date")
        appointment_time = data.get("appointment_time")
        payment_method = data.get("payment_method", "stripe")
        symptom_id = data.get("symptom_id")

        # Validate required fields
        if not all([doctor_id, appointment_date, appointment_time, appointment_id]):
            return jsonify({
                "error": "Missing required fields: doctor_id, appointment_id, appointment_date, appointment_time"
            }), 400

        # Validate payment method
        try:
            validate_payment_method(payment_method)
        except PaymentMethodError as e:
            return jsonify({"error": str(e)}), 400

        # Validate appointment_id format
        try:
            appointment_id_obj = ObjectId(appointment_id)
        except:
            return jsonify({"error": "Invalid appointment ID"}), 400

        # Check doctor exists and is active
        try:
            doctor_id_obj = ObjectId(doctor_id)
            doctor = mongo.db.users.find_one({"_id": doctor_id_obj})
        except:
            return jsonify({"error": "Invalid doctor ID"}), 400

        if not doctor or doctor.get("active") is False:
            return jsonify({"error": "Doctor is not available"}), 403

        if doctor.get("role") != "doctor":
            return jsonify({"error": "Selected user is not a doctor"}), 400

        # CRITICAL: Fetch doctor consultation price from database
        try:
            amount, doctor = get_doctor_consultation_price(doctor_id, mongo.db)
        except PaymentMethodError as e:
            return jsonify({"error": str(e)}), 400

        # Check doctor has availability at this time
        slot_exists = mongo.db.doctor_availability.find_one({
            "doctorId": doctor_id,
            "day": appointment_date,
            "slots": appointment_time
        })

        if not slot_exists:
            return jsonify({"error": "Selected slot not available for doctor"}), 400

        # Check no conflicting appointments
        existing = mongo.db.appointments.find_one({
            "doctorId": doctor_id,
            "appointmentDate": appointment_date,
            "appointmentTime": appointment_time,
            "status": {"$in": ["pending", "accepted", "confirmed"]}
        })

        if existing:
            return jsonify({"error": "Doctor is already booked at this time"}), 409

        # Check no active payment for this appointment already
        try:
            if check_active_payment_for_appointment(appointment_id_obj):
                return jsonify({
                    "error": "This appointment already has an active payment. Please check your payment history."
                }), 409
        except Exception as e:
            return jsonify({"error": f"Failed to check active payments: {str(e)}"}), 500

        # Route based on payment method
        if payment_method == "stripe":
            return _handle_stripe_payment(
                user_id, doctor_id, appointment_id_obj, appointment_date,
                appointment_time, amount, doctor, symptom_id
            )
        elif payment_method == "easypaisa":
            return _handle_easypaisa_payment(
                user_id, doctor_id, appointment_id_obj, appointment_date,
                appointment_time, amount, doctor, symptom_id
            )
        else:
            return jsonify({"error": "Unsupported payment method"}), 400

    except Exception as e:
        return jsonify({"error": f"Internal error: {str(e)}"}), 500


def _handle_stripe_payment(user_id, doctor_id, appointment_id, appointment_date,
                          appointment_time, amount, doctor, symptom_id):
    """Handle Stripe payment method."""
    try:
        currency = "usd"

        # Create Stripe PaymentIntent
        try:
            stripe_intent = stripe_create_payment_intent(
                amount=amount,
                currency=currency,
                user_id=user_id,
                appointment_data={
                    "appointmentDate": appointment_date,
                    "doctorId": doctor_id,
                    "doctorName": doctor.get("name", "Doctor"),
                }
            )
        except StripeServiceError as e:
            return jsonify({"error": f"Payment service error: {str(e)}"}), 503

        # Create payment record in MongoDB
        payment_doc = {
            "userId": user_id,
            "doctorId": doctor_id,
            "appointmentId": appointment_id,
            "payment_method": "stripe",
            "stripe_payment_intent_id": stripe_intent.id,
            "stripe_client_secret": stripe_intent.client_secret,
            "amount": amount,
            "currency": currency,
            "status": "pending",
            "amount_verified_at": datetime.utcnow(),
            "doctor_consultation_price": amount / 100,  # Store original price
            "metadata": {
                "appointmentDate": appointment_date,
                "appointmentTime": appointment_time,
                "doctorId": doctor_id,
                "doctorName": doctor.get("name", "Doctor"),
                "symptomId": symptom_id,
            },
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        try:
            payment_id = create_payment(payment_doc)
        except Exception as e:
            return jsonify({"error": f"Failed to save payment: {str(e)}"}), 500

        return jsonify({
            "payment_method": "stripe",
            "clientSecret": stripe_intent.client_secret,
            "paymentId": str(payment_id),
            "amount": amount,
            "currency": currency,
            "message": "Payment intent created successfully"
        }), 200

    except Exception as e:
        return jsonify({"error": f"Stripe payment error: {str(e)}"}), 500


def _handle_easypaisa_payment(user_id, doctor_id, appointment_id, appointment_date,
                             appointment_time, amount, doctor, symptom_id):
    """Handle Easypaisa manual payment method."""
    try:
        currency = "usd"
        receiver_number = current_app.config.get("EASYPAISA_RECEIVER_NUMBER")

        # Create payment record with pending status (NOT auto-confirmed)
        payment_doc = {
            "userId": user_id,
            "doctorId": doctor_id,
            "appointmentId": appointment_id,
            "payment_method": "easypaisa",
            "amount": amount,
            "currency": currency,
            "status": "pending",  # Waiting for user to send payment
            "amount_verified_at": datetime.utcnow(),
            "doctor_consultation_price": amount / 100,
            "easypaisa_receiver": receiver_number,
            "metadata": {
                "appointmentDate": appointment_date,
                "appointmentTime": appointment_time,
                "doctorId": doctor_id,
                "doctorName": doctor.get("name", "Doctor"),
                "symptomId": symptom_id,
            },
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        try:
            payment_id = create_payment(payment_doc)
        except Exception as e:
            return jsonify({"error": f"Failed to create payment record: {str(e)}"}), 500

        return jsonify({
            "payment_method": "easypaisa",
            "receiver_number": receiver_number,
            "amount": amount,
            "currency": currency,
            "paymentId": str(payment_id),
            "status": "pending",
            "instructions": (
                f"Send payment to Easypaisa number: {receiver_number}\n"
                f"Amount: PKR (amount will be calculated by Easypaisa)\n"
                f"After payment, submit your transaction proof using your Payment ID: {str(payment_id)}\n"
                f"Our admin team will verify and confirm your booking."
            )
        }), 200

    except Exception as e:
        return jsonify({"error": f"Easypaisa payment error: {str(e)}"}), 500


def submit_proof_handler():
    """
    Submit payment proof for Easypaisa payments.

    Expected JSON body:
    {
        "payment_id": "...",
        "proof_type": "screenshot" | "transaction_id",
        "proof": "image_url_or_transaction_id"
    }

    Returns: { message, status }
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()

        if claims.get("role") != "patient":
            return jsonify({"error": "Only patients can submit proofs"}), 403

        data = request.json or {}
        payment_id = data.get("payment_id")
        proof_type = data.get("proof_type")
        proof = data.get("proof")

        # Validate required fields
        if not all([payment_id, proof_type, proof]):
            return jsonify({
                "error": "Missing required fields: payment_id, proof_type, proof"
            }), 400

        # Validate proof_type
        if proof_type not in ["screenshot", "transaction_id"]:
            return jsonify({
                "error": "Invalid proof_type. Must be 'screenshot' or 'transaction_id'"
            }), 400

        # Fetch payment
        try:
            payment_id_obj = ObjectId(payment_id)
            payment = find_payment_by_id(payment_id_obj)
        except:
            return jsonify({"error": "Invalid payment ID"}), 400

        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        # Validate payment ownership
        if payment["userId"] != user_id:
            return jsonify({"error": "You can only submit proof for your own payments"}), 403

        # Validate payment method
        if payment.get("payment_method") != "easypaisa":
            return jsonify({"error": "Proof can only be submitted for Easypaisa payments"}), 400

        # Validate payment status
        if payment.get("status") != "pending":
            return jsonify({
                "error": f"Cannot submit proof for payment with status: {payment.get('status')}"
            }), 400

        # Store proof and update status
        try:
            proof_data = {"proof_type": proof_type, "proof": proof}
            submit_payment_proof(payment_id_obj, proof_data)
        except Exception as e:
            return jsonify({"error": f"Failed to submit proof: {str(e)}"}), 500

        return jsonify({
            "message": "Payment proof submitted successfully. Our admin will review and confirm your booking shortly.",
            "payment_id": payment_id,
            "status": "pending_review"
        }), 200

    except Exception as e:
        return jsonify({"error": f"Internal error: {str(e)}"}), 500


def admin_confirm_payment_handler():
    """
    Admin endpoint to confirm Easypaisa payments.

    Expected JSON body:
    {
        "payment_id": "...",
        "admin_notes": "..." (optional)
    }

    Returns: { message, payment_id, appointment_id, status }
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()

        # Admin role check
        if claims.get("role") != "admin":
            return jsonify({"error": "Only admins can confirm payments"}), 403

        data = request.json or {}
        payment_id = data.get("payment_id")
        admin_notes = data.get("admin_notes")

        if not payment_id:
            return jsonify({"error": "Missing required field: payment_id"}), 400

        # Fetch payment
        try:
            payment_id_obj = ObjectId(payment_id)
            payment = find_payment_by_id(payment_id_obj)
        except:
            return jsonify({"error": "Invalid payment ID"}), 400

        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        # Validate payment status
        if payment.get("status") != "pending_review":
            return jsonify({
                "error": f"Only payments in 'pending_review' status can be confirmed. Current status: {payment.get('status')}"
            }), 400

        # Validate payment method
        if payment.get("payment_method") != "easypaisa":
            return jsonify({
                "error": "Only Easypaisa payments can be manually confirmed"
            }), 400

        # Update payment to paid
        try:
            update_payment_to_paid(payment_id_obj, admin_notes)
        except Exception as e:
            return jsonify({"error": f"Failed to confirm payment: {str(e)}"}), 500

        # Update appointment to confirmed
        try:
            if payment.get("appointmentId"):
                appointment_id = ObjectId(payment["appointmentId"])
                mongo.db.appointments.update_one(
                    {"_id": appointment_id},
                    {
                        "$set": {
                            "status": "confirmed",
                            "paymentStatus": "paid",
                            "updatedAt": datetime.utcnow()
                        }
                    }
                )
        except Exception as e:
            print(f"Warning: Failed to update appointment status: {str(e)}")
            # Don't fail payment confirmation if appointment update fails

        return jsonify({
            "message": "Payment confirmed successfully. Booking is now active.",
            "payment_id": payment_id,
            "appointment_id": str(payment.get("appointmentId")) if payment.get("appointmentId") else None,
            "status": "paid"
        }), 200

    except Exception as e:
        return jsonify({"error": f"Internal error: {str(e)}"}), 500


def handle_webhook():
    """
    Handle Stripe webhook events.

    Only processes payment_intent.succeeded and payment_intent.payment_failed for Stripe payments.
    Easypaisa payments are handled via admin confirmation endpoint.
    """
    try:
        request_data = request.get_data()
        stripe_signature = request.headers.get("stripe-signature")

        if not stripe_signature:
            return jsonify({"error": "Missing stripe-signature header"}), 400

        # Verify webhook signature
        try:
            event = verify_webhook_signature(request_data, stripe_signature)
        except StripeServiceError as e:
            return jsonify({"error": str(e)}), 400

        event_type = event.get("type")
        payment_intent = event.get("data", {}).get("object", {})
        payment_intent_id = payment_intent.get("id")

        if not payment_intent_id:
            return jsonify({"error": "Invalid webhook payload"}), 400

        # Find payment record by Stripe intent ID
        payment = find_payment_by_stripe_intent(payment_intent_id)
        if not payment:
            # Webhook for unknown payment - could be from another system
            return jsonify({"status": "received"}), 200

        payment_id = payment["_id"]

        # Only process Stripe payments
        if payment.get("payment_method") != "stripe":
            return jsonify({"status": "received"}), 200

        # Handle payment_intent.succeeded
        if event_type == "payment_intent.succeeded":
            try:
                # Update payment status
                update_payment_status(
                    payment_id,
                    "paid",
                    {
                        "paid_at": datetime.utcnow(),
                    }
                )
            except Exception as e:
                print(f"Failed to update payment status: {str(e)}")
                return jsonify({"status": "received"}), 200

            # Create appointment if not already created
            if not payment.get("appointmentId"):
                try:
                    metadata = payment.get("metadata", {})
                    appointment = {
                        "patientId": payment["userId"],
                        "doctorId": metadata.get("doctorId"),
                        "symptomId": metadata.get("symptomId"),
                        "appointmentDate": metadata.get("appointmentDate"),
                        "appointmentTime": metadata.get("appointmentTime"),
                        "status": "confirmed",
                        "paymentId": str(payment_id),
                        "paymentStatus": "paid",
                        "requiresPayment": True,
                        "createdAt": datetime.utcnow(),
                    }

                    result = mongo.db.appointments.insert_one(appointment)
                    appointment_id = result.inserted_id

                    # Update payment with appointment ID
                    update_payment_status(
                        payment_id,
                        "paid",
                        {"appointmentId": appointment_id}
                    )

                except Exception as e:
                    print(f"Failed to create appointment after payment: {str(e)}")
                    # Payment succeeded but appointment creation failed - don't fail webhook
                    pass

        # Handle payment_intent.payment_failed
        elif event_type == "payment_intent.payment_failed":
            failure_message = payment_intent.get("last_payment_error", {}).get("message", "Payment declined")

            try:
                update_payment_status(
                    payment_id,
                    "failed",
                    {"failureReason": failure_message}
                )
            except Exception as e:
                print(f"Failed to update failed payment: {str(e)}")

        return jsonify({"status": "received"}), 200

    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return jsonify({"status": "received"}), 200


def get_payment_history():
    """Get payment history for authenticated user."""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()

        if claims.get("role") != "patient":
            return jsonify({"error": "Only patients can view their payments"}), 403

        payments = get_user_payments(user_id)

        # Enrich with appointment details
        for payment in payments:
            if payment.get("appointmentId"):
                try:
                    appointment = mongo.db.appointments.find_one(
                        {"_id": ObjectId(payment["appointmentId"])}
                    )
                    if appointment:
                        payment["appointmentDate"] = appointment.get("appointmentDate")
                        payment["appointmentTime"] = appointment.get("appointmentTime")
                        payment["appointmentStatus"] = appointment.get("status")
                except:
                    pass

        return jsonify(payments), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve payments: {str(e)}"}), 500


def refund_payment_handler():
    """
    Refund a payment.

    Expected JSON body:
    {
        "payment_id": "..."
    }
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()

        if claims.get("role") != "patient":
            return jsonify({"error": "Only patients can request refunds"}), 403

        data = request.json or {}
        payment_id = data.get("payment_id")

        if not payment_id:
            return jsonify({"error": "Missing paymentId"}), 400

        # Validate payment ID format
        try:
            payment_obj_id = ObjectId(payment_id)
        except:
            return jsonify({"error": "Invalid payment ID"}), 400

        # Find payment
        payment = find_payment_by_id(payment_obj_id)

        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        # Verify user owns this payment
        if payment["userId"] != user_id:
            return jsonify({"error": "You can only refund your own payments"}), 403

        # Check payment status
        if payment["status"] == "refunded":
            return jsonify({"error": "Payment is already refunded"}), 400

        if payment["status"] not in ["paid", "succeeded"]:
            return jsonify({"error": "Only paid/succeeded payments can be refunded"}), 400

        # Only Stripe payments can be refunded
        if payment.get("payment_method") != "stripe":
            return jsonify({
                "error": "Only Stripe payments can be refunded. For Easypaisa, please contact admin."
            }), 400

        # Request refund from Stripe
        try:
            stripe_refund = stripe_refund_payment(payment["stripe_payment_intent_id"])
        except StripeServiceError as e:
            return jsonify({"error": f"Refund failed: {str(e)}"}), 503

        # Update payment record with refund info
        try:
            update_payment_with_refund(
                payment_obj_id,
                stripe_refund.id,
                stripe_refund.status
            )
        except Exception as e:
            return jsonify({"error": f"Failed to record refund: {str(e)}"}), 500

        # Cancel appointment if it exists
        if payment.get("appointmentId"):
            try:
                mongo.db.appointments.update_one(
                    {"_id": ObjectId(payment["appointmentId"])},
                    {
                        "$set": {
                            "status": "cancelled",
                            "paymentStatus": "refunded",
                            "updatedAt": datetime.utcnow()
                        }
                    }
                )
            except:
                pass

        return jsonify({
            "refundId": stripe_refund.id,
            "status": stripe_refund.status,
            "amount": stripe_refund.amount,
            "message": "Refund processed successfully"
        }), 200

    except Exception as e:
        return jsonify({"error": f"Internal error: {str(e)}"}), 500


def get_pending_easypaisa_for_admin():
    """
    Admin endpoint to view all pending Easypaisa payments.

    Returns: [ { payment details including proof } ]
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()

        # Admin role check
        if claims.get("role") != "admin":
            return jsonify({"error": "Only admins can view pending payments"}), 403

        payments = get_pending_easypaisa_payments()

        return jsonify({
            "total": len(payments),
            "payments": payments
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve pending payments: {str(e)}"}), 500

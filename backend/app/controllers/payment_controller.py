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
    update_payment_to_rejected,
    get_pending_easypaisa_payments,
    find_payment_by_id,
    payment_has_booked_appointment,
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
from app.services.cloudinary_service import (
    upload_payment_proof_to_cloudinary,
    upload_refund_proof_to_cloudinary,
)
from app.utils.slot_locking import (
    SlotUnavailableError,
    acquire_slot_lock,
    attach_payment_to_lock,
    create_appointment_from_payment,
    release_slot_lock,
    release_slot_lock_for_payment,
)
import os


def _parse_submit_proof_payload():
    """
    JSON body or multipart (proof_image file + form fields).
    Returns (payment_id, proof_type, proof_text_or_url, upload_file).
    """
    if request.files and "proof_image" in request.files:
        return (
            (request.form.get("payment_id") or "").strip(),
            (request.form.get("proof_type") or "screenshot").strip(),
            None,
            request.files["proof_image"],
        )
    data = request.get_json(silent=True) or {}
    return (
        (data.get("payment_id") or "").strip(),
        (data.get("proof_type") or "").strip(),
        (data.get("proof") or "").strip() if data.get("proof") is not None else "",
        None,
    )


def _validate_payment_proof_file(file):
    if not file or not file.filename:
        return "No screenshot file provided"
    ext = os.path.splitext(file.filename)[1].lower().lstrip(".")
    allowed = current_app.config.get(
        "ALLOWED_PAYMENT_PROOF_EXTENSIONS", {"jpg", "jpeg", "png", "webp"}
    )
    if ext not in allowed:
        return f"Invalid file type. Allowed: {', '.join(sorted(allowed))}"
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    max_size = current_app.config.get("MAX_PAYMENT_PROOF_FILE_SIZE", 5 * 1024 * 1024)
    if size > max_size:
        return f"File too large. Maximum size: {max_size // (1024 * 1024)}MB"
    return None


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

        # Debug logging
        current_app.logger.info(f"Payment request - doctor_id: {doctor_id}, appointment_id: {appointment_id}, date: {appointment_date}, time: {appointment_time}, method: {payment_method}")

        # Validate required fields
        if not all([doctor_id, appointment_date, appointment_time, appointment_id]):
            current_app.logger.error(f"Missing fields: doctor_id={doctor_id}, appointment_id={appointment_id}, date={appointment_date}, time={appointment_time}")
            return jsonify({
                "error": "Missing required fields: doctor_id, appointment_id, appointment_date, appointment_time"
            }), 400

        # Validate payment method
        try:
            validate_payment_method(payment_method)
        except PaymentMethodError as e:
            return jsonify({"error": str(e)}), 400

        # Validate appointment_id format (it's a tracking ID, not an ObjectId yet)
        if not appointment_id or not isinstance(appointment_id, str):
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
            amount, currency, fee_pkr, doctor = get_doctor_consultation_price(
                doctor_id, mongo.db
            )
        except PaymentMethodError as e:
            return jsonify({"error": str(e)}), 400

        # Check doctor has availability at this time (slots is an array on the day doc)
        slot_exists = mongo.db.doctor_availability.find_one({
            "doctorId": doctor_id,
            "day": appointment_date,
            "slots": {"$in": [appointment_time]},
        })

        if not slot_exists:
            return jsonify({"error": "Selected slot not available for doctor"}), 400

        from app.utils.appointment_scheduling import is_past_day, is_past_slot

        if is_past_day(appointment_date) or is_past_slot(
            appointment_date, appointment_time
        ):
            return jsonify({"error": "Cannot book a slot in the past"}), 400

        # Check no active payment for this booking reference
        try:
            if check_active_payment_for_appointment(appointment_id):
                return jsonify({
                    "error": "This appointment already has an active payment. Please check your payment history."
                }), 409
        except Exception as e:
            return jsonify({"error": f"Failed to check active payments: {str(e)}"}), 500

        # Atomic slot hold (blocks concurrent payments for the same slot)
        try:
            acquire_slot_lock(
                doctor_id,
                appointment_date,
                appointment_time,
                user_id,
                payment_method=payment_method,
            )
        except SlotUnavailableError as e:
            return jsonify({"error": str(e)}), 409

        # Route based on payment method
        if payment_method == "stripe":
            return _handle_stripe_payment(
                user_id,
                doctor_id,
                appointment_id,
                appointment_date,
                appointment_time,
                amount,
                currency,
                fee_pkr,
                doctor,
                symptom_id,
            )
        elif payment_method == "easypaisa":
            return _handle_easypaisa_payment(
                user_id,
                doctor_id,
                appointment_id,
                appointment_date,
                appointment_time,
                amount,
                currency,
                fee_pkr,
                doctor,
                symptom_id,
            )
        else:
            release_slot_lock(doctor_id, appointment_date, appointment_time)
            return jsonify({"error": "Unsupported payment method"}), 400

    except Exception as e:
        return jsonify({"error": f"Internal error: {str(e)}"}), 500


def _handle_stripe_payment(
    user_id,
    doctor_id,
    appointment_id,
    appointment_date,
    appointment_time,
    amount,
    currency,
    fee_pkr,
    doctor,
    symptom_id,
):
    """Handle Stripe payment method."""

    def _release_hold():
        release_slot_lock(doctor_id, appointment_date, appointment_time)

    try:

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
            _release_hold()
            return jsonify({"error": f"Payment service error: {str(e)}"}), 503

        # Create payment record in MongoDB
        payment_doc = {
            "userId": user_id,
            "doctorId": doctor_id,
            "appointmentId": appointment_id,
            "appointmentTrackingId": appointment_id,
            "payment_method": "stripe",
            "stripe_payment_intent_id": stripe_intent.id,
            "stripe_client_secret": stripe_intent.client_secret,
            "amount": amount,
            "currency": currency,
            "status": "pending",
            "amount_verified_at": datetime.utcnow(),
            "doctor_consultation_price": fee_pkr,
            "metadata": {
                "appointmentDate": appointment_date,
                "appointmentTime": appointment_time,
                "doctorId": doctor_id,
                "doctorName": doctor.get("name", "Doctor"),
                "symptomId": symptom_id,
                "feePkr": fee_pkr,
            },
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        try:
            payment_id = create_payment(payment_doc)
        except Exception as e:
            _release_hold()
            return jsonify({"error": f"Failed to save payment: {str(e)}"}), 500

        attach_payment_to_lock(
            doctor_id,
            appointment_date,
            appointment_time,
            payment_id,
            "stripe",
        )

        return jsonify({
            "payment_method": "stripe",
            "clientSecret": stripe_intent.client_secret,
            "paymentId": str(payment_id),
            "amount": amount,
            "currency": currency,
            "fee_pkr": fee_pkr,
            "message": "Payment intent created successfully"
        }), 200

    except Exception as e:
        _release_hold()
        return jsonify({"error": f"Stripe payment error: {str(e)}"}), 500


def _handle_easypaisa_payment(
    user_id,
    doctor_id,
    appointment_id,
    appointment_date,
    appointment_time,
    amount,
    currency,
    fee_pkr,
    doctor,
    symptom_id,
):
    """Handle Easypaisa manual payment method."""

    def _release_hold():
        release_slot_lock(doctor_id, appointment_date, appointment_time)

    try:
        receiver_number = current_app.config.get("EASYPAISA_RECEIVER_NUMBER")

        # Create payment record with pending status (NOT auto-confirmed)
        payment_doc = {
            "userId": user_id,
            "doctorId": doctor_id,
            "appointmentId": appointment_id,
            "appointmentTrackingId": appointment_id,
            "payment_method": "easypaisa",
            "amount": amount,
            "currency": currency,
            "status": "pending",  # Waiting for user to send payment
            "amount_verified_at": datetime.utcnow(),
            "doctor_consultation_price": fee_pkr,
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
            _release_hold()
            return jsonify({"error": f"Failed to create payment record: {str(e)}"}), 500

        attach_payment_to_lock(
            doctor_id,
            appointment_date,
            appointment_time,
            payment_id,
            "easypaisa",
        )

        return jsonify({
            "payment_method": "easypaisa",
            "receiver_number": receiver_number,
            "amount": amount,
            "currency": currency,
            "fee_pkr": fee_pkr,
            "paymentId": str(payment_id),
            "status": "pending",
            "instructions": (
                f"Send payment to Easypaisa number: {receiver_number}\n"
                f"Amount: PKR {int(fee_pkr) if fee_pkr == int(fee_pkr) else fee_pkr}\n"
                f"After payment, submit your transaction proof using your Payment ID: {str(payment_id)}\n"
                f"Our admin team will verify and confirm your booking."
            )
        }), 200

    except Exception as e:
        _release_hold()
        return jsonify({"error": f"Easypaisa payment error: {str(e)}"}), 500


def submit_proof_handler():
    """
    Submit payment proof for Easypaisa payments.

    JSON: { payment_id, proof_type, proof }
    Multipart: payment_id, proof_type, proof_image (file)
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()

        if claims.get("role") != "patient":
            return jsonify({"error": "Only patients can submit proofs"}), 403

        payment_id, proof_type, proof, upload_file = _parse_submit_proof_payload()

        if not payment_id:
            return jsonify({"error": "Missing required field: payment_id"}), 400

        if proof_type not in ["screenshot", "transaction_id"]:
            return jsonify({
                "error": "Invalid proof_type. Must be 'screenshot' or 'transaction_id'"
            }), 400

        if proof_type == "screenshot":
            if upload_file:
                file_error = _validate_payment_proof_file(upload_file)
                if file_error:
                    return jsonify({"error": file_error}), 400
            elif not proof:
                return jsonify({
                    "error": "Missing screenshot. Upload an image or use multipart proof_image."
                }), 400
        elif not proof:
            return jsonify({
                "error": "Missing required field: proof (transaction ID)"
            }), 400

        try:
            payment_id_obj = ObjectId(payment_id)
            payment = find_payment_by_id(payment_id_obj)
        except Exception:
            return jsonify({"error": "Invalid payment ID"}), 400

        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        if str(payment.get("userId")) != str(user_id):
            return jsonify({"error": "You can only submit proof for your own payments"}), 403

        if payment.get("payment_method") != "easypaisa":
            return jsonify({"error": "Proof can only be submitted for Easypaisa payments"}), 400

        if payment.get("status") != "pending":
            return jsonify({
                "error": f"Cannot submit proof for payment with status: {payment.get('status')}"
            }), 400

        if proof_type == "screenshot" and upload_file:
            try:
                uploaded = upload_payment_proof_to_cloudinary(upload_file, payment_id)
                proof = uploaded["url"]
            except Exception as e:
                current_app.logger.error(f"Payment proof upload failed: {e}")
                return jsonify({
                    "error": "Failed to upload screenshot. Please try again or contact support."
                }), 500

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
        current_app.logger.exception("submit_proof_handler failed")
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

        booked_id, book_err = create_appointment_from_payment(payment)
        if book_err:
            return jsonify({
                "error": (
                    f"Cannot confirm payment: {book_err}. "
                    "The slot may have been taken. Reject this payment or ask the patient to pick another slot."
                )
            }), 409

        try:
            update_payment_to_paid(payment_id_obj, admin_notes)
        except Exception as e:
            return jsonify({"error": f"Failed to confirm payment: {str(e)}"}), 500

        appointment_id = booked_id
        if booked_id:
            try:
                mongo.db.payments.update_one(
                    {"_id": payment_id_obj},
                    {"$set": {"appointmentRecordId": ObjectId(booked_id)}},
                )
            except Exception as e:
                current_app.logger.error(f"Failed to link appointment to payment: {str(e)}")

        return jsonify({
            "message": "Payment confirmed successfully. Booking is now active.",
            "payment_id": payment_id,
            "appointment_id": appointment_id,
            "status": "paid"
        }), 200

    except Exception as e:
        return jsonify({"error": f"Internal error: {str(e)}"}), 500


def admin_reject_payment_handler():
    """Admin rejects an Easypaisa payment under review."""
    try:
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Only admins can reject payments"}), 403

        data = request.json or {}
        payment_id = data.get("payment_id")
        admin_notes = data.get("admin_notes")

        if not payment_id:
            return jsonify({"error": "Missing required field: payment_id"}), 400

        try:
            payment_id_obj = ObjectId(payment_id)
            payment = find_payment_by_id(payment_id_obj)
        except Exception:
            return jsonify({"error": "Invalid payment ID"}), 400

        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        if payment.get("status") != "pending_review":
            return jsonify({
                "error": (
                    f"Only payments in 'pending_review' can be rejected. "
                    f"Current status: {payment.get('status')}"
                )
            }), 400

        if payment.get("payment_method") != "easypaisa":
            return jsonify({"error": "Only Easypaisa payments can be rejected here"}), 400

        try:
            update_payment_to_rejected(payment_id_obj, admin_notes)
        except Exception as e:
            return jsonify({"error": f"Failed to reject payment: {str(e)}"}), 500

        release_slot_lock_for_payment(payment)

        return jsonify({
            "message": "Payment rejected. No appointment was created.",
            "payment_id": payment_id,
            "status": "rejected",
        }), 200

    except Exception as e:
        return jsonify({"error": f"Internal error: {str(e)}"}), 500


def _enrich_pending_payment(payment):
    """Add display fields for admin UI."""
    from app.extensions import mongo
    from bson.objectid import ObjectId

    meta = payment.get("metadata") or {}
    payment["doctor_name"] = meta.get("doctorName") or payment.get("doctor_name")
    payment["appointment_date"] = meta.get("appointmentDate") or payment.get("appointment_date")
    payment["appointment_time"] = meta.get("appointmentTime") or payment.get("appointment_time")
    payment["fee_pkr"] = (
        meta.get("feePkr")
        or payment.get("doctor_consultation_price")
        or payment.get("fee_pkr")
    )

    user_id = payment.get("userId")
    if user_id:
        try:
            user = mongo.db.users.find_one(
                {"_id": ObjectId(str(user_id))},
                {"name": 1, "email": 1},
            )
            if user:
                payment["patient_name"] = user.get("name")
                payment["patient_email"] = user.get("email")
        except Exception:
            pass

    return payment


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

            booked_id, book_err = create_appointment_from_payment(payment)
            if booked_id:
                update_payment_status(
                    payment_id,
                    "paid",
                    {"appointmentRecordId": ObjectId(booked_id)},
                )
            elif book_err:
                print(f"Failed to create appointment after payment: {book_err}")

        # Handle payment_intent.payment_failed
        elif event_type == "payment_intent.payment_failed":
            failure_message = payment_intent.get("last_payment_error", {}).get("message", "Payment declined")

            try:
                update_payment_status(
                    payment_id,
                    "failed",
                    {"failureReason": failure_message}
                )
                release_slot_lock_for_payment(payment)
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
            record_id = payment.get("appointmentRecordId") or payment.get("appointmentId")
            if record_id:
                try:
                    if ObjectId.is_valid(str(record_id)):
                        appointment = mongo.db.appointments.find_one(
                            {"_id": ObjectId(record_id)}
                        )
                        if appointment:
                            payment["appointmentDate"] = appointment.get("appointmentDate")
                            payment["appointmentTime"] = appointment.get("appointmentTime")
                            payment["appointmentStatus"] = appointment.get("status")
                except Exception:
                    pass
            elif payment.get("metadata"):
                payment["appointmentDate"] = payment["metadata"].get("appointmentDate")
                payment["appointmentTime"] = payment["metadata"].get("appointmentTime")

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
        if payment.get("appointmentRecordId") or (
            payment.get("appointmentId") and ObjectId.is_valid(str(payment["appointmentId"]))
        ):
            try:
                record_id = payment.get("appointmentRecordId") or payment["appointmentId"]
                mongo.db.appointments.update_one(
                    {"_id": ObjectId(record_id)},
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

        release_slot_lock_for_payment(payment)

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
        payments = [_enrich_pending_payment(p) for p in payments]

        return jsonify({
            "total": len(payments),
            "payments": payments
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve pending payments: {str(e)}"}), 500


def get_admin_approved_payments_handler():
    """Admin endpoint: history of Easypaisa payments approved by admin."""
    try:
        from app.models.payment_model import get_admin_approved_payments

        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Only admins can view approved payments"}), 403

        payments = get_admin_approved_payments()
        payments = [_enrich_pending_payment(p) for p in payments]

        return jsonify({
            "total": len(payments),
            "payments": payments,
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve approved payments: {str(e)}"}), 500


def _serialize_refund_request(doc):
    if not doc:
        return doc
    out = dict(doc)
    out["_id"] = str(out["_id"])
    for key in ("requestedAt", "processedAt", "updatedAt"):
        val = out.get(key)
        if val is not None and hasattr(val, "isoformat"):
            out[key] = val.isoformat()
    return out


def get_my_refund_requests_handler():
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        if claims.get("role") != "patient":
            return jsonify({"error": "Only patients can view refund requests"}), 403

        from app.models.refund_request_model import get_patient_refund_requests

        rows = get_patient_refund_requests(user_id)
        return jsonify([_serialize_refund_request(row) for row in rows]), 200
    except Exception as e:
        return jsonify({"error": f"Failed to load refund requests: {str(e)}"}), 500


def get_pending_refunds_for_admin_handler():
    try:
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Only admins can view refund requests"}), 403

        from app.models.refund_request_model import get_pending_refund_requests

        rows = get_pending_refund_requests()
        enriched = []
        for row in rows:
            item = _serialize_refund_request(row)
            patient = find_user_by_id(item.get("patientId"))
            if patient:
                item["patientName"] = patient.get("name") or patient.get("email")
            enriched.append(item)
        return jsonify({"total": len(enriched), "refunds": enriched}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to load refund requests: {str(e)}"}), 500


def admin_approve_refund_handler():
    try:
        admin_id = get_jwt_identity()
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Only admins can approve refunds"}), 403

        refund_id = (request.form.get("refund_id") or "").strip()
        admin_notes = (request.form.get("admin_notes") or "").strip() or None
        proof_file = request.files.get("refund_proof") if request.files else None

        if not refund_id:
            data = request.get_json(silent=True) or {}
            refund_id = (data.get("refund_id") or "").strip()
            admin_notes = (data.get("admin_notes") or "").strip() or None

        if not refund_id:
            return jsonify({"error": "refund_id is required"}), 400

        file_error = _validate_payment_proof_file(proof_file)
        if file_error:
            return jsonify({"error": file_error}), 400

        from app.models.refund_request_model import (
            approve_refund_request,
            find_refund_request_by_id,
        )

        refund = find_refund_request_by_id(refund_id)
        if not refund:
            return jsonify({"error": "Refund request not found"}), 404
        if refund.get("status") != "pending":
            return jsonify({"error": "Only pending refund requests can be approved"}), 400

        upload = upload_refund_proof_to_cloudinary(proof_file, refund_id)
        approve_refund_request(refund_id, admin_id, upload["url"], admin_notes)

        payment_id = refund.get("paymentId")
        if payment_id:
            try:
                update_payment_status(
                    ObjectId(payment_id),
                    "refunded",
                    {
                        "refundProofUrl": upload["url"],
                        "refundedAt": datetime.utcnow(),
                        "adminNotes": admin_notes,
                    },
                )
            except Exception:
                pass

        return jsonify({
            "message": "Refund approved and proof uploaded",
            "refundRequestId": refund_id,
            "refundProofUrl": upload["url"],
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to approve refund: {str(e)}"}), 500


def admin_reject_refund_handler():
    try:
        admin_id = get_jwt_identity()
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Only admins can reject refunds"}), 403

        data = request.json or {}
        refund_id = (data.get("refund_id") or "").strip()
        admin_notes = (data.get("admin_notes") or "").strip() or None

        if not refund_id:
            return jsonify({"error": "refund_id is required"}), 400

        from app.models.refund_request_model import (
            find_refund_request_by_id,
            reject_refund_request,
        )

        refund = find_refund_request_by_id(refund_id)
        if not refund:
            return jsonify({"error": "Refund request not found"}), 404
        if refund.get("status") != "pending":
            return jsonify({"error": "Only pending refund requests can be rejected"}), 400

        reject_refund_request(refund_id, admin_id, admin_notes)

        return jsonify({"message": "Refund request rejected", "refundRequestId": refund_id}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to reject refund: {str(e)}"}), 500

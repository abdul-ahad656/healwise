import cloudinary
import cloudinary.uploader
from flask import current_app
import os
from datetime import datetime

def init_cloudinary():
    if not current_app.config.get('CLOUDINARY_CLOUD_NAME'):
        raise ValueError("Cloudinary credentials not configured")

    cloudinary.config(
        cloud_name=current_app.config['CLOUDINARY_CLOUD_NAME'],
        api_key=current_app.config['CLOUDINARY_API_KEY'],
        api_secret=current_app.config['CLOUDINARY_API_SECRET']
    )

def upload_prescription_to_cloudinary(file_obj, appointment_id):
    try:
        init_cloudinary()

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        public_id = f"prescriptions/{appointment_id}_{timestamp}"

        resource_type = "image"
        file_obj.seek(0)
        filename = file_obj.filename.lower()
        if filename.endswith('.pdf'):
            resource_type = "raw"

        response = cloudinary.uploader.upload(
            file_obj,
            public_id=public_id,
            resource_type=resource_type,
            overwrite=False,
            folder="healwise/prescriptions"
        )

        return {
            "url": response.get("secure_url") or response.get("url"),
            "public_id": response.get("public_id"),
            "resource_type": response.get("resource_type"),
            "format": response.get("format")
        }
    except Exception as e:
        raise Exception(f"Failed to upload prescription to Cloudinary: {str(e)}")

def upload_payment_proof_to_cloudinary(file_obj, payment_id):
    """Upload Easypaisa payment screenshot proof."""
    try:
        init_cloudinary()

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        public_id = f"payment_proofs/{payment_id}_{timestamp}"

        file_obj.seek(0)
        response = cloudinary.uploader.upload(
            file_obj,
            public_id=public_id,
            resource_type="image",
            overwrite=False,
            folder="healwise/payment_proofs",
        )

        return {
            "url": response.get("secure_url") or response.get("url"),
            "public_id": response.get("public_id"),
        }
    except Exception as e:
        raise Exception(f"Failed to upload payment proof to Cloudinary: {str(e)}")


def upload_refund_proof_to_cloudinary(file_obj, refund_request_id):
    """Upload admin refund transfer screenshot proof."""
    try:
        init_cloudinary()

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        public_id = f"refund_proofs/{refund_request_id}_{timestamp}"

        file_obj.seek(0)
        response = cloudinary.uploader.upload(
            file_obj,
            public_id=public_id,
            resource_type="image",
            overwrite=False,
            folder="healwise/refund_proofs",
        )

        return {
            "url": response.get("secure_url") or response.get("url"),
            "public_id": response.get("public_id"),
        }
    except Exception as e:
        raise Exception(f"Failed to upload refund proof to Cloudinary: {str(e)}")


def delete_prescription_from_cloudinary(public_id):
    try:
        init_cloudinary()
        cloudinary.uploader.destroy(public_id)
        return True
    except Exception as e:
        raise Exception(f"Failed to delete prescription from Cloudinary: {str(e)}")

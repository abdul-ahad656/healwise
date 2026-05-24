from flask import request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity, get_jwt
from app.extensions import mongo
from bson.objectid import ObjectId
from datetime import datetime
from app.services.cloudinary_service import upload_prescription_to_cloudinary, delete_prescription_from_cloudinary
from app.models.user_model import find_user_by_id
import os

def upload_prescription(appointment_id):
    doctor_id = get_jwt_identity()
    claims = get_jwt()

    if claims.get("role") != "doctor":
        return jsonify({"error": "Only doctors can upload prescriptions"}), 403

    try:
        appointment_id_obj = ObjectId(appointment_id)
    except:
        return jsonify({"error": "Invalid appointment ID"}), 400

    appointment = mongo.db.appointments.find_one({"_id": appointment_id_obj})

    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    if str(appointment.get("doctorId")) != str(doctor_id):
        return jsonify({"error": "You can only upload prescriptions for your own appointments"}), 403

    uploadable_statuses = {"accepted", "confirmed", "in_progress", "completed"}
    if appointment.get("status") not in uploadable_statuses:
        return jsonify({
            "error": "Can only upload prescriptions after the consultation has started or finished"
        }), 400

    existing = mongo.db.prescriptions.find_one({"appointmentId": appointment_id})
    if existing:
        return jsonify({"error": "A prescription already exists for this appointment"}), 409

    if "prescription" not in request.files:
        return jsonify({"error": "No prescription file provided"}), 400

    file = request.files["prescription"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    file_ext = os.path.splitext(file.filename)[1].lower().lstrip('.')
    if file_ext not in current_app.config.get('ALLOWED_PRESCRIPTION_EXTENSIONS', {'pdf', 'jpg', 'jpeg', 'png'}):
        return jsonify({"error": f"Invalid file type. Allowed: {', '.join(current_app.config.get('ALLOWED_PRESCRIPTION_EXTENSIONS', {'pdf', 'jpg', 'jpeg', 'png'}))}"}), 400

    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    if file_size > current_app.config.get('MAX_PRESCRIPTION_FILE_SIZE', 10 * 1024 * 1024):
        return jsonify({"error": f"File too large. Maximum size: {current_app.config.get('MAX_PRESCRIPTION_FILE_SIZE') // (1024*1024)}MB"}), 413

    try:
        cloudinary_response = upload_prescription_to_cloudinary(file, appointment_id)

        notes = request.form.get("notes", "")

        prescription_doc = {
            "appointmentId": appointment_id,
            "doctorId": doctor_id,
            "patientId": appointment.get("patientId"),
            "cloudinaryUrl": cloudinary_response["url"],
            "cloudinaryPublicId": cloudinary_response["public_id"],
            "fileType": file_ext,
            "notes": notes,
            "uploadedAt": datetime.utcnow()
        }

        result = mongo.db.prescriptions.insert_one(prescription_doc)

        prescription_doc["_id"] = str(result.inserted_id)
        prescription_doc["appointmentId"] = str(prescription_doc["appointmentId"])

        return jsonify({
            "message": "Prescription uploaded successfully",
            "prescription": prescription_doc
        }), 201

    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

def get_prescription(appointment_id):
    user_id = get_jwt_identity()
    claims = get_jwt()

    try:
        appointment_id_obj = ObjectId(appointment_id)
    except:
        return jsonify({"error": "Invalid appointment ID"}), 400

    appointment = mongo.db.appointments.find_one({"_id": appointment_id_obj})

    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    is_doctor = claims.get("role") == "doctor" and appointment.get("doctorId") == user_id
    is_patient = claims.get("role") == "patient" and appointment.get("patientId") == user_id

    if not (is_doctor or is_patient):
        return jsonify({"error": "You don't have access to this appointment's prescription"}), 403

    prescription = mongo.db.prescriptions.find_one({"appointmentId": appointment_id})

    if not prescription:
        return jsonify({"error": "No prescription found for this appointment"}), 404

    prescription["_id"] = str(prescription["_id"])
    prescription["appointmentId"] = str(prescription["appointmentId"])

    doctor = find_user_by_id(prescription.get("doctorId"))
    if doctor:
        prescription["doctorName"] = doctor.get("name") or doctor.get("email")
        prescription["doctorSpecialization"] = doctor.get("specialization", "")

    return jsonify(prescription), 200

def get_patient_prescriptions():
    patient_id = get_jwt_identity()
    claims = get_jwt()

    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can view their prescriptions"}), 403

    prescriptions = list(mongo.db.prescriptions.find({"patientId": patient_id}))

    for p in prescriptions:
        p["_id"] = str(p["_id"])
        p["appointmentId"] = str(p["appointmentId"])

        doctor = find_user_by_id(p.get("doctorId"))
        if doctor:
            p["doctorName"] = doctor.get("name") or doctor.get("email")
            p["doctorSpecialization"] = doctor.get("specialization", "")

        appointment = mongo.db.appointments.find_one({"_id": ObjectId(p["appointmentId"])})
        if appointment:
            p["appointmentDate"] = appointment.get("appointmentDate")
            p["appointmentTime"] = appointment.get("appointmentTime")

    return jsonify(prescriptions), 200

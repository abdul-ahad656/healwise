from flask import Blueprint
from app.controllers.auth_controller import register, login, set_language, reset_password_handler
from app.controllers.otp_controller import send_otp_handler, verify_otp_handler

auth_bp = Blueprint("auth_bp", __name__)

auth_bp.post("/register")(register)
auth_bp.post("/login")(login)
auth_bp.post("/reset-password")(reset_password_handler)
auth_bp.put("/language")(set_language)
auth_bp.post("/send-otp")(send_otp_handler)
auth_bp.post("/verify-otp")(verify_otp_handler)

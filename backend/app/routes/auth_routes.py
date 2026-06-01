from flask import Blueprint

from app.controllers.auth_controller import (
    register,
    login,
    set_language,
    reset_password_handler,
)
from app.controllers.otp_controller import send_otp_handler, verify_otp_handler
from app.security.limiter import (
    limiter,
    LOGIN_LIMIT,
    REGISTER_LIMIT,
    RESET_PASSWORD_LIMIT,
    OTP_LIMIT,
)

auth_bp = Blueprint("auth_bp", __name__)

auth_bp.post("/register")(limiter.limit(REGISTER_LIMIT)(register))
auth_bp.post("/login")(limiter.limit(LOGIN_LIMIT)(login))
auth_bp.post("/reset-password")(limiter.limit(RESET_PASSWORD_LIMIT)(reset_password_handler))
auth_bp.put("/language")(limiter.limit("30 per minute")(set_language))
auth_bp.post("/send-otp")(limiter.limit(OTP_LIMIT)(send_otp_handler))
auth_bp.post("/verify-otp")(limiter.limit(OTP_LIMIT)(verify_otp_handler))

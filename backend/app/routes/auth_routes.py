from flask import Blueprint
from app.controllers.auth_controller import register, login, set_language

auth_bp = Blueprint("auth_bp", __name__)

auth_bp.post("/register")(register)
auth_bp.post("/login")(login)
auth_bp.put("/language")(set_language)

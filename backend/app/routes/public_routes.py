from flask import Blueprint
from app.controllers.public_controller import list_doctors

public_bp = Blueprint("public_bp", __name__)

@public_bp.get("/doctors")
def doctors():
    return list_doctors()

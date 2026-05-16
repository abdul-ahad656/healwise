from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.health_tips_controller import (
    add_tip,
    get_tips,
    list_categories,
    deactivate_tip,
    update_tip,
    delete_tip,
)
from app.utils.role_guard import admin_required

health_tips_bp = Blueprint("health_tips_bp", __name__)

# Admin → Add health tip
@health_tips_bp.post("/")
@jwt_required()
def create_tip():
    if not admin_required():
        return {"error": "Admin only"}, 403
    return add_tip()

@health_tips_bp.get("/categories")
@jwt_required()
def view_categories():
    return list_categories()


@health_tips_bp.get("/")
@jwt_required()
def view_tips():
    return get_tips()

# Admin → Deactivate tip
@health_tips_bp.put("/<tip_id>/deactivate")
@jwt_required()
def disable_tip(tip_id):
    if not admin_required():
        return {"error": "Admin only"}, 403
    return deactivate_tip(tip_id)


@health_tips_bp.put("/<tip_id>")
@jwt_required()
def update_tip_route(tip_id):
    if not admin_required():
        return {"error": "Admin only"}, 403
    return update_tip(tip_id)


@health_tips_bp.delete("/<tip_id>")
@jwt_required()
def delete_tip_route(tip_id):
    if not admin_required():
        return {"error": "Admin only"}, 403
    return delete_tip(tip_id)

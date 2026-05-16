from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.medicine_type_controller import MedicineTypeController
from app.utils.role_guard import admin_required

medicine_type_bp = Blueprint("medicine_type_bp", __name__)

medicine_type_bp.route(
    "/type-awareness/<string:medicine_type>",
    methods=["GET"],
)(MedicineTypeController.awareness)

@medicine_type_bp.get("/types")
def list_medicine_types():
    """Public: all medicine types currently stored (for patient dropdown)."""
    return MedicineTypeController.list_types()

@medicine_type_bp.post("/type-awareness")
@jwt_required()
def create_or_update_awareness():
    if not admin_required():
        return {"error": "Admin only"}, 403
    return MedicineTypeController.create_awareness()

@medicine_type_bp.get("/type-awareness")
@jwt_required()
def list_awareness():
    if not admin_required():
        return {"error": "Admin only"}, 403
    return MedicineTypeController.list_awareness()

@medicine_type_bp.delete("/type-awareness/<string:medicine_type>")
@jwt_required()
def delete_awareness(medicine_type):
    if not admin_required():
        return {"error": "Admin only"}, 403
    return MedicineTypeController.delete_awareness(medicine_type)

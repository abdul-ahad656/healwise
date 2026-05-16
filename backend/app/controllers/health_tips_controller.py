from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.models.health_tip_model import HealthTipModel
from app.utils.translate_utils import translate_to_urdu

def add_tip():
    data = request.json
    admin_id = get_jwt_identity()

    # Allow tip_type or type
    tip_type = data.get("tip_type") or data.get("type")

    if not all([data.get("title"), data.get("description"), tip_type, data.get("language")]):
        return {"error": "Missing required fields"}, 400

    if tip_type == "disease" and not data.get("disease"):
        return {"error": "Disease is required for disease-specific tips"}, 400

    HealthTipModel.create_tip(
        title=data["title"],
        description=data["description"],
        tip_type=tip_type,
        language=data["language"],
        created_by=admin_id,
        disease=data.get("disease"),
        image=data.get("image"),
        video=data.get("video")
    )

    return jsonify({"message": "Health tip added"}), 201


def get_tips():
    disease = request.args.get("disease")
    tip_type = request.args.get("type")
    language = request.args.get("language", "en")
    lang_pref = request.args.get("lang")

    if lang_pref == "ur":
        base_tips = HealthTipModel.get_active_tips("en", disease, tip_type)

        for tip in base_tips:
            tip["title"] = translate_to_urdu(tip.get("title", ""))
            tip["description"] = translate_to_urdu(tip.get("description", ""))
            tip["language"] = "ur"

        return jsonify(base_tips), 200

    tips = HealthTipModel.get_active_tips(language, disease, tip_type)

    return jsonify(tips), 200


def list_categories():
    language = request.args.get("language", "en")
    categories = HealthTipModel.get_category_filters(language)
    return jsonify({"categories": categories}), 200


def deactivate_tip(tip_id):
    result = HealthTipModel.deactivate_tip(tip_id)
    
    if result.modified_count == 0:
        return jsonify({"error": "Tip not found or already deactivated"}), 404

    return jsonify({"message": "Health tip deactivated"}), 200


def update_tip(tip_id):
    data = request.json or {}

    tip = HealthTipModel.get_tip_by_id(tip_id)
    if not tip:
        return jsonify({"error": "Tip not found"}), 404

    if data.get("type") == "disease" and not data.get("disease"):
        return jsonify({"error": "Disease is required for disease-specific tips"}), 400

    result = HealthTipModel.update_tip(tip_id, data)
    if result is None:
        return jsonify({"error": "No fields to update"}), 400

    tip = HealthTipModel.get_tip_by_id(tip_id)
    return jsonify(tip), 200


def delete_tip(tip_id):
    result = HealthTipModel.delete_tip(tip_id)

    if result.deleted_count == 0:
        return jsonify({"error": "Tip not found"}), 404

    return jsonify({"message": "Health tip deleted"}), 200

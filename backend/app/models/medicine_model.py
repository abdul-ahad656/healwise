# app/models/medicine_model.py

import re

from app.extensions import mongo
from app.utils.medicine_strength import normalize_strength, strengths_match


class MedicineModel:

    @staticmethod
    def get_by_name(name):
        return mongo.db.medicines.find_one({
            "name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}
        })

    @staticmethod
    def get_by_name_and_strength(name: str, strength: str):
        """Find one medicine matching brand name and potency."""
        pattern = {"$regex": f"^{re.escape(name.strip())}$", "$options": "i"}
        candidates = mongo.db.medicines.find({"name": pattern})
        for med in candidates:
            if strengths_match(med.get("strength"), strength):
                return med
        return None

    @staticmethod
    def get_by_salt(salt):
        return list(mongo.db.medicines.find({
            "salt": {"$regex": f"^{re.escape(salt)}$", "$options": "i"}
        }))

    @staticmethod
    def get_by_salt_and_strength(salt: str, strength: str):
        """Alternatives: same salt and same potency only."""
        salt_pattern = {"$regex": f"^{re.escape(salt.strip())}$", "$options": "i"}
        candidates = mongo.db.medicines.find({"salt": salt_pattern})
        return [
            med
            for med in candidates
            if strengths_match(med.get("strength"), strength)
        ]

# app/models/medicine_model.py

import re

from app.extensions import mongo
from app.utils.medicine_strength import normalize_strength, strengths_match


def ensure_medicine_indexes() -> None:
    """Indexes for name/potency autocomplete and lookups."""
    if mongo.db is None:
        return
    col = mongo.db.medicines
    col.create_index([("name", 1)], name="medicines_name")
    col.create_index([("medicineName", 1)], name="medicines_medicineName")
    col.create_index([("name", 1), ("strength", 1)], name="medicines_name_strength")
    col.create_index(
        [("medicineName", 1), ("potency", 1)],
        name="medicines_medicineName_potency",
    )


def _exact_name_filter(name: str) -> dict:
    pattern = {"$regex": f"^{re.escape(name.strip())}$", "$options": "i"}
    return {"$or": [{"name": pattern}, {"medicineName": pattern}]}


def _prefix_name_filter(query: str) -> dict:
    pattern = {"$regex": f"^{re.escape(query.strip())}", "$options": "i"}
    return {"$or": [{"name": pattern}, {"medicineName": pattern}]}


class MedicineModel:

    @staticmethod
    def get_by_name(name):
        return mongo.db.medicines.find_one(_exact_name_filter(name))

    @staticmethod
    def get_by_name_and_strength(name: str, strength: str):
        """Find one medicine matching brand name and potency."""
        pattern = {"$regex": f"^{re.escape(name.strip())}$", "$options": "i"}
        candidates = mongo.db.medicines.find({
            "$or": [{"name": pattern}, {"medicineName": pattern}]
        })
        for med in candidates:
            potency = med.get("potency") or med.get("strength")
            if strengths_match(potency, strength):
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
            if strengths_match(
                med.get("potency") or med.get("strength"),
                strength,
            )
        ]

    @staticmethod
    def search_name_suggestions(query: str, limit: int = 10) -> list:
        """Distinct medicine names matching case-insensitive prefix."""
        q = (query or "").strip()
        if len(q) < 2:
            return []

        pipeline = [
            {"$match": _prefix_name_filter(q)},
            {
                "$addFields": {
                    "displayName": {
                        "$ifNull": ["$medicineName", "$name"]
                    }
                }
            },
            {"$match": {"displayName": {"$type": "string", "$ne": ""}}},
            {
                "$group": {
                    "_id": {"$toLower": {"$trim": {"input": "$displayName"}}},
                    "name": {"$first": "$displayName"},
                    "docId": {"$first": "$_id"},
                }
            },
            {"$sort": {"name": 1}},
            {"$limit": limit},
        ]

        rows = list(mongo.db.medicines.aggregate(pipeline))
        return [
            {"id": str(row["docId"]), "name": row["name"]}
            for row in rows
            if row.get("name")
        ]

    @staticmethod
    def get_potencies_for_name(name: str) -> dict:
        """Distinct potency/strength values for an exact medicine name."""
        trimmed = (name or "").strip()
        if not trimmed:
            return {"medicine": "", "potencies": []}

        pipeline = [
            {"$match": _exact_name_filter(trimmed)},
            {
                "$project": {
                    "displayName": {"$ifNull": ["$medicineName", "$name"]},
                    "potencyValue": {"$ifNull": ["$potency", "$strength"]},
                }
            },
            {
                "$match": {
                    "potencyValue": {
                        "$exists": True,
                        "$nin": [None, ""],
                    }
                }
            },
            {
                "$group": {
                    "_id": {"$toLower": {"$trim": {"input": "$potencyValue"}}},
                    "potency": {"$first": "$potencyValue"},
                    "medicine": {"$first": "$displayName"},
                }
            },
            {"$sort": {"potency": 1}},
        ]

        rows = list(mongo.db.medicines.aggregate(pipeline))
        if not rows:
            return {"medicine": trimmed, "potencies": []}

        canonical_name = rows[0].get("medicine") or trimmed
        potencies = sorted(
            {str(row["potency"]).strip() for row in rows if row.get("potency")},
            key=lambda v: normalize_strength(v),
        )
        return {"medicine": canonical_name, "potencies": potencies}

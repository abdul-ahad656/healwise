"""Decorators for JSON validation and Mongo operator rejection."""

from functools import wraps

from flask import jsonify, request
from marshmallow import Schema, ValidationError

from app.security.mongo_sanitize import reject_mongo_operators_in_json
from app.security.schemas import format_validation_errors


def validate_json(schema: Schema):
    """Parse JSON body with Marshmallow; block MongoDB operator injection."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({"error": "Content-Type must be application/json"}), 400

            raw = request.get_json(silent=True)
            if raw is None:
                return jsonify({"error": "Invalid JSON body"}), 400

            if not reject_mongo_operators_in_json(raw):
                return jsonify({"error": "Invalid request payload"}), 400

            try:
                data = schema.load(raw)
            except ValidationError as err:
                return jsonify(format_validation_errors(err)), 400

            return fn(data, *args, **kwargs)

        return wrapper

    return decorator

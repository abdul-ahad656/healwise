"""Centralized error handlers — never leak internals to clients."""

import logging

from flask import jsonify
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException

logger = logging.getLogger("healwise.errors")


def register_error_handlers(app) -> None:
    @app.errorhandler(ValidationError)
    def handle_marshmallow_validation(err: ValidationError):
        from app.security.schemas import format_validation_errors

        return jsonify(format_validation_errors(err)), 400

    @app.errorhandler(400)
    def handle_bad_request(err):
        if isinstance(err, HTTPException) and err.description:
            return jsonify({"error": err.description}), 400
        return jsonify({"error": "Bad request"}), 400

    @app.errorhandler(404)
    def handle_not_found(err):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(err):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(HTTPException)
    def handle_http_exception(err: HTTPException):
        return jsonify({"error": err.description or "Request failed"}), err.code

    @app.errorhandler(Exception)
    def handle_unexpected(err: Exception):
        # Full detail only in server logs
        logger.exception("unhandled_exception: %s", type(err).__name__)
        if app.config.get("DEBUG"):
            return jsonify({"error": "Internal server error", "detail": str(err)}), 500
        return jsonify({"error": "Internal server error"}), 500

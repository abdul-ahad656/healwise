"""Marshmallow request validation for authentication endpoints."""

from marshmallow import (
    Schema,
    ValidationError,
    fields,
    pre_load,
    validate,
    validates_schema,
)

from app.utils.password_validator import validate_password_strength


class _StripUnknownMixin:
    """Drop unexpected fields to reduce attack surface."""

    class Meta:
        unknown = "EXCLUDE"


class LoginSchema(_StripUnknownMixin, Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=1, max=256))


class RegisterSchema(_StripUnknownMixin, Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=120))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8, max=256))
    language = fields.String(load_default="en", validate=validate.OneOf(["en", "ur"]))
    role = fields.String(load_default="patient", validate=validate.OneOf(["patient"]))
    verification_token = fields.String(required=True, validate=validate.Length(min=10, max=4096))

    @validates_schema
    def validate_password_strength(self, data, **kwargs):
        is_valid, message = validate_password_strength(data.get("password"))
        if not is_valid:
            raise ValidationError(message, "password")


class ResetPasswordSchema(_StripUnknownMixin, Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8, max=256))
    verification_token = fields.String(required=True, validate=validate.Length(min=10, max=4096))

    @validates_schema
    def validate_password_strength(self, data, **kwargs):
        is_valid, message = validate_password_strength(data.get("password"))
        if not is_valid:
            raise ValidationError(message, "password")


class SendOtpSchema(_StripUnknownMixin, Schema):
    email = fields.Email(required=True)
    purpose = fields.String(
        load_default="register",
        validate=validate.OneOf(["register", "reset_password"]),
    )


class VerifyOtpSchema(_StripUnknownMixin, Schema):
    email = fields.Email(required=True)
    otp = fields.String(required=True, validate=validate.Regexp(r"^\d{6}$", error="OTP must be 6 digits"))


class LanguageSchema(_StripUnknownMixin, Schema):
    language = fields.String(required=True, validate=validate.OneOf(["en", "ur"]))

    @pre_load
    def normalize(self, data, **kwargs):
        if isinstance(data, dict) and "language" in data and isinstance(data["language"], str):
            data = dict(data)
            data["language"] = data["language"].strip().lower()
        return data


def format_validation_errors(err: ValidationError) -> dict:
    """Flat, client-friendly validation errors."""
    if isinstance(err.messages, dict):
        return {"error": "Validation failed", "fields": err.messages}
    return {"error": "Validation failed", "fields": err.messages}


def normalize_email_in_data(data: dict) -> dict:
    """Lowercase email after schema load."""
    if data.get("email"):
        data["email"] = str(data["email"]).strip().lower()
    return data

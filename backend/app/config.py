import os
import sys
from datetime import timedelta

from dotenv import load_dotenv

# Load .env from backend root (parent of app/)
_BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(_BACKEND_ROOT, ".env"))


class Config:
    """Application configuration loaded from environment variables."""

    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    FLASK_ENV = os.getenv("FLASK_ENV", "production")
    IS_PRODUCTION = FLASK_ENV == "production"
    DEBUG = os.getenv("FLASK_DEBUG", "").lower() in ("1", "true", "yes") or (
        FLASK_ENV == "development"
    )

    # JWT — short-lived access tokens
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    MONGO_URI = os.getenv("MONGO_URI")

    # Hugging Face Gradio Space
    HF_SPACE_URL = os.getenv("HF_SPACE_URL", "").strip()
    HF_API_NAME = os.getenv("HF_API_NAME", "/predict")
    HF_PREDICT_TIMEOUT = int(os.getenv("HF_PREDICT_TIMEOUT", "90"))

    # Legacy local model path (optional fallback; symptom flow uses HF by default)
    ML_MODEL_DIR = os.getenv("ML_MODEL_DIR")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    MAX_PRESCRIPTION_FILE_SIZE = 10 * 1024 * 1024
    ALLOWED_PRESCRIPTION_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}

    MAX_PAYMENT_PROOF_FILE_SIZE = 5 * 1024 * 1024
    ALLOWED_PAYMENT_PROOF_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

    # Stripe Payment
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

    # OTP email via Gmail SMTP (Flask-Mail)
    OTP_DEV_MODE = os.getenv("OTP_DEV_MODE", "").lower() in ("1", "true", "yes")

    # Flask-Mail (Gmail SMTP)
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv("GMAIL_USER")
    MAIL_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("GMAIL_USER")

    # Easypaisa Payment
    EASYPAISA_RECEIVER_NUMBER = "03144828190"
    SUPPORTED_PAYMENT_METHODS = ["stripe", "easypaisa"]

    # Optional CORS allowlist (comma-separated). Empty = permissive for dev.
    CORS_ORIGINS = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "").split(",")
        if o.strip()
    ]

    # Flask-Limiter storage (use Redis in multi-instance Cloud Run deployments)
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")

    JSON_SORT_KEYS = False
    PROPAGATE_EXCEPTIONS = True

    @classmethod
    def validate_required(cls) -> None:
        """Fail fast on missing critical configuration."""
        if not cls.MONGO_URI:
            print("ERROR: MONGO_URI environment variable is not set.")
            print("Create backend/.env from .env.example and set MONGO_URI.")
            sys.exit(1)

        if not cls.MONGO_URI.startswith(("mongodb://", "mongodb+srv://")):
            print(f"ERROR: Invalid MONGO_URI format: {cls.MONGO_URI[:50]}...")
            sys.exit(1)

        if not cls.HF_SPACE_URL:
            print(
                "WARNING: HF_SPACE_URL is not set. "
                "Symptom prediction will fail until configured."
            )

        if cls.IS_PRODUCTION:
            missing = []
            if not cls.SECRET_KEY:
                missing.append("SECRET_KEY")
            if not cls.JWT_SECRET_KEY:
                missing.append("JWT_SECRET_KEY")
            if missing:
                print(
                    "ERROR: Production requires these environment variables: "
                    + ", ".join(missing)
                )
                sys.exit(1)
            if cls.DEBUG:
                print("WARNING: DEBUG is enabled in production — disable FLASK_DEBUG.")

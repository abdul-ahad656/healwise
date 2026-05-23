import os
import sys

from dotenv import load_dotenv

# Load .env from backend root (parent of app/)
_BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(_BACKEND_ROOT, ".env"))


class Config:
    """Application configuration loaded from environment variables."""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")

    MONGO_URI = os.getenv("MONGO_URI")

    # Hugging Face Gradio Space
    HF_SPACE_URL = os.getenv("HF_SPACE_URL", "").strip()
    HF_API_NAME = os.getenv("HF_API_NAME", "/predict")
    HF_PREDICT_TIMEOUT = int(os.getenv("HF_PREDICT_TIMEOUT", "90"))

    # Legacy local model path (optional fallback; symptom flow uses HF by default)
    ML_MODEL_DIR = os.getenv("ML_MODEL_DIR", "app/ml_model/clinicalbert_finetuned")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    MAX_PRESCRIPTION_FILE_SIZE = 10 * 1024 * 1024
    ALLOWED_PRESCRIPTION_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}

    # Stripe Payment
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
    APPOINTMENT_CONSULTATION_FEE = int(os.getenv("APPOINTMENT_CONSULTATION_FEE", "5000"))  # in cents

    # Easypaisa Payment
    EASYPAISA_RECEIVER_NUMBER = "03144828190"
    SUPPORTED_PAYMENT_METHODS = ["stripe", "easypaisa"]

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
            print("WARNING: HF_SPACE_URL is not set. Symptom prediction will fail until configured.")

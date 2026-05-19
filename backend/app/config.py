
import os
import sys

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    MONGO_URI = os.getenv("MONGO_URI")

    # Validate MONGO_URI at startup
    if not MONGO_URI:
        print("❌ ERROR: MONGO_URI environment variable not set!")
        print("   Ensure the secret is created in Google Secret Manager:")
        print("   gcloud secrets create MONGO_URI --data-file=- <<< 'your-mongodb-uri'")
        print("   And injected in Cloud Run via --set-secrets MONGO_URI=MONGO_URI:latest")
        sys.exit(1)

    if not MONGO_URI.startswith(('mongodb://', 'mongodb+srv://')):
        print(f"❌ ERROR: Invalid MONGO_URI format: {MONGO_URI[:50]}...")
        print("   Must start with 'mongodb://' or 'mongodb+srv://'")
        sys.exit(1)

    # Path to the local model directory inside the backend
    ML_MODEL_DIR = os.getenv("ML_MODEL_DIR", "app/ml_model/clinicalbert_finetuned")

    # Cloudinary configuration for prescription uploads
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # File upload constraints
    MAX_PRESCRIPTION_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes
    ALLOWED_PRESCRIPTION_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

    # Flask settings
    JSON_SORT_KEYS = False
    PROPAGATE_EXCEPTIONS = True

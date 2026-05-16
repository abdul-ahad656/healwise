
import os

class Config:
    SECRET_KEY = os.getenv("@newBike4945", "change-me")
    JWT_SECRET_KEY = os.getenv("@newBike4945", "change-me")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/healwise")
    # Path to the local model directory inside the backend
    ML_MODEL_DIR = os.getenv("ML_MODEL_DIR", "app/ml_model/clinicalbert_finetuned")

    # Cloudinary configuration for prescription uploads
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # File upload constraints
    MAX_PRESCRIPTION_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes
    ALLOWED_PRESCRIPTION_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

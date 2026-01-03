
import os

class Config:
    SECRET_KEY = os.getenv("@newBike4945", "change-me")
    JWT_SECRET_KEY = os.getenv("@newBike4945", "change-me")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/healwise")
    # Path to the local model directory inside the backend
    ML_MODEL_DIR = os.getenv("ML_MODEL_DIR", "app/ml_model/clinicalbert_finetuned")

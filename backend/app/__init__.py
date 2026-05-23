import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from .extensions import mongo, jwt

from .routes.auth_routes import auth_bp
from .routes.symptom_routes import symptom_bp
from .routes.medicine_routes import medicine_bp
from .routes.doctor_routes import doctor_bp
from .routes.appointment_routes import appointment_bp
from .routes.availability_routes import availability_bp
from .routes.public_routes import public_bp
from .routes.admin_routes import admin_bp
from .routes.doctor_profile_routes import doctor_profile_bp
from .routes.health_tips_routes import health_tips_bp
from .routes.medicine_type_routes import medicine_type_bp
from .routes.prescription_routes import prescription_bp
from .routes.predict_routes import predict_bp
from .routes.payment_routes import payment_bp

from .config import Config


def create_app():
    app = Flask(__name__, instance_relative_config=False)

    # ✅ HF branch: validate config early
    Config.validate_required()

    # Load configuration
    app.config.from_object(Config)

    # Debug logs
    print(f"✅ Flask Environment: {os.getenv('FLASK_ENV', 'production')}")
    print(
        f"✅ MongoDB URI: {Config.MONGO_URI[:50]}..."
        if Config.MONGO_URI else "❌ MONGO_URI is None"
    )

    # Enable CORS
    CORS(app)

    # MongoDB initialization
    try:
        print("🔗 Initializing MongoDB connection...")
        mongo.init_app(app)
        print("✅ MongoDB initialized successfully")
    except Exception as e:
        print(f"❌ MongoDB initialization failed: {e}")
        raise

    # JWT initialization
    try:
        print("🔐 Initializing JWT...")
        jwt.init_app(app)
        print("✅ JWT initialized successfully")
    except Exception as e:
        print(f"⚠️ JWT initialization warning: {e}")

    # Register blueprints
    print("📦 Registering blueprints...")
    try:
        app.register_blueprint(auth_bp, url_prefix="/api/auth")
        app.register_blueprint(symptom_bp, url_prefix="/api/symptoms")
        app.register_blueprint(medicine_bp, url_prefix="/api/medicines")
        app.register_blueprint(doctor_bp, url_prefix="/api/doctor")
        app.register_blueprint(appointment_bp, url_prefix="/api/appointments")
        app.register_blueprint(availability_bp, url_prefix="/api/availability")
        app.register_blueprint(public_bp, url_prefix="/api/public")
        app.register_blueprint(admin_bp, url_prefix="/api/admin")
        app.register_blueprint(doctor_profile_bp, url_prefix="/api/doctor_profile")
        app.register_blueprint(health_tips_bp, url_prefix="/api/health-tips")
        app.register_blueprint(medicine_type_bp, url_prefix="/api/medicine-awareness")
        app.register_blueprint(prescription_bp, url_prefix="/api/prescriptions")
        app.register_blueprint(payment_bp, url_prefix="/api/payments")

        # HF branch addition
        app.register_blueprint(predict_bp)

        print("✅ Blueprints registered successfully")

    except Exception as e:
        print(f"❌ Blueprint registration failed: {e}")
        raise

    # HF branch: ensure DB indexes (best effort)
    with app.app_context():
        try:
            from app.services.symptom_service import ensure_patients_indexes
            if mongo.db is not None:
                ensure_patients_indexes()
        except Exception as e:
            print(f"⚠️ patients index warning: {e}")

    # Health check endpoint
    @app.route("/health")
    def health():
        try:
            if mongo.db:
                mongo.db.command('ping')
                return jsonify({"status": "ok", "mongodb": "connected"}), 200
        except Exception as e:
            return jsonify({"status": "degraded", "error": str(e)}), 503

        return jsonify({"status": "ok"}), 200

    # Error handler
    @app.errorhandler(500)
    def server_error(e):
        print(f"❌ Server error: {e}")
        return jsonify({"error": "Internal server error"}), 500

    print("✅ Flask app created successfully!")
    return app
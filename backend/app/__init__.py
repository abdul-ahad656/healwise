import logging
import os
import sys

from flask import Flask, jsonify
from flask_cors import CORS

from .extensions import mongo, jwt, mail
from .routes.auth_routes import auth_bp
from .routes.symptom_routes import symptom_bp
from .routes.medicine_routes import medicine_bp
from .routes.doctor_routes import doctor_bp
from .routes.appointment_routes import appointment_bp
from .routes.availability_routes import availability_bp
from .routes.schedule_routes import schedule_bp
from .routes.public_routes import public_bp
from .routes.admin_routes import admin_bp
from .routes.doctor_profile_routes import doctor_profile_bp
from .routes.health_tips_routes import health_tips_bp
from .routes.medicine_type_routes import medicine_type_bp
from .routes.prescription_routes import prescription_bp
from .routes.predict_routes import predict_bp
from .routes.payment_routes import payment_bp

from .config import Config
from .security.error_handlers import register_error_handlers
from .security.jwt_handlers import register_jwt_handlers
from .security.limiter import init_limiter
from .security.talisman_config import init_talisman


def _configure_logging(app: Flask) -> None:
    level = logging.DEBUG if app.config.get("DEBUG") else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        stream=sys.stdout,
        force=True,
    )
    logging.getLogger("healwise.security").setLevel(logging.INFO)


def create_app():
    app = Flask(__name__, instance_relative_config=False)

    Config.validate_required()
    app.config.from_object(Config)
    _configure_logging(app)

    if Config.OTP_DEV_MODE:
        print("📧 OTP: DEV MODE — codes printed to server console")
    elif Config.MAIL_USERNAME and Config.MAIL_PASSWORD:
        print(f"📧 OTP: Gmail SMTP ({Config.MAIL_USERNAME})")
    else:
        print("⚠️ OTP: Set GMAIL_USER and GMAIL_APP_PASSWORD in .env")

    print(f"✅ Flask Environment: {app.config.get('FLASK_ENV', 'production')}")
    if Config.MONGO_URI:
        print(f"✅ MongoDB URI: {Config.MONGO_URI[:50]}...")
    else:
        print("❌ MONGO_URI is None")

    # Rate limiting (must init before blueprints that use @limiter)
    init_limiter(app)
    print("✅ Flask-Limiter initialized")

    # Security headers (HTTPS only in production)
    init_talisman(app)
    print("✅ Flask-Talisman initialized")

    # CORS — optional allowlist via CORS_ORIGINS env
    if Config.CORS_ORIGINS:
        CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    else:
        CORS(app)

    try:
        print("🔗 Initializing MongoDB connection...")
        mongo.init_app(app)
        print("✅ MongoDB initialized successfully")
    except Exception as e:
        print(f"❌ MongoDB initialization failed: {e}")
        raise

    try:
        print("🔐 Initializing JWT...")
        jwt.init_app(app)
        register_jwt_handlers(app)
        print("✅ JWT initialized successfully")
    except Exception as e:
        print(f"⚠️ JWT initialization warning: {e}")

    try:
        print("📧 Initializing Flask-Mail...")
        mail.init_app(app)
        print("✅ Flask-Mail initialized successfully")
    except Exception as e:
        print(f"⚠️ Flask-Mail initialization warning: {e}")

    register_error_handlers(app)

    print("📦 Registering blueprints...")
    try:
        app.register_blueprint(auth_bp, url_prefix="/api/auth")
        app.register_blueprint(symptom_bp, url_prefix="/api/symptoms")
        app.register_blueprint(medicine_bp, url_prefix="/api/medicines")
        app.register_blueprint(doctor_bp, url_prefix="/api/doctor")
        app.register_blueprint(appointment_bp, url_prefix="/api/appointments")
        app.register_blueprint(availability_bp, url_prefix="/api/availability")
        app.register_blueprint(schedule_bp, url_prefix="/api/schedules")
        app.register_blueprint(public_bp, url_prefix="/api/public")
        app.register_blueprint(admin_bp, url_prefix="/api/admin")
        app.register_blueprint(doctor_profile_bp, url_prefix="/api/doctor_profile")
        app.register_blueprint(health_tips_bp, url_prefix="/api/health-tips")
        app.register_blueprint(medicine_type_bp, url_prefix="/api/medicine-awareness")
        app.register_blueprint(prescription_bp, url_prefix="/api/prescriptions")
        app.register_blueprint(payment_bp, url_prefix="/api/payments")
        app.register_blueprint(predict_bp)
        print("✅ Blueprints registered successfully")
    except Exception as e:
        print(f"❌ Blueprint registration failed: {e}")
        raise

    with app.app_context():
        try:
            from app.services.symptom_service import ensure_patients_indexes
            from app.utils.slot_locking import ensure_slot_lock_indexes
            from app.models.medicine_model import ensure_medicine_indexes

            if mongo.db is not None:
                ensure_patients_indexes()
                ensure_slot_lock_indexes()
                ensure_medicine_indexes()
        except Exception as e:
            print(f"⚠️ patients index warning: {e}")

    @app.route("/health")
    def health():
        try:
            if mongo.db is not None:
                mongo.db.command("ping")
                return jsonify({"status": "ok", "mongodb": "connected"}), 200
        except Exception:
            app.logger.exception("health_check_mongodb_failed")
            return jsonify({"status": "degraded", "error": "Database unavailable"}), 503

        return jsonify({"status": "ok"}), 200

    print("✅ Flask app created successfully!")
    return app

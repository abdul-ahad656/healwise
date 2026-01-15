from flask import Flask, jsonify
from flask_cors import CORS
from .extensions import mongo, jwt
from .config import Config

from .routes.auth_routes import auth_bp
from .routes.symptom_routes import symptom_bp
from .routes.medicine_routes import medicine_bp
from app.routes.doctor_routes import doctor_bp
from app.routes.appointment_routes import appointment_bp
from app.routes.availability_routes import availability_bp
from app.routes.public_routes import public_bp
from app.routes.admin_routes import admin_bp
from app.routes.doctor_routes import doctor_bp
from app.routes.doctor_profile_routes import doctor_profile_bp
from app.routes.health_tips_routes import health_tips_bp
from app.routes.medicine_type_routes import medicine_type_bp


def create_app():
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object(Config)

    CORS(app)
    mongo.init_app(app)
    jwt.init_app(app)

    # register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(symptom_bp, url_prefix="/api/symptoms")
    app.register_blueprint(medicine_bp, url_prefix="/api/medicines")
    app.register_blueprint(doctor_bp, url_prefix="/api/doctor")
    app.register_blueprint(appointment_bp, url_prefix="/api/appointments")
    app.register_blueprint(availability_bp, url_prefix="/api/availability")
    app.register_blueprint(public_bp, url_prefix="/api/public")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(doctor_profile_bp, url_prefix="/api/doctor_profile")
    app.register_blueprint(health_tips_bp,url_prefix="/api/health-tips")
    app.register_blueprint(medicine_type_bp,url_prefix="/api/medicine-awareness")



    @app.route("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    return app

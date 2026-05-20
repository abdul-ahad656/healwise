import sys
import logging
import os

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

logger = logging.getLogger(__name__)

try:
    logger.info("=" * 80)
    logger.info("🚀 Starting HealWise Backend Server")
    logger.info("=" * 80)
    logger.info(f"Environment: {os.getenv('FLASK_ENV', 'production')}")
    logger.info(f"Python: {sys.version}")

    logger.info("📦 Importing create_app...")
    from app import create_app
    logger.info("✅ Successfully imported create_app")

    logger.info("🏗️  Creating Flask application...")
    app = create_app()
    logger.info("✅ Flask application created successfully!")
    logger.info("=" * 80)

except Exception as e:
    logger.error(f"❌ FATAL ERROR: Failed to start application", exc_info=True)
    sys.exit(1)

if __name__ == "__main__":
    app.run()



import sys
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

logger = logging.getLogger(__name__)

try:
    logger.info("Starting application initialization...")
    from app import create_app
    logger.info("Successfully imported create_app")

    app = create_app()
    logger.info("Successfully created Flask app")
except Exception as e:
    logger.error(f"Failed to create app: {e}", exc_info=True)
    raise

if __name__ == "__main__":
    app.run()


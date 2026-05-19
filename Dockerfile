# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder --chown=1000:1000 /root/.local /home/appuser/.local

# Copy application code
COPY --chown=1000:1000 backend/ .

# Set environment variables
ENV PATH=/home/appuser/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=main.py \
    PORT=8080 \
    PYTHONHASHSEED=0 \
    PYTHONPATH=/app

# Create non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# Use gunicorn with optimized settings for Cloud Run
# Reduced workers (2) to fit in 2Gi memory with transformers library
CMD exec gunicorn --bind 0.0.0.0:8080 --workers 2 --worker-class sync --timeout 120 --keep-alive 5 --max-requests 1000 --max-requests-jitter 100 --access-logfile - --error-logfile - --log-level info wsgi:app
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
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY backend/ .

# Set environment variables
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=main.py \
    PORT=8080

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Use gunicorn for production
CMD exec gunicorn --bind 0.0.0.0:${PORT} --workers 4 --worker-class sync --timeout 60 --access-logfile - --error-logfile - wsgi:app

# CI/CD Pipeline Quick Start

## Overview
This document provides a quick reference for setting up and using the HealWise Backend CI/CD pipeline on Google Cloud Run.

## File Structure
```
.
├── Dockerfile                 # Multi-stage Docker build
├── .dockerignore             # Docker build optimization
├── docker-compose.yml        # Local development setup
├── cloudbuild.yaml           # Google Cloud Build config (alternative)
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions workflow
├── CLOUD_RUN_SETUP.md        # Detailed setup guide
├── backend/
│   ├── main.py               # Flask app entry (dev mode)
│   ├── wsgi.py               # WSGI entry (production)
│   ├── requirements.txt       # Python dependencies (pinned versions)
│   └── app/
│       ├── __init__.py        # Environment-aware app factory
│       ├── config.py          # Legacy config
│       └── config_prod.py     # Environment-specific configs
```

## Quick Setup (5 minutes)

### Option A: Using GitHub Actions (Recommended)

1. **Create GitHub secrets**:
   ```
   GCP_PROJECT_ID: your-gcp-project-id
   WIF_PROVIDER: projects/PROJECT_ID/locations/global/workloadIdentityPools/github-pool/providers/github-provider
   WIF_SERVICE_ACCOUNT: healwise-ci-cd@PROJECT_ID.iam.gserviceaccount.com
   ```

2. **Create GCP resources** (run once):
   ```bash
   bash ./scripts/setup-cloud-run.sh  # If available, or follow CLOUD_RUN_SETUP.md
   ```

3. **Push to main**:
   ```bash
   git add .
   git commit -m "Add CI/CD pipeline"
   git push origin main
   ```

4. **Monitor deployment**:
   - Go to Actions tab in GitHub
   - Click on workflow run
   - Verify "Deploy to Cloud Run" step completes

### Option B: Using Google Cloud Build

1. **Connect repository** to Cloud Build
2. **Push to main** to trigger deployment
3. **Monitor** in Cloud Build console

## Local Development

### With Docker Compose
```bash
# Copy .env (with secrets for development)
cp backend/.env .env

# Start services
docker-compose up --build

# API is available at http://localhost:8080
```

### Native Python (Development)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment
export FLASK_ENV=development
python main.py
```

## Deployment Status

### Check if deployed
```bash
gcloud run services describe healwise-backend --region us-central1
```

### Get service URL
```bash
gcloud run services describe healwise-backend \
  --region us-central1 \
  --format='value(status.url)'
```

### Check logs
```bash
gcloud run services logs read healwise-backend \
  --region us-central1 \
  --limit 50 \
  --follow
```

### Test health endpoint
```bash
SERVICE_URL=$(gcloud run services describe healwise-backend \
  --region us-central1 \
  --format='value(status.url)')

curl $SERVICE_URL/health
```

## Key Technologies

| Component | Technology |
|-----------|-----------|
| Framework | Flask 3.0.0 |
| Database | MongoDB |
| Auth | JWT (flask-jwt-extended) |
| File Storage | Cloudinary |
| ML Model | ClinicalBERT (Transformers) |
| Server | Gunicorn (4 workers) |
| Container | Docker (multi-stage) |
| Registry | Google Container Registry |
| Deployment | Google Cloud Run |
| CI/CD | GitHub Actions / Cloud Build |

## Common Tasks

### Update dependencies
```bash
# Edit backend/requirements.txt with new versions
# Commit and push - pipeline will rebuild with new deps
git add backend/requirements.txt
git commit -m "Update dependencies"
git push origin main
```

### Configure secrets
```bash
# Add/update secret in Google Secret Manager
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Deployment will use latest version automatically
```

### Scale up resources
Edit `.github/workflows/deploy.yml` or use:
```bash
gcloud run services update healwise-backend \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 200
```

### Rollback to previous version
```bash
# Get previous revision
PREV_REVISION=$(gcloud run revisions list --service healwise-backend \
  --region us-central1 --limit 2 --format='value(REVISION)' | tail -1)

# Route traffic to previous revision
gcloud run services update-traffic healwise-backend \
  --to-revisions $PREV_REVISION=100 \
  --region us-central1
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `permission denied` on deploy | Check service account IAM roles |
| Image too large | Review `.dockerignore`, remove venv |
| Secrets not loading | Verify Secret Manager secrets exist |
| High cold start latency | Set min-instances to 1 (costs more) |
| Database connection fails | Verify MONGO_URI secret is correct |
| Timeouts on ML operations | Increase timeout (currently 600s) |

## Monitoring

### Set up alerts (optional)
```bash
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Cloud Run Error Rate" \
  --condition-display-name="Error rate > 5%" \
  ...
```

### Key metrics to watch
- Error rate (dashboard in Cloud Run console)
- P95 latency
- Instance count scaling
- Memory/CPU usage

## Next Steps

1. **Test deployment**: Push to main and verify in Actions/Cloud Build
2. **Monitor logs**: Check CLOUD_RUN_SETUP.md for log queries
3. **Set up alerts**: Configure error/latency notifications
4. **Enable CDN**: Add Cloud CDN for better performance
5. **Security**: Enable Binary Authorization if needed

## Support

- **Documentation**: See CLOUD_RUN_SETUP.md for detailed guide
- **GCP Documentation**: https://cloud.google.com/run/docs
- **GitHub Actions**: https://docs.github.com/actions
- **Flask Documentation**: https://flask.palletsprojects.com

---

**Last Updated**: 2026-05-18  
**Version**: 1.0

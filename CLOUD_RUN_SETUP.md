# HealWise Backend - Cloud Run Deployment Guide

## Overview
This guide explains how to set up CI/CD for the HealWise backend using GitHub Actions and Google Cloud Run.

## Architecture

```
GitHub Repository
       ↓
GitHub Actions Workflow
       ↓
Build Docker Image
       ↓
Push to Google Container Registry (GCR)
       ↓
Deploy to Cloud Run
       ↓
Live Service
```

## Prerequisites

1. **Google Cloud Project**
   - GCP Project ID
   - Billing enabled
   - Cloud Run API enabled
   - Container Registry API enabled

2. **GitHub Repository Access**
   - Admin permissions to configure secrets
   - Admin permissions to configure branch protections

3. **Service Account Setup**
   - Created service account for CI/CD

## Setup Instructions

### Step 1: Create Google Cloud Service Account

```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"

# Create service account
gcloud iam service-accounts create healwise-ci-cd \
    --display-name="HealWise CI/CD Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:healwise-ci-cd@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:healwise-ci-cd@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:healwise-ci-cd@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:healwise-ci-cd@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"
```

### Step 2: Set Up Workload Identity Federation (Recommended)

```bash
# Create identity provider
gcloud iam workload-identity-pools create "github-pool" \
    --location="global" \
    --display-name="GitHub Actions"

# Get the pool resource name
export WORKLOAD_IDENTITY_POOL_ID=$(gcloud iam workload-identity-pools describe github-pool \
    --location=global --format='value(name)')

# Create OIDC provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
    --location="global" \
    --workload-identity-pool="github-pool" \
    --display-name="GitHub provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.aud=assertion.aud" \
    --issuer-uri="https://token.actions.githubusercontent.com"

# Get the provider resource name
export WORKLOAD_IDENTITY_PROVIDER=$(gcloud iam workload-identity-pools providers describe github-provider \
    --location=global \
    --workload-identity-pool=github-pool \
    --format='value(name)')

# Create service account IAM binding
gcloud iam service-accounts add-iam-policy-binding healwise-ci-cd@${GCP_PROJECT_ID}.iam.gserviceaccount.com \
    --role="roles/iam.workloadIdentityUser" \
    --subject="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_PROVIDER}/attribute.actor/abdul-ahad656"
```

### Step 3: Create Google Secret Manager Secrets

```bash
# Create secrets
echo -n "$MONGO_URI" | gcloud secrets create MONGO_URI --data-file=-
echo -n "$JWT_SECRET_KEY" | gcloud secrets create JWT_SECRET_KEY --data-file=-
echo -n "$SECRET_KEY" | gcloud secrets create SECRET_KEY --data-file=-
echo -n "$CLOUDINARY_CLOUD_NAME" | gcloud secrets create CLOUDINARY_CLOUD_NAME --data-file=-
echo -n "$CLOUDINARY_API_KEY" | gcloud secrets create CLOUDINARY_API_KEY --data-file=-
echo -n "$CLOUDINARY_API_SECRET" | gcloud secrets create CLOUDINARY_API_SECRET --data-file=-

# Grant service account access to secrets
for SECRET in MONGO_URI JWT_SECRET_KEY SECRET_KEY CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET; do
    gcloud secrets add-iam-policy-binding $SECRET \
        --member="serviceAccount:healwise-ci-cd@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor"
done
```

### Step 4: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **GCP_PROJECT_ID**: Your Google Cloud Project ID
2. **WIF_PROVIDER**: The Workload Identity Provider resource name from Step 2
3. **WIF_SERVICE_ACCOUNT**: `healwise-ci-cd@YOUR_PROJECT_ID.iam.gserviceaccount.com`

### Step 5: Deploy Manually (First Time)

```bash
# Build and deploy manually using gcloud
gcloud run deploy healwise-backend \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 600 \
    --max-instances 100 \
    --set-env-vars FLASK_ENV=production \
    --set-secrets MONGO_URI=MONGO_URI:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest,SECRET_KEY=SECRET_KEY:latest,CLOUDINARY_CLOUD_NAME=CLOUDINARY_CLOUD_NAME:latest,CLOUDINARY_API_KEY=CLOUDINARY_API_KEY:latest,CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest
```

## Automated Deployment

Once setup is complete, the CI/CD pipeline will:

1. **Trigger on**: Push to `main` or `production` branch with backend changes
2. **Build**: Creates Docker image with Python 3.11
3. **Push**: Uploads to Google Container Registry
4. **Deploy**: Updates Cloud Run service with new image
5. **Health Check**: Service URL is logged in workflow output

## Monitoring and Debugging

### Check Deployment Status
```bash
gcloud run services describe healwise-backend --region us-central1
```

### View Logs
```bash
# Real-time logs
gcloud run services logs read healwise-backend --region us-central1 --limit 50 --follow

# Specific revision logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=healwise-backend" --limit 50
```

### Access Health Check
```bash
curl https://your-service-url/health
```

## Environment Configuration

### Development
```bash
export FLASK_ENV=development
export FLASK_DEBUG=1
```

### Production
- `FLASK_ENV=production` (set in workflow)
- All secrets loaded from Google Secret Manager
- Gunicorn with 4 workers
- HTTPS enforced by Cloud Run

## Scaling Configuration

Current Cloud Run settings:
- **Memory**: 1 GB
- **CPU**: 1 vCPU
- **Timeout**: 10 minutes (600 seconds)
- **Max Instances**: 100
- **Min Instances**: 0 (scales down when idle)

To adjust:
```bash
gcloud run services update healwise-backend \
    --region us-central1 \
    --memory 2Gi \
    --cpu 2
```

## Cost Optimization

- Uses multi-stage Docker build to minimize image size
- Non-root user for security
- Idle time automatically scales to zero
- Estimated cost: ~$5-15/month for light usage

## Troubleshooting

### Deploy fails with "permission denied"
- Verify service account has correct IAM roles
- Check Workload Identity Provider configuration

### Container image too large
- Check `.dockerignore` for unnecessary files
- Remove `.venv` and `__pycache__` directories

### Secrets not loading
- Verify secrets exist in Secret Manager
- Confirm service account has `secretmanager.secretAccessor` role

### High latency on first request
- Cold start is normal (~3-5 seconds)
- Configure min instances if needed

## Next Steps

1. Test the workflow by pushing to `main` branch
2. Monitor logs and performance
3. Set up alerts for errors and high latency
4. Consider implementing canary deployments
5. Add CDN for frontend assets (Cloud CDN)

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation-sign-in)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

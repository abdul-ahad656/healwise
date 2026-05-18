#!/bin/bash

# HealWise Backend - Cloud Run Setup Script
# This script automates the initial setup of CI/CD pipeline on Google Cloud Run

set -e

echo "🚀 HealWise Backend - Cloud Run Setup"
echo "======================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not installed. Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ git not installed."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Get project details
echo "📝 Project Configuration"
echo "-----------------------"
read -p "Enter your GCP Project ID: " GCP_PROJECT_ID
read -p "Enter the GitHub repository owner (e.g., abdul-ahad656): " GITHUB_OWNER
read -p "Enter the GitHub repository name (e.g., healwise): " GITHUB_REPO

echo ""
echo "Setting GCP Project..."
gcloud config set project $GCP_PROJECT_ID

# Check if service account exists
SERVICE_ACCOUNT="healwise-ci-cd"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

echo ""
echo "🔑 Setting up Service Account"
echo "----------------------------"

# Create service account
if gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL &>/dev/null; then
    echo "✅ Service account $SERVICE_ACCOUNT_EMAIL already exists"
else
    echo "Creating service account $SERVICE_ACCOUNT..."
    gcloud iam service-accounts create $SERVICE_ACCOUNT \
        --display-name="HealWise CI/CD Service Account"
    echo "✅ Service account created"
fi

# Grant necessary roles
echo "Granting IAM roles..."
for role in "roles/run.admin" "roles/storage.admin" "roles/secretmanager.secretAccessor" "roles/iam.serviceAccountUser"; do
    gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="$role" \
        --quiet
    echo "  ✅ Granted $role"
done

echo ""
echo "🔐 Setting up Workload Identity Federation"
echo "------------------------------------------"

# Create identity provider
POOL_ID="github-pool"
PROVIDER_ID="github-provider"

if gcloud iam workload-identity-pools describe $POOL_ID --location=global &>/dev/null; then
    echo "✅ Workload identity pool already exists"
else
    echo "Creating workload identity pool..."
    gcloud iam workload-identity-pools create $POOL_ID \
        --location=global \
        --display-name="GitHub Actions"
    echo "✅ Pool created"
fi

# Get pool resource name
WORKLOAD_IDENTITY_POOL=$(gcloud iam workload-identity-pools describe $POOL_ID \
    --location=global --format='value(name)')

# Create OIDC provider
if gcloud iam workload-identity-pools providers describe $PROVIDER_ID \
    --location=global \
    --workload-identity-pool=$POOL_ID &>/dev/null; then
    echo "✅ OIDC provider already exists"
else
    echo "Creating OIDC provider..."
    gcloud iam workload-identity-pools providers create-oidc $PROVIDER_ID \
        --location=global \
        --workload-identity-pool=$POOL_ID \
        --display-name="GitHub provider" \
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.aud=assertion.aud" \
        --issuer-uri="https://token.actions.githubusercontent.com"
    echo "✅ OIDC provider created"
fi

# Get provider resource name
WORKLOAD_IDENTITY_PROVIDER=$(gcloud iam workload-identity-pools providers describe $PROVIDER_ID \
    --location=global \
    --workload-identity-pool=$POOL_ID \
    --format='value(name)')

# Create service account IAM binding
echo "Binding service account to GitHub..."
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT_EMAIL \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_PROVIDER}/attribute.actor/${GITHUB_OWNER}" \
    --quiet
echo "✅ Service account bound to GitHub"

echo ""
echo "🔒 Creating Secrets in Google Secret Manager"
echo "--------------------------------------------"

# Read secrets from .env file
if [ -f "backend/.env" ]; then
    source backend/.env
else
    echo "⚠️  backend/.env not found. Please enter secrets manually:"
    read -sp "MONGO_URI: " MONGO_URI
    echo ""
    read -sp "JWT_SECRET_KEY: " JWT_SECRET_KEY
    echo ""
    read -sp "SECRET_KEY: " SECRET_KEY
    echo ""
    read -sp "CLOUDINARY_CLOUD_NAME: " CLOUDINARY_CLOUD_NAME
    echo ""
    read -sp "CLOUDINARY_API_KEY: " CLOUDINARY_API_KEY
    echo ""
    read -sp "CLOUDINARY_API_SECRET: " CLOUDINARY_API_SECRET
    echo ""
fi

# Create secrets
create_secret() {
    local secret_name=$1
    local secret_value=$2

    if gcloud secrets describe $secret_name &>/dev/null; then
        echo "  ℹ️  Secret $secret_name exists, creating new version..."
        echo -n "$secret_value" | gcloud secrets versions add $secret_name --data-file=-
    else
        echo "  Creating secret $secret_name..."
        echo -n "$secret_value" | gcloud secrets create $secret_name --data-file=-
    fi

    # Grant service account access
    gcloud secrets add-iam-policy-binding $secret_name \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet
}

create_secret "MONGO_URI" "$MONGO_URI"
create_secret "JWT_SECRET_KEY" "$JWT_SECRET_KEY"
create_secret "SECRET_KEY" "$SECRET_KEY"
create_secret "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME"
create_secret "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY"
create_secret "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET"

echo "✅ All secrets created"

echo ""
echo "📋 Output for GitHub Secrets Configuration"
echo "==========================================="
echo ""
echo "Add these secrets to your GitHub repository at:"
echo "https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/settings/secrets/actions"
echo ""
echo "GCP_PROJECT_ID:"
echo "$GCP_PROJECT_ID"
echo ""
echo "WIF_PROVIDER:"
echo "$WORKLOAD_IDENTITY_PROVIDER"
echo ""
echo "WIF_SERVICE_ACCOUNT:"
echo "$SERVICE_ACCOUNT_EMAIL"
echo ""

echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Add the secrets above to GitHub repository settings"
echo "2. Commit and push to main branch"
echo "3. Monitor deployment in GitHub Actions tab"
echo ""
echo "For detailed documentation, see: CLOUD_RUN_SETUP.md"
echo "For quick reference, see: CI_CD_QUICK_START.md"

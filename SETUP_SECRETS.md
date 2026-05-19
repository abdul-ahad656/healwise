# Google Secret Manager Setup for Cloud Run

## Prerequisites
```bash
gcloud config set project project-18984171-457a-43a9-bfe
```

## 1. Create MongoDB URI Secret

**Get your MongoDB connection string** (Atlas or self-hosted):
- Atlas: `mongodb+srv://username:password@cluster.mongodb.net/healwise?retryWrites=true&w=majority`
- Self-hosted: `mongodb://username:password@host:port/healwise`

**Create the secret:**
```bash
gcloud secrets create MONGO_URI \
  --data-file=- \
  --replication-policy=automatic << 'EOF'
mongodb+srv://your-username:your-password@cluster.mongodb.net/healwise?retryWrites=true&w=majority
EOF
```

**Grant Cloud Run service account access:**
```bash
gcloud secrets add-iam-policy-binding MONGO_URI \
  --member=serviceAccount:healwise-sa@project-18984171-457a-43a9-bfe.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

## 2. Create Other Secrets

```bash
# JWT Secret
gcloud secrets create JWT_SECRET_KEY \
  --data-file=- \
  --replication-policy=automatic << 'EOF'
your-jwt-secret-key-here-min-32-chars
EOF

# Secret Key
gcloud secrets create SECRET_KEY \
  --data-file=- \
  --replication-policy=automatic << 'EOF'
your-flask-secret-key-here-min-32-chars
EOF

# Cloudinary (if using)
gcloud secrets create CLOUDINARY_CLOUD_NAME \
  --data-file=- \
  --replication-policy=automatic << 'EOF'
your-cloudinary-cloud-name
EOF

gcloud secrets create CLOUDINARY_API_KEY \
  --data-file=- \
  --replication-policy=automatic << 'EOF'
your-cloudinary-api-key
EOF

gcloud secrets create CLOUDINARY_API_SECRET \
  --data-file=- \
  --replication-policy=automatic << 'EOF'
your-cloudinary-api-secret
EOF
```

**Grant access to all:**
```bash
for secret in JWT_SECRET_KEY SECRET_KEY CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET; do
  gcloud secrets add-iam-policy-binding $secret \
    --member=serviceAccount:healwise-sa@project-18984171-457a-43a9-bfe.iam.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor
done
```

## 3. Verify Secrets Are Set

```bash
gcloud secrets list
```

You should see all secrets listed.

## 4. Redeploy Cloud Run

After secrets are set, redeploy:
```bash
git push origin main
```

The GitHub Actions workflow will deploy with the secrets automatically injected.

## Troubleshooting

**Check Cloud Run logs:**
```bash
gcloud run services logs read healwise-backend --region us-central1 --limit 50
```

**View secret value (be careful):**
```bash
gcloud secrets versions access latest --secret=MONGO_URI
```

**Update a secret:**
```bash
gcloud secrets versions add MONGO_URI \
  --data-file=- << 'EOF'
your-new-mongo-uri
EOF
```

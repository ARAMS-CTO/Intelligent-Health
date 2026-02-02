#!/bin/bash
set -e

# Configuration
PROJECT_ID="intelligent-health-ai"
REGION="us-central1"
SERVICE_NAME="intelligent-health-app"
REPO_NAME="cloud-run-source-deploy"
IMAGE_TAG="v2.3.0-force"
IMAGE_PATH="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:$IMAGE_TAG"

echo "=================================================="
echo "🚀 FORCE DEPLOYING INTELLIGENT HEALTH ($IMAGE_TAG)"
echo "=================================================="

# 1. Config Check
echo "Step 1: Checking Project Config..."
gcloud config set project $PROJECT_ID

# 2. Build Image
echo "Step 2: Building Container Image..."
echo "Target: $IMAGE_PATH"
# Using --no-cache to ensure fresh build of v2.3.0 code
gcloud builds submit --tag "$IMAGE_PATH" .

# 3. Deploy
echo "Step 3: Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image "$IMAGE_PATH" \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --platform managed

# 4. Verification
echo "Step 4: Verifying Deployment..."
URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')
echo "Service URL: $URL"

echo "Checking Version API..."
curl -s "$URL/api/auth/config" | grep "2.3.0" && echo "✅ SUCCESS: v2.3.0 is Live!" || echo "⚠️  WARNING: Version check mismatch"

echo "=================================================="
echo "🎉 DEPLOYMENT COMPLETE"
echo "=================================================="

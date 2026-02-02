---
description: Deploy the complete application to Google Cloud Run automatically
---

# Automated Deployment to Cloud Run

This workflow uses Google Cloud Build triggers to automatically deploy the application to Cloud Run whenever code is pushed to the `main` branch.

## Current Setup

- **Project ID**: `intelligent-health-ai`
- **Service Name**: `intelligent-health-app`
- **Region**: `us-central1`
- **Live URL**: https://intelligenthealth.world

## Trigger Configuration

The trigger `rmgpgab-intelligent-health-us-central1-ARAMS-CTO-Intelligent` is configured to:
- Watch the `main` branch of `ARAMS-CTO/Intelligent-Health`
- Use `cloudbuild.yaml` for build steps
- Deploy to Cloud Run automatically

## Build Process

When triggered, Cloud Build:
1. **Builds** the Docker image using the project's Dockerfile
2. **Pushes** the image to Artifact Registry
3. **Deploys** the image to Cloud Run with:
   - 2Gi memory
   - 2 CPUs
   - 300s timeout
   - Allow unauthenticated access
   - Auto-scaling (0-10 instances)

## Manual Trigger (If Needed)

### Option 1: Google Cloud Console
1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers?project=intelligent-health-ai)
2. Find `rmgpgab-intelligent-health-*`
3. Click **"Run"** → Select branch `main`

### Option 2: gcloud CLI
```bash
gcloud builds triggers run rmgpgab-intelligent-health-us-central1-ARAMS-CTO-Intelligent \
  --project=intelligent-health-ai \
  --branch=main
```

### Option 3: Submit Build Directly
```bash
gcloud builds submit --config=cloudbuild.yaml --project=intelligent-health-ai .
```

## Checking Build Status

### Console
1. Go to [Cloud Build History](https://console.cloud.google.com/cloud-build/builds?project=intelligent-health-ai)
2. Latest builds are shown at the top

### CLI
```bash
gcloud builds list --project=intelligent-health-ai --limit=5
```

## Verifying Deployment

After successful deployment:
1. Check https://intelligenthealth.world (custom domain)
2. Check https://intelligent-health-app-jsc5mqgzua-uc.a.run.app (Cloud Run URL)
3. Verify version: `curl https://intelligenthealth.world/api/auth/config | jq .appVersion`

## Troubleshooting

### Build Failed
- Check logs in [Cloud Build History](https://console.cloud.google.com/cloud-build/builds)
- Common issues: Dockerfile errors, missing dependencies

### Container Start Failed
- Check logs in [Cloud Run Logs](https://console.cloud.google.com/run/detail/us-central1/intelligent-health-app/logs)
- Common issues: Missing environment variables, port configuration

### Environment Variables
Critical env vars that must be set in Cloud Run:
- `GEMINI_API_KEY` - AI functionality
- `DATABASE_URL` - Database connection (if using Cloud SQL)
- `GOOGLE_CLIENT_ID` - OAuth login

To update env vars:
```bash
gcloud run services update intelligent-health-app \
  --update-env-vars="KEY=VALUE" \
  --region=us-central1 \
  --project=intelligent-health-ai
```

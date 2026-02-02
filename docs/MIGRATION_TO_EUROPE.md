# Migration to Europe Region Guide

## 1. Verify Europe Deployment
First, ensure the new deployment to `europe-west1` is successful.
1. Go to [Cloud Run Console](https://console.cloud.google.com/run?project=intelligent-health-ai).
2. You should see two services:
   - `intelligent-health-app` (us-central1) - *Old*
   - `intelligent-health-app` (europe-west1) - *New* (Wait for this to appear/finish deploying)

## 2. Update Domain Mapping
**Important:** You must remove the domain from the old service before adding it to the new one. The IP address will change, so you will need to update your DNS records.

### Step A: Remove from old service
1. In Cloud Run, go to the **"Domain mappings"** tab (or "Manage Custom Domains").
2. Find `intelligenthealth.world` mapped to `us-central1`.
3. Click the three dots (⋮) and select **Delete mapping**.

### Step B: Add to new service
1. Click **"Add Mapping"**.
2. Select the **new service** in `europe-west1`.
3. Select verified domain: `intelligenthealth.world`.
4. Click **Create**.

### Step C: Update DNS
1. Google Cloud will show you new **A** and **AAAA** records.
2. Go to your DNS provider (likely Google Domains or GoDaddy).
3. **Replace** the old A/AAAA records with the new ones provided by Cloud Run.
4. *Note: It may take 15-60 minutes for HTTPS to become active.*

## 3. Delete US Deployment
Once your site is working on the new region, delete the old service to keep only one.

**Run this in Google Cloud Shell:**

```bash
# Delete the US service
gcloud run services delete intelligent-health-app \
  --region us-central1 \
  --project intelligent-health-ai \
  --quiet

# Verify only Europe remains
gcloud run services list
```

## 4. Troubleshooting
If the site shows a certificate error, wait 10-15 minutes. Cloud Run automatically provisions a new TLS certificate for the new region.

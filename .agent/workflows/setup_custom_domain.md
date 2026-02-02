---
description: How to map the custom domain intelligenthealth.world to the Cloud Run service
---

# Map Custom Domain: intelligenthealth.world

Since `intelligenthealth.world` is not yet verified in your Google Cloud Project, you must complete the following steps manually.

## Step 1: Verify Domain Ownership
1. Go to the [Google Cloud Console - Custom Domains](https://console.cloud.google.com/run/domains?project=intelligent-health-ai).
2. Click **"Add mapping"**.
3. Select "Service to map to": `intelligent-health-app`.
4. Select "Domain": Click **"Verify a new domain..."**
5. Enter `intelligenthealth.world`.
6. Google will provide a **TXT record** (e.g., `google-site-verification=...`) or CNAME.
7. Login to your DNS Provider (where you bought the domain).
8. Add the TXT record to your DNS configuration.
9. Wait a few minutes (or up to 24h) and click **Verify** in Google Cloud Console.

## Step 2: Map the Domain
Once verified:
1. Go back to [Cloud Run Custom Domains](https://console.cloud.google.com/run/domains?project=intelligent-health-ai).
2. Click **"Add mapping"**.
3. Service: `intelligent-health-app`.
4. Domain: Select `intelligenthealth.world` (and optionally `www.intelligenthealth.world`).
5. Click **Create**.

## Step 3: Update DNS Records
Google will provide the final DNS records required to point your domain to the Cloud Run service.
- **Record Type:** `A` or `AAAA` (usually 4 A-records and 4 AAAA-records).
- **Value:** IP addresses provided by Google.

Go back to your DNS Provider and add these A/AAAA records.

## Step 5: Update Google OAuth Credentials (CRITICAL)
For "Sign in with Google" to work on the new domain:
1. Go to [Google Cloud Console - APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials?project=intelligent-health-ai).
2. Find your **OAuth 2.0 Client ID** (used by the app).
3. Under **"Authorized JavaScript origins"**, ADD:
   - `https://intelligenthealth.world`
   - `https://www.intelligenthealth.world`
4. Under **"Authorized redirect URIs"**, ADD (if you use redirections, usually handled by popups but good to add):
   - `https://intelligenthealth.world`
   - `https://www.intelligenthealth.world`
5. Click **Save**.


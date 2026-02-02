# Intelligent Health - Deployment Guide v2.0 (PostgreSQL + GCS)

## Overview
This guide covers standardizing the deployment on Google Cloud Run with **Cloud SQL (PostgreSQL)** and **Cloud Storage (GCS)**, replacing the previous ephemeral configuration.

## Prerequisites
- Google Cloud Project with Billing Enabled.
- Enabled APIs:
  - Run API (`run.googleapis.com`)
  - SQL Admin API (`sqladmin.googleapis.com`)
  - Cloud Storage API (`storage.googleapis.com`)

## 1. Google Cloud Storage (GCS) Setup
1. Create a Bucket:
   ```bash
   gcloud storage buckets create gs://FILES_BUCKET_NAME --location=europe-west1
   ```
2. Set Environment Variable:
   - `GCS_BUCKET_NAME`: `FILES_BUCKET_NAME`

## 2. Cloud SQL (PostgreSQL) Setup
1. Create Instance:
   ```bash
   gcloud sql instances create intelligent-health-db \
       --database-version=POSTGRES_15 \
       --region=europe-west1 \
       --cpu=1 --memory=4096MB
   ```
2. Create Database & User:
   ```bash
   gcloud sql databases create health_db --instance=intelligent-health-db
   gcloud sql users create health_user --instance=intelligent-health-db --password=STRONG_PASSWORD
   ```
3. Enable `pgvector` Extension:
   - Connect to DB (via Cloud Shell or Proxy) and run:
   ```sql
   CREATE EXTENSION vector;
   ```

## 3. Application Configuration (Environment Variables)
When deploying to Cloud Run, ensure these variables are set:

| Variable | Value |
|----------|-------|
| `DB_USER` | `health_user` |
| `DB_PASS` | `STRONG_PASSWORD` |
| `DB_NAME` | `health_db` |
| `INSTANCE_CONNECTION_NAME` | `PROJECT_ID:europe-west1:intelligent-health-db` |
| `GCS_BUCKET_NAME` | `gs://FILES_BUCKET_NAME` |
| `GEMINI_API_KEY` | `[Your API Key]` |

## 4. Deployment Command
```bash
gcloud run deploy intelligent-health-app \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "DB_USER=health_user,DB_NAME=health_db,INSTANCE_CONNECTION_NAME=PROJECT_ID:europe-west1:intelligent-health-db,GCS_BUCKET_NAME=files_bucket" \
  --add-cloudsql-instances PROJECT_ID:europe-west1:intelligent-health-db
```
*Note: You must explicitly add `--add-cloudsql-instances` for the Cloud Run service agent to access the DB socket.*

## 5. Verification
- **Uploads**: Check endpoints (`/api/files/upload`) -> should verify file exists in GCS Bucket.
- **Vectors**: Chat with the Agent -> Logs should show "Using PGVectorStore".

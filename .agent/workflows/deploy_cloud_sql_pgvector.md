---
description: Deploy Cloud SQL with PGVector for RAG Persistence
---

# Deploy Cloud SQL with PGVector

This workflow guides you through setting up a production-grade PostgreSQL database with `pgvector` on Google Cloud SQL, resolving the "Vector Store Volatility" issue.

## Prerequisites
- Google Cloud Project with Billing Enabled
- `gcloud` CLI installed and authenticated
- Existing Cloud Run service (optional but recommended)

## Step 1: Create Cloud SQL Instance (if not exists)
Run the following commands to create a standard PostgreSQL 15+ instance.
*Note: This incurs cost.*

```bash
# Set variables
export PROJECT_ID=$(gcloud config get-value project)
export REGION="us-central1"
export INSTANCE_NAME="intelligent-health-db"
export DB_PASS="your-secure-password" # CHANGE THIS

# Create Instance
gcloud sql instances create $INSTANCE_NAME \
    --database-version=POSTGRES_15 \
    --cpu=1 \
    --memory=4GB \
    --region=$REGION \
    --root-password=$DB_PASS
```

## Step 2: Create Database and User
```bash
# Create specific database
gcloud sql databases create intelligent_health --instance=$INSTANCE_NAME

# (Optional) Create a dedicated service user if you don't want to use postgres root
```

## Step 3: Enable pgvector Extension
You must connect to the database to enable the extension. 
**Option A: Using Cloud SQL Proxy (Recommended for local ops)**
```bash
# 1. Start Proxy
./cloud_sql_proxy -instances=$PROJECT_ID:$REGION:$INSTANCE_NAME=tcp:5432

# 2. Connect and Enable (in another terminal)
psql "host=127.0.0.1 sslmode=disable dbname=intelligent_health user=postgres" -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

**Option B: Using Alembic on Deployment**
We have added a migration script `alembic/versions/*_enable_pgvector_and_embeddings.py`. 
However, the migration user MUST have superuser rights to run `CREATE EXTENSION`. 
If your deployment user is `postgres` (default), step 4 below will handle it automatically.

## Step 4: Configure Cloud Run
Update your Cloud Run service to connect to this new DB.

```bash
gcloud run services update intelligent-health-api \
    --add-cloudsql-instances=$PROJECT_ID:$REGION:$INSTANCE_NAME \
    --set-env-vars="DATABASE_URL=postgresql+psycopg2://postgres:$DB_PASS@/$INSTANCE_NAME?host=/cloudsql/$PROJECT_ID:$REGION:$INSTANCE_NAME" \
    --region=$REGION
```

## Step 5: Run Migrations
You need to apply the schema changes (including the `pgvector` table creation).

**From Local (with Proxy running):**
```bash
# Ensure DATABASE_URL points to localhost in your .env temporarily
# DATABASE_URL=postgresql://postgres:pass@localhost:5432/intelligent_health
alembic upgrade head
```

**From Cloud Run Job (Advanced):**
Create a Cloud Run Job that runs `alembic upgrade head` using the same image and env vars.

## Step 6: Verify
1. Log into the app.
2. Upload a document or chat with an Agent.
3. The system should now print "Using PGVectorStore for RAG" in the logs.
4. Restart the Cloud Run service. The knowledge should persist.

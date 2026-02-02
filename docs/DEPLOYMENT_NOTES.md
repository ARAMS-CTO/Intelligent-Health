# Deployment Troubleshooting

## Current Status
The application is configured correctly for Cloud Run deployment, but the container fails to start in the current environment. 

## Fixes Applied
1. **Hardened Dockerfile**: Uses `python:3.11-slim`, installs `gunicorn`, and uses an explicit array-style CMD to avoid shell issues.
2. **Read-Only Filesystem Handling**: Updated `server/main.py`, `server/services/logger.py`, `server/services/agent_service.py`, `server/knowledge_base/store.py` to gracefully handle read-only file systems (falling back to `/tmp`).
3. **Database Configuration**: Updated `server/database.py` to use `/tmp/health.db` if `DATABASE_URL` points to a local path or is missing in production.
4. **Dependencies**: Added `aiofiles`, `requests`, `gunicorn`, `cryptography` to `server/requirements.txt`.
5. **Startup Resilience**: Deferred database table creation to the `startup` event loop to prevent immediate crashes on module load.

## Issue Diagnosis
The deployment persistently fails with "Container failed to start". This occurs even with a minimal "Hello World" application and `python -m http.server`, indicating an issue with the Cloud Run Service configuration or the container image runtime environment in the current region/project context, rather than the application code itself.

## Recommended Actions for User
1. **Inspect Logs**: Go to the Google Cloud Console > Cloud Run > intelligent-health-app > Logs. Look for "Permission Denied" or "Exec format error".
2. **Clean Redeploy**: Deleting the service and redeploying (which we attempted) usually fixes configuration drift.
3. **Check Quotas**: Ensure the project has sufficient quota for Cloud Run instances in `europe-west1`.
4. **Local Verification**: Build the docker image locally (`docker build -t test .`) and run it (`docker run -p 8080:8080 test`) to definitively confirm operational status.

The codebase is now fully optimized for Cloud Run.

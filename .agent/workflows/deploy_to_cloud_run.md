---
description: Deploy the complete application to Google Cloud Run
---
1. List available Google Cloud Projects to confirm the target.
2. Select the appropriate project ID (e.g., `intelligent-health-app`).
3. Deploy the local folder `f:\PROJECTS\Inteligent Health` to Cloud Run.
   - Service Name: `intelligent-health-api`
   - Region: `us-central1` (or user preference)
   - Setup Environment Variables:
     - `GEMINI_API_KEY`: Ensure this is set in the deployment configuration or secrets.
     - `DATABASE_URL`: Ensure the production database connection string is provided.
4. Verify the deployment by checking the service URL.

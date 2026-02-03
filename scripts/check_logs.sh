#!/bin/bash
echo "Fetching Startup Error Logs for intelligent-health-app..."
echo "---------------------------------------------------------"
# Filter for logs from the last 15 minutes, showing crashes or errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=intelligent-health-app AND severity>=ERROR OR textPayload:\"ConnectError\" OR textPayload:\"ModuleNotFoundError\"" --limit 30 --format="value(textPayload)" --project=intelligent-health-ai
echo "---------------------------------------------------------"
echo "If the above is empty, the app might be failing silently or timing out."

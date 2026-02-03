#!/bin/bash
echo "Fetching recent crash logs for intelligent-health-app..."
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=intelligent-health-app AND severity>=ERROR" --limit 20 --format="table(timestamp,textPayload)"

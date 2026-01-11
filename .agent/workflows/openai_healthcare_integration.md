---
description: How to configure and use OpenAI for Healthcare Integration
---

# OpenAI for Healthcare Integration Guide

## Overview
This workflow describes how to enable and use the "External Intelligence" features powered by OpenAI's Healthcare models (GPT-5 or GPT-4o optimized). This integration allows for:
- **Second Opinion Consults**: Cross-referencing cases with global guidelines.
- **Clinical Documentation**: Automated note generation using healthcare-specific templates.
- **Evidence-Based Insights**: Accessing peer-reviewed research context.

## Prerequisites
1.  **OpenAI API Key**: You must have a valid OpenAI API Key. For HIPAA compliance and access to specific healthcare models, you need an Enterprise agreement with OpenAI (OpenAI for Healthcare program).
2.  **Environment Variable**: The key must be set in your Cloud Run environment.

## 1. Configure API Key
Set the `OPENAI_API_KEY` environment variable in Google Cloud Run.

```bash
gcloud run services update intelligent-health-app \
  --update-env-vars OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE \
  --region us-central1
```

## 2. Using the API
The backend exposes two new endpoints under `/api/external_ai`:

### Clinical Consult
**Endpoint**: `POST /api/external_ai/consult`
**Permissions**: Doctor, Noise, Admin
**Payload**:
```json
{
  "query": "Patient presents with... what are the differential diagnoses?",
  "context": "Patient ID: 123, Age: 45, History of...",
  "patient_id": "optional-id"
}
```

### Note Generation
**Endpoint**: `POST /api/external_ai/generate_note`
**Payload**:
```json
{
  "note_type": "Discharge Summary",
  "patient_details": "Patient recovered from..."
}
```

## 3. Privacy & Compliance Note
*   **Data Handling**: This integration sends data to OpenAI's API. Ensure your BAA (Business Associate Agreement) with OpenAI covers this usage if PHI (Protected Health Information) is involved.
*   **De-identification**: It is recommended to send anonymized `context` unless a BAA is in place.

## 4. Frontend Integration
To add this to the frontend:
1.  Use `DataService.consultExternalAI(query, context)` (needs to be added to `api.ts`).
2.  Add a "Get Second Opinion" button in the Case Management view.

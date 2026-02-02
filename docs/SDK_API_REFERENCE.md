# Intelligent Health SDK - API Reference

## Base URL
```
Production: https://api.intelligent-health.app
Sandbox: https://sandbox-api.intelligent-health.app
```

## Authentication

All SDK endpoints require authentication via API key in the Authorization header:

```http
Authorization: Bearer ih_live_your_api_key_here
```

**Security Notes:**
- API keys are shown only once during generation
- Store keys securely (environment variables, secret managers)
- Never commit keys to version control
- Rotate keys every 90 days
- Use different keys for production and testing

## Rate Limiting

- Default: 1,000 requests per hour
- Custom limits available for high-volume partners
- Rate limit info returned in response headers:
  - `X-RateLimit-Limit`: Requests per hour
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## API Endpoints

### 1. Device Registration

Register a new device with the platform before it can submit data.

**Endpoint:** `POST /api/sdk/v1/devices/register`

**Request:**
```json
{
  "device_id": "BP-2000-SN123456",
  "device_type": "blood_pressure_monitor",
  "manufacturer": "YourCompany",
  "model": "BP-2000",
  "firmware_version": "1.0.2",
  "serial_number": "SN123456",
  "capabilities": ["bluetooth", "wifi", "offline_storage"]
}
```

**Response:**
```json
{
  "device_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "device_id": "BP-2000-SN123456",
  "status": "registered",
  "message": "Device registered successfully"
}
```

**Field Descriptions:**
- `device_id`: Unique identifier for the device (manufacturer-defined)
- `device_type`: Category of device (See Device Types section)
- `manufacturer`: Your company name
- `model`: Device model number
- `firmware_version`: Current firmware version
- `serial_number`: Physical device serial number (optional)
- `capabilities`: Array of device capabilities

---

### 2. Submit Health Data

Submit health measurements from a registered device.

**Endpoint:** `POST /api/sdk/v1/data/submit`

**Request:**
```json
{
  "patient_id": "patient-uuid-here",
  "measurements": [
    {
      "device_id": "BP-2000-SN123456",
      "type": "blood_pressure",
      "timestamp": "2026-01-13T00:00:00Z",
      "values": {
        "systolic": 120,
        "diastolic": 80,
        "pulse": 72
      },
      "unit": "mmHg",
      "device_metadata": {
        "battery_level": 85,
        "signal_strength": "good"
      }
    }
  ]
}
```

**FHIR-Compliant Format (Preferred):**
```json
{
  "patient_id": "patient-uuid-here",
  "measurements": [
    {
      "device_id": "BP-2000-SN123456",
      "type": "blood_pressure",
      "timestamp": "2026-01-13T00:00:00Z",
      "fhir_observation": {
        "resourceType": "Observation",
        "status": "final",
        "category": [{
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/observation-category",
            "code": "vital-signs"
          }]
        }],
        "code": {
          "coding": [{
            "system": "http://loinc.org",
            "code": "85354-9",
            "display": "Blood pressure panel"
          }]
        },
        "effectiveDateTime": "2026-01-13T00:00:00Z",
        "component": [
          {
            "code": {
              "coding": [{
                "system": "http://loinc.org",
                "code": "8480-6",
                "display": "Systolic blood pressure"
              }]
            },
            "valueQuantity": {
              "value": 120,
              "unit": "mmHg",
              "system": "http://unitsofmeasure.org",
              "code": "mm[Hg]"
            }
          },
          {
            "code": {
              "coding": [{
                "system": "http://loinc.org",
                "code": "8462-4",
                "display": "Diastolic blood pressure"
              }]
            },
            "valueQuantity": {
              "value": 80,
              "unit": "mmHg",
              "system": "http://unitsofmeasure.org",
              "code": "mm[Hg]"
            }
          }
        ]
      }
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "submissions_created": 1,
  "submission_ids": ["sub_abc123xyz"]
}
```

---

### 3. Get Device Status

Check the current status of a registered device.

**Endpoint:** `GET /api/sdk/v1/devices/{device_id}/status`

**Response:**
```json
{
  "device_id": "BP-2000-SN123456",
  "status": "active",
  "device_type": "blood_pressure_monitor",
  "manufacturer": "YourCompany",
  "model": "BP-2000",
  "firmware_version": "1.0.2",
  "patient_linked": true,
  "registered_at": "2026-01-01T10:00:00Z",
  "last_seen_at": "2026-01-13T00:00:00Z"
}
```

---

### 4. Update Device Information

Update device firmware version or status.

**Endpoint:** `PATCH /api/sdk/v1/devices/{device_id}`

**Request:**
```json
{
  "firmware_version": "1.0.3",
  "status": "active"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Device updated"
}
```

---

### 5. Get Device Data History

Retrieve recent measurements from a device.

**Endpoint:** `GET /api/sdk/v1/devices/{device_id}/data?limit=100`

**Response:**
```json
{
  "device_id": "BP-2000-SN123456",
  "total_records": 50,
  "data": [
    {
      "id": "sub_abc123",
      "timestamp": "2026-01-13T00:00:00Z",
      "data_type": "blood_pressure",
      "values": {
        "systolic": 120,
        "diastolic": 80
      },
      "unit": "mmHg"
    }
  ]
}
```

---

### 6. Check Firmware Update

Check if a firmware update is available for the device.

**Endpoint:** `GET /api/sdk/v1/firmware/check?device_id={device_id}&current_version={version}`

**Response:**
```json
{
  "update_available": true,
  "current_version": "1.0.2",
  "latest_version": "1.0.5",
  "download_url": "https://cdn.intelligent-health.app/firmware/bp-2000/1.0.5.bin",
  "release_notes": "Bug fixes and performance improvements",
  "message": "Update available"
}
```

---

## Device Types

Supported device categories and their identifiers:

| Category | Identifier | Examples |
|----------|-----------|----------|
| Vital Signs | `blood_pressure_monitor` | BP monitors, pulse oximeters |
| | `heart_rate_monitor` | ECG devices, chest straps |
| | `thermometer` | Digital thermometers |
| Metabolic | `glucometer` | Blood glucose meters |
| | `weight_scale` | Smart scales |
| Activity | `fitness_tracker` | Step counters, activity bands |
| | `sleep_monitor` | Sleep tracking devices |
| Specialized | `spirometer` | Lung function testers |
| | `cgm` | Continuous glucose monitors |

---

## Data Types

Standard measurement types and their units:

| Type | Unit | Example Values |
|------|------|---------------|
| `blood_pressure` | `mmHg` | `{"systolic": 120, "diastolic": 80}` |
| `heart_rate` | `bpm` | `{"pulse": 72}` |
| `glucose` | `mg/dL` | `{"glucose": 95}` |
| `weight` | `kg` | `{"weight": 70.5}` |
| `temperature` | `°C` | `{"temperature": 37.0}` |
| `oxygen_saturation` | `%` | `{"spo2": 98}` |
| `steps` | `count` | `{"steps": 10000}` |
| `sleep_minutes` | `minutes` | `{"duration": 480}` |

### Dentistry (Beta)
| Type | ID | Example |
|------|----|---------|
| `tooth_status` | `tooth_number` (1-32) | `{"tooth": 14, "condition": "crown"}` |
| `procedure` | `CDT Code` | `{"code": "D2391", "description": "Resin-based composite"}` |

---

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `401` | Unauthorized | Check API key validity |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Device not registered |
| `429` | Too Many Requests | Rate limit exceeded, wait and retry |
| `400` | Bad Request | Check request format |
| `500` | Internal Server Error | Contact support |

---

## FHIR Compliance

All health data can be submitted in FHIR (Fast Healthcare Interoperability Resources) R4 format. FHIR compliance ensures:
- Standardized data representation
- Interoperability with other health systems
- Clinical validity and accuracy

**Common LOINC Codes:**
- Blood Pressure Panel: `85354-9`
- Systolic BP: `8480-6`
- Diastolic BP: `8462-4`
- Glucose: `2339-0`
- Heart Rate: `8867-4`
- Body Weight: `29463-7`
- Body Temperature: `8310-5`

---

## Best Practices

1. **Timestamp Precision**: Always use ISO 8601 format with timezone
2. **Batch Submissions**: Submit multiple measurements in one request
3. **Error Handling**: Retry failed requests with exponential backoff
4. **Device Heartbeat**: Send status ping every 24 hours
5. **Patient Linking**: Verify patient consent before linking devices
6. **Data Validation**: Validate measurements before submission
7. **Security**: Use TLS 1.3+ for all connections

---

## Webhooks (Coming Soon)

Subscribe to events:
- `device.linked`: Device linked to patient
- `data.processed`: Data processed by AI
- `alert.generated`: Health alert triggered
- `firmware.update_available`: New firmware released

---

## Support

- **Documentation**: https://docs.intelligent-health.app/sdk
- **API Status**: https://status.intelligent-health.app
- **Email**: sdk-support@intelligent-health.app
- **GitHub Issues**: https://github.com/intelligent-health/device-sdk/issues

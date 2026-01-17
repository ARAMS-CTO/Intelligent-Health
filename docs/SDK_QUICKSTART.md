# Hardware SDK Quick Start Guide

Welcome to the Intelligent Health Hardware Integration SDK! This guide will help you integrate your health monitoring device with our platform in 15 minutes.

## Prerequisites

- ✅ Approved partner application
- ✅ API credentials (key + secret)
- ✅ Device with health monitoring capabilities
- ✅ Python 3.8+ or Node.js 16+ (for SDK libraries)

## Step 1: Install the SDK

### Python
```bash
pip install intelligent-health-sdk
```

### Node.js
```bash
npm install @intelligent-health/device-sdk
```

### Embedded C (for IoT devices)
```bash
wget https://sdk.intelligent-health.app/c/latest.tar.gz
tar -xzf latest.tar.gz
```

---

## Step 2: Initialize Authentication

### Python
```python
from intelligent_health_sdk import SDKClient

# Initialize with your credentials
client = SDKClient(
    api_key="ih_live_your_api_key_here",
    environment="production"  # or "sandbox" for testing
)
```

### Node.js
```javascript
const { SDKClient } = require('@intelligent-health/device-sdk');

const client = new SDKClient({
  apiKey: 'ih_live_your_api_key_here',
  environment: 'production'
});
```

---

## Step 3: Register Your Device

```python
# Register device with the platform
device_response = client.register_device({
    "device_id": "BP-2000-SN123456",        # Your unique device ID
    "device_type": "blood_pressure_monitor",
    "manufacturer": "YourCompany",
    "model": "BP-2000",
    "firmware_version": "1.0.2",
    "capabilities": ["bluetooth", "wifi"]
})

print(f"Device registered! Token: {device_response['device_token']}")

# Save the device_token for future data submissions
```

**Important:** Only register each device once. Store the device_token securely.

---

## Step 4: Submit Health Data

### Simple Format
```python
# Submit blood pressure reading
submission = client.submit_data({
    "patient_id": "patient-uuid-from-app",
    "measurements": [{
        "device_id": "BP-2000-SN123456",
        "type": "blood_pressure",
        "timestamp": "2026-01-13T10:30:00Z",
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
    }]
})

print(f"Data submitted! IDs: {submission['submission_ids']}")
```

### FHIR Format (Recommended)
```python
# FHIR-compliant submission
fhir_observation = {
    "resourceType": "Observation",
    "status": "final",
    "code": {
        "coding": [{
            "system": "http://loinc.org",
            "code": "85354-9",
            "display": "Blood pressure panel"
        }]
    },
    "effectiveDateTime": "2026-01-13T10:30:00Z",
    "component": [
        {
            "code": {"coding": [{"system": "http://loinc.org", "code": "8480-6"}]},
            "valueQuantity": {"value": 120, "unit": "mmHg"}
        },
        {
            "code": {"coding": [{"system": "http://loinc.org", "code": "8462-4"}]},
            "valueQuantity": {"value": 80, "unit": "mmHg"}
        }
    ]
}

submission = client.submit_data({
    "patient_id": "patient-uuid-from-app",
    "measurements": [{
        "device_id": "BP-2000-SN123456",
        "type": "blood_pressure",
        "timestamp": "2026-01-13T10:30:00Z",
        "fhir_observation": fhir_observation
    }]
})
```

---

## Step 5: Check Device Status

```python
# Get device info
status = client.get_device_status("BP-2000-SN123456")

print(f"Status: {status['status']}")
print(f"Last seen: {status['last_seen_at']}")
print(f"Patient linked: {status['patient_linked']}")
```

---

## Complete Example: Blood Pressure Monitor

```python
from intelligent_health_sdk import SDKClient
from datetime import datetime

# Initialize
client = SDKClient(api_key="ih_live_your_key_here")

# Register device (first time only)
try:
    device = client.register_device({
        "device_id": "BP-2000-SN123456",
        "device_type": "blood_pressure_monitor",
        "manufacturer": "HealthTech Inc",
        "model": "BP-2000",
        "firmware_version": "1.0.2"
    })
    print("Device registered!")
except Exception as e:
    print(f"Device may already be registered: {e}")

# Simulate taking a measurement
def take_measurement():
    return {
        "systolic": 120,
        "diastolic": 80,
        "pulse": 72,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# Submit measurement
measurement = take_measurement()
result = client.submit_data({
    "patient_id": "patient-uuid-here",  # Get from your app
    "measurements": [{
        "device_id": "BP-2000-SN123456",
        "type": "blood_pressure",
        "timestamp": measurement["timestamp"],
        "values": {
            "systolic": measurement["systolic"],
            "diastolic": measurement["diastolic"],
            "pulse": measurement["pulse"]
        },
        "unit": "mmHg",
        "device_metadata": {
            "battery_level": 85,
            "firmware_version": "1.0.2"
        }
    }]
})

print(f"✅ Measurement submitted successfully!")
print(f"Submission IDs: {result['submission_ids']}")
```

---

## Error Handling

```python
from intelligent_health_sdk import SDKClient, SDKError

client = SDKClient(api_key="your_key")

try:
    client.submit_data({...})
except SDKError as e:
    if e.status_code == 429:
        print("Rate limit exceeded, waiting...")
        time.sleep(60)
        # Retry
    elif e.status_code == 401:
        print("Invalid API key")
    else:
        print(f"Error: {e.message}")
```

---

## Real-time Sync (Advanced)

For continuous monitoring devices (CGM, ECG):

```python
from intelligent_health_sdk import RealtimeSync

sync = RealtimeSync(
    api_key="your_key",
    device_id="CGM-001"
)

# Set up event handlers
@sync.on_patient_linked
def handle_link(patient_id):
    print(f"Device linked to patient: {patient_id}")
    # Start streaming data

@sync.on_disconnect
def handle_disconnect():
    print("Connection lost, buffering data...")
    sync.buffer_offline_data()

# Start streaming
sync.connect()
```

---

## Testing in Sandbox

1. Change environment to `sandbox`:
   ```python
   client = SDKClient(
       api_key="ih_test_sandbox_key",
       environment="sandbox"
   )
   ```

2. Use test patient ID: `test-patient-001`

3. Sandbox data is isolated and reset daily

---

## Common Device Types

### Blood Pressure Monitor
```python
{
    "device_type": "blood_pressure_monitor",
    "measurements": {"systolic": 120, "diastolic": 80},
    "unit": "mmHg"
}
```

### Glucometer
```python
{
    "device_type": "glucometer",
    "measurements": {"glucose": 95},
    "unit": "mg/dL"
}
```

### Weight Scale
```python
{
    "device_type": "weight_scale",
    "measurements": {"weight": 70.5, "body_fat": 18.2},
    "unit": "kg"
}
```

### Pulse Oximeter
```python
{
    "device_type": "pulse_oximeter",
    "measurements": {"spo2": 98, "pulse": 72},
    "unit": "%"
}
```

---

## Next Steps

✅ **You're ready to integrate!** Here's what to do next:

1. **Test Integration**: Use sandbox environment to test
2. **Clinical Validation**: Ensure measurement accuracy
3. **Security Audit**: Complete our security checklist
4. **Certification**: Submit for final approval
5. **Marketplace Listing**: Get listed when we reach 100K users

---

## Resources

- 📘 [Full API Reference](./SDK_API_REFERENCE.md)
- 🔧 [GitHub SDK Repository](https://github.com/intelligent-health/device-sdk)
- 🐛 [Report Issues](https://github.com/intelligent-health/device-sdk/issues)
- 💬 [Developer Community](https://community.intelligent-health.app)
- 📧 [SDK Support](mailto:sdk-support@intelligent-health.app)

---

## Troubleshooting

### "Invalid API Key"
- Verify key starts with `ih_live_` or `ih_test_`
- Check if key is active in partner dashboard
- Ensure key hasn't expired

### "Device not found"
- Register device first using `register_device()`
- Check device_id matches exactly

### "Rate limit exceeded"
- Default limit: 1,000 requests/hour
- Implement exponential backoff
- Contact us for higher limits

### "Patient not found"
- Verify patient_id is correct UUID
- Ensure patient has consented to device linking

---

**Need help?** Contact sdk-support@intelligent-health.app

"""
Helper functions for SDK operations
"""
import hashlib
import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from server.models import PartnerAPIKey, PartnerApplication

def generate_api_credentials(application_id: str, key_name: str = "Production Key") -> tuple:
    """
    Generate API key and secret for approved partners.
    Returns (api_key, api_secret, hashed_key, hashed_secret)
    """
    # Generate random keys
    api_key = f"ih_live_{secrets.token_urlsafe(32)}"
    api_secret = secrets.token_urlsafe(48)
    
    # Hash for storage
    hashed_key = hashlib.sha256(api_key.encode()).hexdigest()
    hashed_secret = hashlib.sha256(api_secret.encode()).hexdigest()
    
    return api_key, api_secret, hashed_key, hashed_secret

def create_api_key_for_partner(
    db: Session,
    application_id: str,
    key_name: str = "Production Key",
    rate_limit: int = 1000,
    expires_in_days: int = 365
):
    """
    Create API key for approved partner application.
    """
    api_key, api_secret, hashed_key, hashed_secret = generate_api_credentials(application_id, key_name)
    
    key_record = PartnerAPIKey(
        application_id=application_id,
        api_key=hashed_key,
        api_secret=hashed_secret,
        key_name=key_name,
        is_active=True,
        rate_limit=rate_limit,
        scopes=["device:register", "data:write", "data:read"],
        expires_at=datetime.utcnow() + timedelta(days=expires_in_days)
    )
    
    db.add(key_record)
    db.commit()
    db.refresh(key_record)
    
    return {
        "key_id": key_record.id,
        "api_key": api_key,  # Return unhashed key ONCE
        "api_secret": api_secret,  # Return unhashed secret ONCE
        "key_name": key_name,
        "rate_limit": rate_limit,
        "expires_at": key_record.expires_at
    }

def validate_fhir_observation(observation: dict) -> bool:
    """
    Validate FHIR Observation resource format.
    """
    required_fields = ["resourceType", "status", "code"]
    
    for field in required_fields:
        if field not in observation:
            return False
    
    if observation["resourceType"] != "Observation":
        return False
    
    return True

def convert_to_fhir(data_type: str, values: dict, timestamp: datetime, unit: str) -> dict:
    """
    Convert simple measurement to FHIR Observation format.
    """
    observation = {
        "resourceType": "Observation",
        "status": "final",
        "category": [{
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "vital-signs",
                "display": "Vital Signs"
            }]
        }],
        "effectiveDateTime": timestamp.isoformat(),
    }
    
    # Map common data types to LOINC codes
    loinc_mapping = {
        "blood_pressure": {
            "code": "85354-9",
            "display": "Blood pressure panel"
        },
        "glucose": {
            "code": "2339-0",
            "display": "Glucose"
        },
        "heart_rate": {
            "code": "8867-4",
            "display": "Heart rate"
        },
        "weight": {
            "code": "29463-7",
            "display": "Body weight"
        },
        "temperature": {
            "code": "8310-5",
            "display": "Body temperature"
        }
    }
    
    if data_type in loinc_mapping:
        observation["code"] = {
            "coding": [{
                "system": "http://loinc.org",
                "code": loinc_mapping[data_type]["code"],
                "display": loinc_mapping[data_type]["display"]
            }]
        }
    
    # Handle blood pressure differently (has components)
    if data_type == "blood_pressure" and "systolic" in values and "diastolic" in values:
        observation["component"] = [
            {
                "code": {
                    "coding": [{
                        "system": "http://loinc.org",
                        "code": "8480-6",
                        "display": "Systolic blood pressure"
                    }]
                },
                "valueQuantity": {
                    "value": values["systolic"],
                    "unit": unit,
                    "system": "http://unitsofmeasure.org",
                    "code": unit
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
                    "value": values["diastolic"],
                    "unit": unit,
                    "system": "http://unitsofmeasure.org",
                    "code": unit
                }
            }
        ]
    else:
        # Single value observation
        value_key = list(values.keys())[0] if values else "value"
        observation["valueQuantity"] = {
            "value": values.get(value_key, 0),
            "unit": unit,
            "system": "http://unitsofmeasure.org",
            "code": unit
        }
    
    return observation

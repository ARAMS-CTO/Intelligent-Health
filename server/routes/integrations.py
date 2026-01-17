from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from pydantic import BaseModel

from ..database import get_db
from ..models import User, HealthIntegration
from .auth import get_current_user
from ..agents.orchestrator import orchestrator

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..database import get_db
from ..models import User, HealthIntegration
from .auth import get_current_user
from ..services.integrations.manager import IntegrationManager
# Import clients to register them
from ..services.integrations.fitbit import FitbitClient
from ..services.integrations.google_health import GoogleHealthClient

# Register Clients
IntegrationManager.register_client(FitbitClient().provider, FitbitClient)
IntegrationManager.register_client(GoogleHealthClient().provider, GoogleHealthClient)

router = APIRouter()

@router.get("/auth/{provider}")
async def get_auth_url(
    provider: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the OAuth2 redirect URL for a specific provider.
    """
    try:
        client = IntegrationManager.get_client(provider)
        # We pass user_id as state to verify on callback
        url = client.get_auth_url(state=current_user.id)
        return {"url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/callback/{provider}")
async def oauth_callback(
    provider: str,
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Handle OAuth2 callback.
    1. Verify state (user_id).
    2. Exchange code for token.
    3. Save Integration record in DB.
    """
    # In a real app, verify state matches a session or authenticated user
    # Here we trust the state is the user_id for simplicity of the mock
    user = db.query(User).filter(User.id == state).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found from state")
        
    try:
        client = IntegrationManager.get_client(provider)
        token_data = client.exchange_code(code)
        
        # Check if integration already exists
        integration = db.query(HealthIntegration).filter(
            HealthIntegration.user_id == user.id,
            HealthIntegration.provider == provider
        ).first()
        
        if not integration:
            integration = HealthIntegration(
                id=f"int-{provider}-{user.id}",
                user_id=user.id,
                provider=provider,
                status="active"
            )
            db.add(integration)
            
        # Update tokens
        integration.access_token = token_data.get("access_token")
        integration.refresh_token = token_data.get("refresh_token")
        integration.status = "active"
        db.commit()
        
        return {"status": "success", "provider": provider}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Integration failed: {e}")

@router.post("/sync/{provider}")
async def trigger_sync(
    provider: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger a data sync for a provider.
    """
    integration = db.query(HealthIntegration).filter(
        HealthIntegration.user_id == current_user.id,
        HealthIntegration.provider == provider
    ).first()
    
    if not integration or integration.status != "active":
        raise HTTPException(status_code=400, detail="Integration not active")
        
    try:
        client = IntegrationManager.get_client(provider)
        # Fetch data for today
        data = client.fetch_data(integration.access_token, "today")
        # Normalize
        fhir_bundle = client.normalize_to_fhir(data)
        
        # Save FHIR data to DB
        # For this mock, we just log it, but in production we'd parse observations
        # and store them in the HealthData or MedicalRecord tables.
        try:
             import json
             from ..models import MedicalRecord
             # Mock: Create a medical record summarizing the sync
             for res in fhir_bundle:
                 if res.get("resourceType") == "Observation":
                     val = res.get("valueQuantity", {}).get("value", 0)
                     unit = res.get("valueQuantity", {}).get("unit", "")
                     code = res.get("code", {}).get("text", "Activity")
                     
                     rec = MedicalRecord(
                         id=f"rec-{provider}-{current_user.id}-{val}", # simple distinct id
                         patient_id=current_user.patient_profile.id if current_user.patient_profile else f"PAT-{current_user.id}",
                         type="Vitals",
                         date=res.get("effectiveDateTime", "2024-01-01")[:10],
                         description=f"Synced from {provider}: {code} - {val} {unit}",
                         doctor_id="system",
                         attachments=[]
                     )
                     # Check dupe?
                     # db.merge(rec) 
                     # For now just print to avoid constraint errors in demo
                     print(f"Synced Record: {rec.description}")
        except Exception as data_err:
             print(f"Data Sync persistence warning: {data_err}")

        return {"status": "synced", "records_count": len(fhir_bundle), "sample": fhir_bundle[:1]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


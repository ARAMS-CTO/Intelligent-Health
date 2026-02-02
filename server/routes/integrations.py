from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
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
    redirect_url: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get the OAuth2 redirect URL for a specific provider.
    """
    try:
        client = IntegrationManager.get_client(provider)
        
        # Encode state with user_id and optional return url
        import json
        import base64
        
        state_dict = {"uid": current_user.id}
        if redirect_url:
            state_dict["ret"] = redirect_url
            
        state_json = json.dumps(state_dict)
        state_encoded = base64.urlsafe_b64encode(state_json.encode()).decode()
        
        url = client.get_auth_url(state=state_encoded)
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
    4. Sync Initial Data immediately.
    """
    # Parse State
    import json
    import base64
    import os
    from fastapi.responses import RedirectResponse
    
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173") # Default
    user_id = state # Fallback
    
    try:
        # Try decoding state
        decoded = base64.urlsafe_b64decode(state).decode()
        state_data = json.loads(decoded)
        user_id = state_data.get("uid")
        if state_data.get("ret"):
             frontend_url = state_data.get("ret")
             # Ensure no trailing slash for clean append
             if frontend_url.endswith("/"): frontend_url = frontend_url[:-1]
    except:
        # If decode fails, assume it's just raw user_id from legacy request
        pass
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # Fallback redirect to login?
        return RedirectResponse(f"{frontend_url}/login?error=user_not_found")
        
    try:
        print(f"DEBUG: Processing OAuth Callback for {provider}")
        client = IntegrationManager.get_client(provider)
        token_data = client.exchange_code(code)
        
        print(f"DEBUG: Token exchanged successfully. Keys: {list(token_data.keys())}")

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
        db.commit() # Save token first
        
        # --- IMMEDIATE SYNC ---
        try:
             print("DEBUG: Triggering immediate initial sync...")
             # Fetch data for today
             data = client.fetch_data(integration.access_token, "today")
             fhir_bundle = client.normalize_to_fhir(data)
             
             # Save
             from ..models import MedicalRecord
             count = 0
             for res in fhir_bundle:
                 if res.get("resourceType") == "Observation":
                     val = res.get("valueQuantity", {}).get("value", 0)
                     unit = res.get("valueQuantity", {}).get("unit", "")
                     code_text = res.get("code", {}).get("text", "Activity")
                     
                     rec_id = f"rec-{provider}-{user.id}-{val}-{code_text.replace(' ', '')}"
                     
                     rec = MedicalRecord(
                         id=rec_id, 
                         patient_id=user.patient_profile.id if user.patient_profile else None,
                         uploader_id=user.id,
                         type="Vitals",
                         title=f"Synced {code_text} from {provider}",
                         content_text=f"Value: {val} {unit}\nSource: {provider}\nDate: {res.get('effectiveDateTime', 'N/A')}",
                         ai_summary=f"Automated Import: {val} {unit}",
                         metadata_={
                            "source": provider, 
                            "code": code_text, 
                            "value": val, 
                            "unit": unit,
                            "effectiveDateTime": res.get("effectiveDateTime")
                         }
                     )
                     
                     existing_rec = db.query(MedicalRecord).filter(MedicalRecord.id == rec_id).first()
                     if not existing_rec:
                         db.add(rec)
                         count += 1
             
             db.commit()
             print(f"DEBUG: Initial Sync Saved {count} records.")
             
        except Exception as sync_err:
             print(f"DEBUG: Initial Sync Error (Non-Critical): {sync_err}")
             # Don't fail the whole callback, just log
        
        print(f"DEBUG: Data Saved. Redirecting to {frontend_url}...")

        return RedirectResponse(f"{frontend_url}/integrations?status=success&provider={provider}")
        
    except ValueError as e:
        print(f"DEBUG: OAuth Error Value: {e}")
        return RedirectResponse(f"{frontend_url}/integrations?error={str(e)}")
    except Exception as e:
        print(f"DEBUG: OAuth Error General: {e}")
        # Return simple HTML or Redirect
        return RedirectResponse(f"{frontend_url}/integrations?error=server_error")

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
                         patient_id=current_user.patient_profile.id if current_user.patient_profile else None,
                         uploader_id=current_user.id,
                         type="Vitals",
                         title=f"Synced {code} from {provider}",
                         content_text=f"Value: {val} {unit}\nSource: {provider}\nDate: {res.get('effectiveDateTime', 'N/A')}",
                         ai_summary=f"Automated Import: {val} {unit}",
                         metadata_={
                            "source": provider, 
                            "code": code, 
                            "value": val, 
                            "unit": unit,
                            "effectiveDateTime": res.get("effectiveDateTime")
                         }
                     )
                     
                     # Simple dedup check (optional, here we rely on ID or just log)
                     # In a real app, use db.merge or check existing ID
                     existing_rec = db.query(MedicalRecord).filter(MedicalRecord.id == rec.id).first()
                     if not existing_rec:
                         db.add(rec)
                         db.commit()
                         print(f"Synced Record Saved: {rec.title}")
                     else:
                         print(f"Skipped duplicate record: {rec.id}")
        except Exception as data_err:
             print(f"Data Sync persistence warning: {data_err}")

        return {"status": "synced", "records_count": len(fhir_bundle), "sample": fhir_bundle[:1]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# --- Simple Integation Management for External AI ---
class ConnectRequest(BaseModel):
    provider: str # 'openai', 'claude'

@router.get("/list")
async def list_integrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all integrations and their status for the current user."""
    integrations = db.query(HealthIntegration).filter(
        HealthIntegration.user_id == current_user.id
    ).all()
    
    return [
        {"provider": i.provider, "status": i.status, "synced_at": i.last_sync_timestamp} 
        for i in integrations
    ]

@router.post("/connect_ai")
async def connect_ai_provider(
    request: ConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Connect a server-managed External AI Provider (Opt-In).
    Verified against server environment variables.
    """
    import os
    provider = request.provider.lower()
    
    # 1. Verify Availability (Real Check)
    if provider == "openai":
         if not os.environ.get("OPENAI_API_KEY"):
             raise HTTPException(status_code=400, detail="OpenAI Health is not configured on this server.")
    elif provider == "claude":
         if not os.environ.get("ANTHROPIC_API_KEY"):
             raise HTTPException(status_code=400, detail="Claude Healthcare is not configured on this server.")
    else:
         raise HTTPException(status_code=400, detail="Unknown Provider")
         
    # 2. Record Integration
    existing = db.query(HealthIntegration).filter(
        HealthIntegration.user_id == current_user.id,
        HealthIntegration.provider == provider
    ).first()
    
    if existing:
        existing.status = "active"
    else:
        new_int = HealthIntegration(
            id=f"int-{provider}-{current_user.id}",
            user_id=current_user.id,
            provider=provider,
            status="active"
        )
        db.add(new_int)
        
    db.commit()
    return {"status": "connected", "provider": provider}

@router.post("/disconnect_ai")
async def disconnect_ai_provider(
    request: ConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    provider = request.provider.lower()
    existing = db.query(HealthIntegration).filter(
        HealthIntegration.user_id == current_user.id,
        HealthIntegration.provider == provider
    ).first()
    
    if existing:
        existing.status = "disconnected"
        db.commit()
        
    return {"status": "disconnected", "provider": provider}

class ExternalAIPayload(BaseModel):
    provider: str # 'openai_health', 'claude_healthcare'
    patient_email: str
    data_type: str # 'summary', 'alert', 'recommendation'
    content: Dict[str, Any]
    timestamp: Optional[str] = None

@router.post("/webhook/external_ai")
async def receive_external_ai_data(
    payload: ExternalAIPayload,
    db: Session = Depends(get_db)
):
    """
    Webhook to receive data from connected External AI agents.
    """
    # 1. Find User/Patient
    # Assuming email linking for simplicity
    user = db.query(User).filter(User.email == payload.patient_email).first()
    if not user:
        # Try to find user via patient profile if email matches?
        # Or just log error
        raise HTTPException(status_code=404, detail="User not found for provided email")
        
    patient_id = None
    if user.patient_profile:
        patient_id = user.patient_profile.id
    else:
        # Fallback search or create?
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # 2. Save to MedicalRecord
    import uuid
    from datetime import datetime
    from ..services.agent_service import agent_service
    
    try:
        # Create a summary string from content
        summary_text = f"External Insight from {payload.provider}: {payload.data_type}"
        content_text = str(payload.content)
        
        # Use existing model fields
        record = MedicalRecord(
            id=f"ext-{uuid.uuid4()}",
            patient_id=patient_id,
            uploader_id=user.id, # Attributed to user themselves or system? User owning the data.
            type=f"External AI - {payload.provider}",
            title=f"Insight: {payload.data_type.capitalize()}",
            content_text=content_text,
            ai_summary=summary_text,
            created_at=datetime.utcnow(),
            metadata_={"provider": payload.provider, "raw_timestamp": payload.timestamp}
        )
        
        db.add(record)
        db.commit()
        db.refresh(record)
        
        # 3. Index for RAG
        # This ensures OUR Agent can see this new data immediately
        agent_service.index_medical_record(
            user_id=user.id,
            record_id=record.id,
            content=f"Received from {payload.provider}: {content_text}",
            summary=summary_text
        )
        
        return {"status": "success", "record_id": record.id}
        
    except Exception as e:
        print(f"Error saving external AI data: {e}")
        raise HTTPException(status_code=500, detail="Failed to save data")

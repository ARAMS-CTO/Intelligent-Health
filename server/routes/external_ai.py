
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from .auth import get_current_user
from ..integrations.openai_client import consult_openai_health, generate_clinical_note_template

router = APIRouter()

class ConsultRequest(BaseModel):
    query: str
    context: Optional[str] = None
    patient_id: Optional[str] = None

class DocumentationRequest(BaseModel):
    note_type: str # 'Progres Note', 'Discharge Summary'
    patient_details: str

@router.post("/consult")
async def consult_external_ai(
    request: ConsultRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Connects to OpenAI for Healthcare models to get a second opinion or guidelines check.
    """
    # Verify Permissions (Doctors/Nurses only)
    if current_user.role not in ["Doctor", "Nurse", "Specialist", "Admin"]:
        raise HTTPException(status_code=403, detail="Access to External Clinical AI is restricted to clinical staff.")

    response = await consult_openai_health(query=request.query, context=request.context)
    
    if response["status"] == "config_missing":
        # Return a friendly message for the demo if not configured
        return {
            "source": "OpenAI (Simulated)",
            "data": "The OpenAI integration is ready but requires an API Key. Please configure OPENAI_API_KEY to receive live insights from GPT-5.2 Healthcare models.",
            "status": "simulated"
        }
        
    return response

@router.post("/generate_note")
async def generate_note(
    request: DocumentationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generates clinical documentation using OpenAI.
    """
    content = await generate_clinical_note_template(request.note_type, request.patient_details)
    return {"content": content}

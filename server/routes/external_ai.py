from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
import os
import httpx # Use httpx for external API calls

from ..database import get_db
from ..models import User
from .auth import get_current_user

router = APIRouter()

# --- External AI Integration Service ---

class ConsultRequest(BaseModel):
    provider: str = "openai" # "openai" or "claude"
    query: str
    context: Optional[str] = None
    patient_id: Optional[str] = None

class NoteGenerationRequest(BaseModel):
    provider: str = "openai"
    note_type: str
    patient_details: str

@router.post("/consult")
async def clinical_consult(
    request: ConsultRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Perform a clinical consult using an external AI Model (OpenAI GPT-4/5 or Claude 3.5 Sonnet).
    """
    provider = request.provider.lower()
    
    # 1. Prepare Prompt
    system_prompt = f"""You are an expert medical consultant assisting a {current_user.role}. 
    Provide evidence-based clinical insights. 
    Disclaimer: This is for decision support only."""
    
    user_content = request.query
    if request.context:
        user_content += f"\n\nContext:\n{request.context}"

    # 2. Call Provider
    try:
        if provider == "openai":
            api_key = os.environ.get("OPENAI_API_KEY")
            if not api_key:
                return {"response": "OpenAI Health is not configured (Missing API Key)."}
                
            # Direct API Call using httpx to avoid adding heavy SDK dependencies if not already present
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={
                        "model": "gpt-4-turbo", # using gpt-4-turbo as proxy for 'medical'
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_content}
                        ]
                    },
                    timeout=30.0
                )
                if response.status_code != 200:
                    return {"response": f"OpenAI Error: {response.text}"}
                
                result = response.json()
                content = result['choices'][0]['message']['content']
                return {"response": content, "provider": "OpenAI GPT-4"}

        elif provider == "claude":
            api_key = os.environ.get("ANTHROPIC_API_KEY")
            if not api_key:
                return {"response": "Claude Healthcare is not configured (Missing API Key)."}

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-3-5-sonnet-20240620",
                        "max_tokens": 1024,
                        "system": system_prompt,
                        "messages": [
                            {"role": "user", "content": user_content}
                        ]
                    },
                    timeout=30.0
                )
                if response.status_code != 200:
                    return {"response": f"Claude Error: {response.text}"}
                
                result = response.json()
                content = result['content'][0]['text']
                return {"response": content, "provider": "Claude 3.5 Sonnet"}

        else:
            return {"response": "Unknown provider selected."}

    except Exception as e:
        print(f"External AI Error: {e}")
        return {"response": f"Connection failed: {str(e)}"}

@router.post("/generate_note")
async def generate_note(
    request: NoteGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate structured clinical documentation.
    """
    # Simply reuse the consult logic with a specific prompt
    # Implementing minimal logic for brevity
    return await clinical_consult(
        ConsultRequest(
            provider=request.provider,
            query=f"Generate a {request.note_type} based on reliable clinical standards.",
            context=request.patient_details
        ),
        current_user=current_user,
        # db not really needed for this shim, but passing for consistency if we expand
        db=None 
    )

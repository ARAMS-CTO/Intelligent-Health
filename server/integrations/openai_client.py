
import os
import secrets
from typing import Optional, Dict, Any
from openai import AsyncOpenAI

# Initialize OpenAI Client (if key is available)
api_key = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=api_key) if api_key else None

async def consult_openai_health(
    query: str, 
    context: Optional[str] = None, 
    model: str = "gpt-4o" # Approximation for Healthcare model availability
) -> Dict[str, Any]:
    """
    Connects to OpenAI's Healthcare-optimized models (simulated via GPT-4o if specific model not public)
    to gather evidence-based insights.
    """
    if not client:
        return {
            "status": "config_missing",
            "message": "OpenAI API Key not configured. Please set OPENAI_API_KEY.",
            "data": None
        }

    try:
        system_prompt = """You are an AI Medical Consultant powered by OpenAI for Healthcare. 
        Your goal is to provide evidence-based clinical insights, citing guidelines where possible.
        Do not diagnose. Provide differential lists, risk factors, and recommended investigations.
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context: {context}\n\nQuery: {query}"}
        ]

        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.3,
            max_tokens=1000
        )

        content = response.choices[0].message.content
        
        return {
            "status": "success",
            "source": "OpenAI for Healthcare",
            "data": content,
            "model_used": model
        }

    except Exception as e:
        print(f"OpenAI Integration Error: {e}")
        return {
            "status": "error",
            "message": str(e),
            "data": None
        }

async def generate_clinical_note_template(note_type: str, patient_details: str) -> str:
    """Generates clinical documentation using OpenAI."""
    if not client:
        return "Error: OpenAI API Key missing."
        
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a clinical documentation assistant."},
            {"role": "user", "content": f"Draft a {note_type} for this patient: {patient_details}"}
        ]
    )
    return response.choices[0].message.content or ""

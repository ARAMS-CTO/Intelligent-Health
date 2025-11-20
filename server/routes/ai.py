from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
from google import genai
from google.genai import types
from ..schemas import Case, AIInsights, ExtractedCaseData, AIContextualSuggestion, SymptomAnalysisResult

router = APIRouter()

# Initialize Gemini
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")
    client = None
else:
    client = genai.Client(api_key=API_KEY)

MODEL_ID = "gemini-2.0-flash"

@router.post("/insights", response_model=AIInsights)
async def get_case_insights(case: Case):
    if not client:
        return {"diagnosisConfidence": 0.0, "patientRisks": ["AI Service Unavailable"], "keySymptoms": []}
    
    prompt = f"""Analyze this clinical case.
    Patient: {case.patientProfile.age}y {case.patientProfile.sex}.
    Complaint: {case.complaint}. History: {case.history}. Findings: {case.findings}.
    Return JSON: {{ "diagnosisConfidence": number (0-1), "patientRisks": string[], "keySymptoms": string[] }}"""

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": types.Type.OBJECT,
                    "properties": {
                        "diagnosisConfidence": {"type": types.Type.NUMBER},
                        "patientRisks": {"type": types.Type.ARRAY, "items": {"type": types.Type.STRING}},
                        "keySymptoms": {"type": types.Type.ARRAY, "items": {"type": types.Type.STRING}}
                    }
                }
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"AI Error: {e}")
        return {"diagnosisConfidence": 0.0, "patientRisks": ["Error generating insights"], "keySymptoms": []}

class ChatRequest(BaseModel):
    history: List[Dict[str, str]]
    message: str
    context: Optional[str] = None

@router.post("/chat")
async def chat(request: ChatRequest):
    if not client:
        return {"response": "AI Service Unavailable"}
    
    try:
        chat_session = client.chats.create(
            model=MODEL_ID,
            config=types.GenerateContentConfig(
                system_instruction=request.context or "You are a helpful medical assistant."
            )
        )
        
        # Replay history if needed (simplified here)
        # for msg in request.history:
        #     chat_session.send_message(msg['content']) # This might need adjustment based on SDK

        response = chat_session.send_message(request.message)
        return {"response": response.text}
    except Exception as e:
        print(f"AI Chat Error: {e}")
        return {"response": "I'm sorry, I encountered an error processing your request."}

class AnalysisRequest(BaseModel):
    text: str

@router.post("/analyze_symptoms", response_model=List[SymptomAnalysisResult])
async def analyze_symptoms(request: AnalysisRequest):
    if not client:
        return []
    
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=f'Analyze symptoms: "{request.text}". Suggest 3 conditions. Return JSON array: [{{ "condition": string, "confidence": number, "explanation": string }}]',
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        return []

@router.post("/extract_case", response_model=ExtractedCaseData)
async def extract_case(request: AnalysisRequest):
    if not client:
        return {}
    
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=f'Extract case details from: "{request.text}". Return JSON: {{ "complaint": string, "history": string, "findings": string, "diagnosis": string, "missing_information": string[] }}',
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except Exception as e:
        return {}

class ImageAnalysisRequest(BaseModel):
    image_data: str
    mime_type: str
    prompt: str

@router.post("/analyze_image")
async def analyze_image(request: ImageAnalysisRequest):
    if not client:
        return {"response": "AI Service Unavailable"}
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[
                types.Part.from_bytes(data=json.loads(request.image_data), mime_type=request.mime_type) if request.mime_type == "application/json" else {"inline_data": {"mime_type": request.mime_type, "data": request.image_data}},
                request.prompt
            ]
        )
        return {"response": response.text}
    except Exception as e:
        print(f"Image Analysis Error: {e}")
        return {"response": "Error analyzing image."}

class TextRequest(BaseModel):
    text: str

@router.post("/clinical_guidelines")
async def clinical_guidelines(request: TextRequest):
    if not client: return {"response": "Service Unavailable"}
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=f"Summarize clinical guidelines for {request.text} in markdown."
        )
        return {"response": response.text}
    except Exception: return {"response": "Error fetching guidelines."}

class ExplainRequest(BaseModel):
    query: str
    patient_name: str

@router.post("/explain_patient")
async def explain_patient(request: ExplainRequest):
    if not client: return {"response": "Service Unavailable"}
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=f'Explain this medical query to patient {request.patient_name}: "{request.query}". Use simple language.'
        )
        return {"response": response.text}
    except Exception: return {"response": "Error generating explanation."}

@router.post("/general_chat")
async def general_chat(request: ChatRequest):
    if not client: return {"response": "Service Unavailable"}
    try:
        chat_session = client.chats.create(
            model=MODEL_ID,
            config=types.GenerateContentConfig(system_instruction="Helpful AI health assistant. General info only.")
        )
        response = chat_session.send_message(request.message)
        return {"response": response.text}
    except Exception: return {"response": "Error in chat."}

class AugmentRequest(BaseModel):
    extracted_data: ExtractedCaseData
    baseline_illnesses: List[str]

@router.post("/augment_case", response_model=List[AIContextualSuggestion])
async def augment_case(request: AugmentRequest):
    if not client: return []
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=f"Given extracted data {request.extracted_data.json()} and patient history {json.dumps(request.baseline_illnesses)}, suggest checks. Return JSON array: [{{ \"suggestion\": string, \"rationale\": string }}]",
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except Exception: return []

@router.post("/search_icd10")
async def search_icd10(request: TextRequest):
    if not client: return []
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=f'Find 5 relevant ICD-10 codes for: "{request.text}". Return JSON array: [{{ "code": string, "description": string }}]',
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except Exception: return []

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
from google import genai
from google.genai import types
from ..schemas import Case, AIInsights, ExtractedCaseData, AIContextualSuggestion, SymptomAnalysisResult
from ..services.agent_service import agent_service
from ..database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter()

# Initialize Gemini
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")
    client = None
else:
    client = genai.Client(api_key=API_KEY)

# Model Configuration
DEFAULT_MODEL = "gemini-2.0-flash"
ADVANCED_MODEL = "gemini-1.5-pro"

class AIRequestBase(BaseModel):
    userId: Optional[str] = "anonymous"
    userRole: Optional[str] = "User"
    model: Optional[str] = DEFAULT_MODEL

@router.post("/insights", response_model=AIInsights)
async def get_case_insights(case: Case, user_id: str = "anonymous", user_role: str = "Doctor", db: Session = Depends(get_db)):
    if not client:
        return {"diagnosisConfidence": 0.0, "patientRisks": ["AI Service Unavailable"], "keySymptoms": []}
    
    # Get personalized context
    context = agent_service.get_system_instruction(user_id, user_role, db)
    
    prompt = f"""{context}
    
    Analyze this clinical case.
    
    Example:
    Patient: 45y Male. Complaint: Chest pain. History: Smoker. Findings: ST elevation.
    Output: {{ "diagnosisConfidence": 0.95, "patientRisks": ["Myocardial Infarction", "Arrhythmia"], "keySymptoms": ["Chest pain", "ST elevation"] }}

    Patient: {case.patientProfile.age}y {case.patientProfile.sex}.
    Complaint: {case.complaint}. History: {case.history}. Findings: {case.findings}.
    
    Provide a diagnosis confidence score (0-1), a list of patient risks, and a list of key symptoms.
    """

    try:
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": types.Type.OBJECT,
                    "properties": {
                        "diagnosisConfidence": {"type": types.Type.NUMBER},
                        "patientRisks": {"type": types.Type.ARRAY, "items": {"type": types.Type.STRING}},
                        "keySymptoms": {"type": types.Type.ARRAY, "items": {"type": types.Type.STRING}}
                    },
                    "required": ["diagnosisConfidence", "patientRisks", "keySymptoms"]
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
    userId: Optional[str] = "anonymous"
    userRole: Optional[str] = "User"
    model: Optional[str] = DEFAULT_MODEL

@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Get personalized system instruction
    system_instruction = agent_service.get_system_instruction(request.userId, request.userRole, db, context_query=request.message)
    
    if request.context:
        system_instruction += f"\n\nContext: {request.context}"

    # Simple "learning" trigger (demo)
    if "prefer" in request.message.lower() or "like" in request.message.lower():
        agent_service.add_learning_point(request.userId, f"User mentioned preference: {request.message}", db)

    try:
        # Construct history for Gemini
        # Gemini expects 'role' (user/model) and 'parts'
        # The frontend sends 'role' (user/model) and 'content' or 'text'
        # We need to adapt it.
        
        chat_history = []
        # Exclude the last message if it matches the current message to avoid duplication
        history_to_process = request.history
        if history_to_process and (history_to_process[-1].get("content") == request.message or history_to_process[-1].get("text") == request.message):
             history_to_process = history_to_process[:-1]

        for msg in history_to_process:
            # Handle different frontend message formats
            role_val = msg.get("role") or msg.get("author")
            if role_val == "system":
                continue # Skip system messages in history
            
            role = "user" if role_val == "user" else "model"
            content = msg.get("content") or msg.get("text") or ""
            chat_history.append(types.Content(role=role, parts=[types.Part.from_text(text=content)]))

        chat_session = client.chats.create(
            model=request.model or DEFAULT_MODEL,
            history=chat_history,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction
            )
        )
        response = chat_session.send_message(request.message)
        return {"response": response.text}
    except Exception as e:
        print(f"Chat Error: {e}")
        return {"response": "I'm sorry, I'm having trouble connecting to the AI service right now."}

class AnalysisRequest(BaseModel):
    text: str

@router.post("/extract_case", response_model=ExtractedCaseData)
async def extract_case(request: AnalysisRequest):
    if not client:
        return {}
    
    try:
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents=f'Extract case details from: "{request.text}".',
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": types.Type.OBJECT,
                    "properties": {
                        "complaint": {"type": types.Type.STRING},
                        "history": {"type": types.Type.STRING},
                        "findings": {"type": types.Type.STRING},
                        "diagnosis": {"type": types.Type.STRING},
                        "missing_information": {"type": types.Type.ARRAY, "items": {"type": types.Type.STRING}}
                    },
                    "required": ["complaint", "history", "findings", "diagnosis", "missing_information"]
                }
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Extraction Error: {e}")
        return {}

@router.post("/analyze_symptoms", response_model=List[SymptomAnalysisResult])
async def analyze_symptoms(request: AnalysisRequest):
    if not client:
        return []

    try:
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents=f'Analyze these symptoms and suggest possible conditions: "{request.text}".',
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": types.Type.ARRAY,
                    "items": {
                        "type": types.Type.OBJECT,
                        "properties": {
                            "condition": {"type": types.Type.STRING},
                            "confidence": {"type": types.Type.NUMBER},
                            "explanation": {"type": types.Type.STRING}
                        },
                        "required": ["condition", "confidence", "explanation"]
                    }
                }
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Symptom Analysis Error: {e}")
        return []

class ImageAnalysisRequest(BaseModel):
    image_data: str
    mime_type: str
    prompt: str

@router.post("/analyze_image")
async def analyze_image(request: ImageAnalysisRequest):
    if not client:
        return {"response": "AI Service Unavailable"}
    try:
        import base64
        if "," in request.image_data:
            header, encoded = request.image_data.split(",", 1)
        else:
            encoded = request.image_data
        image_bytes = base64.b64decode(encoded)
        
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=request.mime_type),
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
            model=DEFAULT_MODEL,
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
            model=DEFAULT_MODEL,
            contents=f'Explain this medical query to patient {request.patient_name}: "{request.query}". Use simple language.'
        )
        return {"response": response.text}
    except Exception: return {"response": "Error generating explanation."}

@router.post("/general_chat")
async def general_chat(request: ChatRequest, db: Session = Depends(get_db)):
    if not client: return {"response": "Service Unavailable"}
    
    # Personalization
    system_instruction = agent_service.get_system_instruction(request.userId, "Health Assistant", db)
    system_instruction += "\nProvide general health information only. Do not provide medical advice."

    # Learning
    if "prefer" in request.message.lower() or "like" in request.message.lower():
        agent_service.add_learning_point(request.userId, f"User mentioned preference: {request.message}", db)

    try:
        chat_history = []
        if request.history:
            # Exclude the last message if it matches the current message to avoid duplication
            history_to_process = request.history
            if history_to_process and (history_to_process[-1].get("content") == request.message or history_to_process[-1].get("text") == request.message):
                history_to_process = history_to_process[:-1]

            for msg in history_to_process:
                role = "user" if msg.get("author") == "user" else "model"
                # Frontend sends 'author': 'user'|'ai', backend expects 'user'|'model'
                # Also frontend AIChatbot sends 'content', AIChat sends 'content' (mapped to 'parts' in /chat)
                # Let's check AIChatbot.tsx: it sends { author: 'user'|'ai', content: string }
                content = msg.get("content") or ""
                chat_history.append(types.Content(role=role, parts=[types.Part.from_text(text=content)]))

        chat_session = client.chats.create(
            model=DEFAULT_MODEL,
            history=chat_history,
            config=types.GenerateContentConfig(system_instruction=system_instruction)
        )
        response = chat_session.send_message(request.message)
        return {"response": response.text}
    except Exception as e: 
        print(f"General Chat Error: {e}")
        return {"response": "Error in chat."}

class AugmentRequest(BaseModel):
    extracted_data: ExtractedCaseData
    baseline_illnesses: List[str]

@router.post("/augment_case", response_model=List[AIContextualSuggestion])
async def augment_case(request: AugmentRequest):
    if not client: return []
    try:
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents=f"Given extracted data {request.extracted_data.json()} and patient history {json.dumps(request.baseline_illnesses)}, suggest checks.",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": types.Type.ARRAY,
                    "items": {
                        "type": types.Type.OBJECT,
                        "properties": {
                            "suggestion": {"type": types.Type.STRING},
                            "rationale": {"type": types.Type.STRING}
                        },
                        "required": ["suggestion", "rationale"]
                    }
                }
            )
        )
        return json.loads(response.text)
    except Exception: return []

@router.post("/search_icd10")
async def search_icd10(request: TextRequest):
    if not client: return []
    try:
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents=f'Find 5 relevant ICD-10 codes for: "{request.text}".',
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": types.Type.ARRAY,
                    "items": {
                        "type": types.Type.OBJECT,
                        "properties": {
                            "code": {"type": types.Type.STRING},
                            "description": {"type": types.Type.STRING}
                        },
                        "required": ["code", "description"]
                    }
                }
            )
        )
        return json.loads(response.text)
    except Exception: return []

class FormAssistRequest(BaseModel):
    transcript: str
    form_schema: Dict[str, Any]
    current_data: Dict[str, Any]

@router.post("/form_assist")
async def form_assist(request: FormAssistRequest):
    if not client:
        return {"updates": {}, "response": "AI service unavailable."}
    
    prompt = f"""
    You are a helpful voice assistant for a doctor filling out a medical form.
    
    Form Schema: {json.dumps(request.form_schema)}
    Current Data: {json.dumps(request.current_data)}
    User Voice Input: "{request.transcript}"
    
    Task:
    1. Extract information from the voice input to update the form fields.
    2. Handle corrections (e.g. "actually, change age to 50").
    3. Return a JSON object with:
       - "updates": A dictionary of field names and their new values. Only include fields that changed.
       - "response": A brief, natural conversational response confirming the action (e.g. "Updated age to 50", "Added diabetes to comorbidities").
    
    Rules:
    - Only update fields present in the schema.
    - Infer types based on the schema (e.g. convert "fifty" to 50).
    - If the input is unclear, ask for clarification in the "response" and leave "updates" empty.
    - Keep the "response" short (under 10 words if possible).
    """

    try:
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": types.Type.OBJECT,
                    "properties": {
                        "updates": {"type": types.Type.OBJECT},
                        "response": {"type": types.Type.STRING}
                    },
                    "required": ["updates", "response"]
                }
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Form Assist Error: {e}")
        return {"updates": {}, "response": "Sorry, I didn't catch that."}

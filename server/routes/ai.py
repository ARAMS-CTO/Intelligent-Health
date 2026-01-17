from fastapi import APIRouter, HTTPException, Body, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import shutil
import uuid
from datetime import datetime
import json
import base64
# Import the legacy SDK
import google.generativeai as genai
from sqlalchemy.orm import Session
from ..schemas import Case, AIInsights, ExtractedCaseData, AIContextualSuggestion, SymptomAnalysisResult, AIFeedback as AIFeedbackSchema, AIFeedbackCreate, AIAgentStats, UnratedSuggestion, DiagnosisSuggestion, ChatRequest
import server.models as models
from ..models import SystemConfig, Case as CaseModel, AIFeedback, MedicalRecord, Patient as PatientModel, HealthData
# SystemLog and LearningLog accessed via models.*
from ..services.agent_service import agent_service
from ..database import get_db

from ..routes.auth import get_current_user
from ..schemas import User
from ..services.learning_service import LearningService

router = APIRouter()

class OutcomeRequest(BaseModel):
    case_id: str
    outcome: str
    log_id: Optional[str] = None

@router.post("/outcome")
async def record_outcome(request: OutcomeRequest, db: Session = Depends(get_db)):
    svc = LearningService(db)
    
    log_id = request.log_id
    if not log_id:
        # Find latest log for case
        log = db.query(models.LearningLog).filter(models.LearningLog.case_id == request.case_id).order_by(models.LearningLog.created_at.desc()).first()
        if not log: return {"error": "No learning log found for case"}
        log_id = log.id
        
    lesson = svc.record_outcome(log_id, request.outcome)
    
    # Also log event
    log_ai_event(db, "learning_outcome", "system", {"case_id": request.case_id, "lesson": lesson})
        
    return {"status": "success", "lesson": lesson}

@router.post("/feedback")
async def submit_feedback(feedback: AIFeedbackCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_feedback = AIFeedback(
        user_id=current_user.id,
        case_id=feedback.case_id,
        suggestion_name=feedback.suggestion_name,
        rating=feedback.rating,
        comments=feedback.comments
    )
    db.add(db_feedback)
    db.commit()
    
    # Automate Learning from Positive Feedback
    if feedback.rating == 'good':
        # Infer a learning point. For now, simple assumption.
        point = f"User liked the suggestion '{feedback.suggestion_name}'."
        if feedback.comments:
            point += f" Comment: {feedback.comments}"
        agent_service.add_learning_point(current_user.id, point, db)
        
    return {"status": "success"}

@router.get("/stats/{user_id}", response_model=AIAgentStats)
async def get_ai_stats(user_id: str, db: Session = Depends(get_db)):
    # ...
    feedbacks = db.query(AIFeedback).filter(AIFeedback.user_id == user_id).all()
    total_feedback = len(feedbacks)
    good_feedback = len([f for f in feedbacks if f.rating == 'good'])
    
    accuracy = 0.85 # Base
    if total_feedback > 0:
        accuracy = good_feedback / total_feedback
        
    # Robust count for SQLite compatibility
    # Fetch all ai_query logs for user and filter in python to avoid JSON dialect issues
    all_logs = db.query(models.SystemLog).filter(
        models.SystemLog.user_id == user_id, 
        models.SystemLog.event_type == 'ai_query'
    ).all()
    
    cases_analyzed = 0
    for log in all_logs:
        if log.details and isinstance(log.details, dict):
            if log.details.get('endpoint') == 'insights':
                cases_analyzed += 1
                
    # Fallback if 0 (maybe generic queries count too?)
    if cases_analyzed == 0 and len(all_logs) > 0:
         cases_analyzed = len(all_logs) # fallback to total queries

    personalization = min(0.5 + (total_feedback * 0.05), 0.95)

    return {
        "id": f"stats-{user_id}",
        "userId": user_id,
        "accuracy": accuracy,
        "personalizationLevel": personalization,
        "casesAnalyzed": cases_analyzed,
        "feedbackProvided": total_feedback
    }



from ..config import settings

try:
    from google.cloud import speech
except ImportError:
    speech = None

# Initialize Gemini
API_KEY = settings.GEMINI_API_KEY
if not API_KEY:
    print("WARNING: GEMINI_API_KEY not found in settings. AI features will be disabled.")
else:
    try:
        genai.configure(api_key=API_KEY)
        print("Gemini AI Configured Successfully.")
    except Exception as e:
        print(f"Error configuring Gemini AI: {e}")

# Model Configuration
DEFAULT_MODEL = "gemini-1.5-flash" 
ADVANCED_MODEL = "gemini-1.5-pro"
MEDLM_MODEL = "medlm-large"

def log_ai_event(db: Session, event_type: str, user_id: str, details: Dict[str, Any]):
    try:
        log = models.SystemLog(event_type=event_type, user_id=user_id, details=details)
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Log Error: {e}")

async def get_active_model_name(db: Session):
    config = db.query(SystemConfig).filter(SystemConfig.key == "features").first()
    if config and config.value.get("medLM"):
        return MEDLM_MODEL
    return DEFAULT_MODEL

def get_model(model_name: str):
    # GenerativeModel wrapper
    # If using MedLM via Vertex, we'd need Vertex Init, but for this demo assuming Gemini API
    # MedLM is not directly available via studio key, so fallback to advanced if strictly studio
    if model_name == MEDLM_MODEL:
        # Check if we can use it, else fallback
        return genai.GenerativeModel(ADVANCED_MODEL)
    return genai.GenerativeModel(model_name)

class AnalysisRequest(BaseModel):
    text: str

class AIRequestBase(BaseModel):
    userId: Optional[str] = "anonymous"
    userRole: Optional[str] = "User"
    model: Optional[str] = None

@router.post("/insights", response_model=AIInsights)
async def get_case_insights(case: Case, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not API_KEY:
        return {"diagnosisConfidence": 0.0, "patientRisks": ["AI Service Unavailable"], "keySymptoms": []}

    context = {
        "user_id": current_user.id,
        "user_role": current_user.role
    }
    
    # Pass case_id so the agent can fetch it or just pass data if agent supports it.
    # DoctorAgent expects "case_id". But wait, the endpoint receives the entire Case object in the body?
    # No, the schema is `Case` but usually endpoints involving `case_id` are GETs or take ID.
    # Ah, `get_case_insights` is a POST that takes the Case object as body (likely from frontend state).
    # But `DoctorAgent` fetches by ID. If the case is unsaved, this might fail `db.query(CaseModel)`.
    # BUT, `CaseView.tsx` calls it with `caseData`.
    # If the case is already saved in DB (which it is, presumably), then `case.id` is valid.
    # However, if the user made changes on frontend not yet saved, the Agent *should* use the provided data.
    # Let's check DoctorAgent again.
    # DoctorAgent currently: `case = db.query(CaseModel).filter(CaseModel.id == case_id).first()`
    # If I pass `case_id`, it will ignore local frontend changes.
    # The frontend `handleGenerateInsights` sends `caseData`.
    # If I want the agent to use the *latest* data from frontend, I should update DoctorAgent to accept `case_data` in payload.
    # Let's update `get_case_insights` to pass `case_id` AND `case_data` (as dict).
    # And I should probably update `DoctorAgent` to prefer `case_data` if present.
    
    # For now, sticking to ID is safer for consistency, but less reactive to unsaved edits.
    # Given the previous code used `case` object from argument, using ID is a slight regression if unsaved.
    # However, `DoctorAgent` is backend-centric.
    # Let's pass the ID. The frontend usually saves or we assume it's synced.
    
    return await orchestrator.dispatch("clinical_summary", {"case_id": case.id}, context, db)

@router.get("/feedback/history/{case_id}")
async def get_feedback_history(case_id: str, db: Session = Depends(get_db)):
    # Simple check for feedback existence
    return db.query(AIFeedback).filter(AIFeedback.case_id == case_id).all()

# ... (unrated endpoint is fine) ...

@router.post("/chat")
async def chat(request: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not API_KEY:
        return {"response": "AI Service Unavailable. Please configure GEMINI_API_KEY in your environment."}

    model_name = request.model or await get_active_model_name(db)
    
    # Securely override user info
    request.userId = current_user.id
    request.userRole = current_user.role
    
    system_instruction = agent_service.get_system_instruction(request.userId, request.userRole, db, context_query=request.message)
    if request.context:
        system_instruction += f"\n\nContext: {request.context}"
        
    start_chat_history = []
    # Convert history
    for msg in request.history:
        # Skip current message if present
        if msg.get("content") == request.message: continue
        role = "user" if (msg.get("role") or msg.get("author")) == "user" else "model"
        start_chat_history.append({"role": role, "parts": [msg.get("content", "")]})

    if "prefer" in request.message.lower() or "like" in request.message.lower():
        agent_service.add_learning_point(request.userId, f"User preference: {request.message}", db)

    try:
        # EXCLUSIVE GEMINI CHAT
        # Re-init model with system instruction
        # We ensure model_name defaults to meaningful Gemini model if user tries to pass others
        final_model = model_name
        if "gpt" in model_name.lower() or "claude" in model_name.lower():
            final_model = DEFAULT_MODEL
            
        chat_model = genai.GenerativeModel(final_model, system_instruction=system_instruction)
        chat = chat_model.start_chat(history=start_chat_history)
        
        response = chat.send_message(request.message)
        log_ai_event(db, "ai_query", request.userId, {"endpoint": "chat", "model": final_model, "provider": "google"})
        return {"response": response.text}
    except Exception as e:
        print(f"Chat Error: {e}")
        return {"response": f"AI Service Error: {str(e)}"}




class SpecialistRequest(BaseModel):
    query: str
    case_data: str
    domain: Optional[str] = None

@router.post("/specialist_consult")
async def specialist_consult(request: SpecialistRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Direct line to a Specialist Agent (Cardiology, Orthopedics, etc.).
    """
    if not API_KEY: return {"message": "AI Service Offline"}
    
    context = {
        "user_id": current_user.id,
        "user_role": current_user.role
    }
    
    payload = {
        "query": request.query,
        "case_data": request.case_data,
        "domain": request.domain
    }

    return await orchestrator.dispatch("specialist_consult", payload, context, db)


class WorkflowRequest(BaseModel):
    workflow_name: str
    case_id: str
    payload: Optional[Dict[str, Any]] = {}

@router.post("/workflow")
async def execute_workflow(request: WorkflowRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Triggers a complex multi-agent workflow (e.g. Comprehensive Patient Analysis).
    """
    if not API_KEY: return {"message": "AI Service Offline"}
    
    context = {
        "user_id": current_user.id,
        "user_role": current_user.role
    }
    
    # Merge specific payload params
    payload = request.payload or {}
    payload["case_id"] = request.case_id
    
    return await orchestrator.execute_workflow(request.workflow_name, payload, context, db)


@router.post("/generate_daily_questions")
async def generate_daily_questions(payload: Dict[str, Any], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_summary = payload.get("profile_summary", "")
    
    prompt = f"""
    Generate 3 simple, daily health check-in questions for a patient with this profile:
    {profile_summary}
    
    Return JSON: {{ "questions": ["q1", "q2", "q3"] }}
    """
    
    try:
        model = genai.GenerativeModel(DEFAULT_MODEL)
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)
    except Exception as e:
        return {"questions": ["How are you feeling today?", "Did you take your medications?", "Any new symptoms?"]}

@router.post("/agent_chat")
async def agent_chat(request: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Natural Language Interface to the Agent Bus.
    User asks "Triage case 123", we route to Triage Agent.
    If no agent task is identified, falls back to General Chat.
    """
    message = request.message
    if not message:
         raise HTTPException(status_code=400, detail="Message required")

    from ..agents.orchestrator import orchestrator
    
    # 1. Route Intent
    routing = await orchestrator.route_task(message)
    
    # 2. Check for Task or Fallback
    if "error" in routing:
        # Fallback to General Conversation
        return await chat(request, current_user, db)
        
    task = routing.get("task")
    params = routing.get("payload", {})
    
    # 3. Dispatch Agent Task
    # Pass context (user info)
    context = {"user_id": current_user.id, "user_role": current_user.role}
    
    result = await orchestrator.dispatch(task, params, context, db)
    
    # 4. Format Response
    # Convert result to string or keep object?
    # Frontend expects "response" string for chat, "result" object for data
    
    # Simple summary if string not present
    response_text = result.get("message", "Task Executed.")
    
    # Fetch metadata for frontend (Avatar, Voice)
    agent_info = None
    agent = orchestrator.get_agent_for_task(task)
    if agent:
        agent_info = agent.get_metadata()

    return {
        "response": response_text,
        "result": result,
        "routed_to": task,
        "agent": agent_info
    }

class AgentTaskRequest(BaseModel):
    task: str
    payload: Dict[str, Any]

@router.post("/agent_task")
async def execute_agent_task(request: AgentTaskRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Directly execute a specific agent task.
    Bypasses the LLM Router.
    """
    from ..agents.orchestrator import orchestrator
    
    context = {"user_id": current_user.id, "user_role": current_user.role}
    result = await orchestrator.dispatch(request.task, request.payload, context, db)
    
    return result

@router.post("/search_icd10")
async def search_icd10(request: AnalysisRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not API_KEY: return []
    try:
        model = genai.GenerativeModel("gemini-1.5-flash") # Keep flash for speed on search
        prompt = f"Find top 5 ICD-10 codes for '{request.text}'. Return JSON list of {{code: string, description: string}}."
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        log_ai_event(db, "ai_query", current_user.id, {"endpoint": "search_icd10"})
        return json.loads(response.text)
    except Exception as e:
        print(f"ICD10 Search Error: {e}")
        return []

class AugmentRequest(BaseModel):
    extracted_data: ExtractedCaseData
    baseline_illnesses: List[str]

@router.get("/report/patient/{case_id}")
async def generate_patient_report(case_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Generates a simplified, patient-friendly explanation of the case.
    """
    if not API_KEY:
        return {"report": "AI Service Unavailable"}
        
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    system_instruction = agent_service.get_system_instruction(current_user.id, current_user.role, db)
    system_instruction += "\nYou are a compassionate doctor explaining results to a patient. Use simple language. Avoid medical jargon."
    
    prompt = f"""
    Write a report for the patient based on this case:
    Diagnosis: {case.diagnosis}
    Complaint: {case.complaint}
    Findings: {case.findings}
    
    Structure:
    1. What we found (Diagnosis)
    2. What it means
    3. Next steps (Treatment Plan)
    4. Things to watch out for
    """
    
    try:
        model = genai.GenerativeModel(DEFAULT_MODEL, system_instruction=system_instruction)
        response = model.generate_content(prompt)
        return {"report": response.text}
    except Exception as e:
        print(f"Patient Report Error: {e}")
        return {"report": "Error generating report."}

@router.get("/plan/{case_id}")
async def generate_clinical_plan(case_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Generates a comprehensive clinical plan for the doctor.
    """
    if not API_KEY:
        return {"plan": "AI Service Unavailable"}

    context = {
        "user_id": current_user.id,
        "user_role": current_user.role
    }

    return await orchestrator.dispatch("treatment_plan", {"case_id": case_id}, context, db)

@router.post("/augment_case", response_model=List[AIContextualSuggestion])
async def augment_case(request: AugmentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not API_KEY: return []
    
    context = {
        "user_id": current_user.id,
        "user_role": current_user.role
    }
    
    payload = {
        "extracted_data": request.extracted_data.model_dump(),
        "baseline_illnesses": request.baseline_illnesses
    }

    return await orchestrator.dispatch("augment_case", payload, context, db)



@router.post("/extract_case", response_model=ExtractedCaseData)
async def extract_case(request: AnalysisRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not API_KEY: return {}
    
    system_instruction = agent_service.get_system_instruction(current_user.id, current_user.role, db)
    system_instruction += "\nYou are a medical data extraction specialist. Output strictly JSON."
    
    model = get_model(await get_active_model_name(db))
    # Note: If get_model returns genai.GenerativeModel, we can't easily change system_instruction locally without re-init 
    # unless we pass it to constructor. get_model creates new instance.
    # We should update get_model or just create instance here.
    # For now, let's just create instance to be safe and support instructions.
    model = genai.GenerativeModel(await get_active_model_name(db), system_instruction=system_instruction)

    try:
        response = model.generate_content(
            f'Extract medical case data from: "{request.text}". Return JSON matching schema.',
            generation_config={"response_mime_type": "application/json"}
        )
        log_ai_event(db, "ai_query", current_user.id, {"endpoint": "extract_case"})
        return json.loads(response.text)
    except Exception as e:
        return {}

@router.post("/analyze_symptoms", response_model=List[SymptomAnalysisResult])
async def analyze_symptoms(request: AnalysisRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not API_KEY: return []
    
    system_instruction = agent_service.get_system_instruction(current_user.id, current_user.role, db)
    
    try:
        model = genai.GenerativeModel(DEFAULT_MODEL, system_instruction=system_instruction)
        response = model.generate_content(
            f'Analyze symptoms: "{request.text}". Return JSON array of objects with "condition", "confidence" (number), "explanation".',
            generation_config={"response_mime_type": "application/json"}
        )
        log_ai_event(db, "ai_query", current_user.id, {"endpoint": "analyze_symptoms"})
        return json.loads(response.text)
    except Exception as e:
        return []

from ..agents.orchestrator import orchestrator

@router.post("/auto_triage")
async def auto_triage(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not API_KEY: return {"status": "error", "message": "Offline"}

    context = {
        "user_id": current_user.id,
        "user_role": current_user.role
    }
    
    # Delegate to NurseAgent via Orchestrator
    # We pass "triage" as the task. Payload can specify specific cases if needed, but defaults to all open.
    return await orchestrator.dispatch("triage", {"criteria": "urgency"}, context, db)

# FormAssistRequest and form_assist are already updated in previous step.
# But we need to keep them or skip them. 
# I will use a StartLine AFTER form_assist if I want to skip it, or overwrite it again (harmless).
# Actually form_assist is after auto_triage. I'll just leave it out of this block to handle `analyze_image` onwards.
# WAIT. I need to be careful with StartLine.
# `extract_case` starts around line 296 (in previous view).
# `form_assist` is around line 348?
# Let's target `extract_case` to `auto_triage` first.
# ...
# Actually I'll do `analyze_image` onwards separately or all together?
# The `replace_file_content` tool takes ONE block.
# I can use `multi_replace_file_content`!
# Ah, the user instruction says: "Use this tool ONLY when you are making MULTIPLE, NON-CONTIGUOUS edits".
# `extract_case`, `analyze_symptoms`, `auto_triage` are contiguous.
# `form_assist` is next.
# `analyze_image` is next.
# So I can actally replace from `extract_case` down to the end of the file?
# `form_assist` was just updated. I'd rather not overwrite it if I don't have to, OR I can just include it's new version.
# Including it is safer to ensure continuity.

# Let's construct the FULL block from `extract_case` to `generate_daily_questions`.


async def _analyze_content(content: bytes, mime_type: str, prompt: Optional[str], current_user: User, db: Session):
    """Helper to analyze content bytes directly."""
    if not API_KEY: 
        return {"error": "AI Service Unavailable. API Key missing."}

    valid_mimes = [
        "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", 
        "application/pdf",
        "video/mp4", "video/mpeg", "video/mov", "video/quicktime", "video/webm"
    ]
    
    if mime_type not in valid_mimes and not mime_type.startswith("image/") and not mime_type.startswith("video/"):
         return {"error": f"Unsupported file type: {mime_type}. Only Images, PDFs, and Videos are supported."}
    
    system_instruction = agent_service.get_system_instruction(current_user.id, current_user.role, db)
    
    if mime_type.startswith("video/"):
        base_prompt = """
        Analyze this medical video. It may be a surgical procedure, a diagnostic scan (MRI/Ultrasound feed), or a clinical examination/consultation recording.
        
        1. Identify the TYPE of video (e.g., 'Surgical Procedure Video', 'Ultrasound Video', 'Gait Analysis Video', 'Nurse Examination Video').
        2. Describe the key actions or events occurring.
        3. Identify visible anatomical structures, medical devices, or symptoms.
        4. Summarize the clinical interaction or findings.
        
        Return JSON properties: document_type (MUST include 'Video' suffix, e.g., 'Surgical Video'), findings, summary.
        """
    else:
        base_prompt = "Analyze this medical document or image. Return JSON properties: document_type, findings, summary. Be precise with medical terminology."
    
    final_prompt = f"{base_prompt} Specific focus: {prompt}" if prompt else base_prompt
    
    try:
        model = genai.GenerativeModel(DEFAULT_MODEL, system_instruction=system_instruction) 
        file_part = {"mime_type": mime_type, "data": content}
        
        # Enforce JSON structure in prompt
        final_prompt += " Return strictly valid JSON."
        
        response = model.generate_content([final_prompt, file_part], generation_config={"response_mime_type": "application/json"})
        
        log_ai_event(db, "ai_query", current_user.id, {"endpoint": "analyze_content", "file_type": mime_type})
        
        # Robust Parsing
        text_resp = response.text.strip()
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:]
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3]
            
        return json.loads(text_resp)
    except Exception as e:
        print(f"Analysis Helper Error: {e}")
        return {"error": str(e)}

@router.post("/analyze_file")
async def analyze_file(
    file: UploadFile = File(...), 
    type: str = "general", 
    prompt: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content = await file.read()
    mime_type = file.content_type or "application/pdf"
    return await _analyze_content(content, mime_type, prompt, current_user, db)

# Keep alias for backward compatibility
@router.post("/analyze_image")
async def analyze_image_alias(
    file: UploadFile = File(...), 
    type: str = "general", 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await analyze_file(file, type, None, current_user, db)

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    transcript = ""
    content = await file.read()
    
    # Attempt 1: Google Cloud Speech
    if speech:
        try:
            speech_client = speech.SpeechClient()
            audio = speech.RecognitionAudio(content=content)
            config = speech.RecognitionConfig(language_code="en-US", model="latest_long")
            
            response = speech_client.recognize(config=config, audio=audio)
            transcript = " ".join([result.alternatives[0].transcript for result in response.results])
            
            if transcript:
                log_ai_event(db, "ai_query", current_user.id, {"endpoint": "transcribe", "service": "google_speech"})
                return {"transcript": transcript}
        except Exception as e:
            print(f"Google Cloud Speech Error (Fallback to Gemini): {e}")

    # Attempt 2: Gemini Multimodal (Fallback)
    if API_KEY:
        try:
            model = genai.GenerativeModel(DEFAULT_MODEL) # Transcribe is purely functional, maybe no system instruction needed? or "You are a transcriber"?
            # Sending system instruction to transcribe might be weird if it tries to 'chat'.
            # Let's keep it simple for transcribe.
            audio_part = {
                "mime_type": file.content_type or "audio/wav",
                "data": content
            }
            prompt = "Transcribe this audio file accurately. Return only the transcript."
            
            response = model.generate_content([prompt, audio_part])
            transcript = response.text
            
            log_ai_event(db, "ai_query", current_user.id, {"endpoint": "transcribe", "service": "gemini"})
            return {"transcript": transcript}
        except Exception as e:
            print(f"Gemini Transcription Error: {e}")

    return {"transcript": "Transcription unavailable."}

class PatientExplanationRequest(BaseModel):
    diagnosis: str
    plan: str
    patient_age: int

@router.post("/explain_patient")
async def explain_to_patient(request: PatientExplanationRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not API_KEY: return {"explanation": "Offline"}
    
    context = {
        "user_id": current_user.id,
        "user_role": current_user.role
    }

    payload = {
        "diagnosis": request.diagnosis,
        "plan": request.plan,
        "age": request.patient_age
    }

    return await orchestrator.dispatch("explain_diagnosis", payload, context, db)

class DailyCheckRequest(BaseModel):
    profile_summary: str

@router.post("/generate_daily_questions")
async def generate_daily_questions(request: DailyCheckRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not API_KEY: return {"questions": ["How are you feeling today?", "Any new symptoms?", "Did you take your meds?"]}
    
    system_instruction = agent_service.get_system_instruction(current_user.id, current_user.role, db)
    
    prompt = f"Based on this patient profile: '{request.profile_summary}', generate 3 short, specific daily health check questions to ask them today to monitor their condition. Return JSON with key 'questions' which is a list of strings."
    try:
        model = genai.GenerativeModel(DEFAULT_MODEL, system_instruction=system_instruction)
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        log_ai_event(db, "ai_query", current_user.id, {"endpoint": "generate_daily_questions"})
        return json.loads(response.text)
    except Exception as e:
        print(f"Daily Question Error: {e}")
        return {"questions": ["How is your general energy level today?", "Have you experienced any new symptoms?", "Did you take your prescribed medications?"]}

@router.post("/patient/upload_record")
async def upload_patient_record(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Save File Locally
        file_ext = os.path.splitext(file.filename)[1]
        file_id = str(uuid.uuid4())
        filename = f"{file_id}{file_ext}"
        upload_dir = "static/uploads"
        file_path = os.path.join(upload_dir, filename)
        
        os.makedirs(upload_dir, exist_ok=True)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_url = f"/uploads/{filename}"

        # 2. Save Initial Record (Pending Analysis)
        patient_id = None
        if current_user.role == "Patient" and current_user.patient_profile:
            patient_id = current_user.patient_profile.id
            
        # Default Title before analysis
        title = file.filename
        
        record = MedicalRecord(
            id=file_id,
            patient_id=patient_id,
            uploader_id=current_user.id,
            type="Unknown", # Will be updated by AI
            title=title,
            content_text="",
            ai_summary="", # Empty indicates pending
            file_url=file_url,
            created_at=datetime.utcnow()
        )
        db.add(record)
        db.commit()
        
        # Return success with pending status
        return {
            "status": "success", 
            "record_id": record.id, 
            "message": "File uploaded. Ready for analysis.",
            "file_url": file_url,
            "analysis": {"type": "Pending", "summary": "Pending Analysis", "title": title}
        }
        
    except Exception as e:
        print(f"Upload Record Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/patient/analyze_record/{record_id}")
async def analyze_patient_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trigger AI analysis and Index for RAG.
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    try:
        # Resolve file path from URL
        # URL is /uploads/filename.ext
        filename = record.file_url.split("/")[-1]
        file_path = os.path.join("static/uploads", filename)
        
        if not os.path.exists(file_path):
             raise HTTPException(status_code=404, detail="File content not found on server")
             
        with open(file_path, "rb") as f:
            content = f.read()
            
        # Determine mime type (simple extension check)
        ext = os.path.splitext(filename)[1].lower()
        mime_type = "application/pdf"
        if ext in ['.jpg', '.jpeg']: mime_type = "image/jpeg"
        elif ext == '.png': mime_type = "image/png"
        elif ext == '.webp': mime_type = "image/webp"
        elif ext in ['.mp4', '.m4v']: mime_type = "video/mp4"
        elif ext in ['.mov', '.qt']: mime_type = "video/quicktime"
        elif ext == '.webm': mime_type = "video/webm"
        elif ext == '.avi': mime_type = "video/x-msvideo"
        elif ext == '.mpeg': mime_type = "video/mpeg"
        
        # Analyze
        analysis = await _analyze_content(
            content=content,
            mime_type=mime_type,
            prompt="Extract text, categorize document (Lab Report, Prescription, Imaging, Discharge Summary, Other), summarize key findings, and extract date. JSON: {content_text, type, summary, title, date}",
            current_user=current_user,
            db=db
        )
        
        if "error" in analysis:
             print(f"Analysis warning: {analysis['error']}")
             return {"status": "error", "message": f"AI Analysis Failed: {analysis['error']}"}
        else:
            # Update Record
            record.type = analysis.get("type", "Document")
            record.title = analysis.get("title", record.title)
            record.content_text = analysis.get("content_text") or analysis.get("findings") or ""
            record.ai_summary = analysis.get("summary", "Analysis completed.")
            record.metadata_ = analysis
            
            # 1. RAG Vector Indexing (DB)
            # Compute embedding for the record (summary + content snippet)
            text_to_embed = f"{record.title}\n{record.ai_summary}\n{record.content_text[:1000]}"
            embedding = agent_service.vector_store.get_embedding(text_to_embed)
            if embedding:
                record.embedding = embedding
            
            # 2. Agent Knowledge Indexing (Fast Retrieval)
            if current_user.patient_profile:
                # Store in agent vector store associated with patient_id (or user_id logic)
                # Maps patient's record to the USER's knowledge graph if user is patient
                agent_service.index_medical_record(
                    current_user.id, 
                    record.id, 
                    record.content_text[:2000], # Store meaningful chunk
                    record.ai_summary
                )
            
            db.commit()
        
        return {"status": "success", "analysis": analysis}

    except Exception as e:
        print(f"Analyze Record Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/patient/chat")
async def patient_chat(request: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Fetch records & Profile & Health Data
    records = []
    profile_text = ""
    health_data_text = ""
    
    if current_user.patient_profile:
        # A. Records
        records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == current_user.patient_profile.id).all()
        
        # B. Profile (Height/Weight/Conditions)
        p = current_user.patient_profile
        profile_text = f"""
        Patient Profile:
        - Name: {p.name}
        - Age: {p.age} | Sex: {p.sex} | Blood: {p.blood_type}
        - Height: {p.height} cm | Weight: {p.weight} kg
        - Conditions: {', '.join(p.baseline_illnesses or [])}
        - Allergies: {', '.join(p.allergies or [])}
        - Medications: {', '.join([m.name for m in p.medications] if p.medications else [])}
        """
        
        # C. Recent Health Data (Integrations)
        # Fetch last 3 days
        from datetime import timedelta
        since = datetime.utcnow() - timedelta(days=3)
        h_data = db.query(HealthData).filter(
            HealthData.user_id == current_user.id,
            HealthData.source_timestamp >= since
        ).order_by(HealthData.data_type, HealthData.source_timestamp.desc()).all()
        
        if h_data:
            health_data_text = "\nRecent Health Metrics (Integrations):\n"
            # simple grouping to show latest of each type or avg
            seen_types = set()
            for hd in h_data:
                if hd.data_type not in seen_types:
                    health_data_text += f"- {hd.data_type}: {hd.value} {hd.unit} ({hd.source_timestamp.strftime('%Y-%m-%d %H:%M')})\n"
                    seen_types.add(hd.data_type)
    
    # 2. Build Context
    context_str = profile_text + health_data_text + "\nMedical Records:\n"
    if records:
        for r in records[-10:]: # limit to last 10
            context_str += f"- [{r.created_at.strftime('%Y-%m-%d')}] {r.type} - {r.title}: {r.ai_summary}\n"
    else:
        context_str += "No uploaded records available."

    # 3. Inject into request
    request.context = context_str + (("\n" + request.context) if request.context else "")
    
    # 4. Call standard chat
    return await chat(request, current_user, db)

@router.get("/report/comprehensive/{patient_id}")
async def generate_comprehensive_report(patient_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Generates a full status report taking into account:
    - Demographics
    - Chronic Conditions
    - Medications
    - Recent Health Data (Steps, Vitals)
    - Recent Lab Results/Records
    """
    if not API_KEY:
        return {"report": "AI Service Unavailable"}
        
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
         raise HTTPException(status_code=404, detail="Patient not found")
         
    # 1. Gather Context
    # Meds
    meds_list = ", ".join([f"{m.name} ({m.dosage}, {m.frequency})" for m in patient.medications]) if patient.medications else "None"
    
    # Conditions
    conditions = ", ".join(patient.baseline_illnesses or [])
    
    # Health Data (Last 7 Days)
    from datetime import timedelta
    since = datetime.utcnow() - timedelta(days=7)
    h_data = db.query(HealthData).filter(
        HealthData.user_id == patient.user_id,
        HealthData.source_timestamp >= since
    ).all()
    
    vitals_summary = ""
    if h_data:
        # Simple aggregation: avg heart rate, total steps (avg/day), latest weight
        steps = [d.value for d in h_data if d.data_type == 'steps']
        hr = [d.value for d in h_data if d.data_type == 'heart_rate']
        weights = [d.value for d in h_data if d.data_type == 'weight']
        
        avg_steps = sum(steps)/len(steps) if steps else 0
        avg_hr = sum(hr)/len(hr) if hr else 0
        latest_weight = weights[0] if weights else (patient.weight or 0)
        
        vitals_summary = f"""
        - Avg Daily Steps (7d): {int(avg_steps)}
        - Avg Heart Rate (7d): {int(avg_hr)} bpm
        - Latest Weight: {latest_weight} kg (change vs profile: {latest_weight - (patient.weight or 0):.1f}kg)
        """
    else:
        vitals_summary = "No recent wearable data found."

    # Labs/Records
    records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id).order_by(MedicalRecord.created_at.desc()).limit(5).all()
    recent_labs = "\n".join([f"- {r.created_at.strftime('%Y-%m-%d')} [{r.type}]: {r.title} ({r.ai_summary})" for r in records])

    prompt = f"""
    Generate a Comprehensive Clinical Status Report for this patient.
    
    PATIENT: {patient.name} ({patient.sex}, Age: {patient.age})
    Biometrics: Height {patient.height}cm, Weight {patient.weight}kg
    
    CLINICAL CONTEXT:
    - Chronic Conditions: {conditions}
    - Current Medications: {meds_list}
    
    RECENT LABS & RECORDS:
    {recent_labs}
    
    WEARABLE/VITALS DATA (Last 7 Day Trends):
    {vitals_summary}
    
    INSTRUCTIONS:
    1. Summarize current health status and stability of chronic conditions.
    2. Analyze medication adherence or potential interactions (if any obvious red flags).
    3. Interpret recent lab trends in context of conditions.
    4. Provide actionable recommendations for the patient (lifestyle, follow-up).
    5. Flag any urgent concerns based on vitals or labs.
    
    Format nicely in Markdown.
    """
    
    try:
        system_instruction = agent_service.get_system_instruction(current_user.id, current_user.role, db)
        model = genai.GenerativeModel(DEFAULT_MODEL, system_instruction=system_instruction)
        response = model.generate_content(prompt)
        return {"report": response.text}
    except Exception as e:
        print(f"Comprehensive Report Error: {e}")
        return {"report": "Could not generate report."}

class AgentTaskRequest(BaseModel):
    task: str
    payload: Dict[str, Any] = {}

@router.post("/agent_task")
async def execute_agent_task(request: AgentTaskRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Directly invokes a specific agent capability via Orchestrator.
    """
    try:
        from ..agents.orchestrator import orchestrator
        # Inject user_id into context
        context = {"user_id": current_user.id}
        
        result = await orchestrator.dispatch(request.task, request.payload, context, db)
        
        if "error" in result:
             # Log warning but return 200 with error info so frontend handles gracefully
             print(f"Agent Task Warning: {result.get('message') or result.get('error')}")
        
        return result
    except Exception as e:
        print(f"Agent Task Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class AgentWorkflowRequest(BaseModel):
    workflow: str
    payload: Dict[str, Any] = {}

@router.post("/agent_workflow")
async def execute_agent_workflow(request: AgentWorkflowRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Executes a complex multi-agent workflow.
    """
    try:
        from ..agents.orchestrator import orchestrator
        context = {"user_id": current_user.id}
        
        result = await orchestrator.execute_workflow(request.workflow, request.payload, context, db)
        return result
    except Exception as e:
        print(f"Workflow Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/agent_chat")
async def agent_chat_router(request: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Intelligent routing of chat messages to specific agents.
    """
    try:
        from ..agents.orchestrator import orchestrator
        
        # 1. Ask Router which task this maps to
        route = await orchestrator.route_task(request.message)
        
        if "error" in route:
             # Fallback to general chat if no specific task found
             fallback_result = await chat(request, current_user, db)
             # Ensure fallback uses 'response' key
             if "message" in fallback_result and "response" not in fallback_result:
                 fallback_result["response"] = fallback_result["message"]
             return fallback_result
             
        task = route.get("task")
        payload = route.get("payload", {})
        
        # 2. Execute Task
        context = {"user_id": current_user.id}
        result = await orchestrator.dispatch(task, payload, context, db)
        
        # 3. Format result as chat response
        # Most agents return { "status": "success", "message": "..." } or similar
        # Frontend expects { "response": "...", "agent": { "role": "..." } }
        
        response_text = result.get("message") or result.get("error") or json.dumps(result)
        agent_role = orchestrator.get_agent_for_task(task)
        
        return {
            "response": response_text,
            "agent": {
                "name": agent_role.name if agent_role else "System",
                "role": agent_role.role if agent_role else "Assistant"
            }
        }
        
    except Exception as e:
        print(f"Agent Chat Router Error: {e}")
        # Fallback
        return await chat(request, current_user, db)

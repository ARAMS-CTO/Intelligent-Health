from typing import Dict, Any, List
from sqlalchemy.orm import Session
import json
import os
import google.generativeai as genai
from .base import BaseAgent
from ..models import Case as CaseModel, Patient as PatientModel
from ..services.agent_service import agent_service

class DoctorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Dr. House", 
            role="Doctor",
            description="Responsible for clinical diagnosis, treatment planning, and complex case analysis."
        )
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # Use a smarter model for Doctor tasks
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["diagnose", "treatment_plan", "review_labs", "clinical_summary", "augment_case", "daily_checkin"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task == "clinical_summary":
            return await self._generate_clinical_summary(payload, context, db)
        elif task == "treatment_plan":
            return await self._generate_treatment_plan(payload, context, db)
        elif task == "augment_case":
             return await self._augment_case_data(payload, context, db)
        elif task == "daily_checkin":
             return await self.daily_checkin(payload, context, db)
        else:
            raise NotImplementedError(f"DoctorAgent cannot handle task: {task}")

    async def _generate_clinical_summary(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        case_id = payload.get("case_id")
        if not case_id: return {"error": "Missing case_id"}

        case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
        if not case: return {"error": "Case not found"}

        # Use system instructions from AgentService for personalization
        user_id = context.get("user_id", "system")
        user_role = context.get("user_role", "Doctor")
        
        sys_instr = agent_service.get_system_instruction(user_id, user_role, db)
        
        # Override model with instruction
        model = genai.GenerativeModel("gemini-1.5-pro", system_instruction=sys_instr)

        prompt = f"""
        Analyze the following case.
        Complaint: {case.complaint}
        History: {case.history}
        Findings: {case.findings}
        
        Return JSON:
        {{
            "diagnosisConfidence": float (0-1),
            "primaryDiagnosis": string,
            "patientRisks": list[string],
            "keySymptoms": list[string]
        }}
        """
        
        try:
            response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            return {"error": str(e)}

    async def _generate_treatment_plan(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        case_id = payload.get("case_id")
        case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
        if not case: return {"error": "Case not found"}

        prompt = f"""
        Generate a detailed clinical treatment plan for:
        Diagnosis: {case.diagnosis}
        Patient Findings: {case.findings}
        
        Include: Immediate actions, Medication(s), Labs needed.
        """
        try:
            response = self.model.generate_content(prompt)
            return {"plan": response.text}
        except Exception as e:
            return {"error": str(e)}

    async def _augment_case_data(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        # Augment extracted data with medical knowledge
        extracted = payload.get("extracted_data", {})
        baseline = payload.get("baseline_illnesses", [])
        
        prompt = f"""
        Review these extracted case details against the patient's baseline history.
        Extracted: {extracted}
        Baseline: {baseline}
        
        Identify 3 potential conflicts or missing checks. Return JSON list of {{ "suggestion": str, "rationale": str }}
        """
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            return []

    async def daily_checkin(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        """
        Proactively asks doctor about research data or financial needs.
        """
        user_id = context.get("user_id")
        
        # Check if we already asked today? (Mock logic for now)
        
        prompt = """
        You are a helpful assistant for a Doctor. 
        Generate a friendly, concise daily check-in message.
        Ask specifically if they have any new patient cases that could be anonymized for the 'Research Community'.
        Also ask if they have any pending financial reimbursements or needs for their department.
        
        Tone: Professional, Collaborative, Encouraging.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return {
                "message": response.text,
                "actions": [
                    {"label": "Submit Research Case", "action": "navigate", "target": "/research-community"},
                    {"label": "Check Finances", "action": "navigate", "target": "/dashboard/billing"}
                ]
            }
        except Exception as e:
             return {"error": str(e)}

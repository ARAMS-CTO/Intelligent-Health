from typing import Dict, Any
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json
from .base import BaseAgent

class PatientAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Personal Health Companion",
            role="Patient Advocate",
            description="Interacts directly with patients, explains diagnoses, remembers history, and provides comfort."
        )
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp") # Fast, conversational

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["explain_diagnosis", "chat_with_patient", "daily_checkup", "medication_reminder", "generate_health_summary"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task == "explain_diagnosis":
            return await self._explain(payload)
        elif task == "daily_checkup":
            return await self._daily_checkup(payload, context, db)
        elif task == "medication_reminder":
            return await self._medication_reminder(payload, context, db)
        elif task == "generate_health_summary":
            return await self._generate_health_summary(payload, context, db)
        return {"error": "Unknown task"}

    async def _explain(self, payload: Dict[str, Any]):
        diagnosis = payload.get("diagnosis")
        plan = payload.get("plan")
        age = payload.get("age", 30)
        
        prompt = f"""
        Explain this diagnosis '{diagnosis}' and plan '{plan}' to a patient who is {age} years old.
        Use simple, comforting language. Avoid scary jargon.
        Return JSON {{ "explanation": "string", "key_takeaways": ["point 1", "point 2"] }}
        """
        response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)

    async def _daily_checkup(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        """Generates daily checkup questions based on patient profile."""
        from ..models import Patient as PatientModel
        
        user_id = context.get("user_id")
        patient_summary = payload.get("profile_summary", "")
        
        # If no summary, try to fetch from DB
        if not patient_summary and user_id:
            from ..models import User
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.patient_profile:
                p = user.patient_profile
                patient_summary = f"Age: {p.age}, Sex: {p.sex}, Conditions: {', '.join(p.baseline_illnesses or [])}, Medications: {len(p.medications or [])}"
        
        prompt = f"""
        ACT AS: Caring Health Companion.
        PATIENT PROFILE: {patient_summary or 'General patient'}
        
        Generate 3 personalized daily health check-in questions.
        Be friendly and encouraging. Focus on wellness and medication adherence.
        
        OUTPUT JSON: {{ "questions": ["q1", "q2", "q3"], "greeting": "string" }}
        """
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            return {"questions": ["How are you feeling today?", "Did you take your medications?", "Any new symptoms?"], "greeting": "Good morning! Let's check in on your health."}

    async def _medication_reminder(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        """Generates medication reminders with explanations."""
        medications = payload.get("medications", [])
        
        if not medications:
            return {"message": "No medications to remind about.", "reminders": []}
        
        prompt = f"""
        ACT AS: Friendly Pharmacy Assistant.
        MEDICATIONS: {medications}
        
        For each medication, generate a brief, friendly reminder with:
        - Simple explanation of why it's important
        - Best time to take it
        - Any simple tips (with food, avoid alcohol, etc.)
        
        OUTPUT JSON: {{ "reminders": [{{ "name": "med name", "message": "friendly reminder", "timing": "when to take" }}] }}
        """
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            return {"error": str(e)}

    async def _generate_health_summary(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        """Generates a comprehensive health summary for the patient."""
        from ..models import User, MedicalRecord
        
        user_id = context.get("user_id")
        if not user_id:
            return {"error": "User context required"}
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.patient_profile:
            return {"error": "Patient profile not found"}
        
        p = user.patient_profile
        records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == p.id).order_by(MedicalRecord.created_at.desc()).limit(5).all()
        
        records_summary = "\n".join([f"- {r.type}: {r.title} - {r.ai_summary}" for r in records]) if records else "No recent records"
        
        prompt = f"""
        ACT AS: Personal Health Advisor.
        Generate a friendly, comprehensive health summary for this patient.
        
        PATIENT:
        - Name: {p.name}
        - Age: {p.age}, Sex: {p.sex}
        - Conditions: {', '.join(p.baseline_illnesses or ['None reported'])}
        - Allergies: {', '.join(p.allergies or ['None'])}
        - Current Medications: {len(p.medications or [])} active
        
        RECENT RECORDS:
        {records_summary}
        
        OUTPUT JSON:
        {{
            "summary": "overall health status paragraph",
            "recommendations": ["actionable tip 1", "tip 2", "tip 3"],
            "upcoming_actions": ["next steps"],
            "wellness_score": number (1-100)
        }}
        """
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            return {"error": str(e)}

class InsuranceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Insurance Validator",
            role="Insurance",
            description="Checks eligibility, prior authorizations, and coverage details."
        )
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["check_eligibility", "prior_auth"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task == "check_eligibility":
            return await self._check_eligibility(payload)
        return {"error": "Unknown task"}

    async def _check_eligibility(self, payload: Dict[str, Any]):
        diagnosis = payload.get("diagnosis", "General Checkup")
        plan = payload.get("plan", "Standard Consultation")
        
        prompt = f"""
        ACT AS: Health Insurance Validator System.
        TASK: Check eligibility and coverage for:
        - Diagnosis: {diagnosis}
        - Proposed Plan: {plan}
        
        CONTEXT: Assume a standard PPO plan with moderate coverage.
        
        OUTPUT: JSON format with fields:
        - status: "Approved", "Denied", or "Pending Review"
        - coverage_percentage: number (e.g. 80)
        - deductible_met: boolean
        - copay: string (e.g. "$50.00")
        - notes: brief explanation of coverage decision.
        """
        response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)

class PricingAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Cost Estimator",
            role="Pricing",
            description="Calculates estimated procedural costs and patient responsibility."
        )
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["estimate_cost"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task == "estimate_cost":
            return await self._estimate_cost(payload)
        return {"error": "Unknown task"}

    async def _estimate_cost(self, payload: Dict[str, Any]):
        diagnosis = payload.get("diagnosis", "Unknown")
        plan = payload.get("plan", "Unknown")
        
        prompt = f"""
        ACT AS: Medical Billing Estimator.
        TASK: Estimate costs for:
        - Diagnosis: {diagnosis}
        - Plan: {plan}
        
        OUTPUT: JSON format with fields:
        - estimated_total: number
        - currency: "USD"
        - breakdown: list of objects {{ "item": string, "cost": number }}
        - insurance_coverage_est: number
        - patient_responsibility_est: number
        """
        response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)

class RecoveryAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Rehab Specialist",
            role="Recovery",
            description="Designs physical therapy plans and monitors post-op recovery."
        )
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["generate_rehab_plan"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task == "generate_rehab_plan":
            return await self._generate_rehab_plan(payload)
        return {"error": "Unknown task"}

    async def _generate_rehab_plan(self, payload: Dict[str, Any]):
        condition = payload.get("condition", "General Recovery")
        age = payload.get("age", 30)
        severity = payload.get("severity", "Moderate")
        
        prompt = f"""
        ACT AS: Expert Physical Therapist.
        TASK: Design a 4-week recovery plan for:
        - Condition: {condition}
        - Patient Age: {age}
        - Severity: {severity}
        
        OUTPUT: JSON format with fields:
        - overview: string (summary of approach)
        - precautions: list of strings (what to avoid)
        - timeline: list of objects (phases)
          - phase_name: string (e.g. "Weeks 1-2: Mobility")
          - goals: list of strings
          - exercises: list of objects {{ "name": string, "frequency": string, "sets": string }}
        - estimated_recovery_time: string
        """
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            return {"error": f"Failed to generate plan: {str(e)}"}

class PsychologyAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Wellness Support",
            role="Psychologist",
            description="Provides mental health support, anxiety management, and coping strategies."
        )
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["mental_health_screening", "coping_strategies"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task == "coping_strategies":
             return await self._generate_coping_strategies(payload)
        return {"error": "Unknown task"}

    async def _generate_coping_strategies(self, payload: Dict[str, Any]):
        diagnosis = payload.get("diagnosis", "General Stress")
        prompt = f"""
        ACT AS: Clinical Psychologist.
        TASK: Suggest coping strategies for a patient dealing with: {diagnosis}.
        
        OUTPUT: JSON format with fields:
        - strategies: list of objects {{ "title": string, "description": string, "duration_mins": number }}
        - daily_affirmation: string
        - recommended_resources: list of strings (book titles or app types)
        """
        response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)

from typing import Dict, Any
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json
from ..base import BaseAgent
from ...models import Case

class EmergencyAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Emergency Response Unit",
            role="Emergency",
            description="High-priority triage, rapid protocol generation, and critical alert management."
        )
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash") 

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["emergency_protocol", "crash_cart_recommendation", "rapid_triage"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task == "emergency_protocol":
            return await self._generate_protocol(payload)
        return {"error": "Unknown task"}

    async def _generate_protocol(self, payload: Dict[str, Any]):
        symptoms = payload.get("symptoms", "Unknown")
        vitals = payload.get("vitals", "Unknown")
        
        prompt = f"""
        CRITICAL EMERGENCY:
        Symptoms: {symptoms}
        Vitals: {vitals}
        
        Generate an immediate, step-by-step emergency stabilization protocol.
        Format: JSON {{ "steps": ["step 1", "step 2"], "equipment_needed": ["item 1"], "alert_level": "RED/YELLOW" }}
        """
        try:
            response = await self.model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception:
            return {"steps": ["Call 911", "Stabilize patient"], "alert_level": "RED"}

class LaboratoryAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Lab Tech AI",
            role="Laboratory",
            description="Analyzes lab results, flags abnormalities, and suggests follow-up tests."
        )
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["analyze_labs", "validate_results"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task == "analyze_labs":
            return await self._analyze_lab_results(payload, db)
        return {"error": "Unknown task"}

    async def _analyze_lab_results(self, payload: Dict[str, Any], db: Session):
        case_id = payload.get("case_id")
        if not case_id:
             return {"error": "Case ID required."}

        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
             return {"error": "Case not found."}

        lab_data = []
        if case.lab_results:
             for res in case.lab_results:
                 lab_data.append(f"{res.test}: {res.value} {res.unit} (Ref: {res.reference_range})")
        
        if not lab_data and case.findings:
             lab_data.append(f"Make inferences from findings: {case.findings}")

        if not lab_data:
             return {"status": "warning", "message": "No lab results found in case record."}

        prompt = f"""
        ACT AS: Clinical Pathologist.
        TASK: Analyze these lab results: {json.dumps(lab_data)}
        
        OUTPUT: JSON format with fields:
        - abnormalities: list of objects {{ "test": string, "flag": "High"|"Low"|"Critical", "explanation": string }}
        - clinical_significance: string (summary)
        - recommended_followup: list of strings
        """
        
        try:
            response = await self.model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            return {"error": str(e)}

class RadiologyAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Radiology AI",
            role="Radiology",
            description="Analyzes medical imaging (X-Ray, CT, MRI) and generates preliminary reports."
        )
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["analyze_image", "analyze_xray", "analyze_ct"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task in ["analyze_image", "analyze_xray", "analyze_ct"]:
            return await self._analyze_radiology(payload, db)
        return {"error": "Unknown task"}

    async def _analyze_radiology(self, payload: Dict[str, Any], db: Session):
        return {"message": "Radiology analysis not fully verified in this test mode."}

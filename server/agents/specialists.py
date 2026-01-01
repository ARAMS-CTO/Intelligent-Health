from typing import Dict, Any
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json
from .base import BaseAgent

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
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp") # High intelligence for critical decisions

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
        response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)

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
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

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

        # Check if case has structured lab results
        lab_data = []
        if case.lab_results:
             for res in case.lab_results:
                 lab_data.append(f"{res.test}: {res.value} {res.unit} (Ref: {res.reference_range})")
        
        # Also check extraction/files if no structured data (simplified fallback)
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
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            return {"error": str(e)}

from ..models import Case, CaseFile

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
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["analyze_image", "analyze_xray", "analyze_ct"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task in ["analyze_image", "analyze_xray", "analyze_ct"]:
            return await self._analyze_radiology(payload, db)
        return {"error": "Unknown task"}

    async def _analyze_radiology(self, payload: Dict[str, Any], db: Session):
        case_id = payload.get("case_id")
        if not case_id:
             return {"error": "Case ID required for backend analysis."}

        # Fetch Case Images
        # logic: get all files for case, filter for images, pick latest
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
             return {"error": "Case not found."}
        
        # Simple filter for images
        images = [f for f in case.files if any(ext in f.url.lower() for ext in ['.png', '.jpg', '.jpeg', '.webp', '.dcm'])]
        
        if not images:
             return {
                 "status": "warning", 
                 "message": "No imaging files found in this case.", 
                 "findings": "N/A", 
                 "impression": "No image available for analysis."
             }
             
        # Use the most recent image
        # Assuming last in list is recent or we stick to one.
        target_image = images[-1]
        
        # Resolve path - assuming url is like /uploads/filename
        # and server is running from root, validation needed
        filename = target_image.url.split('/')[-1]
        file_path = f"static/uploads/{filename}"
        
        if not os.path.exists(file_path):
             return {"error": f"Image file not found on server at {file_path}"}
             
        try:
             # Read file
             with open(file_path, "rb") as f:
                 image_data = f.read()
                 
             mime_type = "image/jpeg" 
             if target_image.url.lower().endswith(".png"): mime_type = "image/png"
             # ... other mappings
             
             file_part = {"mime_type": mime_type, "data": image_data}
             
             prompt = """
             ACT AS: Expert Radiologist.
             TASK: Analyze this medical image.
             
             OUTPUT: JSON format with fields:
             - modality: string (e.g. X-Ray, CT, MRI)
             - body_part: string
             - findings: list of strings (detailed observations)
             - abnormalities_detected: boolean
             - impression: string (concise summary)
             - urgency: "Routine" | "Urgent" | "Critical"
             - recommendations: list of strings
             """
             
             response = self.model.generate_content([prompt, file_part], generation_config={"response_mime_type": "application/json"})
             return json.loads(response.text)
             
        except Exception as e:
             print(f"Radiology Agent Error: {e}")
             return {"error": f"Analysis failed: {str(e)}"}

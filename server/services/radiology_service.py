import google.generativeai as genai
from ..config import settings
import json

class RadiologyAIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.model = None

    async def draft_report(self, study_data: dict) -> str:
        if not self.model:
            return "AI Service Unavailable. Please configure GEMINI_API_KEY."

        prompt = f"""
        You are an expert Radiologist. Draft a preliminary radiology report for the following study:
        
        Patient: {study_data.get('patient_name', 'Unknown')}
        Modality: {study_data.get('modality', 'Unknown')}
        Body Part: {study_data.get('body_part', 'Unknown')}
        Indication: {study_data.get('indication', 'None provided')}
        
        Structure the report with:
        1. Exam Description
        2. Clinical Indication
        3. Technique (standard protocol)
        4. Comparison (None)
        5. Findings (Generate plausible normal or minor abnormal findings based on indication)
        6. Impression
        
        Keep it professional and concise.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error generating report: {e}")
            return "Error generating report."

    async def detect_abnormalities(self, study_data: dict) -> list:
        if not self.model:
            return [{"finding": "Service Offline", "confidence": 0.0}]

        prompt = f"""
        Analyze the clinical indication for this radiology study and predict potential abnormalities to look for:
        
        Modality: {study_data.get('modality')}
        Body Part: {study_data.get('body_part')}
        Indication: {study_data.get('indication')}
        
        Return a JSON list of objects with keys: "finding" (string) and "likelihood" (High/Medium/Low) based on the indication.
        Example: [{{"finding": "Appendicitis", "likelihood": "High"}}]
        """
        
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            print(f"Error detecting abnormalities: {e}")
            return []

radiology_ai = RadiologyAIService()

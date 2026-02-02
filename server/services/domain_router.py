import google.generativeai as genai
from ..config import settings
from typing import Dict

class DomainRouter:
    """
    Classifies medical cases into specific health domains to route to the appropriate Specialist Agent.
    """
    
    DOMAINS = ["Cardiology", "Orthopedics", "Pulmonology", "Endocrinology", "General"]
    
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
    async def classify_domain(self, text: str) -> Dict[str, str]:
        """
        Returns {'domain': 'Cardiology', 'confidence': 'High', 'reason': '...'}
        """
        if not settings.GEMINI_API_KEY:
            return {"domain": "General", "confidence": "Low", "reason": "Offline"}

        prompt = f"""
        Classify the following medical case description into one of these domains: {', '.join(self.DOMAINS)}.
        
        Case: "{text}"
        
        Return JSON with keys: 'domain', 'confidence' (Low/Medium/High), 'reason' (short explanation).
        If uncertain or multiple domains apply, choose the most acute/relevant one or 'General'.
        """
        
        try:
            model = genai.GenerativeModel("gemini-2.5-flash", generation_config={"response_mime_type": "application/json"})
            response = await model.generate_content_async(prompt)
            import json
            return json.loads(response.text)
        except Exception as e:
            print(f"Router Error: {e}")
            return {"domain": "General", "confidence": "Low", "reason": "Error in classification"}

domain_router = DomainRouter()

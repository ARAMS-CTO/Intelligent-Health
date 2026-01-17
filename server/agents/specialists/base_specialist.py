from typing import Dict, Any, List
from ..base import BaseAgent
from ...services.openai_service import openai_service
from ...services.anthropic_service import anthropic_service
import google.generativeai as genai
from ...config import settings

class SpecialistAgent(BaseAgent):
    """
    Base class for Domain-Specific Specialist Agents (e.g., Cardiology, Orthopedics).
    Leverages CAG (Contextual Augmented Generation) via specialized System Instructions.
    """
    
    def __init__(self, domain_name: str, domain_emoji: str):
        super().__init__(
            name=f"{domain_name}Specialist", 
            role="Specialist",
            description=f"Domain expert in {domain_name}. Handles consults, guidelines, and risk assessment."
        )
        self.domain_name = domain_name
        self.domain_emoji = domain_emoji
        
        # Configure Gemini (Primary Brain)
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["specialist_consult", "consult_guidelines", "assess_risk"]

    def get_system_instruction(self) -> str:
        """
        To be implemented by subclasses.
        Returns the specific CAG prompt for the specialist.
        """
        return f"You are a specialized medical AI assistant for {self.domain_name}."

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db_session=None) -> Dict[str, Any]:
        """
        Processes a request using the specialist's domain knowledge.
        """
        query = payload.get("query")
        case_data = payload.get("case_data", "")
        
        # 1. Construct CAG Prompt
        system_instruction = self.get_system_instruction()
        
        prompt = f"""
        Case Context:
        {case_data}
        
        Specific Query:
        {query}
        
        Provide a detailed, domain-specific response based on your expertise in {self.domain_name}.
        Cite relevant guidelines if applicable.
        """
        
        # 2. Call AI (Gemini Flash for speed/reasoning, or Pro for complex)
        response_text = "AI Service Unavailable"
        try:
            model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_instruction)
            result = await model.generate_content_async(prompt)
            response_text = result.text
        except Exception as e:
            response_text = f"Error consulting specialist: {str(e)}"

        return {
            "status": "success",
            "domain": self.domain_name,
            "message": response_text,
            "actions": self.get_suggested_actions(case_data)
        }

    def get_suggested_actions(self, case_data: str) -> List[Dict[str, str]]:
        """
        Returns a list of suggested UI actions/tools relevant to the domain.
        Override in subclasses.
        """
        return []

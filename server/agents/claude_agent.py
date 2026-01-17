from typing import Dict, Any, List
from sqlalchemy.orm import Session
from .base import BaseAgent
from ..services.anthropic_service import anthropic_service

class ClaudeSpecialistAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Claude Healthcare Specialist",
            role="HealthcareSpecialist",
            description="Expert in ICD-10 coding, clinical references (PubMed), and administrative healthcare data."
        )
        self.capabilities = [
            "consult_healthcare_data", 
            "find_icd10_codes", 
            "research_clinical_guidelines"
        ]

    def can_handle(self, task_type: str) -> bool:
        return task_type in self.capabilities

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """
        Process task using Anthropic Service.
        """
        query = payload.get("query", "")
        if task == "find_icd10_codes":
             query = f"Find ICD-10 codes for: {payload.get('condition', query)}"
        elif task == "research_clinical_guidelines":
             query = f"Find clinical guidelines for: {payload.get('condition', query)}"
             
        # Call Anthropic "MCP" Method
        data = await anthropic_service.analyze_healthcare_data(
            query=query,
            context=payload.get("context", f"User Role: {context.get('user_role')}")
        )
        
        return {
            "status": "success",
            "agent": self.name,
            "data": data,
            "message": "Healthcare data retrieved from Claude."
        }

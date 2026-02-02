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
        
        # 1. RAG Retrieve
        # 1. RAG Retrieve via AgentService (Unified)
        knowledge_context = ""
        try:
             # Use the global agent_service which now supports Persistent PGVector + Filtering
             from ...services.agent_service import agent_service
             
             # Filter by domain (assuming metadata has 'domain' or related tags)
             # Note: Knowledge items might not strictly have 'domain' field yet unless we enforce it during ingestion.
             # However, we can use the 'context' or 'type' fields if available.
             # For now, let's filter by type='medical_knowledge' or similar if we had specific tags.
             # If no tags, we just query with semantic focus.
             # But the 'filter' param is powerful. Let's try to query for general knowledge + user specific context.
             
             rag_content = agent_service.retrieve_context(
                 user_id=context.get("user_id", "system"), 
                 query=f"{self.domain_name} guidelines for: {query}", 
                 n_results=3
                 # filter={"domain": self.domain_name} # Enable this once ingestion tags are robust
             )
             
             if rag_content:
                 knowledge_context = f"Relevant Guidelines & Research (RAG):\n{rag_content}"
                 
        except Exception as e:
             print(f"RAG Error: {e}")

        # 2. Construct CAG Prompt
        system_instruction = self.get_system_instruction()
        
        prompt = f"""
        Case Context:
        {case_data}
        
        {knowledge_context}
        
        Specific Query:
        {query}
        
        Provide a detailed, domain-specific response based on your expertise in {self.domain_name}.
        Cite relevant guidelines if applicable.
        """
        
        # 2. Call AI (Dynamic Model Selection)
        response_text = "AI Service Unavailable"
        try:
            from ..slm_orchestrator import slm_orchestrator
            model_name = slm_orchestrator.select_model(query, self.domain_name)
            
            model = genai.GenerativeModel(model_name, system_instruction=system_instruction)
            result = await model.generate_content_async(prompt)
            response_text = result.text
        except Exception as e:
            response_text = f"Error consulting specialist: {str(e)}"

        # 3. Security & Action Handling
        suggested_actions = self.get_suggested_actions(case_data)
        safe_actions = [a for a in suggested_actions if self.validate_action(a, context)]

        # 4. Log to Training Dataset (Async/Fire-and-forget ideally, but sync for now)
        try:
             if db_session:
                 from ...models import TrainingDataset
                 import datetime
                 
                 log_entry = TrainingDataset(
                     domain=self.domain_name,
                     query=query,
                     response=response_text,
                     context_summary=case_data[:200] + "..." if len(case_data) > 200 else case_data,
                     user_id=context.get('user_id'),
                     tags=["cag", "specialist"],
                     timestamp=datetime.datetime.utcnow()
                 )
                 db_session.add(log_entry)
                 db_session.commit()
        except Exception as e:
             print(f"Training Log Error: {e}")

        return {
            "status": "success",
            "domain": self.domain_name,
            "message": response_text,
            "actions": safe_actions
        }

    def validate_action(self, action: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """
        Checks if the action is safe/allowed for the current user context.
        """
        risk = action.get('risk_level', 'LOW')
        user_role = context.get('user_role', 'Patient')
        
        if risk == 'HIGH' and user_role != 'Doctor':
            return False
            
        return True

    def get_suggested_actions(self, case_data: str) -> List[Dict[str, Any]]:
        """
        Returns a list of suggested UI actions/tools relevant to the domain.
        Each action must have: label, action_id, risk_level.
        """
        return []

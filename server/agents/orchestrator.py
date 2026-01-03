from typing import Dict, Any, List
from sqlalchemy.orm import Session
from .base import BaseAgent
from .nurse import NurseAgent
from .doctor import DoctorAgent
from .specialists import EmergencyAgent, LaboratoryAgent, RadiologyAgent
from .support import PatientAgent, InsuranceAgent, PricingAgent, RecoveryAgent, PsychologyAgent
from .researcher import ResearcherAgent

import google.generativeai as genai
import json
import os

class AgentOrchestrator:
    """
    The Traffic Controller.
    Manages the registry of agents and routes tasks to the appropriate one.
    """
    def __init__(self):
        # Configure Gemini for Routing
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.router_model = genai.GenerativeModel("gemini-2.0-flash-exp")
            
        self.agents: List[BaseAgent] = [
            NurseAgent(),
            DoctorAgent(),
            EmergencyAgent(),
            LaboratoryAgent(),
            RadiologyAgent(),
            PatientAgent(),
            InsuranceAgent(),
            PricingAgent(),
            RecoveryAgent(),
            PsychologyAgent(),
            ResearcherAgent()
        ]

    async def route_task(self, query: str) -> Dict[str, Any]:
        """
        Intelligently routes a natural language query to a specific task and payload.
        """
        if not self.router_model:
            return {"error": "Router LLM not configured"}

        # Dynamic Capability List
        possible_tasks = ['triage', 'diagnose', 'analyze_labs', 'analyze_image', 'check_eligibility', 'estimate_cost', 'coping_strategies', 'research_condition', 'find_guidelines', 'drug_interaction_deep_dive', 'generate_rehab_plan', 'emergency_protocol', 'mental_health_screening']
        caps_desc = "\n".join([f"- {a.name}: {a.description} (Tasks: {[t for t in possible_tasks if a.can_handle(t)]})" for a in self.agents])

        prompt = f"""
        ACT AS: AI Agent Router.
        CONTEXT: You are managing a hospital agent bus.
        AGENTS:
        {caps_desc}

        USER QUERY: "{query}"

        TASK: Map the query to the BEST single task.
        OUTPUT: JSON only: {{ "task": "string", "payload": {{ "param_name": "value" }} }}
        If no match, return {{ "error": "No suitable agent found" }}
        
        Common Maps:
        - "Triage case X" -> task: "triage", payload: {{ "case_id": "X" }}
        - "Check intersection for ..." -> task: "check_drug_interaction" (if Nurse handles) OR "triage"
        - "Analyze X-Ray..." -> task: "analyze_image"
        - "Find guidelines for X..." -> task: "find_guidelines", payload: {{ "condition": "X" }}
        - "Research treatment for Y..." -> task: "research_condition", payload: {{ "query": "Y" }}
        """
        
        try:
            response = self.router_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            return {"error": f"Routing failed: {str(e)}"}

    def get_agent_for_task(self, task: str) -> BaseAgent:
        """
        Simple Registry Lookup. 
        In the future, this could use an LLM to decide which agent is best suited based on the task description.
        """
        for agent in self.agents:
            if agent.can_handle(task):
                return agent
        return None

    async def dispatch(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """
        Main entry point for the backend.
        """
        # 1. GDPR/Consent Check
        user_id = context.get("user_id")
        if user_id:
            from ..models import User # Delayed import to avoid circular dependency
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                # 1. GDPR/Consent Check
                # Check explicit consents from the User model
                # Note: We allow 'ResearcherAgent' to run generally, but 'DoctorAgent' or 'NurseAgent' on specific patient data might need consent.
                # For now, we enforce a baseline: If no GDPR consent, simple block.
                
                if hasattr(user, 'gdpr_consent') and user.gdpr_consent is False:
                     # Allow 'coping_strategies' (Psychology) or internal tasks, but block heavy data tasks?
                     # For simplicity and compliance: Block AI usage if no consent.
                     return {
                         "status": "error", 
                         "message": "GDPR Permission Denied: You must enable 'GDPR Consent' in your profile to use AI Agents."
                     }
                
                # Check Data Sharing for Research/External
                if task in ["research_condition", "contribute_data"] and hasattr(user, 'data_sharing_consent') and user.data_sharing_consent is False:
                     return {
                         "status": "error",
                         "message": "Data Sharing Permission Denied: Enable 'Data Sharing' to use Research Agents."
                     }

        agent = self.get_agent_for_task(task)
        if not agent:
             return {"status": "error", "message": f"No agent found capable of handling task: {task}"}
        
        # Log the dispatch?
        # print(f"Dispatching task '{task}' to agent '{agent.name}'")
        
        return await agent.process(task, payload, context, db)

    def list_capabilities(self):
        caps = []
        for agent in self.agents:
            caps.append(agent.get_metadata())
        return caps

# Singleton Instance
orchestrator = AgentOrchestrator()

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from .base import BaseAgent
from .nurse import NurseAgent
from .doctor import DoctorAgent
from .specialists import (
    EmergencyAgent, LaboratoryAgent, RadiologyAgent, 
    CardiologyAgent, OrthopedicsAgent, PulmonologyAgent, EndocrinologyAgent
)
from .support import PatientAgent, InsuranceAgent, PricingAgent, RecoveryAgent, PsychologyAgent
from .researcher import ResearcherAgent
from .integration_agent import IntegrationAgent

from .claude_agent import ClaudeSpecialistAgent
from .openai_agent import OpenAIAgent
from ..services.domain_router import domain_router

import google.generativeai as genai
import json
import os
import uuid
from datetime import datetime

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
            self.router_model = genai.GenerativeModel("gemini-2.5-flash")
            
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
            ResearcherAgent(),
            IntegrationAgent(),
            ClaudeSpecialistAgent(),
            OpenAIAgent(),
            CardiologyAgent(),
            OrthopedicsAgent(),
            PulmonologyAgent(),
            EndocrinologyAgent()
        ]

    async def route_task(self, query: str) -> Dict[str, Any]:
        """
        Intelligently routes a natural language query to a specific task and payload.
        """
        if not self.router_model:
            return {"error": "Router LLM not configured"}

        # Dynamic Capability List
        possible_tasks = [
            'triage', 'diagnose', 'analyze_labs', 'analyze_image', 'check_eligibility', 
            'estimate_cost', 'coping_strategies', 'research_condition', 'find_guidelines', 
            'drug_interaction_deep_dive', 'generate_rehab_plan', 'emergency_protocol', 
            'mental_health_screening', 'treatment_plan', 'review_labs', 'clinical_summary', 
            'augment_case', 'daily_checkin', 'vitals_check', 'monitor', 'initial_assessment',
            'check_interactions', 'check_drug_interaction', 'prior_auth', 'chat_with_patient',
            'daily_checkup', 'crash_cart_recommendation', 'rapid_triage', 'validate_results',
            'analyze_xray', 'analyze_ct', 'consult_healthcare_data', 'find_icd10_codes', 'research_clinical_guidelines',
            'general_consultation', 'complex_reasoning', 'second_opinion', 'analyze_medical_structured',
            'specialist_consult'
        ]
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
        - "Consult specialist for..." -> task: "specialist_consult", payload: {{ "query": "...", "case_data": "..." }}
        """
        
        try:
            response = await self.router_model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
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
        Main entry point for the backend. Handles single task execution and Result Persistence.
        """
        # 1. SPECIAL LOGIC: Specialist Consult with Auto-Routing
        if task == "specialist_consult":
            domain = payload.get("domain")
            if not domain and payload.get("case_data"):
                # Auto-Identify Domain
                classification = await domain_router.classify_domain(payload["case_data"])
                domain = classification.get("domain", "General")
            
            # Find the specific agent for this domain
            target_agent = None
            for agent in self.agents:
                if hasattr(agent, 'domain_name') and agent.domain_name == domain:
                    target_agent = agent
                    break
            
            # Fallback to General (DoctorAgent) if specialist not found
            if not target_agent:
                target_agent = self.get_agent_for_task("diagnose") # Default to Doctor
                payload["query"] = f"[Domain: {domain}] {payload.get('query')}"
                
            agent = target_agent
        else:
            # Standard Lookup
            agent = self.get_agent_for_task(task)

        # 1. GDPR/Consent Check
        user_id = context.get("user_id")
        if user_id:
            from ..models import User # Delayed import to avoid circular dependency
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                # 1. GDPR/Consent Check
                if hasattr(user, 'gdpr_consent') and user.gdpr_consent is False:
                     # Allow 'coping_strategies' (Psychology) or internal tasks, but block heavy data tasks
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

        if not agent:
             return {"status": "error", "message": f"No agent found capable of handling task: {task}"}
        
        # Check Admin Configuration (Active Status)
        from ..models import AgentCapability
        capability = db.query(AgentCapability).filter(AgentCapability.capability_name == task).first()
        if capability and not capability.is_active:
             return {"status": "error", "message": f"Agent Capability '{task}' is currently disabled by Administrators."}
        
        # Log execution
        try:
             import server.models as models
             log = models.SystemLog(
                 event_type="ai_query", 
                 user_id=user_id if user_id else "system", 
                 details={"task": task, "agent": agent.name, "action": "dispatch", "status": "started"}
             )
             db.add(log)
             db.commit()
        except Exception as e:
             print(f"Orchestrator Log Error: {e}")
        
        # 2. EXECUTE AGENT
        # Some agents might need specialized method calls, but process() is the standard interface.
        result = await agent.process(task, payload, context, db)

        # 3. RESULT PERSISTENCE (Orchestration Layer)
        # Automatically save high-value outputs to DB if not already handled by agent
        try:
            if task == "research_condition" and "summary" in result:
                # Save as KnowledgeItem
                from ..models import KnowledgeItem
                if user_id:
                    k_item = KnowledgeItem(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        content=result["summary"],
                        metadata_={"type": "research", "query": payload.get("query"), "source": "ResearcherAgent"}
                    )
                    db.add(k_item)
                    db.commit()

            elif task == "generate_health_summary" and "summary" in result:
                # Update Patient Profile or Agent State
                from ..models import AgentState
                if user_id:
                    state = db.query(AgentState).filter(AgentState.user_id == user_id).first()
                    if not state:
                        state = AgentState(user_id=user_id, interaction_history_summary="")
                        db.add(state)
                    
                    # Append to summary history
                    new_summary = f"\n[Health Summary {datetime.utcnow().date()}]: {result['summary'][:200]}..."
                    state.interaction_history_summary = (state.interaction_history_summary or "") + new_summary
                    db.commit()

        except Exception as e:
            print(f"Result Persistence Error: {e}")

        return result

    async def execute_workflow(self, workflow_name: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        """
        Executes a pre-defined multi-step workflow.
        """
        results = {}
        
        if workflow_name == "comprehensive_patient_analysis":
            # Domain-Aware Multi-Agent Consultation
            import asyncio
            from ..models import Case

            # 1. Get Case & Identify Domain
            case_id = payload.get("case_id")
            if not case_id: return {"error": "Missing case_id"}
            
            case = db.query(Case).filter(Case.id == case_id).first()
            if not case: return {"error": "Case not found"}

            case_text = f"Complaint: {case.complaint}\nHistory: {case.history}\nFindings: {case.findings}"
            classification = await domain_router.classify_domain(case_text)
            domain = classification.get("domain", "General")
            
            # Helper for conditional tasks
            async def run_task_or_skip(condition, task_name, task_payload):
                if condition:
                    return await self.dispatch(task_name, task_payload, context, db)
                return {"status": "skipped", "message": "Not applicable"}

            # 2. Parallel Execution of Specialists
            # - Domain Specialist (Cardio, Ortho, etc.)
            # - Lab Specialist (if labs exist)
            # - Radiology Specialist (if imaging exists)
            
            has_labs = bool(case.lab_results)
            has_images = any(f.type in ['CT', 'X-Ray', 'MRI', 'Photo', 'Doppler Scan'] for f in case.files)

            specialist_task = self.dispatch(
                "specialist_consult", 
                {"query": "Please provide a comprehensive domain assessment for this case.", "case_data": case_text, "domain": domain}, 
                context, db
            )
            
            lab_task = run_task_or_skip(has_labs, "analyze_labs", {"case_id": case_id})
            img_task = run_task_or_skip(has_images, "analyze_image", {"case_id": case_id})

            results = await asyncio.gather(specialist_task, lab_task, img_task)
            spec_res, lab_res, img_res = results

            # 3. Synthesis by Doctor (Moderator)
            # We treat the specialist outputs as "expert testimony" for the Doctor to synthesize
            
            synthesis_payload = {
                "case_id": case_id,
                "extracted_data": { 
                    "consultation_context": f"Multi-Disciplinary Team Review ({domain})",
                    "specialist_opinion": spec_res.get("message"),
                    "lab_analysis": lab_res,
                    "radiology_analysis": img_res,
                    "domain_actions": spec_res.get("actions", [])
                },
                "baseline_illnesses": case.patientProfile.comorbidities if case.patientProfile else []
            }
            
            # Using 'augment_case' to synthesize findings
            final_res = await self.dispatch("augment_case", synthesis_payload, context, db)
            
            return {
                "status": "success",
                "domain": domain,
                "consultation_summary": {
                    "specialist": spec_res,
                    "labs": lab_res,
                    "imaging": img_res
                },
                "final_recommendation": final_res
            }
            
        return {"error": "Unknown workflow"}

    def list_capabilities(self):
        caps = []
        for agent in self.agents:
            caps.append(agent.get_metadata())
        return caps

# Singleton Instance
orchestrator = AgentOrchestrator()

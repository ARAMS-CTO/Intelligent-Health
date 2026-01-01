from sqlalchemy.orm import Session
from ..models import AgentCapability
from ..schemas import AgentCapability as AgentCapabilitySchema
import google.generativeai as genai
import json
import os
from .agents.nurse_agent import nurse_agent
from .agents.billing_agent import billing_agent
from .agents.pharmacy_agent import pharmacy_agent

class AgentBusService:
    def __init__(self):
        # Fallback key check
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp") # Fast model for routing
        else:
            self.model = None

    def register_capability(self, db: Session, capability: AgentCapabilitySchema):
        # Check if exists (by name and role)
        existing = db.query(AgentCapability).filter(
            AgentCapability.agent_role == capability.agent_role,
            AgentCapability.capability_name == capability.capability_name
        ).first()

        if existing:
            # Update
            existing.description = capability.description
            existing.input_schema = capability.input_schema
            existing.output_schema = capability.output_schema
            existing.is_active = capability.is_active
        else:
            # Create
            new_cap = AgentCapability(
                id=capability.id,
                agent_role=capability.agent_role,
                capability_name=capability.capability_name,
                description=capability.description,
                input_schema=capability.input_schema,
                output_schema=capability.output_schema,
                is_active=capability.is_active
            )
            db.add(new_cap)
        
        db.commit()
        return {"status": "registered", "capability": capability.capability_name}

    def find_capability(self, db: Session, query: str):
        # Fetch all active capabilities
        caps = db.query(AgentCapability).filter(AgentCapability.is_active == True).all()
        
        if not caps:
            return []

        # Format for LLM
        tools_desc = "\n".join([f"- {c.capability_name} (Agent: {c.agent_role}): {c.description}" for c in caps])
        
        prompt = f"""
        You are an intelligent internal router for a hospital system.
        User Query: "{query}"
        
        Available Capabilities:
        {tools_desc}
        
        Return JSON list of the best matching capability names (top 3 max). 
        If none match, return empty matches list.
        
        JSON format: {{"matches": ["capability_name"]}}
        """
        
        if not self.model:
            return [{"error": "AI Service unavailable for routing"}]

        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            data = json.loads(response.text)
            matches = data.get("matches", [])
            
            # Retrieve full objects
            results = [c for c in caps if c.capability_name in matches]
            return results
        except Exception as e:
            print(f"Routing Error: {e}")
            return []

    def execute_capability(self, capability_name: str, params: dict):
        """
        Executes the registered python function for a capability.
        In a real distributed system, this would send an RPC/HTTP request to the agent service.
        Here we map to local function calls.
        """
        try:
            if capability_name == "triage_patient":
                return nurse_agent.triage_patient(params.get("symptoms", ""), params.get("vitals", {}))
            
            elif capability_name == "check_insurance_eligibility":
                return billing_agent.check_insurance_eligibility(params.get("patient_id", ""), params.get("procedure_code", ""))
            
            elif capability_name == "check_drug_interaction":
                 return pharmacy_agent.check_drug_interaction(params.get("medications", []))
            
            else:
                return {"error": "Capability execution not implemented or unknown."}
        except Exception as e:
            return {"error": f"Execution failed: {str(e)}"}

    def seed_defaults(self, db: Session):
        defaults = [
            {
                "id": "cap-billing-1",
                "agent_role": "BillingAgent",
                "capability_name": "check_insurance_eligibility",
                "description": "Verifies patient insurance coverage and eligibility for specific procedures.",
                "input_schema": {"patient_id": "string", "procedure_code": "string"},
                "output_schema": {"eligible": "boolean", "copay": "number"},
                "is_active": True
            },
            {
                "id": "cap-nurse-1",
                "agent_role": "NurseAgent",
                "capability_name": "triage_patient",
                "description": "Assess patient symptoms and assign priority level (1-5).",
                "input_schema": {"symptoms": "string", "vitals": "object"},
                "output_schema": {"priority": "integer", "notes": "string"},
                "is_active": True
            },
            {
                "id": "cap-pharmacy-1",
                "agent_role": "PharmacyAgent",
                "capability_name": "check_drug_interaction",
                "description": "Checks for adverse interactions between a list of medications.",
                "input_schema": {"medications": "list[string]"},
                "output_schema": {"interactions": "list[string]", "severity": "string"},
                "is_active": True
            }
        ]
        
        count = 0
        for d in defaults:
            # Check exist
            exists = db.query(AgentCapability).filter(AgentCapability.id == d["id"]).first()
            if not exists:
                db.add(AgentCapability(**d))
                count += 1
        db.commit()
        return {"status": "seeded", "count": count}

agent_bus = AgentBusService()

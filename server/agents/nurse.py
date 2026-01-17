from typing import Dict, Any
from sqlalchemy.orm import Session
import json
import os
import google.generativeai as genai
from .base import BaseAgent
from ..models import Case as CaseModel, SystemLog
from ..services.agent_service import agent_service

class NurseAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Nurse Ratched", # Friendly reference or standard? using standard for now.
            role="Nurse",
            description="Responsible for patient triage, initial assessments, and vital sign monitoring."
        )
        # Init Gemini locally for this agent
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["triage", "vitals_check", "monitor", "initial_assessment"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task == "triage":
            return await self._perform_triage(payload, context, db)
        elif task == "initial_assessment":
            return await self._assess_patient(payload, context, db)
        else:
            raise NotImplementedError(f"NurseAgent cannot handle task: {task}")

    async def _perform_triage(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        # Functional implementation of Auto-Triage
        # Expects payload to contain criteria or just "triage_all_open" flag
        
        # 1. Fetch Cases
        # If payload has 'case_id', triage one. Else triage all open.
        target_cases = []
        if payload.get("case_id"):
            c = db.query(CaseModel).filter(CaseModel.id == payload["case_id"]).first()
            if c: target_cases.append(c)
        else:
            target_cases = db.query(CaseModel).filter(CaseModel.status == "Open").all()

        if not target_cases:
            return {"status": "success", "message": "No cases to triage."}

        # 2. AI Reasoning
        cases_data = [{"id": c.id, "complaint": c.complaint, "age": c.patient.age if c.patient else "Unknown"} for c in target_cases]
        
        user_id = context.get("user_id", "system")
        user_role = context.get("user_role", "Nurse")
        sys_instr = agent_service.get_system_instruction(user_id, user_role, db)
        
        # Override to ensure Triage Persona is dominant but includes system context (e.g. pinned protocols)
        sys_instr += "\nAct as a Senior Triage Nurse. Prioritize patient safety above all."
        
        model = genai.GenerativeModel("gemini-2.0-flash-exp", system_instruction=sys_instr)

        prompt = f"""
        Rank the following patient cases by urgency (1-5, where 5 is critical/immediate).
        Provide a short rationale for each.
        
        Input Data: {json.dumps(cases_data)}
        
        Return STRICT JSON list:
        [{{"id": "case_id", "urgency": int, "rationale": "string"}}]
        """

        try:
            response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            rankings = json.loads(response.text)
            
            updated_count = 0
            for item in rankings:
                case = db.query(CaseModel).filter(CaseModel.id == item["id"]).first()
                if case:
                    # Update Tags
                    tags = list(case.tags) if case.tags else []
                    # Remove old priority tags
                    tags = [t for t in tags if not t.startswith("Priority:")]
                    tags.append(f"Priority: {item['urgency']}")
                    case.tags = tags
                    updated_count += 1
            
            db.commit()
            return {"status": "success", "triaged_count": updated_count, "details": rankings}

        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def _assess_patient(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        # Placeholder for initial assessment logic (e.g. asking clarifying questions)
        return {"status": "mock", "message": "Assessment would happen here."}

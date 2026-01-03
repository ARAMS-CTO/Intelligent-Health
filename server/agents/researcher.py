from typing import Dict, Any, List
from sqlalchemy.orm import Session
import json
import os
import google.generativeai as genai
from .base import BaseAgent

class ResearcherAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Research Librarian", 
            role="Researcher", 
            description="Conducts medical literature research, finds clinical guidelines, and cross-references external databases."
        )
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["research_condition", "find_guidelines", "drug_interaction_deep_dive", "check_drug_interaction", "check_interactions"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task == "research_condition":
            return await self._research_condition(payload)
        elif task == "find_guidelines":
            return await self._find_guidelines(payload)
        elif task in ["drug_interaction_deep_dive", "check_drug_interaction", "check_interactions"]:
            return await self._check_drug_db(payload)
        else:
            raise NotImplementedError(f"ResearcherAgent cannot handle task: {task}")

    async def _research_condition(self, payload: Dict[str, Any]):
        query = payload.get("query")
        if not query: return {"error": "Query required"}

        # Simulate External Research using LLM Knowledge
        prompt = f"""
        ACT AS: Medical Research Librarian.
        TASK: Conduct a comprehensive research summary for: "{query}"
        SOURCES: Cite standard medical texts (e.g., Harrison's, UpToDate style).
        
        OUTPUT: JSON
        {{
            "summary": "string",
            "recent_advancements": ["string"],
            "key_references": ["string"]
        }}
        """
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            return {"error": str(e)}

    async def _find_guidelines(self, payload: Dict[str, Any]):
        condition = payload.get("condition")
        region = payload.get("region", "US/International")
        
        prompt = f"""
        ACT AS: Clinical Guidelines Expert.
        TASK: Find the current gold-standard clinical guidelines for: "{condition}" in region "{region}".
        
        OUTPUT: JSON
        {{
            "guideline_title": "string",
            "organization": "string (e.g. AHA, ACC, WHO)",
            "year": "latest",
            "key_recommendations": ["string"],
            "url_stub": "string"
        }}
        """
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            return {"error": str(e)}

    async def _check_drug_db(self, payload: Dict[str, Any]):
        # Robust extraction
        medications = payload.get("medications") or payload.get("drugs") or payload.get("meds") or []
        
        if not medications:
            return {"error": "No medications provided for interaction check."}
        
        prompt = f"""
        ACT AS: Clinical Pharmacologist.
        TASK: Perform a deep-dive interaction check on these medications: {medications}.
        Focus on CYP450 interactions, QT prolongation, and bioavailability.
        
        OUTPUT: JSON
        {{
            "interactions": [
                {{ "drug_pair": "A + B", "severity": "High/Mod/Low", "mechanism": "string", "management": "string" }}
            ],
            "safe": boolean
        }}
        """
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        except Exception as e:
            return {"error": str(e)}

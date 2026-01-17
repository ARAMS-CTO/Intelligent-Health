from typing import List, Dict, Any, Optional
import httpx
from ..config import settings

class AnthropicService:
    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.base_url = "https://api.anthropic.com/v1"
        self.model = "claude-3-sonnet-20240229" # or claude-3-opus-20240229
        self.default_headers = {
            "x-api-key": self.api_key or "",
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        system_instruction: str, 
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> str:
        """
        Generates a response from Claude.
        """
        if not self.api_key:
            return "Error: ANTHROPIC_API_KEY is not configured."

        payload = {
            "model": self.model,
            "system": system_instruction,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/messages", 
                    headers=self.default_headers, 
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"Anthropic API Error: {response.text}")
                    return f"Error from Claude: {response.status_code} - {response.text}"
                
                data = response.json()
                if "content" in data and len(data["content"]) > 0:
                    return data["content"][0]["text"]
                return ""
            except Exception as e:
                print(f"Anthropic Service Exception: {e}")
                return f"Error contacting Claude: {str(e)}"

    async def analyze_healthcare_data(self, query: str, context: str = "") -> Dict[str, Any]:
        """
        Specialized method acting as an 'MCP Server' tool to fetch healthcare data from Claude.
        Focuses on ICD-10, Medical Coding, and Clinical Research.
        """
        system = """You are an AI specialized in Healthcare and Life Sciences (Claude for Healthcare). 
        You have access to medical coding standards (ICD-10), administrative workflows, and clinical knowledge.
        
        Your task is to analyze the user query and return STRUCTURED JSON data.
        
        Output Schema:
        {
            "analysis_type": "string",
            "clinical_findings": ["string"],
            "icd10_codes": [{"code": "string", "description": "string"}],
            "admin_suggestions": ["string"],
            "research_references": ["string"]
        }
        
        Do not output conversational text outside the JSON.
        """
        
        messages = [
            {"role": "user", "content": f"Context: {context}\n\nQuery: {query}"}
        ]
        
        response = await self.generate_response(messages, system, temperature=0.2)
        
        # Parse JSON
        import json
        try:
            # Strip potential markdown
            clean = response.strip()
            if clean.startswith("```json"): clean = clean[7:]
            if clean.endswith("```"): clean = clean[:-3]
            return json.loads(clean)
        except:
            return {"error": "Failed to parse JSON from Claude", "raw": response}


# Singleton
anthropic_service = AnthropicService()

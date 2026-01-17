import httpx
from typing import List, Dict, Any, Optional
from ..config import settings
import json

class OpenAIService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.base_url = "https://api.openai.com/v1"
        self.model = "gpt-4-turbo" # Or gpt-4o, using turbo as safe default for now
        self.default_headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        system_instruction: str = None, 
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> str:
        """
        Generates a response from OpenAI.
        """
        if not self.api_key:
            return "Error: OPENAI_API_KEY is not configured."

        # Prepend system instruction if provided
        final_messages = []
        if system_instruction:
            final_messages.append({"role": "system", "content": system_instruction})
        final_messages.extend(messages)

        payload = {
            "model": self.model,
            "messages": final_messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions", 
                    headers=self.default_headers, 
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"OpenAI API Error: {response.text}")
                    return f"Error from OpenAI: {response.status_code} - {response.text}"
                
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    return data["choices"][0]["message"]["content"]
                return ""
            except Exception as e:
                print(f"OpenAI Service Exception: {e}")
                return f"Error contacting OpenAI: {str(e)}"

    async def analyze_medical_text_structured(self, query: str, context: str = "") -> Dict[str, Any]:
        """
        Uses OpenAI JSON mode to return structured medical data.
        Acts as an MCP-like endpoint for structured extractions.
        """
        system_prompt = """You are an expert AI medical assistant (OpenAI Health).
        Your task is to analyze the input and extract structured medical information.
        
        Output MUST be valid JSON matching this schema:
        {
            "category": "Diagnostics|Treatment|Admin|General",
            "medical_entities": ["entity1", "entity2"],
            "suggested_actions": ["action1", "action2"],
            "risk_assessment": "Low|Medium|High",
            "summary": "string"
        }
        """
        
        messages = [
            {"role": "user", "content": f"Context: {context}\n\nQuery: {query}"}
        ]
        
        if not self.api_key:
             return {"error": "Missing OpenAI API Key"}

        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system_prompt}] + messages,
            "response_format": { "type": "json_object" },
            "temperature": 0.2
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.default_headers,
                    json=payload,
                    timeout=30.0
                )
                if response.status_code == 200:
                    content = response.json()["choices"][0]["message"]["content"]
                    return json.loads(content)
                else:
                    return {"error": f"OpenAI Error: {response.status_code}", "raw": response.text}
            except Exception as e:
                return {"error": str(e)}

openai_service = OpenAIService()

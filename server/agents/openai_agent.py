from typing import Dict, Any, List
from sqlalchemy.orm import Session
from .base import BaseAgent
from ..services.openai_service import openai_service

class OpenAIAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="OpenAI Health Assistant",
            role="GeneralAI",
            description="Versatile AI assistant powered by GPT-4 for general medical queries, summarization, and complex reasoning."
        )
        self.capabilities = [
            "complex_reasoning",
            "analyze_medical_structured"
        ]

    def can_handle(self, task_type: str) -> bool:
        return task_type in self.capabilities

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """
        Process task using OpenAI Service.
        """
        query = payload.get("query", "")
        
        # STRUCTURED ANALYSIS (MCP-like)
        if task == "analyze_medical_structured":
            # Direct usage of OpenAI JSON mode for structured data extraction
            data = await openai_service.analyze_medical_text_structured(
                query=query,
                context=str(context)
            )
            return {
                "status": "success",
                "agent": self.name,
                "data": data, # Structured JSON
                "message": "Structured medical analysis complete."
            }

        # If task is structured analysis, usage analyze_medical_text_structured
        if task == "summarize_notes":
             query = f"Summarize these notes: {payload.get('text', query)}"
        
        # General chat or specific task?
        # For agent bus, we usually expect structured results or text.
        
        # Let's default to text response for general consultation
        messages = [
            {"role": "user", "content": f"Context: {context.get('user_role', 'User')}\nTask: {task}\n\n{query}"}
        ]
        
        response = await openai_service.generate_response(
            messages=messages,
            system_instruction="You are a helpful AI medical assistant. Provide accurate, safe, and helpful information."
        )
        
        return {
            "status": "success",
            "agent": self.name,
            "data": response, # Raw text
            "message": "Processed by OpenAI"
        }

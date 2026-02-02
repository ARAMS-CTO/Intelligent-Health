import google.generativeai as genai

class SLMOrchestrator:
    """
    Orchestrates logic to select the most efficient model (SLM vs LLM) 
    based on query complexity and domain availability.
    """
    
    @staticmethod
    def select_model(query: str, domain: str) -> str:
        """
        Returns the model name to use.
        """
        # 1. Heuristic: Length check
        if len(query) > 1000:
             return "gemini-3-pro-preview" # Use stronger model for long context
        
        # 2. Heuristic: Keywords requiring high reasoning
        complex_triggers = ["analyze", "compare", "synthesize", "treatment plan", "differential diagnosis"]
        if any(trigger in query.lower() for trigger in complex_triggers):
             return "gemini-3-pro-preview"
             
        # 3. Default to Flash (SLM-tier speed/cost)
        return "gemini-3-flash-preview"

slm_orchestrator = SLMOrchestrator()

import asyncio
import os
from server.agents.orchestrator import orchestrator
from server.agents.specialists.pulmonology import PulmonologyAgent

# Mock DB Session
class MockDB:
    def __init__(self): self.dirty = False
    def query(self, *args): return self
    def filter(self, *args): return self
    def first(self): return None
    def add(self, obj): pass
    def commit(self): pass
    def refresh(self, obj): pass

async def verify():
    print("Verifying New Specialist Agents...")
    db = MockDB()
    
    # 1. List Loaded Agents
    print("\n--- Loaded Agents ---")
    pulmo_loaded = False
    endo_loaded = False
    
    for agent in orchestrator.agents:
        if hasattr(agent, 'domain_name'):
            print(f"- {agent.name} (Domain: {agent.domain_name})")
            if agent.domain_name == "Pulmonology": pulmo_loaded = True
            if agent.domain_name == "Endocrinology": endo_loaded = True

    if not pulmo_loaded or not endo_loaded:
        print("FAILED: New agents not loaded!")
        return

    # 2. Test Pulmonology Explicit Usage
    print("\n--- Testing Pulmonology Agent ---")
    mock_payload = {
        "query": "Patient has COPD and SpO2 is 88%.",
        "case_data": "History of smoking. Wheezing present.",
        "domain": "Pulmonology"
    }
    
    try:
        response = await orchestrator.dispatch("specialist_consult", mock_payload, {}, db)
        print(f"Domain: {response.get('domain')}")
        print(f"Message: {response.get('message')[:100]}...")
        print(f"Actions: {len(response.get('actions', []))} suggested actions.")
        
        # Verify actions contain Pulmo specific ones
        actions = response.get('actions', [])
        has_lung_action = any("Spirometry" in a['label'] or "CURB-65" in a['label'] for a in actions)
        if has_lung_action:
            print("SUCCESS: Pulmonology actions detected.")
        else:
            print("WARNING: No specific pulmonology actions found.")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    current_key = os.environ.get("GEMINI_API_KEY")
    if not current_key:
        print("WARNING: GEMINI_API_KEY is not set. Agents might fail gracefully.")
    
    asyncio.run(verify())

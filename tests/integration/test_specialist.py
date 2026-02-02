import asyncio
import os
import sys

# Add root to path
sys.path.append(os.getcwd())

from server.services.learning_service import learning_service
from server.agents.factory import agent_factory

async def test_specialists():
    print("--- Testing Continuous Learning ---")
    
    # 1. Dentistry Test
    print("\n[DENTISTRY TEST]")
    learning_service.ingest_research(
        "dentistry", 
        "Silver diamine fluoride is effective for arresting caries in primary teeth.", 
        "JADA 2025"
    )
    agent = agent_factory.get_agent("dentistry")
    context = {"contextId": "tooth-14"}
    payload = {
        "query": "What are the options for a cavity on a baby tooth? I heard about some silver liquid?",
        "case_data": "Patient is 5 years old. Tooth 14 (primary molar) has a small cavity."
    }
    result = await agent.process("specialist_consult", payload, context)
    print(f"Response (Partial): {result['message'][:200]}...")

    # 2. Cardiology Test
    print("\n[CARDIOLOGY TEST]")
    learning_service.ingest_research(
        "cardiology",
        "For patients with AFib and CHA2DS2-VASc score > 2, DOACs are preferred over Warfarin.",
        "ESC Guidelines 2024"
    )
    cardio_agent = agent_factory.get_agent("cardiology")
    cardio_payload = {
        "query": "My grandma has atrial fibrillation and a stroke risk score of 4. acts?",
        "case_data": "Patient: Female, 75yo. History of HTN, Diabetes."
    }
    # Using generic context
    result_c = await cardio_agent.process("specialist_consult", cardio_payload, {})
    print(f"Response (Partial): {result_c['message'][:200]}...")

if __name__ == "__main__":
    asyncio.run(test_specialists())

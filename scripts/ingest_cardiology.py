import sys
import os
import requests
import json
import time

# Script to ingest Cardiology Protocols into the RAG system

API_BASE = "http://localhost:8000/api"
# Using a mocked admin user ID for system-wide knowledge
# In a real system, this would be a 'system' user or specific role
SYSTEM_USER_ID = "system_knowledge_base" 

# Dummy Cardiology Protocols
protocols = [
    {
        "title": "Acute Coronary Syndrome (ACS) Protocol",
        "content": """
        **Acute Coronary Syndrome (ACS) Management Protocol**
        
        1. **Immediate Assessment (< 10 mins)**:
           - 12-lead ECG.
           - Check Vitals (BP, HR, O2 Sat).
           - IV Access.
           - Troponin I/T levels.
        
        2. **Immediate Treatment (MONA)**:
           - **M**orphine: If pain is severe and not relieved by nitrates.
           - **O**xygen: Only if O2 sat < 90%.
           - **N**itroglycerine: Sublingual 0.4mg x 3 every 5 mins.
           - **A**spirin: 325mg chewed (non-enteric coated).

        3. **Risk Stratification**:
           - Use TIMI or Grace Score.
           - If STEMI: Immediate PCI (Percutaneous Coronary Intervention) goal < 90 mins (Door-to-Balloon).
           - If NSTEMI: Medical management vs. early invasive strategy based on risk.
        """,
        "metadata": {"type": "protocol", "specialty": "cardiology", "topic": "ACS", "for_role": "doctor"}
    },
    {
        "title": "Atrial Fibrillation (AFib) Guidelines",
        "content": """
        **Atrial Fibrillation (AFib) Rate vs Rhythm Control**
        
        1. **Hemodynamically Unstable**:
           - Immediate synchronized cardioversion.
        
        2. **Hemodynamically Stable**:
           - **Rate Control**: First line. Beta-blockers (Metoprolol) or Calcium Channel Blockers (Diltiazem). Goal HR < 110 bpm (Lenient) or < 80 bpm (Strict).
           - **Rhythm Control**: Considered if young, symptomatic despite rate control, or first episode. Amiodarone or Flecainide.
        
        3. **Anticoagulation (CHA2DS2-VASc Score)**:
           - Score 0: No treatment.
           - Score 1: Consider Oral Anticoagulant (OAC).
           - Score >= 2: OAC recommended (Warfarin or DOACs like Apixaban).
        """,
        "metadata": {"type": "guideline", "specialty": "cardiology", "topic": "Arrhythmia", "for_role": "doctor"}
    },
    {
        "title": "Hypertension Crisis Management",
        "content": """
        **Hypertensive Crisis (Emergency vs Urgency)**
        
        1. **Definitions**:
           - **Urgency**: BP > 180/120 WITHOUT end-organ damage.
           - **Emergency**: BP > 180/120 WITH end-organ damage (stroke, MI, renal failure).
        
        2. **Management**:
           - **Urgency**: Oral agents (Captopril, Labetalol, Clonidine). Reduce BP slowly over 24-48 hours.
           - **Emergency**: IV agents (Nicardipine, Labetalol, Esmolol). Reduce MAP by max 25% in first hour.
           - **Exceptions**: Aortic Dissection (Rapid reduction SBP < 120), Ischemic Stroke (Permissive hypertension).
        """,
        "metadata": {"type": "protocol", "specialty": "cardiology", "topic": "Hypertension", "for_role": "doctor"}
    },
    {
        "title": "Heart Failure Exacerbation",
        "content": """
        **Acute Decompensated Heart Failure (ADHF)**
        
        1. **Assessment**:
           - "Wet vs Dry" (Volume Status) and "Warm vs Cold" (Perfusion).
           - Most common: "Wet and Warm" (Volume overloaded, good perfusion).
        
        2. **Treatment (Wet & Warm)**:
           - IV Diuretics (Furosemide). Dose: 2.5x home dose iv.
           - Vasodilators (Nitroglycerine) if hypertensive.
           - Oxygen / BiPAP if respiratory distress.
        
        3. **Monitoring**:
           - Urine output.
           - Daily weights.
           - Electrolytes (K+, Mg+).
        """,
        "metadata": {"type": "protocol", "specialty": "cardiology", "topic": "Heart Failure", "for_role": "doctor"}
    }
]

def ingest_data():
    print(f"Ingesting {len(protocols)} Cardiology protocols into local RAG...")
    
    # We will use the agent_service directly via python import if API isn't running,
    # but strictly speaking we should use the API if we want to test the full stack.
    # For this script, let's try to mock the ingestion by directly using the AgentService class
    # assuming we run this in the same environment.
    
    # However, since the server is running (likely), we might not be able to access the same DB 
    # file if it's locked (SQLite) or we can just access Postgres.
    
    # Let's try to hit the API endpoint if it exists, or just print instructions.
    # The current API structure might not have a public 'ingest' endpoint exposed easily.
    # So we will create a standalone script that imports the service.
    
    try:
        sys.path.append(os.getcwd())
        from server.services.agent_service import AgentService
        
        agent_service = AgentService()
        
        for protocol in protocols:
            print(f"Adding: {protocol['title']}")
            agent_service.vector_store.add(
                user_id=SYSTEM_USER_ID,
                text=protocol['content'],
                metadata=protocol['metadata']
            )
            
        print("Ingestion Complete.")
        
    except ImportError:
        print("Error: Could not import AgentService. Run this from the project root.")
    except Exception as e:
        print(f"Ingestion failed: {e}")

if __name__ == "__main__":
    ingest_data()

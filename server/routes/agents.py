from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
import server.models as models
# AgentCapability, User accessed via models.*
# SystemLog accessed via models.SystemLog
from ..schemas import AgentCapability as AgentCapabilitySchema
from ..routes.auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[AgentCapabilitySchema])
async def list_agents(db: Session = Depends(get_db)):
    """List all available agent capabilities/tasks."""
    return db.query(models.AgentCapability).all()

@router.put("/{agent_id}", response_model=AgentCapabilitySchema)
async def update_agent(agent_id: str, updates: Dict[str, Any], current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update agent configuration (Admin only)."""
    if current_user.role != "Admin": raise HTTPException(403, "Admin only")
    
    agent = db.query(models.AgentCapability).filter(models.AgentCapability.id == agent_id).first()
    if not agent: raise HTTPException(404, "Agent not found")
    
    if "is_active" in updates:
        agent.is_active = updates["is_active"]
    if "description" in updates:
        agent.description = updates["description"]
    # Note: input/output_schema updates can be added if schema supports it
    
    db.commit()
    db.refresh(agent)
    return agent

@router.post("/{agent_id}/test")
async def test_agent(agent_id: str, payload: Dict[str, Any] = Body(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Execute an agent task directly for testing."""
    if current_user.role != "Admin": raise HTTPException(403, "Admin only")
    
    agent = db.query(models.AgentCapability).filter(models.AgentCapability.id == agent_id).first()
    if not agent: raise HTTPException(404, "Agent not found")
    
    # Execute via Orchestrator
    try:
        from ..agents.orchestrator import orchestrator
        
        context = {"user_id": current_user.id, "user_role": current_user.role}
        task_name = agent.capability_name 
        
        result = await orchestrator.dispatch(task_name, payload, context, db)
        return {"status": "success", "result": result}
    except ImportError:
         return {"status": "error", "message": "Orchestrator not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/{agent_id}/activity")
async def get_agent_activity(agent_id: str, db: Session = Depends(get_db)):
    """Get recent logs relevant to AI/Agents."""
    # Filter for each_query for now. 
    # In future, filter by agent_id in details.
    logs = db.query(models.SystemLog).filter(models.SystemLog.event_type == "ai_query").order_by(models.SystemLog.timestamp.desc()).limit(20).all()
    return logs

@router.post("/seed")
async def seed_agents_endpoint(current_user: models.User = Depends(get_current_user)):
    """Seed default agent capabilities (Admin only)."""
    if current_user.role != "Admin": raise HTTPException(403, "Admin only")
    try:
        from ..seed_data import seed_agents
        # Create new session for seeding or use db? 
        # seed_agents uses SessionLocal internally.
        seed_agents()
        return {"status": "success", "message": "Agent capabilities seeded."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
@router.post("/specialist_chat")
async def specialist_chat(
    payload: Dict[str, Any] = Body(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Direct chat with a Specialist Agent.
    Payload: { zone: "dentistry", context: {...}, query: "..." }
    """
    zone = payload.get("zone")
    context = payload.get("context", {})
    query = payload.get("query")
    context_id = context.get("contextId", "")
    
    if not zone or not query:
        raise HTTPException(400, "Missing zone or query")
    
    # Enrich context with user info
    context["user_id"] = current_user.id
    context["user_name"] = current_user.name
    
    # =========================================================================
    # MEDICAL KNOWLEDGE INJECTION
    # Based on zone and contextId, inject specialized prompts
    # =========================================================================
    knowledge_prompt = ""
    
    if zone == "urology":
        knowledge_prompt = """
You are a urology specialist with deep expertise in kidney stones (nephrolithiasis).
Key Knowledge:
- Types: Calcium Oxalate (most common), Uric Acid, Struvite, Cystine
- Risk Factors: Dehydration, high sodium diet, obesity, gout, family history
- Diagnostics: Non-contrast CT (gold standard), ultrasound, 24-hour urine collection
- Treatments: Hydration, Alpha-blockers (Tamsulosin), ESWL, Ureteroscopy, PCNL
- Prevention: Increase fluids, reduce sodium/oxalate, citrate supplementation
"""

    elif zone == "gastroenterology" and "gallstone" in context_id.lower():
        knowledge_prompt = """
You are a hepatobiliary specialist with expertise in gallstones (cholelithiasis).
Key Knowledge:
- Types: Cholesterol stones (80%), Pigment stones, Mixed
- Risk Factors: Female, age >40, obesity, rapid weight loss, pregnancy
- Diagnostics: Abdominal ultrasound, HIDA scan, MRCP
- Treatments: Laparoscopic cholecystectomy (gold standard), ERCP for CBD stones
- Complications: Cholecystitis, Choledocholithiasis, Pancreatitis, Cholangitis
"""

    elif zone == "hematology" or "clot" in context_id.lower():
        knowledge_prompt = """
You are a hematology specialist focused on thrombosis and anticoagulation.
Key Knowledge:
- Types: DVT, PE, Arterial thrombosis
- Risk Factors: Immobility, surgery, cancer, Factor V Leiden
- Diagnostics: D-dimer, Doppler ultrasound, CT Pulmonary Angiography
- Medications:
  * Eliquis (Apixaban): Factor Xa inhibitor, 5mg BID, no routine monitoring
  * Xarelto (Rivaroxaban): Factor Xa inhibitor, 20mg daily with food
  * Warfarin: Needs INR monitoring, target 2-3
- Reversals: Andexanet alfa for Xa inhibitors, Vitamin K for Warfarin
"""

    elif zone == "orthopedics":
        if "acl" in context_id.lower():
            knowledge_prompt = """
You are a sports medicine orthopedic surgeon specializing in ACL injuries.
Key Knowledge:
- Mechanism: Non-contact pivoting, sudden deceleration
- Grading: Grade I (sprain), II (partial), III (complete rupture)
- Diagnosis: Lachman test (most sensitive), MRI
- Surgery: ACL Reconstruction with patellar/hamstring/quadriceps autograft
- Recovery: 9-12 months return to sport, structured rehab critical
"""
        elif "meniscus" in context_id.lower():
            knowledge_prompt = """
You are a knee arthroscopy specialist.
Key Knowledge:
- Types: Radial, Horizontal, Bucket-handle, Flap, Complex/Degenerative
- Zones: Red-Red (vascular, heals), Red-White, White-White (avascular)
- Diagnosis: McMurray test, MRI
- Treatment: Repair (sutures) preferred if vascular; Partial meniscectomy if not
- Outcomes: Repair preserves long-term joint health
"""
        elif "knee" in context_id.lower() or "tka" in context_id.lower():
            knowledge_prompt = """
You are a joint replacement surgeon specializing in total knee arthroplasty (TKA).
Key Knowledge:
- Indications: End-stage OA, failed conservative management
- Types: Total vs Partial (unicompartmental)
- Implants: Cemented vs cementless, PS vs CR
- Recovery: 3-6 months for most activities, PT critical
- Complications: Infection, DVT/PE, stiffness, loosening
"""
        else:
            knowledge_prompt = """
You are an orthopedic specialist covering musculoskeletal conditions.
Provide evidence-based guidance on fractures, joint problems, and surgical options.
"""

    elif zone == "metabolic" or "uric" in context_id.lower() or "cholesterol" in context_id.lower():
        knowledge_prompt = """
You are a metabolic disease specialist.
Key Knowledge:

HYPERURICEMIA & GOUT:
- Normal uric acid: < 6.8 mg/dL
- Target for gout: < 6.0 mg/dL
- Adenuric (Febuxostat): 40-80mg daily, non-purine XO inhibitor
  * FDA cardiovascular warning - assess ASCVD risk
- Allopurinol: 100-800mg daily, start low, HLA-B*5801 in Asians
- Colchicine: For flare prophylaxis, 0.6mg daily/BID

HYPERLIPIDEMIA:
- LDL targets: <100 (general), <70 (high ASCVD risk)
- Lipitor (Atorvastatin): 10-80mg daily, 37-55% LDL reduction
  * Side effects: Myalgia, elevated LFTs
- Crestor (Rosuvastatin): Up to 63% LDL reduction
- Ezetimibe: Add for 15-20% additional reduction
- PCSK9 inhibitors: For refractory cases
"""

    elif zone == "cardiology" or "heart" in context_id.lower():
        knowledge_prompt = """
You are an interventional cardiologist.
Key Knowledge:
- MI Types: STEMI (door-to-balloon <90min), NSTEMI, Type 2
- Diagnostics: ECG, Troponin, Coronary angiography
- Acute Treatment: Aspirin, P2Y12 inhibitor, PCI/thrombolytics
- Secondary Prevention: Statins, Beta-blockers, ACE inhibitors
"""

    elif zone == "genetics":
        knowledge_prompt = """
You are a clinical geneticist and longevity scientist.
Key Knowledge:
- Inheritance: Autosomal dominant (50%), recessive (25% if carriers), X-linked
- Key Tests: BRCA1/2, Lynch syndrome, Familial hypercholesterolemia
- Pharmacogenomics: CYP2D6, CYP2C19, VKORC1, HLA-B*5701
- Longevity Markers: Telomere length, Epigenetic clocks (Horvath, GrimAge)
- Interventions: Senolytics, NAD+ precursors, Caloric restriction mimetics
"""

    elif zone == "oncology":
        knowledge_prompt = """
You are a medical oncologist with comprehensive cancer knowledge.
Cover staging, biomarkers (EGFR, ALK, PD-L1, BRCA), and treatment options.
Include chemotherapy, targeted therapy, and immunotherapy as appropriate.
"""
    
    try:
        from ..agents.factory import agent_factory
        agent = agent_factory.get_agent(zone)
        
        # Prepare payload for the agent with knowledge injection
        agent_payload = {
            "query": query,
            "case_data": f"Context Object: {context_id}\nFull Context: {str(context)}",
            "knowledge_context": knowledge_prompt  # Injected specialized knowledge
        }
        
        result = await agent.process("specialist_consult", agent_payload, context, db)
        
        # Log interaction for SLM training
        try:
             # Basic logging or use a dedicate service
             pass
        except:
             pass

        return {"reply": result.get("message", "No response from specialist.")}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Specialist error: {str(e)}")


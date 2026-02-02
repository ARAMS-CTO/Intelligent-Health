"""
Medical Knowledge API Routes
Provides endpoints for condition lookup, treatment recommendations, 
cross-referential analysis, and Master Doctor consultations
"""

from fastapi import APIRouter, HTTPException, Body, Depends, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from server.database import get_db
from server.services.medical_knowledge import medical_knowledge
# Import extended knowledge to add more conditions and medications
from server.services import medical_knowledge_extended  # noqa: F401
from server.agents.master_doctor import master_doctor
from server.routes.auth import get_current_user
from server import models


router = APIRouter(prefix="/api/knowledge", tags=["Medical Knowledge"])


# =============================================================================
# REQUEST MODELS
# =============================================================================

class ConditionSearchRequest(BaseModel):
    query: str
    specialty: Optional[str] = None

class TreatmentRequest(BaseModel):
    condition_id: str
    patient_factors: Dict[str, Any]

class DifferentialRequest(BaseModel):
    symptoms: List[str]

class CrossReferenceRequest(BaseModel):
    condition_ids: List[str]

class PatientAnalysisRequest(BaseModel):
    age: Optional[int] = 50
    sex: Optional[str] = None
    symptoms: List[str] = []
    conditions: List[str] = []
    medications: List[str] = []
    allergies: List[str] = []
    risk_factors: List[str] = []
    lab_results: Optional[Dict[str, Any]] = {}
    vitals: Optional[Dict[str, Any]] = {}

class GoutAttackRequest(BaseModel):
    joints_affected: int = 1
    fever: bool = False
    prior_attacks: int = 0
    egfr: Optional[int] = 90
    medications: List[str] = []
    uric_acid: Optional[float] = None

class DrugAnalysisRequest(BaseModel):
    drug_name: str
    age: Optional[int] = 50
    egfr: Optional[int] = 90
    weight: Optional[float] = None
    medications: List[str] = []


# =============================================================================
# CONDITION ENDPOINTS
# =============================================================================

@router.get("/conditions")
async def list_conditions():
    """List all available conditions in the knowledge base"""
    conditions = []
    for cid, condition in medical_knowledge.conditions.items():
        conditions.append({
            "id": cid,
            "name": condition.name,
            "specialty": condition.specialty,
            "icd10_code": condition.icd10_code
        })
    return {"conditions": conditions, "total": len(conditions)}

@router.get("/conditions/{condition_id}")
async def get_condition(condition_id: str):
    """Get detailed information about a specific condition"""
    condition = medical_knowledge.get_condition(condition_id)
    if not condition:
        raise HTTPException(status_code=404, detail=f"Condition '{condition_id}' not found")
    
    return medical_knowledge.condition_to_dict(condition)

@router.post("/conditions/search")
async def search_conditions(request: ConditionSearchRequest):
    """Search conditions by name, symptoms, or description"""
    results = medical_knowledge.search_conditions(request.query, request.specialty)
    return {
        "query": request.query,
        "specialty_filter": request.specialty,
        "results": [
            {
                "id": c.id,
                "name": c.name,
                "specialty": c.specialty,
                "description": c.description[:200] + "..." if len(c.description) > 200 else c.description
            }
            for c in results
        ],
        "total": len(results)
    }


# =============================================================================
# MEDICATION ENDPOINTS
# =============================================================================

@router.get("/medications")
async def list_medications():
    """List all medications in the knowledge base"""
    medications = []
    for mid, med in medical_knowledge.medications.items():
        medications.append({
            "id": mid,
            "name": med.name,
            "generic_name": med.generic_name,
            "drug_class": med.drug_class,
            "cost_tier": med.cost_tier
        })
    return {"medications": medications, "total": len(medications)}

@router.get("/medications/{medication_id}")
async def get_medication(medication_id: str):
    """Get detailed information about a specific medication"""
    med = medical_knowledge.get_medication(medication_id)
    if not med:
        raise HTTPException(status_code=404, detail=f"Medication '{medication_id}' not found")
    
    return {
        "id": medication_id,
        "name": med.name,
        "generic_name": med.generic_name,
        "drug_class": med.drug_class,
        "mechanism": med.mechanism,
        "dosing": med.dosing,
        "frequency": med.frequency,
        "max_dose": med.max_dose,
        "contraindications": med.contraindications,
        "side_effects": med.side_effects,
        "interactions": med.interactions,
        "monitoring": med.monitoring,
        "warnings": med.warnings,
        "cost_tier": med.cost_tier
    }


# =============================================================================
# TREATMENT RECOMMENDATION ENDPOINTS
# =============================================================================

@router.post("/treatments/recommend")
async def get_treatment_recommendation(request: TreatmentRequest):
    """
    Get personalized treatment recommendations for a condition
    based on patient-specific factors
    """
    recommendations = medical_knowledge.get_treatment_recommendations(
        request.condition_id,
        request.patient_factors
    )
    
    if "error" in recommendations:
        raise HTTPException(status_code=404, detail=recommendations["error"])
    
    return recommendations


# =============================================================================
# DIFFERENTIAL DIAGNOSIS ENDPOINTS
# =============================================================================

@router.post("/differential")
async def get_differential_diagnosis(request: DifferentialRequest):
    """
    Generate differential diagnoses based on presenting symptoms
    Returns ranked list of possible conditions
    """
    if not request.symptoms:
        raise HTTPException(status_code=400, detail="At least one symptom required")
    
    differentials = medical_knowledge.get_differential_diagnosis(request.symptoms)
    
    return {
        "symptoms_analyzed": request.symptoms,
        "differentials": differentials,
        "total_matches": len(differentials)
    }


# =============================================================================
# CROSS-REFERENCE ANALYSIS ENDPOINTS
# =============================================================================

@router.post("/cross-reference")
async def cross_reference_conditions(request: CrossReferenceRequest):
    """
    Analyze multiple conditions for interactions, shared risk factors,
    and unified management considerations
    """
    if len(request.condition_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 conditions required for cross-reference")
    
    analysis = medical_knowledge.get_cross_reference_analysis(request.condition_ids)
    
    if "error" in analysis:
        raise HTTPException(status_code=400, detail=analysis["error"])
    
    return analysis


# =============================================================================
# MASTER DOCTOR ENDPOINTS
# =============================================================================

@router.post("/master-doctor/analyze")
async def master_doctor_analysis(
    request: PatientAnalysisRequest,
    current_user: models.User = Depends(get_current_user)
):
    """
    Comprehensive patient analysis by Master AI Health Doctor
    Combines all specialist knowledge with cross-referential reasoning
    """
    patient_data = {
        "age": request.age,
        "sex": request.sex,
        "symptoms": request.symptoms,
        "conditions": request.conditions,
        "medications": request.medications,
        "allergies": request.allergies,
        "risk_factors": request.risk_factors,
        "lab_results": request.lab_results or {},
        "vitals": request.vitals or {}
    }
    
    analysis = master_doctor.analyze_presentation(patient_data)
    
    return {
        "status": "success",
        "analysis": analysis,
        "consulted_by": "Master AI Health Doctor",
        "specialist_domains": master_doctor.specialty_agents
    }

@router.post("/master-doctor/gout-attack")
async def gout_attack_protocol(
    request: GoutAttackRequest,
    current_user: models.User = Depends(get_current_user)
):
    """
    Specific protocol for acute gout attack management
    Includes detailed colchicine guidance and alternatives
    """
    patient_data = {
        "joints_affected": request.joints_affected,
        "fever": request.fever,
        "prior_attacks": request.prior_attacks,
        "egfr": request.egfr,
        "medications": request.medications,
        "uric_acid": request.uric_acid
    }
    
    protocol = master_doctor.get_gout_attack_protocol(patient_data)
    
    return {
        "status": "success",
        "protocol": protocol
    }

@router.post("/master-doctor/drug-analysis")
async def analyze_drug_therapy(
    request: DrugAnalysisRequest,
    current_user: models.User = Depends(get_current_user)
):
    """
    Deep analysis of a specific drug for a patient
    Checks appropriateness, interactions, and provides guidance
    """
    patient_factors = {
        "age": request.age,
        "egfr": request.egfr,
        "weight": request.weight,
        "medications": request.medications
    }
    
    analysis = master_doctor.analyze_drug_therapy(request.drug_name, patient_factors)
    
    if "error" in analysis:
        raise HTTPException(status_code=404, detail=analysis["error"])
    
    return {
        "status": "success",
        "analysis": analysis
    }


# =============================================================================
# SPECIALTY QUICK ACCESS ENDPOINTS
# =============================================================================

@router.get("/specialty/{specialty}")
async def get_specialty_conditions(specialty: str):
    """Get all conditions for a specific medical specialty"""
    conditions = []
    for cid, condition in medical_knowledge.conditions.items():
        if condition.specialty.lower() == specialty.lower():
            conditions.append({
                "id": cid,
                "name": condition.name,
                "symptoms": condition.symptoms[:5],
                "treatments_count": len(condition.treatments)
            })
    
    if not conditions:
        raise HTTPException(status_code=404, detail=f"No conditions found for specialty '{specialty}'")
    
    return {"specialty": specialty, "conditions": conditions}

@router.get("/quick-reference/gout")
async def gout_quick_reference():
    """Quick reference for gout management"""
    gout_acute = medical_knowledge.get_condition("gout_acute")
    hyperuricemia = medical_knowledge.get_condition("hyperuricemia")
    colchicine = medical_knowledge.get_medication("colchicine")
    allopurinol = medical_knowledge.get_medication("allopurinol")
    febuxostat = medical_knowledge.get_medication("febuxostat")
    
    return {
        "acute_gout": {
            "symptoms": gout_acute.symptoms if gout_acute else [],
            "first_line": "Colchicine or NSAIDs",
            "colchicine_dosing": colchicine.dosing if colchicine else "",
            "alternatives": ["NSAIDs (indomethacin, naproxen)", "Corticosteroids", "IL-1 inhibitors"]
        },
        "chronic_management": {
            "uric_acid_target": "< 6 mg/dL (< 5 mg/dL with tophi)",
            "first_line": "Allopurinol (start low, go slow)",
            "allopurinol_dosing": allopurinol.dosing if allopurinol else "",
            "alternative": "Febuxostat (be aware of CV warning)",
            "prophylaxis_during_initiation": "Colchicine 0.6mg daily x 3-6 months"
        },
        "key_points": [
            "Start ULT 2 weeks after acute attack resolves",
            "Titrate to target - don't stay at starting dose",
            "Screen for HLA-B*5801 in high-risk populations before allopurinol",
            "Lifestyle: limit alcohol (especially beer), reduce purine intake, weight management"
        ]
    }

@router.get("/quick-reference/anticoagulation")
async def anticoagulation_quick_reference():
    """Quick reference for anticoagulation management"""
    apixaban = medical_knowledge.get_medication("apixaban")
    rivaroxaban = medical_knowledge.get_medication("rivaroxaban")
    warfarin = medical_knowledge.get_medication("warfarin")
    
    return {
        "doacs": {
            "apixaban": {
                "brand": "Eliquis",
                "dosing": apixaban.dosing if apixaban else "",
                "frequency": "BID",
                "reversal": "Andexanet alfa",
                "advantages": ["No routine monitoring", "Lower bleeding risk"]
            },
            "rivaroxaban": {
                "brand": "Xarelto",
                "dosing": rivaroxaban.dosing if rivaroxaban else "",
                "frequency": "Daily (with food)",
                "reversal": "Andexanet alfa",
                "note": "Higher GI bleed risk"
            }
        },
        "warfarin": {
            "target_inr": "2.0-3.0 (2.5-3.5 for mechanical valves)",
            "reversal": ["Vitamin K", "4-Factor PCC", "FFP"],
            "monitoring": "INR every 1-4 weeks",
            "key_interactions": ["Vitamin K intake", "Antibiotics", "Amiodarone", "NSAIDs"]
        },
        "indications": [
            "Atrial fibrillation (use CHA2DS2-VASc)",
            "DVT/PE treatment",
            "VTE prophylaxis (post-surgery)",
            "Mechanical heart valves (warfarin only)"
        ]
    }

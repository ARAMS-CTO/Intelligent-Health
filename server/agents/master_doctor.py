"""
Master AI Health Doctor Agent
Combines all specialist knowledge with cross-referencing and analytical reasoning
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime

from server.services.medical_knowledge import medical_knowledge, MedicalKnowledgeService


class MasterHealthDoctorAgent:
    """
    Advanced AI agent that combines knowledge from all specialist domains.
    Provides cross-referential analysis, multi-condition reasoning, and 
    personalized recommendations with full transparency.
    """
    
    def __init__(self):
        self.knowledge = medical_knowledge
        self.specialty_agents = [
            "rheumatology", "hematology", "cardiology", "oncology",
            "metabolic", "orthopedics", "gastroenterology", "urology",
            "neurology", "genetics"
        ]
        self.reasoning_chain = []
        
    def build_comprehensive_context(self, patient_data: Dict[str, Any]) -> str:
        """Build a comprehensive context prompt from patient data"""
        context_parts = [
            "You are a Master AI Health Doctor with access to all specialist knowledge.",
            "You can cross-reference conditions, identify patterns, and provide holistic recommendations.",
            "",
            "CLINICAL REASONING FRAMEWORK:",
            "1. Gather key facts from patient presentation",
            "2. Generate differential diagnoses ranked by probability",
            "3. Identify which specialists would be consulted",
            "4. Cross-reference for drug interactions and comorbidities",
            "5. Provide evidence-based recommendations with citations",
            ""
        ]
        
        if patient_data.get("symptoms"):
            context_parts.append(f"PRESENTING SYMPTOMS: {', '.join(patient_data['symptoms'])}")
        
        if patient_data.get("conditions"):
            context_parts.append(f"KNOWN CONDITIONS: {', '.join(patient_data['conditions'])}")
            
        if patient_data.get("medications"):
            context_parts.append(f"CURRENT MEDICATIONS: {', '.join(patient_data['medications'])}")
            
        if patient_data.get("allergies"):
            context_parts.append(f"ALLERGIES: {', '.join(patient_data['allergies'])}")
            
        if patient_data.get("vitals"):
            vitals = patient_data["vitals"]
            context_parts.append(f"VITALS: BP {vitals.get('bp', 'N/A')}, HR {vitals.get('hr', 'N/A')}, Temp {vitals.get('temp', 'N/A')}")
        
        if patient_data.get("lab_results"):
            context_parts.append(f"LAB RESULTS: {json.dumps(patient_data['lab_results'])}")
        
        return "\n".join(context_parts)
    
    def analyze_presentation(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Comprehensive analysis of patient presentation
        Returns structured analysis with reasoning chain
        """
        self.reasoning_chain = []
        analysis = {
            "timestamp": datetime.utcnow().isoformat(),
            "patient_summary": {},
            "differential_diagnoses": [],
            "specialist_consultations": [],
            "treatment_plan": {},
            "drug_interactions": [],
            "monitoring_plan": [],
            "reasoning_chain": []
        }
        
        # Step 1: Summarize patient
        self._add_reasoning("Gathering patient information...")
        analysis["patient_summary"] = {
            "age": patient_data.get("age"),
            "sex": patient_data.get("sex"),
            "symptoms": patient_data.get("symptoms", []),
            "conditions": patient_data.get("conditions", []),
            "medications": patient_data.get("medications", []),
            "risk_factors": patient_data.get("risk_factors", [])
        }
        
        # Step 2: Generate differential
        symptoms = patient_data.get("symptoms", [])
        if symptoms:
            self._add_reasoning(f"Analyzing symptoms: {symptoms}")
            diff_dx = self.knowledge.get_differential_diagnosis(symptoms)
            analysis["differential_diagnoses"] = diff_dx[:5]  # Top 5
            
            for dx in diff_dx[:3]:
                self._add_reasoning(f"Consider {dx['condition']} (score: {dx['match_score']}) - consult {dx['specialty']}")
                if dx["specialty"] not in [s["specialty"] for s in analysis["specialist_consultations"]]:
                    analysis["specialist_consultations"].append({
                        "specialty": dx["specialty"],
                        "reason": f"Potential {dx['condition']}",
                        "priority": "high" if dx["match_score"] >= 2 else "moderate"
                    })
        
        # Step 3: Analyze known conditions for cross-references
        conditions = patient_data.get("conditions", [])
        if conditions:
            self._add_reasoning(f"Cross-referencing existing conditions: {conditions}")
            
            # Map condition names to IDs
            condition_ids = []
            for cond in conditions:
                for cid, c in self.knowledge.conditions.items():
                    if cond.lower() in c.name.lower():
                        condition_ids.append(cid)
            
            if len(condition_ids) >= 2:
                cross_ref = self.knowledge.get_cross_reference_analysis(condition_ids)
                analysis["cross_reference"] = cross_ref
                
                if cross_ref.get("potential_interactions"):
                    for interaction in cross_ref["potential_interactions"]:
                        analysis["drug_interactions"].append(interaction)
                        self._add_reasoning(f"⚠️ Potential interaction: {interaction['drug1']} + {interaction['drug2']}")
                
                if cross_ref.get("shared_risk_factors"):
                    self._add_reasoning(f"Shared risk factors identified: {list(cross_ref['shared_risk_factors'].keys())}")
        
        # Step 4: Generate treatment plan
        current_meds = patient_data.get("medications", [])
        patient_factors = {
            "age": patient_data.get("age", 50),
            "egfr": patient_data.get("lab_results", {}).get("egfr", 90),
            "liver_disease": "liver" in " ".join(patient_data.get("conditions", [])).lower(),
            "cvd": any(c in " ".join(patient_data.get("conditions", [])).lower() for c in ["heart", "cardiovascular", "cad", "mi"]),
            "medications": current_meds,
            "allergies": patient_data.get("allergies", [])
        }
        
        treatment_recommendations = []
        for cond in conditions:
            for cid, c in self.knowledge.conditions.items():
                if cond.lower() in c.name.lower():
                    rec = self.knowledge.get_treatment_recommendations(cid, patient_factors)
                    treatment_recommendations.append(rec)
                    
                    if rec.get("considerations"):
                        for consideration in rec["considerations"]:
                            self._add_reasoning(consideration)
                    
                    if rec.get("contraindicated"):
                        for contra in rec["contraindicated"]:
                            self._add_reasoning(f"❌ {contra['name']} contraindicated: {contra.get('reason', 'See full details')}")
        
        analysis["treatment_plan"] = {
            "recommendations_by_condition": treatment_recommendations,
            "unified_lifestyle_changes": self._unify_lifestyle(treatment_recommendations),
            "unified_monitoring": self._unify_monitoring(treatment_recommendations)
        }
        
        # Step 5: Create monitoring plan
        all_monitoring = set()
        for rec in treatment_recommendations:
            for fl in rec.get("first_line", []):
                all_monitoring.update(fl.get("monitoring", []))
        
        analysis["monitoring_plan"] = list(all_monitoring)
        self._add_reasoning(f"Monitoring plan established: {len(analysis['monitoring_plan'])} items")
        
        # Finalize reasoning chain
        analysis["reasoning_chain"] = self.reasoning_chain
        
        return analysis
    
    def get_gout_attack_protocol(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Specific protocol for acute gout attack with colchicine details
        """
        self.reasoning_chain = []
        
        result = {
            "condition": "Acute Gout Attack",
            "severity_assessment": "",
            "treatment_protocol": {},
            "colchicine_details": {},
            "alternatives": [],
            "prophylaxis_plan": {},
            "reasoning": []
        }
        
        # Assess severity
        joint_count = patient_data.get("joints_affected", 1)
        fever = patient_data.get("fever", False)
        prior_attacks = patient_data.get("prior_attacks", 0)
        
        if joint_count > 2 or fever:
            result["severity_assessment"] = "SEVERE - consider hospitalization"
            self._add_reasoning("Multiple joints or fever present - severe attack")
        elif joint_count > 1:
            result["severity_assessment"] = "MODERATE"
            self._add_reasoning("Oligoarticular involvement - moderate attack")
        else:
            result["severity_assessment"] = "MILD-MODERATE (monoarticular)"
            self._add_reasoning("Single joint involvement - typical presentation")
        
        # Check contraindications for colchicine
        egfr = patient_data.get("egfr", 90)
        medications = patient_data.get("medications", [])
        
        colchicine = self.knowledge.get_medication("colchicine")
        
        # Check for interactions
        colchicine_safe = True
        interaction_drugs = ["clarithromycin", "cyclosporine", "ritonavir", "diltiazem", "verapamil"]
        for med in medications:
            if any(d.lower() in med.lower() for d in interaction_drugs):
                colchicine_safe = False
                self._add_reasoning(f"⚠️ Colchicine interaction with {med} - dose reduction or alternative needed")
        
        if egfr < 30:
            colchicine_safe = False
            self._add_reasoning("⚠️ CrCl <30 - colchicine relatively contraindicated")
        
        # Build colchicine protocol
        if colchicine_safe:
            result["colchicine_details"] = {
                "recommended": True,
                "regimen": {
                    "acute_attack": {
                        "initial_dose": "1.2 mg (2 x 0.6 mg tablets)",
                        "second_dose": "0.6 mg one hour later",
                        "total_day_1": "1.8 mg",
                        "day_2_onwards": "0.6 mg once or twice daily until attack resolves"
                    },
                    "timing": "Most effective if started within 12-24 hours of attack onset",
                    "expected_response": "Pain relief typically within 12-24 hours"
                },
                "warnings": [
                    "Do NOT exceed 1.8 mg in first 24 hours",
                    "Wait at least 3 days before repeating acute dosing",
                    "Common: diarrhea, nausea (call if severe)",
                    "Rare but serious: muscle weakness, numbness (stop and call)"
                ],
                "with_food": "Can be taken with or without food",
                "cost": "Generic available - typically $20-40/month"
            }
            self._add_reasoning("Colchicine is appropriate - prescribing low-dose ACR guideline regimen")
        else:
            result["colchicine_details"] = {
                "recommended": False,
                "reason": "Contraindication or significant interaction present"
            }
        
        # Alternatives
        result["alternatives"] = [
            {
                "name": "NSAIDs",
                "example": "Indomethacin 50mg TID or Naproxen 500mg BID",
                "duration": "Until attack resolves (typically 3-7 days)",
                "cautions": ["GI bleeding", "Renal impairment", "Heart failure", "Elderly"],
                "when_to_use": "If colchicine contraindicated and no NSAID contraindications"
            },
            {
                "name": "Corticosteroids",
                "example": "Prednisone 30-40mg daily x 5 days",
                "alternatives": ["Intra-articular triamcinolone if single joint"],
                "cautions": ["Diabetes", "Infection", "Immunosuppression"],
                "when_to_use": "If both colchicine and NSAIDs contraindicated"
            },
            {
                "name": "IL-1 Inhibitors",
                "example": "Anakinra 100mg SC x 3 days",
                "cautions": ["Cost", "Infection risk"],
                "when_to_use": "Refractory or when other options contraindicated"
            }
        ]
        
        # Prophylaxis plan for urate-lowering therapy
        if prior_attacks >= 2:
            self._add_reasoning(f"Patient has {prior_attacks} prior attacks - urate-lowering therapy indicated")
            result["prophylaxis_plan"] = {
                "timing": "Initiate 2 weeks after acute attack resolves",
                "first_line": {
                    "medication": "Allopurinol",
                    "starting_dose": "100 mg daily",
                    "titration": "Increase by 100 mg every 2-4 weeks",
                    "target": "Serum uric acid < 6 mg/dL (< 5 mg/dL if tophi)",
                    "max_dose": "800 mg daily"
                },
                "flare_prophylaxis": {
                    "medication": "Colchicine 0.6 mg daily or BID",
                    "duration": "Continue for 3-6 months after achieving target uric acid",
                    "rationale": "Prevents treatment-initiation flares"
                },
                "genetic_testing": "Consider HLA-B*5801 screening in Asian patients before allopurinol"
            }
        else:
            result["prophylaxis_plan"] = {
                "recommendation": "Lifestyle modification first if < 2 attacks/year",
                "lifestyle": [
                    "Limit red meat and organ meats",
                    "Avoid beer and spirits (wine in moderation)",
                    "Reduce high-fructose beverages",
                    "Weight loss if overweight",
                    "Stay hydrated",
                    "Consider low-fat dairy (protective)"
                ]
            }
        
        result["reasoning"] = self.reasoning_chain
        
        return result
    
    def analyze_drug_therapy(self, drug_name: str, patient_factors: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deep analysis of a specific drug for a patient
        """
        # Find the medication
        medication = None
        for mid, med in self.knowledge.medications.items():
            if drug_name.lower() in med.name.lower() or drug_name.lower() in med.generic_name.lower():
                medication = med
                break
        
        if not medication:
            return {"error": f"Medication '{drug_name}' not found in knowledge base"}
        
        analysis = {
            "medication": {
                "name": medication.name,
                "generic": medication.generic_name,
                "class": medication.drug_class
            },
            "patient_specific": {
                "appropriate": True,
                "dose_adjustment_needed": False,
                "contraindication_check": "PASS",
                "interaction_check": "PASS",
                "warnings": []
            },
            "dosing": {
                "recommended": medication.dosing,
                "adjustments": []
            },
            "monitoring": medication.monitoring,
            "patient_education": []
        }
        
        # Check patient factors
        age = patient_factors.get("age", 50)
        egfr = patient_factors.get("egfr", 90)
        weight = patient_factors.get("weight")
        current_meds = patient_factors.get("medications", [])
        
        # Age-based adjustments
        if age >= 80:
            analysis["patient_specific"]["warnings"].append("Elderly patient - consider lower starting dose")
            analysis["dosing"]["adjustments"].append("Start at lower end of dosing range due to age")
        
        # Renal adjustments
        if egfr < 60:
            analysis["patient_specific"]["dose_adjustment_needed"] = True
            if egfr < 30:
                if "renal" in " ".join(medication.contraindications).lower():
                    analysis["patient_specific"]["contraindication_check"] = "FAIL"
                    analysis["patient_specific"]["appropriate"] = False
                    analysis["patient_specific"]["warnings"].append("Severe renal impairment - medication may be contraindicated")
            analysis["dosing"]["adjustments"].append(f"Renal adjustment needed (eGFR {egfr} mL/min)")
        
        # Check interactions
        for med in current_meds:
            for interaction in medication.interactions:
                if interaction.lower() in med.lower():
                    analysis["patient_specific"]["interaction_check"] = "WARNING"
                    analysis["patient_specific"]["warnings"].append(f"Interaction with {med}: {interaction}")
        
        # Patient education points
        analysis["patient_education"] = [
            f"This medication is a {medication.drug_class}",
            f"Mechanism: {medication.mechanism}",
            f"Take as prescribed: {medication.frequency}",
            f"Common side effects to watch for: {', '.join(medication.side_effects[:3])}",
            f"Do not take with: {', '.join(medication.interactions[:3])}" if medication.interactions else ""
        ]
        
        return analysis
    
    def _add_reasoning(self, step: str):
        """Add a reasoning step to the chain"""
        self.reasoning_chain.append({
            "step": len(self.reasoning_chain) + 1,
            "reasoning": step,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def _unify_lifestyle(self, recommendations: List[Dict[str, Any]]) -> List[str]:
        """Combine and deduplicate lifestyle recommendations"""
        all_lifestyle = set()
        for rec in recommendations:
            all_lifestyle.update(rec.get("lifestyle", []))
        return list(all_lifestyle)
    
    def _unify_monitoring(self, recommendations: List[Dict[str, Any]]) -> List[str]:
        """Combine and deduplicate monitoring requirements"""
        all_monitoring = set()
        for rec in recommendations:
            for fl in rec.get("first_line", []):
                all_monitoring.update(fl.get("monitoring", []))
            for alt in rec.get("alternatives", []):
                all_monitoring.update(alt.get("monitoring", []))
        return list(all_monitoring)


# Global instance
master_doctor = MasterHealthDoctorAgent()

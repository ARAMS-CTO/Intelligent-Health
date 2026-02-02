"""
Comprehensive Medical Knowledge Service
Replaces mock data with structured medical knowledge for AI agents
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
import json

class Severity(Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"

class TreatmentCategory(Enum):
    FIRST_LINE = "first_line"
    SECOND_LINE = "second_line"
    ALTERNATIVE = "alternative"
    EMERGENCY = "emergency"

@dataclass
class Medication:
    name: str
    generic_name: str
    drug_class: str
    mechanism: str
    dosing: str
    frequency: str
    max_dose: str
    contraindications: List[str]
    side_effects: List[str]
    interactions: List[str]
    monitoring: List[str]
    warnings: List[str]
    cost_tier: str = "generic"  # generic, brand, specialty

@dataclass
class Treatment:
    name: str
    category: TreatmentCategory
    medications: List[Medication]
    lifestyle_changes: List[str]
    duration: str
    expected_outcome: str
    follow_up: str

@dataclass
class Condition:
    id: str
    name: str
    icd10_code: str
    specialty: str
    description: str
    pathophysiology: str
    risk_factors: List[str]
    symptoms: List[str]
    diagnostics: List[str]
    biomarkers: List[str]
    differential_diagnosis: List[str]
    treatments: List[Treatment]
    complications: List[str]
    prognosis: str
    prevention: List[str]

# =============================================================================
# MEDICATION DATABASE
# =============================================================================

MEDICATIONS = {
    # GOUT MEDICATIONS
    "colchicine": Medication(
        name="Colchicine",
        generic_name="Colchicine",
        drug_class="Anti-inflammatory (microtubule inhibitor)",
        mechanism="Disrupts microtubule polymerization, inhibiting neutrophil migration and inflammasome activation (NLRP3)",
        dosing="Acute flare: 1.2mg initially, then 0.6mg 1 hour later (1.8mg total). Prophylaxis: 0.6mg once or twice daily",
        frequency="Acute: single day treatment. Prophylaxis: daily",
        max_dose="1.8mg per day during acute attack, 1.2mg/day for prophylaxis",
        contraindications=["Severe renal impairment (CrCl <30)", "Hepatic impairment with renal impairment", "P-gp or CYP3A4 inhibitor co-administration"],
        side_effects=["Diarrhea (most common)", "Nausea", "Vomiting", "Abdominal pain", "Bone marrow suppression (rare)"],
        interactions=["Clarithromycin", "Cyclosporine", "Ritonavir", "Diltiazem", "Verapamil", "Grapefruit juice"],
        monitoring=["CBC if prolonged use", "Renal function", "Signs of toxicity (myopathy, neuropathy)"],
        warnings=["Fatal overdose possible", "Reduce dose in renal impairment", "Do not repeat course within 3 days"],
        cost_tier="generic"
    ),
    "febuxostat": Medication(
        name="Febuxostat (Adenuric/Uloric)",
        generic_name="Febuxostat",
        drug_class="Xanthine Oxidase Inhibitor (XOI)",
        mechanism="Selective non-purine xanthine oxidase inhibitor, reduces uric acid production",
        dosing="Start 40mg daily, may increase to 80mg if uric acid >6mg/dL after 2 weeks",
        frequency="Once daily",
        max_dose="80mg daily (120mg in some countries)",
        contraindications=["Concurrent azathioprine/mercaptopurine", "Severe hepatic impairment"],
        side_effects=["Liver function abnormalities", "Nausea", "Rash", "Cardiovascular events (FDA warning)"],
        interactions=["Azathioprine", "Mercaptopurine", "Theophylline"],
        monitoring=["Serum uric acid at 2 weeks", "LFTs at baseline and periodically", "Cardiovascular status"],
        warnings=["FDA boxed warning: increased cardiovascular death vs allopurinol in patients with established CVD", "More gout flares initially - use with prophylaxis"],
        cost_tier="brand"
    ),
    "allopurinol": Medication(
        name="Allopurinol (Zyloprim)",
        generic_name="Allopurinol",
        drug_class="Xanthine Oxidase Inhibitor (XOI)",
        mechanism="Purine analog that inhibits xanthine oxidase, reducing uric acid production",
        dosing="Start 100mg daily, titrate by 100mg every 2-4 weeks to target uric acid <6mg/dL. Max 800mg/day",
        frequency="Once daily (or divided if >300mg)",
        max_dose="800mg daily",
        contraindications=["HLA-B*5801 positive (high risk of DRESS/SJS)", "Prior severe reaction to allopurinol"],
        side_effects=["Rash", "GI upset", "DRESS syndrome (rare)", "SJS/TEN (rare)", "Hepatotoxicity"],
        interactions=["Azathioprine", "Mercaptopurine", "Warfarin", "Theophylline", "Ampicillin (rash)"],
        monitoring=["Serum uric acid every 2-4 weeks during titration", "CBC", "LFTs", "Renal function", "HLA-B*5801 screening in high-risk populations (Han Chinese, Thai, Korean)"],
        warnings=["Start low, go slow", "Higher risk of hypersensitivity in renal impairment", "Screen for HLA-B*5801 in Asian populations"],
        cost_tier="generic"
    ),
    # ANTICOAGULANTS
    "apixaban": Medication(
        name="Apixaban (Eliquis)",
        generic_name="Apixaban",
        drug_class="Direct Oral Anticoagulant (DOAC) - Factor Xa Inhibitor",
        mechanism="Selective, reversible direct inhibitor of Factor Xa, reducing thrombin generation",
        dosing="AF: 5mg BID (2.5mg BID if 2+ of: age ≥80, weight ≤60kg, Cr ≥1.5). DVT/PE: 10mg BID x 7 days, then 5mg BID",
        frequency="Twice daily",
        max_dose="10mg BID (treatment phase)",
        contraindications=["Active pathological bleeding", "Severe hepatic disease", "Prosthetic heart valves", "Antiphospholipid syndrome"],
        side_effects=["Bleeding", "Bruising", "Nausea", "Anemia"],
        interactions=["Strong CYP3A4/P-gp inhibitors (ketoconazole, ritonavir)", "Strong inducers (rifampin, phenytoin)"],
        monitoring=["Signs of bleeding", "Renal function annually", "No routine coagulation monitoring needed"],
        warnings=["Premature discontinuation increases stroke risk", "Spinal hematoma risk with neuraxial anesthesia"],
        cost_tier="brand"
    ),
    "rivaroxaban": Medication(
        name="Rivaroxaban (Xarelto)",
        generic_name="Rivaroxaban",
        drug_class="Direct Oral Anticoagulant (DOAC) - Factor Xa Inhibitor",
        mechanism="Selective, reversible direct inhibitor of Factor Xa",
        dosing="AF: 20mg daily with food (15mg if CrCl 15-50). DVT/PE: 15mg BID x 21 days, then 20mg daily",
        frequency="Once daily (with food) or twice daily for initial treatment",
        max_dose="20mg daily",
        contraindications=["Active bleeding", "Hepatic disease with coagulopathy", "CrCl <15"],
        side_effects=["Bleeding", "Back pain", "GI bleed risk higher than other DOACs"],
        interactions=["Strong CYP3A4/P-gp inhibitors/inducers", "Aspirin", "NSAIDs"],
        monitoring=["Bleeding signs", "Renal function", "Hemoglobin if suspected bleeding"],
        warnings=["Take with food for optimal absorption", "Higher GI bleed risk"],
        cost_tier="brand"
    ),
    "warfarin": Medication(
        name="Warfarin (Coumadin)",
        generic_name="Warfarin",
        drug_class="Vitamin K Antagonist",
        mechanism="Inhibits vitamin K epoxide reductase, preventing synthesis of clotting factors II, VII, IX, X",
        dosing="Individualized based on INR. Typical: 2-10mg daily. Target INR 2-3 (2.5-3.5 for mechanical valves)",
        frequency="Once daily",
        max_dose="Varies by patient",
        contraindications=["Pregnancy", "Hemorrhagic tendencies", "Uncontrolled hypertension", "Recent CNS surgery"],
        side_effects=["Bleeding", "Skin necrosis (rare)", "Purple toe syndrome", "Hair loss"],
        interactions=["Extensive - vitamin K intake, antibiotics, amiodarone, NSAIDs, many others"],
        monitoring=["INR frequently during initiation, then every 4 weeks when stable", "Bleeding signs"],
        warnings=["Narrow therapeutic index", "Dietary vitamin K consistency required", "Multiple drug interactions"],
        cost_tier="generic"
    ),
    # STATINS
    "atorvastatin": Medication(
        name="Atorvastatin (Lipitor)",
        generic_name="Atorvastatin",
        drug_class="HMG-CoA Reductase Inhibitor (Statin)",
        mechanism="Inhibits HMG-CoA reductase, the rate-limiting enzyme in cholesterol synthesis",
        dosing="10-80mg daily. High-intensity: 40-80mg. Moderate: 10-20mg",
        frequency="Once daily (any time)",
        max_dose="80mg daily",
        contraindications=["Active liver disease", "Pregnancy", "Breastfeeding"],
        side_effects=["Myalgia (5-10%)", "Elevated transaminases", "Rhabdomyolysis (rare)", "New-onset diabetes"],
        interactions=["CYP3A4 inhibitors (clarithromycin, itraconazole)", "Gemfibrozil", "Grapefruit juice (large amounts)"],
        monitoring=["Lipid panel 4-12 weeks after initiation", "LFTs if symptoms", "CK if muscle symptoms"],
        warnings=["10-year ASCVD risk should guide intensity", "Cognitive effects controversial but reversible"],
        cost_tier="generic"
    ),
    "rosuvastatin": Medication(
        name="Rosuvastatin (Crestor)",
        generic_name="Rosuvastatin",
        drug_class="HMG-CoA Reductase Inhibitor (Statin)",
        mechanism="Inhibits HMG-CoA reductase with high potency (most potent statin per mg)",
        dosing="5-40mg daily. High-intensity: 20-40mg. Moderate: 5-10mg",
        frequency="Once daily (any time)",
        max_dose="40mg daily (20mg for Asian patients)",
        contraindications=["Active liver disease", "Pregnancy", "Breastfeeding", "Severe renal impairment for high doses"],
        side_effects=["Myalgia", "Headache", "Proteinuria at high doses", "Rhabdomyolysis (rare)"],
        interactions=["Cyclosporine", "Gemfibrozil", "Atazanavir/ritonavir"],
        monitoring=["Lipid panel", "LFTs if symptoms", "Renal function for high doses"],
        warnings=["Most potent statin - lower doses often sufficient", "Asian patients: start 5mg, max 20mg"],
        cost_tier="generic"
    )
}

# =============================================================================
# CONDITIONS DATABASE
# =============================================================================

CONDITIONS = {
    "gout_acute": Condition(
        id="gout_acute",
        name="Acute Gout Attack (Gouty Arthritis)",
        icd10_code="M10.9",
        specialty="Rheumatology",
        description="Sudden onset of intense joint pain, swelling, and redness caused by monosodium urate crystal deposition",
        pathophysiology="Hyperuricemia leads to urate crystal formation in joints. Crystals activate NLRP3 inflammasome in macrophages, releasing IL-1β and triggering intense neutrophilic inflammation",
        risk_factors=["Hyperuricemia (>6.8 mg/dL)", "Male sex", "Obesity", "Alcohol (especially beer)", "Purine-rich diet", "Diuretics", "Chronic kidney disease", "Metabolic syndrome", "Genetics (URAT1, GLUT9 variants)"],
        symptoms=["Sudden severe joint pain (often at night)", "Podagra (1st MTP most common)", "Joint swelling and erythema", "Warmth over joint", "Fever", "Desquamation of skin after attack resolves"],
        diagnostics=["Synovial fluid analysis (gold standard) - needle-shaped negatively birefringent crystals", "Serum uric acid (may be normal during attack)", "Joint X-ray (soft tissue swelling acutely, punched-out erosions chronically)", "Dual-energy CT (tophi detection)"],
        biomarkers=["Serum uric acid", "CRP/ESR (elevated)", "WBC (may be elevated)", "24-hour urine uric acid (for classification)"],
        differential_diagnosis=["Septic arthritis", "Pseudogout (CPPD)", "Cellulitis", "Reactive arthritis", "Rheumatoid arthritis", "Trauma"],
        treatments=[
            Treatment(
                name="Acute Attack - First Line",
                category=TreatmentCategory.FIRST_LINE,
                medications=[MEDICATIONS["colchicine"]],
                lifestyle_changes=["Rest affected joint", "Ice application", "Avoid alcohol", "Hydration"],
                duration="Until attack resolves (typically 3-10 days)",
                expected_outcome="Pain relief within 12-24 hours with colchicine",
                follow_up="Initiate urate-lowering therapy 2 weeks after attack resolves"
            )
        ],
        complications=["Chronic tophaceous gout", "Joint destruction", "Nephrolithiasis (uric acid stones)", "Chronic kidney disease", "Recurrent attacks"],
        prognosis="Excellent with proper management. Untreated, attacks become more frequent and severe",
        prevention=["Urate-lowering therapy to target <6 mg/dL", "Avoid trigger foods/alcohol", "Weight management", "Hydration", "Avoid purine-rich foods"]
    ),
    "hyperuricemia": Condition(
        id="hyperuricemia",
        name="Hyperuricemia (Chronic Gout Management)",
        icd10_code="E79.0",
        specialty="Rheumatology",
        description="Persistently elevated serum uric acid requiring long-term management to prevent gout attacks",
        pathophysiology="Imbalance between uric acid production (from purine metabolism) and excretion (primarily renal)",
        risk_factors=["High purine diet", "Alcohol", "Fructose intake", "Obesity", "Metabolic syndrome", "Chronic kidney disease", "Diuretics", "Low-dose aspirin"],
        symptoms=["Often asymptomatic", "Recurrent gout attacks", "Tophi formation", "Kidney stones"],
        diagnostics=["Serum uric acid >6.8 mg/dL", "24-hour urine uric acid collection (classify as over-producer vs under-excretor)"],
        biomarkers=["Serum uric acid", "eGFR", "Lipid panel", "Fasting glucose", "Liver function tests"],
        differential_diagnosis=["Secondary hyperuricemia (myeloproliferative disorders, tumor lysis)", "Drug-induced", "Dehydration"],
        treatments=[
            Treatment(
                name="Urate-Lowering Therapy - First Line",
                category=TreatmentCategory.FIRST_LINE,
                medications=[MEDICATIONS["allopurinol"]],
                lifestyle_changes=["Limit purine-rich foods (organ meats, shellfish)", "Reduce alcohol (especially beer)", "Reduce fructose/sugar", "Weight loss", "Increase dairy intake (protective)"],
                duration="Lifelong",
                expected_outcome="Serum uric acid <6 mg/dL within 6 months. Prevention of gout flares",
                follow_up="Check uric acid every 2-4 weeks during titration, then every 6 months"
            ),
            Treatment(
                name="Urate-Lowering Therapy - Alternative",
                category=TreatmentCategory.ALTERNATIVE,
                medications=[MEDICATIONS["febuxostat"]],
                lifestyle_changes=["Same as above"],
                duration="Lifelong",
                expected_outcome="May be more effective in patients with CKD. Caution in CVD",
                follow_up="Monitor for cardiovascular events. LFTs periodically"
            )
        ],
        complications=["Gout flares during initiation (give prophylaxis)", "Cardiovascular disease", "CKD progression", "Nephrolithiasis"],
        prognosis="Good with adherence. Target uric acid <6mg/dL (or <5mg/dL for tophaceous gout)",
        prevention=["Maintain uric acid at target", "Lifelong therapy for most patients with gout"]
    ),
    "dvt": Condition(
        id="dvt",
        name="Deep Vein Thrombosis (DVT)",
        icd10_code="I82.40",
        specialty="Hematology",
        description="Formation of blood clot in deep veins, most commonly in the lower extremities",
        pathophysiology="Virchow's triad: endothelial injury, venous stasis, and hypercoagulability lead to clot formation",
        risk_factors=["Immobility/surgery", "Cancer", "Pregnancy", "Oral contraceptives/HRT", "Obesity", "Prior VTE", "Factor V Leiden", "Prothrombin mutation", "Antiphospholipid syndrome"],
        symptoms=["Unilateral leg swelling", "Pain/tenderness along deep veins", "Warmth", "Erythema", "Pitting edema", "Homan's sign (unreliable)"],
        diagnostics=["D-dimer (to rule out if low probability)", "Compression ultrasound (gold standard)", "CT venography", "Venography (rarely needed)"],
        biomarkers=["D-dimer", "CBC", "PT/INR", "aPTT", "Renal function", "LFTs"],
        differential_diagnosis=["Cellulitis", "Ruptured Baker's cyst", "Muscle strain/hematoma", "Superficial thrombophlebitis", "Lymphedema", "Venous insufficiency"],
        treatments=[
            Treatment(
                name="Anticoagulation - First Line (DOAC)",
                category=TreatmentCategory.FIRST_LINE,
                medications=[MEDICATIONS["apixaban"], MEDICATIONS["rivaroxaban"]],
                lifestyle_changes=["Early ambulation", "Compression stockings (controversial)", "Avoid prolonged immobility"],
                duration="3 months minimum. Extended if unprovoked or recurrent",
                expected_outcome="Resolution of symptoms, prevention of PE and extension",
                follow_up="Clinical follow-up at 1-2 weeks, then at 3 months for duration decision"
            ),
            Treatment(
                name="Anticoagulation - Alternative (Warfarin)",
                category=TreatmentCategory.ALTERNATIVE,
                medications=[MEDICATIONS["warfarin"]],
                lifestyle_changes=["Same as above", "Consistent vitamin K intake"],
                duration="3+ months",
                expected_outcome="Requires bridging with heparin/LMWH. More monitoring",
                follow_up="INR every 1-4 weeks"
            )
        ],
        complications=["Pulmonary embolism (life-threatening)", "Post-thrombotic syndrome", "Recurrent VTE", "Chronic venous insufficiency"],
        prognosis="Good with early treatment. 30% risk of recurrence if unprovoked",
        prevention=["Pharmacologic prophylaxis in high-risk settings", "Mechanical prophylaxis", "Early mobilization post-surgery"]
    ),
    "hyperlipidemia": Condition(
        id="hyperlipidemia",
        name="Hyperlipidemia (Dyslipidemia)",
        icd10_code="E78.5",
        specialty="Cardiology/Internal Medicine",
        description="Elevated levels of lipids (cholesterol, triglycerides) in the blood, increasing cardiovascular risk",
        pathophysiology="Imbalance in lipid metabolism leading to elevated LDL, triglycerides, and/or reduced HDL. LDL oxidation initiates atherosclerosis",
        risk_factors=["Diet high in saturated/trans fats", "Obesity", "Diabetes", "Hypothyroidism", "Familial hypercholesterolemia", "Chronic kidney disease", "Medications (thiazides, steroids)"],
        symptoms=["Usually asymptomatic", "Xanthomas (tendon, eruptive)", "Xanthelasma", "Arcus cornealis", "Only symptomatic when causing atherosclerotic disease (MI, stroke, PAD)"],
        diagnostics=["Fasting lipid panel", "Non-fasting acceptable for screening", "Lipoprotein(a) in high-risk", "Calculate 10-year ASCVD risk"],
        biomarkers=["Total cholesterol", "LDL-C", "HDL-C", "Triglycerides", "Non-HDL cholesterol", "Apolipoprotein B", "Lipoprotein(a)"],
        differential_diagnosis=["Primary (genetic) vs secondary (diet, medications, other conditions)", "Familial hypercholesterolemia", "Familial combined hyperlipidemia"],
        treatments=[
            Treatment(
                name="Statin Therapy - First Line",
                category=TreatmentCategory.FIRST_LINE,
                medications=[MEDICATIONS["atorvastatin"], MEDICATIONS["rosuvastatin"]],
                lifestyle_changes=["Heart-healthy diet (reduce saturated fat <7% of calories)", "Regular aerobic exercise (150 min/week)", "Weight management", "Smoking cessation", "Limit alcohol"],
                duration="Lifelong for most with established ASCVD or high risk",
                expected_outcome="37-55% LDL reduction with high-intensity statin. Reduced CV events",
                follow_up="Lipid panel 4-12 weeks after initiation, then annually"
            )
        ],
        complications=["Atherosclerotic cardiovascular disease", "Myocardial infarction", "Stroke", "Peripheral artery disease", "Pancreatitis (with severe hypertriglyceridemia)"],
        prognosis="Excellent with statin therapy - 25-35% reduction in major CV events",
        prevention=["Lifestyle interventions", "Early identification of familial forms", "Risk factor optimization"]
    )
}

# =============================================================================
# KNOWLEDGE SERVICE CLASS
# =============================================================================

class MedicalKnowledgeService:
    """Service for accessing structured medical knowledge"""
    
    def __init__(self):
        self.medications = MEDICATIONS
        self.conditions = CONDITIONS
    
    def get_condition(self, condition_id: str) -> Optional[Condition]:
        """Get a condition by ID"""
        return self.conditions.get(condition_id)
    
    def get_medication(self, medication_id: str) -> Optional[Medication]:
        """Get a medication by ID"""
        return self.medications.get(medication_id)
    
    def search_conditions(self, query: str, specialty: Optional[str] = None) -> List[Condition]:
        """Search conditions by name or symptoms"""
        results = []
        query_lower = query.lower()
        
        for condition in self.conditions.values():
            if specialty and condition.specialty.lower() != specialty.lower():
                continue
            
            # Check name, symptoms, and description
            if (query_lower in condition.name.lower() or
                query_lower in condition.description.lower() or
                any(query_lower in s.lower() for s in condition.symptoms)):
                results.append(condition)
        
        return results
    
    def get_treatment_recommendations(self, condition_id: str, patient_factors: Dict[str, Any]) -> Dict[str, Any]:
        """Get personalized treatment recommendations based on patient factors"""
        condition = self.get_condition(condition_id)
        if not condition:
            return {"error": "Condition not found"}
        
        recommendations = {
            "condition": condition.name,
            "first_line": [],
            "alternatives": [],
            "contraindicated": [],
            "considerations": [],
            "monitoring": [],
            "lifestyle": []
        }
        
        # Analyze patient factors
        age = patient_factors.get("age", 50)
        renal_function = patient_factors.get("egfr", 90)  # mL/min/1.73m2
        liver_disease = patient_factors.get("liver_disease", False)
        cardiovascular_disease = patient_factors.get("cvd", False)
        current_medications = patient_factors.get("medications", [])
        allergies = patient_factors.get("allergies", [])
        
        for treatment in condition.treatments:
            for med in treatment.medications:
                # Check contraindications
                is_contraindicated = False
                contraindication_reason = None
                
                # Special logic for specific medications
                if med.generic_name.lower() == "colchicine":
                    if renal_function < 30:
                        is_contraindicated = True
                        contraindication_reason = "Severe renal impairment (CrCl <30)"
                
                if med.generic_name.lower() == "febuxostat":
                    if cardiovascular_disease:
                        recommendations["considerations"].append(
                            f"{med.name}: FDA warning - increased CV death risk in CVD patients. Consider allopurinol instead."
                        )
                
                if med.generic_name.lower() in ["apixaban", "rivaroxaban"]:
                    if renal_function < 15:
                        is_contraindicated = True
                        contraindication_reason = "Severe renal impairment"
                
                # Check drug interactions
                for interaction in med.interactions:
                    if any(interaction.lower() in m.lower() for m in current_medications):
                        recommendations["considerations"].append(
                            f"⚠️ {med.name} interaction with {interaction}"
                        )
                
                # Add to appropriate category
                med_info = {
                    "name": med.name,
                    "dosing": med.dosing,
                    "frequency": med.frequency,
                    "monitoring": med.monitoring,
                    "warnings": med.warnings
                }
                
                if is_contraindicated:
                    med_info["reason"] = contraindication_reason
                    recommendations["contraindicated"].append(med_info)
                elif treatment.category == TreatmentCategory.FIRST_LINE:
                    recommendations["first_line"].append(med_info)
                else:
                    recommendations["alternatives"].append(med_info)
            
            # Add lifestyle recommendations
            recommendations["lifestyle"].extend(treatment.lifestyle_changes)
        
        # Deduplicate lifestyle
        recommendations["lifestyle"] = list(set(recommendations["lifestyle"]))
        
        return recommendations
    
    def get_differential_diagnosis(self, symptoms: List[str]) -> List[Dict[str, Any]]:
        """Generate differential diagnosis based on symptoms"""
        matches = []
        
        for condition in self.conditions.values():
            score = 0
            matched_symptoms = []
            
            for symptom in symptoms:
                for condition_symptom in condition.symptoms:
                    if symptom.lower() in condition_symptom.lower():
                        score += 1
                        matched_symptoms.append(condition_symptom)
            
            if score > 0:
                matches.append({
                    "condition": condition.name,
                    "id": condition.id,
                    "specialty": condition.specialty,
                    "match_score": score,
                    "matched_symptoms": matched_symptoms,
                    "all_symptoms": condition.symptoms,
                    "recommended_diagnostics": condition.diagnostics
                })
        
        # Sort by match score
        matches.sort(key=lambda x: x["match_score"], reverse=True)
        return matches
    
    def get_cross_reference_analysis(self, condition_ids: List[str]) -> Dict[str, Any]:
        """Cross-reference multiple conditions for comorbidity analysis"""
        conditions = [self.get_condition(cid) for cid in condition_ids if self.get_condition(cid)]
        
        if len(conditions) < 2:
            return {"error": "Need at least 2 conditions for cross-reference"}
        
        # Find common medications
        all_medications = set()
        medication_conditions = {}
        
        for condition in conditions:
            for treatment in condition.treatments:
                for med in treatment.medications:
                    all_medications.add(med.generic_name)
                    if med.generic_name not in medication_conditions:
                        medication_conditions[med.generic_name] = []
                    medication_conditions[med.generic_name].append(condition.name)
        
        # Find potential interactions between treatments
        interactions = []
        medication_list = [med for condition in conditions for treatment in condition.treatments for med in treatment.medications]
        
        for i, med1 in enumerate(medication_list):
            for med2 in medication_list[i+1:]:
                for interaction in med1.interactions:
                    if interaction.lower() in med2.generic_name.lower() or interaction.lower() in med2.name.lower():
                        interactions.append({
                            "drug1": med1.name,
                            "drug2": med2.name,
                            "interaction": interaction
                        })
        
        # Find shared risk factors
        all_risk_factors = {}
        for condition in conditions:
            for rf in condition.risk_factors:
                if rf not in all_risk_factors:
                    all_risk_factors[rf] = []
                all_risk_factors[rf].append(condition.name)
        
        shared_risk_factors = {k: v for k, v in all_risk_factors.items() if len(v) > 1}
        
        return {
            "conditions_analyzed": [c.name for c in conditions],
            "shared_risk_factors": shared_risk_factors,
            "potential_interactions": interactions,
            "medication_overlap": medication_conditions,
            "combined_monitoring": list(set(
                item for condition in conditions 
                for treatment in condition.treatments 
                for med in treatment.medications 
                for item in med.monitoring
            )),
            "lifestyle_recommendations": list(set(
                item for condition in conditions 
                for treatment in condition.treatments 
                for item in treatment.lifestyle_changes
            ))
        }
    
    def condition_to_dict(self, condition: Condition) -> Dict[str, Any]:
        """Convert condition to dictionary for API response"""
        return {
            "id": condition.id,
            "name": condition.name,
            "icd10_code": condition.icd10_code,
            "specialty": condition.specialty,
            "description": condition.description,
            "pathophysiology": condition.pathophysiology,
            "risk_factors": condition.risk_factors,
            "symptoms": condition.symptoms,
            "diagnostics": condition.diagnostics,
            "biomarkers": condition.biomarkers,
            "differential_diagnosis": condition.differential_diagnosis,
            "complications": condition.complications,
            "prognosis": condition.prognosis,
            "prevention": condition.prevention,
            "treatments": [
                {
                    "name": t.name,
                    "category": t.category.value,
                    "medications": [
                        {
                            "name": m.name,
                            "generic_name": m.generic_name,
                            "drug_class": m.drug_class,
                            "mechanism": m.mechanism,
                            "dosing": m.dosing,
                            "frequency": m.frequency,
                            "max_dose": m.max_dose,
                            "contraindications": m.contraindications,
                            "side_effects": m.side_effects,
                            "interactions": m.interactions,
                            "monitoring": m.monitoring,
                            "warnings": m.warnings
                        }
                        for m in t.medications
                    ],
                    "lifestyle_changes": t.lifestyle_changes,
                    "duration": t.duration,
                    "expected_outcome": t.expected_outcome,
                    "follow_up": t.follow_up
                }
                for t in condition.treatments
            ]
        }

# Global instance
medical_knowledge = MedicalKnowledgeService()

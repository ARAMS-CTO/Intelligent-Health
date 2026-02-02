"""
Extended Medical Knowledge - Additional Conditions and Medications
This file extends the base medical_knowledge module with more conditions
"""

from server.services.medical_knowledge import (
    MEDICATIONS, CONDITIONS, Medication, Condition, Treatment, 
    TreatmentCategory, MedicalKnowledgeService
)

# =============================================================================
# ADDITIONAL MEDICATIONS
# =============================================================================

EXTENDED_MEDICATIONS = {
    # DIABETES MEDICATIONS
    "metformin": Medication(
        name="Metformin (Glucophage)",
        generic_name="Metformin",
        drug_class="Biguanide",
        mechanism="Decreases hepatic glucose production, increases insulin sensitivity, reduces intestinal glucose absorption",
        dosing="Start 500mg daily with meals, titrate to 1000mg BID over 2-4 weeks",
        frequency="With meals, 1-3 times daily",
        max_dose="2550mg daily (850mg TID) or 2000mg (extended-release)",
        contraindications=["eGFR <30", "Metabolic acidosis", "Acute contrast procedures (hold 48h)"],
        side_effects=["GI upset (common)", "Diarrhea", "Nausea", "B12 deficiency (long-term)", "Lactic acidosis (rare)"],
        interactions=["Contrast dye", "Alcohol (increased lactic acidosis risk)"],
        monitoring=["Renal function annually", "B12 levels periodically", "Glucose/A1c"],
        warnings=["Hold before surgery/procedures", "Hold if dehydration risk"],
        cost_tier="generic"
    ),
    "lisinopril": Medication(
        name="Lisinopril (Zestril/Prinivil)",
        generic_name="Lisinopril",
        drug_class="ACE Inhibitor",
        mechanism="Blocks angiotensin-converting enzyme, reducing angiotensin II production, lowering BP and reducing cardiac remodeling",
        dosing="Start 5-10mg daily, titrate to 20-40mg daily",
        frequency="Once daily",
        max_dose="40mg daily (80mg in heart failure)",
        contraindications=["Pregnancy", "Angioedema history", "Bilateral renal artery stenosis"],
        side_effects=["Dry cough (10-20%)", "Hyperkalemia", "Angioedema (rare)", "Dizziness", "Hypotension"],
        interactions=["Potassium supplements", "NSAIDs", "Lithium", "Sacubitril"],
        monitoring=["Renal function", "Potassium", "Blood pressure"],
        warnings=["Can cause fetal harm", "Monitor K+ especially with CKD"],
        cost_tier="generic"
    ),
    "amlodipine": Medication(
        name="Amlodipine (Norvasc)",
        generic_name="Amlodipine",
        drug_class="Calcium Channel Blocker (Dihydropyridine)",
        mechanism="Blocks L-type calcium channels in vascular smooth muscle, causing vasodilation",
        dosing="Start 5mg daily, may increase to 10mg",
        frequency="Once daily",
        max_dose="10mg daily",
        contraindications=["Severe hypotension", "Cardiogenic shock"],
        side_effects=["Peripheral edema (dose-related)", "Headache", "Flushing", "Dizziness"],
        interactions=["Strong CYP3A4 inhibitors", "Simvastatin (limit to 20mg)"],
        monitoring=["Blood pressure", "Heart rate", "Edema"],
        warnings=["Ankle swelling common at higher doses", "May worsen heart failure if systolic dysfunction"],
        cost_tier="generic"
    ),
    "omeprazole": Medication(
        name="Omeprazole (Prilosec)",
        generic_name="Omeprazole",
        drug_class="Proton Pump Inhibitor (PPI)",
        mechanism="Irreversibly inhibits H+/K+ ATPase (proton pump) in gastric parietal cells",
        dosing="20-40mg daily, 30-60 min before breakfast",
        frequency="Once daily (BID for erosive esophagitis)",
        max_dose="40mg BID",
        contraindications=["Hypersensitivity to PPIs"],
        side_effects=["Headache", "Diarrhea", "C. diff (long-term)", "B12/Mg deficiency", "Bone fractures (long-term)"],
        interactions=["Clopidogrel (use pantoprazole instead)", "Methotrexate"],
        monitoring=["Magnesium if prolonged use", "B12 if long-term", "Consider bone density if risk factors"],
        warnings=["Use lowest effective dose", "Re-evaluate need periodically", "Increased C. diff and pneumonia risk"],
        cost_tier="generic"
    ),
    # PAIN MEDICATIONS
    "naproxen": Medication(
        name="Naproxen (Aleve/Naprosyn)",
        generic_name="Naproxen",
        drug_class="NSAID",
        mechanism="Inhibits COX-1 and COX-2, reducing prostaglandin synthesis",
        dosing="250-500mg BID with food",
        frequency="Every 8-12 hours",
        max_dose="1250mg/day (1000mg for OTC)",
        contraindications=["Active GI bleeding", "Severe renal impairment", "Post-CABG", "Aspirin-sensitive asthma"],
        side_effects=["GI bleeding", "Renal impairment", "Hypertension", "CV events", "Edema"],
        interactions=["Anticoagulants", "Lithium", "ACE inhibitors", "Diuretics"],
        monitoring=["Renal function", "Blood pressure", "GI symptoms"],
        warnings=["Boxed warning: increased CV events", "Boxed warning: GI bleeding"],
        cost_tier="generic"
    ),
    "indomethacin": Medication(
        name="Indomethacin (Indocin)",
        generic_name="Indomethacin",
        drug_class="NSAID (Potent)",
        mechanism="Potent non-selective COX inhibitor, highly effective for gout and inflammatory conditions",
        dosing="Gout: 50mg TID until pain subsides (max 200mg/day first day), then reduce",
        frequency="Every 8 hours with food",
        max_dose="200mg/day",
        contraindications=["Same as other NSAIDs", "CNS effects more common in elderly"],
        side_effects=["Headache (very common)", "Dizziness", "GI bleeding", "CNS effects"],
        interactions=["Same as other NSAIDs", "Probenecid increases levels"],
        monitoring=["Renal function", "CNS symptoms", "GI bleeding"],
        warnings=["More CNS side effects than other NSAIDs", "First-line NSAID for gout"],
        cost_tier="generic"
    ),
    # ANTIBIOTICS
    "amoxicillin": Medication(
        name="Amoxicillin",
        generic_name="Amoxicillin",
        drug_class="Aminopenicillin (Beta-lactam)",
        mechanism="Inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins",
        dosing="500mg TID or 875mg BID for most infections",
        frequency="Every 8-12 hours",
        max_dose="3000mg/day",
        contraindications=["Penicillin allergy (true IgE-mediated)", "Mononucleosis (rash risk)"],
        side_effects=["Diarrhea", "Rash", "Nausea", "Allergic reactions"],
        interactions=["Probenecid", "Warfarin", "Methotrexate"],
        monitoring=["Signs of allergy", "Resolution of infection"],
        warnings=["Rash in mono", "C. diff risk", "Complete full course"],
        cost_tier="generic"
    ),
    "azithromycin": Medication(
        name="Azithromycin (Zithromax/Z-Pack)",
        generic_name="Azithromycin",
        drug_class="Macrolide Antibiotic",
        mechanism="Binds to 50S ribosomal subunit, inhibiting bacterial protein synthesis",
        dosing="500mg day 1, then 250mg days 2-5 (Z-Pack)",
        frequency="Once daily",
        max_dose="500mg/day (2g single dose for STIs)",
        contraindications=["History of cholestatic jaundice with prior azithromycin", "QT prolongation"],
        side_effects=["Diarrhea", "Nausea", "Abdominal pain", "QT prolongation"],
        interactions=["QT-prolonging drugs", "Warfarin", "Digoxin"],
        monitoring=["QT interval in at-risk patients", "LFTs if symptoms"],
        warnings=["QT prolongation risk", "May worsen myasthenia gravis"],
        cost_tier="generic"
    ),
    # ASTHMA/COPD
    "albuterol": Medication(
        name="Albuterol (Ventolin/ProAir)",
        generic_name="Albuterol",
        drug_class="Short-Acting Beta-2 Agonist (SABA)",
        mechanism="Relaxes bronchial smooth muscle via beta-2 receptor agonism",
        dosing="2 puffs every 4-6 hours PRN. For acute exacerbation: 4-8 puffs q20min x3",
        frequency="Every 4-6 hours as needed",
        max_dose="12 puffs/day regularly (more in acute)",
        contraindications=["None absolute"],
        side_effects=["Tremor", "Tachycardia", "Palpitations", "Hypokalemia"],
        interactions=["Beta-blockers (antagonism)", "MAOIs", "TCAs"],
        monitoring=["Frequency of use (indicator of control)", "Heart rate"],
        warnings=["Overuse suggests poor asthma control", "May mask worsening disease"],
        cost_tier="generic"
    ),
    # THYROID
    "levothyroxine": Medication(
        name="Levothyroxine (Synthroid/Levoxyl)",
        generic_name="Levothyroxine",
        drug_class="Thyroid Hormone Replacement",
        mechanism="Synthetic T4, converted to active T3, replaces endogenous thyroid hormone",
        dosing="Start 25-50mcg daily (12.5-25mcg if elderly/cardiac), titrate by 12.5-25mcg q6-8 weeks",
        frequency="Once daily, 30-60 min before breakfast",
        max_dose="200-300mcg daily (individualized)",
        contraindications=["Acute MI", "Uncorrected adrenal insufficiency", "Thyrotoxicosis"],
        side_effects=["Palpitations", "Tremor", "Weight loss", "Insomnia", "Heat intolerance (if over-replaced)"],
        interactions=["Calcium", "Iron", "PPIs", "Bile acid sequestrants (separate by 4h)", "Warfarin"],
        monitoring=["TSH every 6-8 weeks during titration, then annually", "Free T4"],
        warnings=["Brand interchange may affect levels", "Many drug/food interactions affect absorption"],
        cost_tier="generic"
    )
}

# =============================================================================
# ADDITIONAL CONDITIONS
# =============================================================================

EXTENDED_CONDITIONS = {
    "hypertension": Condition(
        id="hypertension",
        name="Essential Hypertension",
        icd10_code="I10",
        specialty="Cardiology/Internal Medicine",
        description="Persistently elevated arterial blood pressure, major risk factor for cardiovascular disease",
        pathophysiology="Multifactorial: increased peripheral resistance, RAAS activation, endothelial dysfunction, sympathetic overactivity",
        risk_factors=["Age", "Obesity", "High sodium diet", "Sedentary lifestyle", "Family history", "Black race", "Excess alcohol", "Stress"],
        symptoms=["Usually asymptomatic (silent killer)", "Headache (severe HTN)", "Visual changes", "Epistaxis", "Dyspnea"],
        diagnostics=["Office BP >130/80 on 2+ occasions", "Ambulatory BP monitoring (ABPM)", "Home BP monitoring"],
        biomarkers=["Basic metabolic panel", "Lipid panel", "Urinalysis", "ECG", "Fasting glucose"],
        differential_diagnosis=["Secondary hypertension (renal artery stenosis, pheochromocytoma, primary aldosteronism, Cushing's)", "White coat HTN"],
        treatments=[
            Treatment(
                name="First-Line Antihypertensive Therapy",
                category=TreatmentCategory.FIRST_LINE,
                medications=[EXTENDED_MEDICATIONS["lisinopril"], EXTENDED_MEDICATIONS["amlodipine"]],
                lifestyle_changes=["DASH diet", "Sodium restriction (<2300mg/day)", "Weight loss", "Regular exercise (150 min/week)", "Limit alcohol", "Smoking cessation"],
                duration="Lifelong",
                expected_outcome="BP <130/80 for most adults. Reduces stroke by 35-40%, MI by 20-25%",
                follow_up="Monthly until at goal, then every 3-6 months"
            )
        ],
        complications=["Stroke", "Heart failure", "CAD/MI", "CKD", "Retinopathy", "Aortic aneurysm"],
        prognosis="Excellent with treatment. Each 20/10 mmHg reduction halves CV risk",
        prevention=["Healthy diet", "Regular exercise", "Weight management", "Limit sodium and alcohol"]
    ),
    "diabetes_type2": Condition(
        id="diabetes_type2",
        name="Type 2 Diabetes Mellitus",
        icd10_code="E11.9",
        specialty="Endocrinology",
        description="Metabolic disorder characterized by insulin resistance and relative insulin deficiency",
        pathophysiology="Progressive beta-cell dysfunction with underlying insulin resistance. Often associated with metabolic syndrome",
        risk_factors=["Obesity", "Sedentary lifestyle", "Family history", "Age >45", "Gestational diabetes history", "PCOS", "Prediabetes"],
        symptoms=["Polyuria", "Polydipsia", "Polyphagia", "Weight loss", "Fatigue", "Blurred vision", "Slow wound healing"],
        diagnostics=["Fasting glucose ≥126 mg/dL", "HbA1c ≥6.5%", "Random glucose ≥200 with symptoms", "2-hour OGTT ≥200"],
        biomarkers=["HbA1c", "Fasting glucose", "C-peptide", "Lipid panel", "Urine albumin/creatinine ratio"],
        differential_diagnosis=["Type 1 diabetes", "LADA", "Monogenic diabetes (MODY)", "Secondary diabetes (steroids, pancreatitis)"],
        treatments=[
            Treatment(
                name="First-Line Therapy - Metformin",
                category=TreatmentCategory.FIRST_LINE,
                medications=[EXTENDED_MEDICATIONS["metformin"]],
                lifestyle_changes=["Weight loss (7% target)", "Medical nutrition therapy", "150 min/week moderate exercise", "Reduce refined carbs", "Smoking cessation"],
                duration="Lifelong",
                expected_outcome="A1c reduction 1-1.5%. First-line unless contraindicated",
                follow_up="A1c every 3 months until at goal, then every 6 months"
            )
        ],
        complications=["Retinopathy", "Nephropathy", "Neuropathy", "CAD/MI", "Stroke", "PAD", "Foot ulcers/amputation"],
        prognosis="A1c <7% reduces microvascular complications. Aggressive management of CV risk factors essential",
        prevention=["Weight management", "Diet/exercise", "Metformin in high-risk prediabetes"]
    ),
    "copd": Condition(
        id="copd",
        name="Chronic Obstructive Pulmonary Disease",
        icd10_code="J44.9",
        specialty="Pulmonology",
        description="Progressive lung disease characterized by persistent airflow limitation",
        pathophysiology="Chronic inflammation causes airway remodeling and parenchymal destruction (emphysema)",
        risk_factors=["Smoking (80-90%)", "Occupational dusts/chemicals", "Indoor biomass fuel", "Alpha-1 antitrypsin deficiency", "Childhood respiratory infections"],
        symptoms=["Dyspnea (progressive)", "Chronic cough", "Sputum production", "Wheezing", "Chest tightness", "Fatigue"],
        diagnostics=["Spirometry: FEV1/FVC < 0.70 post-bronchodilator", "Chest X-ray", "CT chest", "ABG in severe disease"],
        biomarkers=["Spirometry (FEV1)", "Alpha-1 antitrypsin level", "ABG", "CBC (polycythemia)"],
        differential_diagnosis=["Asthma", "Bronchiectasis", "Heart failure", "Interstitial lung disease", "Tuberculosis"],
        treatments=[
            Treatment(
                name="Bronchodilator Therapy",
                category=TreatmentCategory.FIRST_LINE,
                medications=[EXTENDED_MEDICATIONS["albuterol"]],
                lifestyle_changes=["Smoking cessation (most important)", "Pulmonary rehabilitation", "Vaccinations (flu, pneumococcal, COVID)", "Avoid triggers"],
                duration="Lifelong",
                expected_outcome="Symptom relief, reduced exacerbations, improved quality of life",
                follow_up="Spirometry annually, symptoms every visit"
            )
        ],
        complications=["Acute exacerbations", "Respiratory failure", "Cor pulmonale", "Lung cancer", "Depression/anxiety"],
        prognosis="Progressive but treatable. Smoking cessation is the only intervention that slows decline",
        prevention=["Smoking prevention and cessation", "Occupational protections"]
    ),
    "hypothyroidism": Condition(
        id="hypothyroidism",
        name="Hypothyroidism",
        icd10_code="E03.9",
        specialty="Endocrinology",
        description="Thyroid hormone deficiency, most commonly due to Hashimoto's thyroiditis",
        pathophysiology="Inadequate thyroid hormone production leads to decreased metabolic activity",
        risk_factors=["Female sex", "Age >60", "Autoimmune disease", "Family history", "Prior thyroid surgery/radiation", "Iodine deficiency"],
        symptoms=["Fatigue", "Weight gain", "Cold intolerance", "Constipation", "Dry skin", "Hair loss", "Depression", "Bradycardia", "Menstrual irregularities"],
        diagnostics=["TSH elevated (>4.5 mIU/L)", "Free T4 low", "TPO antibodies (for Hashimoto's)"],
        biomarkers=["TSH", "Free T4", "TPO antibodies", "Thyroglobulin antibodies"],
        differential_diagnosis=["Subclinical hypothyroidism", "Sick euthyroid syndrome", "Central hypothyroidism", "Medication-induced (lithium, amiodarone)"],
        treatments=[
            Treatment(
                name="Thyroid Hormone Replacement",
                category=TreatmentCategory.FIRST_LINE,
                medications=[EXTENDED_MEDICATIONS["levothyroxine"]],
                lifestyle_changes=["Take medication consistently", "Avoid taking with calcium/iron/PPIs", "Maintain stable iodine intake"],
                duration="Lifelong",
                expected_outcome="Normalization of TSH, resolution of symptoms over 4-8 weeks",
                follow_up="TSH 6-8 weeks after dose change, then annually when stable"
            )
        ],
        complications=["Myxedema coma (severe)", "Cardiovascular disease", "Infertility", "Neuropathy"],
        prognosis="Excellent with proper replacement. Requires lifelong therapy",
        prevention=["Adequate iodine intake", "Early detection in high-risk populations"]
    ),
    "gerd": Condition(
        id="gerd",
        name="Gastroesophageal Reflux Disease (GERD)",
        icd10_code="K21.0",
        specialty="Gastroenterology",
        description="Chronic condition of gastric acid reflux causing symptoms and/or esophageal injury",
        pathophysiology="Lower esophageal sphincter dysfunction allows gastric acid reflux. Hiatal hernia often contributes",
        risk_factors=["Obesity", "Hiatal hernia", "Pregnancy", "Smoking", "Alcohol", "Certain foods (spicy, fatty, citrus)", "NSAIDs", "Scleroderma"],
        symptoms=["Heartburn (retrosternal burning)", "Regurgitation", "Dysphagia", "Chest pain", "Chronic cough", "Hoarseness", "Globus sensation"],
        diagnostics=["Clinical diagnosis for typical symptoms", "Endoscopy (EGD) for alarm symptoms or refractory", "pH monitoring", "Barium swallow"],
        biomarkers=["H. pylori testing (if indicated)", "Tissue biopsy (Barrett's screening)"],
        differential_diagnosis=["CAD/ACS (chest pain)", "Esophageal motility disorders", "Eosinophilic esophagitis", "Peptic ulcer disease", "Esophageal cancer"],
        treatments=[
            Treatment(
                name="PPI Therapy",
                category=TreatmentCategory.FIRST_LINE,
                medications=[EXTENDED_MEDICATIONS["omeprazole"]],
                lifestyle_changes=["Weight loss", "Elevate head of bed", "Avoid eating 3h before bed", "Avoid trigger foods", "Smoking cessation", "Smaller meals"],
                duration="4-8 weeks trial, then step-down to lowest effective dose",
                expected_outcome="90% symptom relief with PPIs. Healing of esophagitis",
                follow_up="Reassess at 8 weeks, consider EGD if refractory"
            )
        ],
        complications=["Erosive esophagitis", "Barrett's esophagus (precancerous)", "Stricture", "Esophageal adenocarcinoma"],
        prognosis="Good symptom control with treatment. Barrett's surveillance if present",
        prevention=["Weight management", "Avoid known triggers", "Lifestyle modifications"]
    ),
    "uti": Condition(
        id="uti",
        name="Urinary Tract Infection (Uncomplicated Cystitis)",
        icd10_code="N39.0",
        specialty="Urology/Internal Medicine",
        description="Bacterial infection of the bladder, most commonly E. coli in healthy premenopausal women",
        pathophysiology="Ascending infection from periurethral bacteria. Short female urethra increases risk",
        risk_factors=["Female sex", "Sexual activity", "Prior UTI", "Spermicide use", "Menopause", "Urinary obstruction", "Diabetes", "Immunosuppression"],
        symptoms=["Dysuria", "Urinary frequency", "Urgency", "Suprapubic pain", "Hematuria", "No systemic symptoms (fever = consider pyelonephritis)"],
        diagnostics=["Urinalysis (pyuria, nitrites, leukocyte esterase)", "Urine culture (if complicated or recurrent)", "No imaging for uncomplicated"],
        biomarkers=["Urinalysis", "Urine culture with sensitivities"],
        differential_diagnosis=["Vaginitis", "STI (chlamydia, gonorrhea)", "Interstitial cystitis", "Pyelonephritis", "Urethritis"],
        treatments=[
            Treatment(
                name="Antibiotic Therapy",
                category=TreatmentCategory.FIRST_LINE,
                medications=[EXTENDED_MEDICATIONS["amoxicillin"]],  # Note: TMP-SMX or nitrofurantoin usually first-line
                lifestyle_changes=["Hydration", "Urinate after intercourse", "Avoid spermicides if recurrent"],
                duration="3-5 days for uncomplicated cystitis",
                expected_outcome="Symptom resolution in 1-3 days",
                follow_up="No follow-up needed if symptoms resolve. Culture if recurrent"
            )
        ],
        complications=["Pyelonephritis", "Recurrent UTI", "Urosepsis (rare in uncomplicated)"],
        prognosis="Excellent for uncomplicated UTI. Recurrence common (25% within 6 months)",
        prevention=["Hydration", "Post-coital voiding", "Cranberry products (modest evidence)", "Vaginal estrogen in postmenopausal"]
    ),
    "anxiety": Condition(
        id="anxiety",
        name="Generalized Anxiety Disorder (GAD)",
        icd10_code="F41.1",
        specialty="Psychiatry",
        description="Persistent excessive worry about multiple life domains for ≥6 months",
        pathophysiology="Dysregulation of GABA, serotonin, and norepinephrine systems. Amygdala hyperactivity",
        risk_factors=["Female sex (2:1)", "Family history", "Childhood adversity", "Stressful life events", "Other psychiatric disorders", "Chronic medical illness"],
        symptoms=["Excessive worry", "Restlessness", "Fatigue", "Difficulty concentrating", "Irritability", "Muscle tension", "Sleep disturbance"],
        diagnostics=["Clinical interview", "GAD-7 screening tool", "Rule out medical causes (thyroid, substance use)"],
        biomarkers=["TSH (rule out hyperthyroidism)", "Drug screen if indicated"],
        differential_diagnosis=["Panic disorder", "Social anxiety", "Depression", "Hyperthyroidism", "Substance use", "Medication side effect", "Medical conditions"],
        treatments=[
            Treatment(
                name="Psychotherapy + Pharmacotherapy",
                category=TreatmentCategory.FIRST_LINE,
                medications=[],  # SSRIs/SNRIs would be first-line
                lifestyle_changes=["CBT (cognitive behavioral therapy) - first-line", "Regular exercise", "Sleep hygiene", "Caffeine reduction", "Relaxation techniques", "Mindfulness"],
                duration="Therapy: 12-16 sessions typically. Medication: 6-12 months minimum",
                expected_outcome="50-60% response rate to first-line treatment",
                follow_up="Every 1-2 weeks initially, then monthly"
            )
        ],
        complications=["Depression (common comorbidity)", "Substance use disorder", "Impaired functioning", "Physical health effects (CV risk)"],
        prognosis="Chronic but treatable. CBT has lasting effects. Relapse common if medication stopped early",
        prevention=["Stress management", "Early intervention", "Lifestyle factors (exercise, sleep)"]
    )
}


def extend_knowledge_base():
    """Add extended medications and conditions to the knowledge base"""
    # Add medications
    MEDICATIONS.update(EXTENDED_MEDICATIONS)
    
    # Add conditions
    CONDITIONS.update(EXTENDED_CONDITIONS)
    
    print(f"Knowledge base extended: {len(MEDICATIONS)} medications, {len(CONDITIONS)} conditions")


# Auto-extend when imported
extend_knowledge_base()

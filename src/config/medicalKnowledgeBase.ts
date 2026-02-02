/**
 * Intelligent Health - Medical Knowledge Base Configuration
 * 
 * This file defines the structured knowledge domains for AI Specialist Agents.
 * Each domain includes conditions, medications, procedures, and contextual info.
 */

// ============================================================================
// CONDITION KNOWLEDGE BASES
// ============================================================================

export const CONDITION_KNOWLEDGE = {
    // Urological & Metabolic Conditions
    KIDNEY_STONES: {
        id: 'kidney_stones',
        name: 'Kidney Stones (Nephrolithiasis)',
        category: 'urology',
        types: ['Calcium Oxalate', 'Uric Acid', 'Struvite', 'Cystine'],
        riskFactors: [
            'Dehydration',
            'High sodium diet',
            'Obesity',
            'Family history',
            'Gout/High Uric Acid',
            'Certain medications'
        ],
        diagnostics: ['CT Scan (Non-contrast)', 'Ultrasound', 'Urinalysis', '24-hour urine collection'],
        treatments: ['Hydration therapy', 'Alpha-blockers', 'ESWL (Shock Wave Lithotripsy)', 'Ureteroscopy', 'PCNL'],
        relatedMedications: ['Potassium Citrate', 'Allopurinol', 'Thiazide diuretics'],
        contextPrompt: `You are a specialist in nephrolithiasis (kidney stones). Provide evidence-based guidance on stone types, prevention strategies, and treatment options including ESWL and ureteroscopy.`
    },

    GALLSTONES: {
        id: 'gallstones',
        name: 'Gallstones (Cholelithiasis)',
        category: 'gastroenterology',
        types: ['Cholesterol stones', 'Pigment stones', 'Mixed stones'],
        riskFactors: [
            'Female gender',
            'Age > 40',
            'Obesity',
            'Rapid weight loss',
            'Pregnancy',
            'Family history',
            'High-fat diet'
        ],
        diagnostics: ['Abdominal Ultrasound', 'HIDA Scan', 'MRCP', 'CT Scan', 'Endoscopic Ultrasound'],
        treatments: ['Watchful waiting', 'Laparoscopic Cholecystectomy', 'ERCP', 'Ursodeoxycholic acid'],
        complications: ['Cholecystitis', 'Choledocholithiasis', 'Pancreatitis', 'Cholangitis'],
        contextPrompt: `You are a hepatobiliary specialist. Provide guidance on gallstone disease, including indications for surgery, ERCP procedures, and management of complications like cholecystitis.`
    },

    BLOOD_CLOTS: {
        id: 'blood_clots',
        name: 'Thrombosis & Blood Clots',
        category: 'hematology',
        types: ['DVT (Deep Vein Thrombosis)', 'PE (Pulmonary Embolism)', 'Arterial Thrombosis', 'Portal Vein Thrombosis'],
        riskFactors: [
            'Immobility',
            'Surgery',
            'Cancer',
            'Pregnancy',
            'Oral contraceptives',
            'Factor V Leiden',
            'Antiphospholipid syndrome'
        ],
        diagnostics: ['D-dimer', 'Doppler ultrasound', 'CT Pulmonary Angiography', 'Venography'],
        treatments: ['Anticoagulation (Heparin, LMWH)', 'DOACs (Eliquis, Xarelto)', 'Warfarin', 'Thrombolysis', 'IVC Filter'],
        medications: {
            ELIQUIS: {
                generic: 'Apixaban',
                class: 'Factor Xa inhibitor (DOAC)',
                mechanism: 'Selectively inhibits Factor Xa, interrupting the intrinsic and extrinsic coagulation cascade',
                dosing: '5mg BID (reduced to 2.5mg BID for age >80, weight <60kg, or CrCl 15-25)',
                sideEffects: ['Bleeding', 'Bruising', 'Anemia'],
                monitoring: 'No routine monitoring needed; Anti-Xa levels if required',
                reversal: 'Andexanet alfa (Andexxa)'
            }
        },
        contextPrompt: `You are a hematology specialist focused on thrombosis. Provide evidence-based guidance on DVT/PE diagnosis, anticoagulation therapy including DOACs like Eliquis, and thrombophilia workup.`
    },

    HEART_ATTACKS: {
        id: 'heart_attacks',
        name: 'Myocardial Infarction (Heart Attack)',
        category: 'cardiology',
        types: ['STEMI', 'NSTEMI', 'Silent MI', 'Type 2 MI (Demand ischemia)'],
        riskFactors: [
            'Hypertension',
            'Diabetes',
            'Smoking',
            'Hyperlipidemia',
            'Family history of CAD',
            'Obesity',
            'Sedentary lifestyle'
        ],
        diagnostics: ['12-lead ECG', 'Troponin I/T', 'Coronary Angiography', 'Echocardiogram', 'Stress testing'],
        treatments: ['Aspirin', 'P2Y12 inhibitors', 'PCI (Angioplasty + Stent)', 'CABG', 'Thrombolytics', 'Beta-blockers', 'ACE inhibitors'],
        timeframes: {
            doorToBalloon: '< 90 minutes (ideal)',
            goldWindow: '< 12 hours for PCI benefit'
        },
        contextPrompt: `You are an interventional cardiologist. Provide guidance on STEMI/NSTEMI management, PCI procedures, and secondary prevention including antiplatelet therapy and statins.`
    },

    BRAIN_TUMORS: {
        id: 'brain_tumors',
        name: 'Brain Tumors (CNS Neoplasms)',
        category: 'neuro-oncology',
        types: ['Glioblastoma (GBM)', 'Meningioma', 'Pituitary Adenoma', 'Schwannoma', 'Metastatic tumors', 'Astrocytoma', 'Oligodendroglioma'],
        grading: ['WHO Grade I', 'WHO Grade II', 'WHO Grade III', 'WHO Grade IV'],
        diagnostics: ['MRI with contrast', 'CT Head', 'PET Scan', 'Stereotactic biopsy', 'Lumbar puncture'],
        treatments: ['Surgical resection', 'Radiation therapy (IMRT, SRS)', 'Chemotherapy (Temozolomide)', 'Targeted therapy', 'Immunotherapy'],
        symptoms: ['Headache', 'Seizures', 'Focal neurological deficits', 'Personality changes', 'Vision problems'],
        contextPrompt: `You are a neuro-oncologist specializing in brain tumors. Provide guidance on tumor grading, surgical considerations, radiation protocols, and prognosis discussion.`
    }
};

// ============================================================================
// CANCER KNOWLEDGE BASE (By Type)
// ============================================================================

export const CANCER_KNOWLEDGE = {
    LUNG_CANCER: {
        id: 'lung_cancer',
        name: 'Lung Cancer',
        types: ['NSCLC (Adenocarcinoma, Squamous)', 'SCLC'],
        biomarkers: ['EGFR', 'ALK', 'ROS1', 'KRAS G12C', 'PD-L1'],
        treatments: ['Surgery', 'Chemotherapy', 'Targeted therapy (Osimertinib, Crizotinib)', 'Immunotherapy (Pembrolizumab)'],
        staging: 'TNM System',
        screening: 'Low-dose CT for high-risk individuals'
    },
    BREAST_CANCER: {
        id: 'breast_cancer',
        name: 'Breast Cancer',
        types: ['Ductal Carcinoma (DCIS, IDC)', 'Lobular Carcinoma', 'Triple Negative', 'HER2+'],
        biomarkers: ['ER', 'PR', 'HER2', 'Ki-67', 'BRCA1/2'],
        treatments: ['Lumpectomy', 'Mastectomy', 'Chemotherapy', 'Hormone therapy (Tamoxifen)', 'HER2 therapy (Herceptin)'],
        screening: 'Mammography, Genetic testing (BRCA)'
    },
    COLORECTAL_CANCER: {
        id: 'colorectal_cancer',
        name: 'Colorectal Cancer',
        types: ['Adenocarcinoma', 'Carcinoid', 'Lymphoma'],
        biomarkers: ['MSI-H', 'KRAS', 'NRAS', 'BRAF V600E'],
        treatments: ['Surgery', 'FOLFOX', 'FOLFIRI', 'Targeted (Bevacizumab, Cetuximab)', 'Immunotherapy'],
        screening: 'Colonoscopy every 10 years from age 45'
    },
    PROSTATE_CANCER: {
        id: 'prostate_cancer',
        name: 'Prostate Cancer',
        types: ['Adenocarcinoma', 'Small cell', 'Transitional cell'],
        biomarkers: ['PSA', 'Gleason Score', 'BRCA2'],
        treatments: ['Active surveillance', 'Prostatectomy', 'Radiation', 'Hormone therapy (ADT)', 'Chemotherapy'],
        screening: 'PSA testing (shared decision making)'
    },
    PANCREATIC_CANCER: {
        id: 'pancreatic_cancer',
        name: 'Pancreatic Cancer',
        types: ['Pancreatic Ductal Adenocarcinoma (PDAC)', 'Neuroendocrine'],
        biomarkers: ['CA 19-9', 'KRAS', 'BRCA'],
        treatments: ['Whipple procedure', 'FOLFIRINOX', 'Gemcitabine + Nab-paclitaxel'],
        prognosis: 'Generally poor; early detection critical'
    },
    SKIN_CANCER: {
        id: 'skin_cancer',
        name: 'Skin Cancer',
        types: ['Melanoma', 'Basal Cell Carcinoma', 'Squamous Cell Carcinoma'],
        biomarkers: ['BRAF V600E', 'NRAS', 'C-KIT'],
        treatments: ['Excision', 'Mohs surgery', 'Immunotherapy (Ipilimumab, Nivolumab)', 'Targeted (Vemurafenib)'],
        screening: 'Regular skin exams, dermoscopy'
    },
    LEUKEMIA: {
        id: 'leukemia',
        name: 'Leukemia',
        types: ['AML', 'ALL', 'CML', 'CLL'],
        biomarkers: ['BCR-ABL', 'FLT3', 'NPM1', 'Philadelphia chromosome'],
        treatments: ['Chemotherapy', 'Targeted (Imatinib for CML)', 'CAR-T therapy', 'Stem cell transplant']
    },
    LYMPHOMA: {
        id: 'lymphoma',
        name: 'Lymphoma',
        types: ['Hodgkin Lymphoma', 'Non-Hodgkin Lymphoma (DLBCL, Follicular)'],
        biomarkers: ['CD20', 'PD-1', 'Ann Arbor staging'],
        treatments: ['ABVD', 'R-CHOP', 'Radiation', 'CAR-T therapy', 'Stem cell transplant']
    }
};

// ============================================================================
// METABOLIC & MEDICATION KNOWLEDGE
// ============================================================================

export const METABOLIC_KNOWLEDGE = {
    HIGH_URIC_ACID: {
        id: 'hyperuricemia',
        name: 'Hyperuricemia & Gout',
        normalRange: '< 6.8 mg/dL (360 µmol/L)',
        causes: ['Purine-rich diet', 'Alcohol', 'Obesity', 'CKD', 'Diuretics', 'Genetic factors'],
        complications: ['Gout', 'Kidney stones (uric acid)', 'Chronic nephropathy'],
        medications: {
            FEBUXOSTAT: {
                brand: 'Adenuric / Uloric',
                class: 'Xanthine Oxidase Inhibitor',
                mechanism: 'Non-purine selective inhibitor of xanthine oxidase, reducing uric acid production',
                dosing: '40-80mg once daily',
                targetLevel: '< 6.0 mg/dL',
                sideEffects: ['Liver function abnormalities', 'Nausea', 'Arthralgias', 'Cardiovascular risk (FDA warning)'],
                contraindications: ['Azathioprine co-administration', 'Mercaptopurine'],
                monitoring: 'Uric acid levels, LFTs, CV risk assessment'
            },
            ALLOPURINOL: {
                brand: 'Zyloprim',
                class: 'Xanthine Oxidase Inhibitor',
                mechanism: 'Purine analog that inhibits xanthine oxidase',
                dosing: '100-800mg daily (start low)',
                sideEffects: ['Rash', 'Hypersensitivity syndrome', 'GI upset'],
                note: 'HLA-B*5801 testing in high-risk populations'
            },
            COLCHICINE: {
                brand: 'Colcrys',
                class: 'Anti-inflammatory',
                mechanism: 'Inhibits microtubule polymerization, reducing neutrophil migration',
                dosing: 'Acute: 1.2mg then 0.6mg 1hr later; Prophylaxis: 0.6mg daily/BID',
                sideEffects: ['Diarrhea', 'Nausea', 'Myopathy']
            }
        },
        contextPrompt: `You are an expert in hyperuricemia and gout management. Provide guidance on urate-lowering therapy, flare prophylaxis, and lifestyle modifications. Include details on Febuxostat (Adenuric) vs Allopurinol therapy.`
    },

    HIGH_CHOLESTEROL: {
        id: 'hyperlipidemia',
        name: 'Hyperlipidemia & Dyslipidemia',
        normalRanges: {
            totalCholesterol: '< 200 mg/dL',
            LDL: '< 100 mg/dL (or < 70 for high ASCVD risk)',
            HDL: '> 40 mg/dL (men), > 50 mg/dL (women)',
            triglycerides: '< 150 mg/dL'
        },
        riskCalculators: ['ASCVD 10-year risk calculator', 'Framingham Risk Score'],
        medications: {
            ATORVASTATIN: {
                brand: 'Lipitor',
                class: 'HMG-CoA Reductase Inhibitor (Statin)',
                mechanism: 'Inhibits cholesterol synthesis in the liver by blocking HMG-CoA reductase',
                dosing: '10-80mg once daily',
                LDLReduction: '37-55% depending on dose',
                sideEffects: ['Myalgia', 'Elevated transaminases', 'Rhabdomyolysis (rare)', 'Diabetes risk'],
                interactions: ['CYP3A4 inhibitors', 'Gemfibrozil', 'Cyclosporine'],
                monitoring: 'Lipid panel, LFTs, CK if symptomatic'
            },
            ROSUVASTATIN: {
                brand: 'Crestor',
                class: 'Statin',
                mechanism: 'Same as Atorvastatin; more hydrophilic',
                dosing: '5-40mg daily',
                LDLReduction: 'Up to 63%',
                note: 'Dose adjustment in Asian patients'
            },
            EZETIMIBE: {
                brand: 'Zetia',
                class: 'Cholesterol Absorption Inhibitor',
                mechanism: 'Blocks intestinal absorption of dietary and biliary cholesterol',
                dosing: '10mg daily',
                note: 'Often combined with statin for additional 15-20% LDL reduction'
            },
            PCSK9_INHIBITORS: {
                examples: 'Evolocumab (Repatha), Alirocumab (Praluent)',
                class: 'PCSK9 Inhibitor (Injectable)',
                mechanism: 'Monoclonal antibody that increases LDL receptor recycling',
                LDLReduction: '50-60% (on top of statin)',
                indication: 'Familial hypercholesterolemia, ASCVD not at goal on max statin'
            }
        },
        contextPrompt: `You are a lipidologist. Provide evidence-based guidance on statin therapy including Atorvastatin (Lipitor), ASCVD risk assessment, and management of statin intolerance.`
    }
};

// ============================================================================
// ORTHOPEDIC SPECIALIZATION (Knee/ACL/Meniscus)
// ============================================================================

export const ORTHOPEDIC_KNEE_KNOWLEDGE = {
    ACL_INJURY: {
        id: 'acl_tear',
        name: 'ACL Tear (Anterior Cruciate Ligament)',
        mechanism: ['Non-contact pivoting', 'Sudden deceleration', 'Direct blow to knee'],
        grading: ['Grade I (Sprain)', 'Grade II (Partial tear)', 'Grade III (Complete rupture)'],
        diagnosis: {
            physical: ['Lachman test (gold standard)', 'Anterior drawer test', 'Pivot shift test'],
            imaging: ['MRI knee (definitive)', 'X-ray (rule out fractures)']
        },
        treatment: {
            conservative: ['RICE', 'Physical therapy', 'Bracing', 'Activity modification'],
            surgical: {
                procedures: ['ACL Reconstruction (ACLR)'],
                grafts: ['Patellar tendon autograft', 'Hamstring autograft', 'Quadriceps tendon', 'Allograft'],
                timeline: 'Surgery often delayed 2-4 weeks for swelling reduction',
                rehabilitation: '6-12 months before return to sport'
            }
        },
        contextPrompt: `You are an orthopedic sports medicine surgeon specializing in ACL injuries. Provide guidance on diagnosis, surgical vs conservative management, graft selection, and return-to-sport protocols.`
    },

    MENISCUS_INJURY: {
        id: 'meniscus_tear',
        name: 'Meniscus Tear',
        types: ['Radial', 'Horizontal', 'Bucket handle', 'Flap/Parrot beak', 'Complex/Degenerative'],
        zones: ['Red-Red (vascular)', 'Red-White (intermediate)', 'White-White (avascular)'],
        diagnosis: {
            physical: ['McMurray test', 'Thessaly test', 'Joint line tenderness'],
            imaging: ['MRI knee']
        },
        treatment: {
            conservative: ['Physical therapy', 'NSAIDs', 'Activity modification'],
            surgical: {
                arthroscopy: true,
                procedures: ['Partial meniscectomy', 'Meniscus repair (sutures)', 'Meniscus transplant'],
                repairability: 'Depends on tear location, type, and vascularity'
            }
        },
        contextPrompt: `You are a knee arthroscopy specialist. Provide guidance on meniscus tear classification, repair vs meniscectomy decision-making, and post-operative rehabilitation.`
    },

    KNEE_REPLACEMENT: {
        id: 'tka',
        name: 'Total Knee Arthroplasty (TKA)',
        indications: ['End-stage osteoarthritis', 'Rheumatoid arthritis', 'Post-traumatic arthritis', 'Failed conservative management'],
        procedure: {
            types: ['Total Knee Replacement', 'Partial (Unicompartmental) Knee Replacement', 'Patellofemoral replacement'],
            implants: ['Cemented', 'Cementless', 'Posterior-stabilized', 'Cruciate-retaining']
        },
        outcomes: {
            longevity: '15-25 years for most implants',
            satisfaction: '~85-90% patient satisfaction',
            complications: ['Infection', 'DVT/PE', 'Stiffness', 'Instability', 'Loosening']
        },
        rehabilitation: {
            phases: ['Immediate post-op (ROM)', 'Weeks 1-6 (strengthening)', 'Weeks 6-12 (functional)'],
            fullRecovery: '3-6 months for most activities'
        },
        contextPrompt: `You are a joint replacement surgeon specializing in knee arthroplasty. Provide guidance on surgical techniques, implant selection, and rehabilitation protocols.`
    }
};

// ============================================================================
// GENETICS & LONGEVITY KNOWLEDGE
// ============================================================================

export const GENETICS_KNOWLEDGE = {
    HEREDITARY_PATTERNS: {
        autosomalDominant: {
            description: 'One copy of mutated gene causes disease',
            examples: ['Huntington disease', 'BRCA1/2 mutations', 'Marfan syndrome', 'Familial hypercholesterolemia'],
            inheritanceRisk: '50% per child'
        },
        autosomalRecessive: {
            description: 'Two copies needed for disease expression',
            examples: ['Cystic fibrosis', 'Sickle cell disease', 'Tay-Sachs disease'],
            inheritanceRisk: '25% if both parents carriers'
        },
        xLinked: {
            description: 'Gene located on X chromosome',
            examples: ['Hemophilia A/B', 'Duchenne muscular dystrophy', 'Fragile X syndrome']
        },
        mitochondrial: {
            description: 'Maternal inheritance through mitochondrial DNA',
            examples: ['MELAS', 'MERRF', 'Leber hereditary optic neuropathy']
        }
    },

    PHARMACOGENOMICS: {
        description: 'How genetic variations affect drug response',
        keyGenes: {
            CYP2D6: ['Codeine metabolism', 'Tamoxifen activation', 'Tricyclic antidepressants'],
            CYP2C19: ['Clopidogrel activation', 'PPIs', 'SSRIs'],
            CYP3A4: ['Statin metabolism', 'Immunosuppressants', 'Opioids'],
            VKORC1: ['Warfarin sensitivity'],
            HLA_B5701: ['Abacavir hypersensitivity'],
            TPMT: ['Thiopurine toxicity']
        }
    },

    LONGEVITY_MARKERS: {
        telomeres: {
            role: 'Chromosome end-caps; shorten with age',
            testing: 'Telomere length testing',
            interventions: ['Lifestyle factors', 'TA-65 (Telomerase activators)', 'Stress reduction']
        },
        epigenetics: {
            role: 'Gene expression without DNA sequence changes',
            clocks: ['Horvath Clock', 'GrimAge', 'DunedinPACE'],
            interventions: ['Caloric restriction', 'Fasting', 'Exercise', 'Sleep optimization']
        },
        senescence: {
            role: 'Accumulation of senescent cells',
            interventions: ['Senolytics (Dasatinib + Quercetin)', 'Fisetin']
        }
    }
};

// ============================================================================
// VIP SERVICES CONFIGURATION
// ============================================================================

export const VIP_SERVICES = {
    GENETIC_ANALYSIS: {
        id: 'vip_genetics',
        name: 'Premium Genetic Analysis',
        tier: 'VIP',
        features: [
            'Whole Genome Sequencing (30x coverage)',
            'Pharmacogenomics Panel',
            'Cancer Predisposition Screening',
            'Carrier Status Testing',
            'Ancestry & Trait Reports',
            'Family Pedigree Analysis',
            'Personalized Risk Assessment'
        ],
        price: 'From $2,500'
    },

    LONGEVITY_PROGRAM: {
        id: 'vip_longevity',
        name: 'Longevity Optimization Program',
        tier: 'VIP',
        features: [
            'Biological Age Testing (Epigenetic Clocks)',
            'Telomere Length Analysis',
            'Comprehensive Metabolomics Panel',
            'Personalized Supplement Protocol',
            'Quarterly Biomarker Tracking',
            'Access to Anti-Aging Research',
            'Concierge Physician Access'
        ],
        price: 'From $5,000/year'
    },

    FUTURE_ROADMAP: {
        id: 'future_2035',
        name: '10-Year Vision: Memory & Consciousness',
        phases: [
            {
                year: '2025-2026',
                title: 'Foundation',
                features: ['Comprehensive biometric collection', 'Wearable integration', 'Genetic profiling']
            },
            {
                year: '2027-2028',
                title: 'Advanced Analytics',
                features: ['AI-powered health predictions', 'Digital twin modeling', 'Quantum-enhanced analysis']
            },
            {
                year: '2029-2031',
                title: 'Neural Interface',
                features: ['EEG/MEG integration', 'Brainwave pattern storage', 'Cognitive fingerprinting']
            },
            {
                year: '2032-2035',
                title: 'Memory Preservation',
                features: ['Experiential memory encoding', 'Consciousness mapping', 'Quantum memory storage']
            }
        ]
    }
};

// ============================================================================
// BLOCKCHAIN & BIOMETRIC IDENTITY
// ============================================================================

export const BLOCKCHAIN_IDENTITY = {
    WORLDCOIN_ORB: {
        id: 'worldcoin_integration',
        name: 'World ID / Orb Protocol Integration',
        description: 'Biometric identity verification using iris scanning technology',
        features: [
            'Iris-based unique identifier',
            'Zero-knowledge proof of personhood',
            'Sybil-resistant verification',
            'Privacy-preserving authentication'
        ],
        useCases: [
            'Patient identity verification',
            'Genetic data ownership attestation',
            'Clinical trial enrollment verification',
            'Prescription fraud prevention'
        ]
    },

    GENETIC_NFT: {
        id: 'genetic_identity',
        name: 'Genetic Identity Token',
        description: 'Cryptographic proof of genetic identity on blockchain',
        features: [
            'Hash of genomic data (privacy-preserving)',
            'Consent management on-chain',
            'Data monetization rights',
            'Research participation tracking'
        ]
    }
};

// ============================================================================
// AGENT CONTEXT BUILDERS
// ============================================================================

export function buildAgentContext(zone: string, contextId: string | null): string {
    let basePrompt = `You are an AI medical specialist operating within the Intelligent Health platform. 
You have access to comprehensive medical knowledge and should provide evidence-based guidance.
Always remind users to consult their healthcare provider for personalized medical advice.

`;

    switch (zone) {
        case 'urology':
            basePrompt += CONDITION_KNOWLEDGE.KIDNEY_STONES.contextPrompt;
            break;
        case 'gastroenterology':
            if (contextId?.includes('gallstone')) {
                basePrompt += CONDITION_KNOWLEDGE.GALLSTONES.contextPrompt;
            } else {
                basePrompt += `You are a gastroenterology specialist with deep knowledge of gallstones, GI cancers, and endoscopic procedures.`;
            }
            break;
        case 'hematology':
            basePrompt += CONDITION_KNOWLEDGE.BLOOD_CLOTS.contextPrompt;
            break;
        case 'cardiology':
            basePrompt += CONDITION_KNOWLEDGE.HEART_ATTACKS.contextPrompt;
            break;
        case 'neuro-oncology':
            basePrompt += CONDITION_KNOWLEDGE.BRAIN_TUMORS.contextPrompt;
            break;
        case 'orthopedics':
            if (contextId?.includes('acl') || contextId?.includes('knee')) {
                basePrompt += ORTHOPEDIC_KNEE_KNOWLEDGE.ACL_INJURY.contextPrompt;
            } else if (contextId?.includes('meniscus')) {
                basePrompt += ORTHOPEDIC_KNEE_KNOWLEDGE.MENISCUS_INJURY.contextPrompt;
            } else {
                basePrompt += ORTHOPEDIC_KNEE_KNOWLEDGE.KNEE_REPLACEMENT.contextPrompt;
            }
            break;
        case 'metabolic':
            if (contextId?.includes('uric') || contextId?.includes('gout')) {
                basePrompt += METABOLIC_KNOWLEDGE.HIGH_URIC_ACID.contextPrompt;
            } else {
                basePrompt += METABOLIC_KNOWLEDGE.HIGH_CHOLESTEROL.contextPrompt;
            }
            break;
        case 'genetics':
            basePrompt += `You are a clinical geneticist specializing in hereditary disease patterns, pharmacogenomics, and longevity science. 
You help patients understand their genetic risks, family history patterns, and personalized medicine options.
You are knowledgeable about BRCA mutations, Lynch syndrome, familial hypercholesterolemia, and emerging longevity interventions.`;
            break;
        case 'oncology':
            basePrompt += `You are a medical oncologist with comprehensive knowledge of cancer types, staging, biomarkers, and treatment protocols including chemotherapy, targeted therapy, and immunotherapy.`;
            break;
        default:
            basePrompt += `You are a general medical AI assistant with broad clinical knowledge.`;
    }

    return basePrompt;
}

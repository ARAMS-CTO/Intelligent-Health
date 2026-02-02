/**
 * Medical Knowledge Service
 * Frontend service for accessing medical knowledge APIs
 */

// Helper to get token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const API_BASE_URL = '/api';

// Generic fetch helpers
async function get<T>(url: string): Promise<{ data: T }> {
    const response = await fetch(url, { headers: getAuthHeader() });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { data };
}

async function post<T>(url: string, body: object): Promise<{ data: T }> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { data };
}

// Types
export interface Condition {
    id: string;
    name: string;
    icd10_code: string;
    specialty: string;
    description: string;
    pathophysiology: string;
    risk_factors: string[];
    symptoms: string[];
    diagnostics: string[];
    biomarkers: string[];
    differential_diagnosis: string[];
    treatments: Treatment[];
    complications: string[];
    prognosis: string;
    prevention: string[];
}

export interface Treatment {
    name: string;
    category: 'first_line' | 'second_line' | 'alternative' | 'emergency';
    medications: Medication[];
    lifestyle_changes: string[];
    duration: string;
    expected_outcome: string;
    follow_up: string;
}

export interface Medication {
    name: string;
    generic_name: string;
    drug_class: string;
    mechanism: string;
    dosing: string;
    frequency: string;
    max_dose: string;
    contraindications: string[];
    side_effects: string[];
    interactions: string[];
    monitoring: string[];
    warnings: string[];
    cost_tier?: string;
}

export interface TreatmentRecommendation {
    condition: string;
    first_line: MedicationRecommendation[];
    alternatives: MedicationRecommendation[];
    contraindicated: MedicationRecommendation[];
    considerations: string[];
    monitoring: string[];
    lifestyle: string[];
}

export interface MedicationRecommendation {
    name: string;
    dosing: string;
    frequency: string;
    monitoring: string[];
    warnings: string[];
    reason?: string;
}

export interface DifferentialDiagnosis {
    condition: string;
    id: string;
    specialty: string;
    match_score: number;
    matched_symptoms: string[];
    all_symptoms: string[];
    recommended_diagnostics: string[];
}

export interface PatientAnalysis {
    timestamp: string;
    patient_summary: {
        age?: number;
        sex?: string;
        symptoms: string[];
        conditions: string[];
        medications: string[];
        risk_factors: string[];
    };
    differential_diagnoses: DifferentialDiagnosis[];
    specialist_consultations: {
        specialty: string;
        reason: string;
        priority: string;
    }[];
    treatment_plan: {
        recommendations_by_condition: TreatmentRecommendation[];
        unified_lifestyle_changes: string[];
        unified_monitoring: string[];
    };
    drug_interactions: {
        drug1: string;
        drug2: string;
        interaction: string;
    }[];
    monitoring_plan: string[];
    reasoning_chain: {
        step: number;
        reasoning: string;
        timestamp: string;
    }[];
}

export interface GoutProtocol {
    condition: string;
    severity_assessment: string;
    treatment_protocol: any;
    colchicine_details: {
        recommended: boolean;
        regimen?: {
            acute_attack: {
                initial_dose: string;
                second_dose: string;
                total_day_1: string;
                day_2_onwards: string;
            };
            timing: string;
            expected_response: string;
        };
        warnings?: string[];
        with_food?: string;
        cost?: string;
        reason?: string;
    };
    alternatives: {
        name: string;
        example: string;
        duration?: string;
        alternatives?: string[];
        cautions: string[];
        when_to_use: string;
    }[];
    prophylaxis_plan: {
        timing?: string;
        first_line?: {
            medication: string;
            starting_dose: string;
            titration: string;
            target: string;
            max_dose: string;
        };
        flare_prophylaxis?: {
            medication: string;
            duration: string;
            rationale: string;
        };
        genetic_testing?: string;
        recommendation?: string;
        lifestyle?: string[];
    };
    reasoning: {
        step: number;
        reasoning: string;
        timestamp: string;
    }[];
}

export interface DrugAnalysis {
    medication: {
        name: string;
        generic: string;
        class: string;
    };
    patient_specific: {
        appropriate: boolean;
        dose_adjustment_needed: boolean;
        contraindication_check: string;
        interaction_check: string;
        warnings: string[];
    };
    dosing: {
        recommended: string;
        adjustments: string[];
    };
    monitoring: string[];
    patient_education: string[];
}

// Service class
class MedicalKnowledgeService {
    private baseUrl = `${API_BASE_URL}/knowledge`;

    // =====================================
    // CONDITIONS
    // =====================================

    async listConditions(): Promise<{ conditions: { id: string; name: string; specialty: string; icd10_code: string }[]; total: number }> {
        const response = await get<{ conditions: { id: string; name: string; specialty: string; icd10_code: string }[]; total: number }>(`${this.baseUrl}/conditions`);
        return response.data;
    }

    async getCondition(conditionId: string): Promise<Condition> {
        const response = await get<Condition>(`${this.baseUrl}/conditions/${conditionId}`);
        return response.data;
    }

    async searchConditions(query: string, specialty?: string): Promise<{ query: string; results: any[]; total: number }> {
        const response = await post<{ query: string; results: any[]; total: number }>(`${this.baseUrl}/conditions/search`, {
            query,
            specialty
        });
        return response.data;
    }

    // =====================================
    // MEDICATIONS
    // =====================================

    async listMedications(): Promise<{ medications: any[]; total: number }> {
        const response = await get<{ medications: any[]; total: number }>(`${this.baseUrl}/medications`);
        return response.data;
    }

    async getMedication(medicationId: string): Promise<Medication> {
        const response = await get<Medication>(`${this.baseUrl}/medications/${medicationId}`);
        return response.data;
    }

    // =====================================
    // TREATMENT RECOMMENDATIONS
    // =====================================

    async getTreatmentRecommendation(
        conditionId: string,
        patientFactors: {
            age?: number;
            egfr?: number;
            liver_disease?: boolean;
            cvd?: boolean;
            medications?: string[];
            allergies?: string[];
        }
    ): Promise<TreatmentRecommendation> {
        const response = await post<TreatmentRecommendation>(`${this.baseUrl}/treatments/recommend`, {
            condition_id: conditionId,
            patient_factors: patientFactors
        });
        return response.data;
    }

    // =====================================
    // DIFFERENTIAL DIAGNOSIS
    // =====================================

    async getDifferentialDiagnosis(symptoms: string[]): Promise<{
        symptoms_analyzed: string[];
        differentials: DifferentialDiagnosis[];
        total_matches: number;
    }> {
        const response = await post<{
            symptoms_analyzed: string[];
            differentials: DifferentialDiagnosis[];
            total_matches: number;
        }>(`${this.baseUrl}/differential`, { symptoms });
        return response.data;
    }

    // =====================================
    // CROSS-REFERENCE
    // =====================================

    async crossReferenceConditions(conditionIds: string[]): Promise<{
        conditions_analyzed: string[];
        shared_risk_factors: Record<string, string[]>;
        potential_interactions: { drug1: string; drug2: string; interaction: string }[];
        medication_overlap: Record<string, string[]>;
        combined_monitoring: string[];
        lifestyle_recommendations: string[];
    }> {
        const response = await post<{
            conditions_analyzed: string[];
            shared_risk_factors: Record<string, string[]>;
            potential_interactions: { drug1: string; drug2: string; interaction: string }[];
            medication_overlap: Record<string, string[]>;
            combined_monitoring: string[];
            lifestyle_recommendations: string[];
        }>(`${this.baseUrl}/cross-reference`, {
            condition_ids: conditionIds
        });
        return response.data;
    }

    // =====================================
    // MASTER DOCTOR AGENT
    // =====================================

    async getMasterDoctorAnalysis(patientData: {
        age?: number;
        sex?: string;
        symptoms?: string[];
        conditions?: string[];
        medications?: string[];
        allergies?: string[];
        risk_factors?: string[];
        lab_results?: Record<string, any>;
        vitals?: Record<string, any>;
    }): Promise<{ status: string; analysis: PatientAnalysis; consulted_by: string; specialist_domains: string[] }> {
        const response = await post<{ status: string; analysis: PatientAnalysis; consulted_by: string; specialist_domains: string[] }>(
            `${this.baseUrl}/master-doctor/analyze`,
            patientData
        );
        return response.data;
    }

    async getGoutAttackProtocol(data: {
        joints_affected?: number;
        fever?: boolean;
        prior_attacks?: number;
        egfr?: number;
        medications?: string[];
        uric_acid?: number;
    }): Promise<{ status: string; protocol: GoutProtocol }> {
        const response = await post<{ status: string; protocol: GoutProtocol }>(
            `${this.baseUrl}/master-doctor/gout-attack`,
            data
        );
        return response.data;
    }

    async analyzeDrugTherapy(
        drugName: string,
        patientFactors: {
            age?: number;
            egfr?: number;
            weight?: number;
            medications?: string[];
        }
    ): Promise<{ status: string; analysis: DrugAnalysis }> {
        const response = await post<{ status: string; analysis: DrugAnalysis }>(
            `${this.baseUrl}/master-doctor/drug-analysis`,
            {
                drug_name: drugName,
                ...patientFactors
            }
        );
        return response.data;
    }

    // =====================================
    // QUICK REFERENCES
    // =====================================

    async getGoutQuickReference(): Promise<{
        acute_gout: any;
        chronic_management: any;
        key_points: string[];
    }> {
        const response = await get<{
            acute_gout: any;
            chronic_management: any;
            key_points: string[];
        }>(`${this.baseUrl}/quick-reference/gout`);
        return response.data;
    }

    async getAnticoagulationQuickReference(): Promise<{
        doacs: any;
        warfarin: any;
        indications: string[];
    }> {
        const response = await get<{
            doacs: any;
            warfarin: any;
            indications: string[];
        }>(`${this.baseUrl}/quick-reference/anticoagulation`);
        return response.data;
    }

    async getSpecialtyConditions(specialty: string): Promise<{
        specialty: string;
        conditions: { id: string; name: string; symptoms: string[]; treatments_count: number }[];
    }> {
        const response = await get<{
            specialty: string;
            conditions: { id: string; name: string; symptoms: string[]; treatments_count: number }[];
        }>(`${this.baseUrl}/specialty/${specialty}`);
        return response.data;
    }
}

export const medicalKnowledge = new MedicalKnowledgeService();
export default medicalKnowledge;

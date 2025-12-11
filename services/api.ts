
import { User, Role, Case, Comment, AnonymisedPatientProfile, TreatmentOption, PatientProfile, PatientFile, DiagnosisSuggestion, AIInsights, Medication, PatientIntakeData, AIAgentStats, AIActionItem, DiagnosisSuggestionFeedback, ExtractedCaseData, SymptomAnalysisResult, AIContextualSuggestion, DoctorProfile, Certification, UnratedSuggestion } from '../types/index';
import { appEvents } from './events';

// --- CONFIGURATION ---
const API_BASE_URL = '/api'; // Base URL for backend

// Helper to get token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// --- DATA SERVICE LAYER ---
export class DataService {
    // --- User & Auth ---
    static async login(email: string, role: Role, password?: string): Promise<User | null> {
        const pwd = password || "password"; // Fallback for dev ease, but UI should promote input
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role, password: pwd })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Implicit registration fallback for demo smoothness (optional, can be removed for strict auth)
                    // If we want strict auth, we should return null or throw.
                    // return await this.register(email, role, pwd);
                    throw new Error('Login failed: Invalid credentials');
                }
                throw new Error('Login failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            return data.user;
        } catch (e) {
            console.error("Login error", e);
            throw e;
        }
    }

    static async register(email: string, role: Role, password?: string, name?: string): Promise<User> {
        const pwd = password || "password";
        const userName = name || email.split('@')[0];

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                role,
                password: pwd,
                name: userName
            })
        });
        if (!response.ok) throw new Error('Registration failed');
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        return data.user;
    }

    static async getUsers(): Promise<User[]> {
        const res = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeader() });
        return res.json();
    }

    static async getDoctorProfile(profileId: string): Promise<DoctorProfile | undefined> {
        const res = await fetch(`${API_BASE_URL}/doctors/${profileId}`, { headers: getAuthHeader() });
        return res.json();
    }

    static async updateDoctorProfile(profileId: string, updates: Partial<DoctorProfile>): Promise<DoctorProfile | undefined> {
        const res = await fetch(`${API_BASE_URL}/doctors/${profileId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(updates)
        });
        return res.json();
    }

    // --- Cases ---
    static async getCases(): Promise<Case[]> {
        const res = await fetch(`${API_BASE_URL}/cases`, { headers: getAuthHeader() });
        return res.json();
    }

    static async getCaseById(id: string): Promise<Case | undefined> {
        const res = await fetch(`${API_BASE_URL}/cases/${id}`, { headers: getAuthHeader() });
        if (res.status === 404) return undefined;
        return res.json();
    }

    static async createCase(caseData: Omit<Case, 'id' | 'createdAt' | 'status' | 'files'>): Promise<Case> {
        const res = await fetch(`${API_BASE_URL}/cases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(caseData)
        });
        return res.json();
    }

    static async updateCase(caseId: string, updates: Partial<Case>): Promise<void> {
        await fetch(`${API_BASE_URL}/cases/${caseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(updates)
        });
    }

    static async updateCaseStatus(caseId: string, newStatus: Case['status']): Promise<void> {
        await fetch(`${API_BASE_URL}/cases/${caseId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ status: newStatus })
        });
    }

    static async assignSpecialist(caseId: string, specialistId: string): Promise<void> {
        await fetch(`${API_BASE_URL}/cases/${caseId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ specialistId })
        });
    }

    // --- Comments ---
    static async getAllComments(): Promise<Comment[]> {
        const res = await fetch(`${API_BASE_URL}/comments`, { headers: getAuthHeader() });
        return res.json();
    }

    static async getCaseComments(caseId: string): Promise<Comment[]> {
        const res = await fetch(`${API_BASE_URL}/cases/${caseId}/comments`, { headers: getAuthHeader() });
        return res.json();
    }

    static async addComment(comment: Comment): Promise<void> {
        await fetch(`${API_BASE_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(comment)
        });
    }

    // --- Dashboard ---
    static async getDashboardStats(userId: string): Promise<{ overdue: number, updates: number, assignments: number }> {
        const res = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers: getAuthHeader() });
        return res.json();
    }

    static async getRecentActivity(): Promise<Comment[]> {
        const res = await fetch(`${API_BASE_URL}/dashboard/activity`, { headers: getAuthHeader() });
        return res.json();
    }

    // --- Patients ---
    static async getPatientProfile(id: string): Promise<PatientProfile | undefined> {
        const res = await fetch(`${API_BASE_URL}/patients/${id}`, { headers: getAuthHeader() });
        return res.json();
    }

    static async addPatientMedication(profileId: string, medication: Medication): Promise<void> {
        await fetch(`${API_BASE_URL}/patients/${profileId}/medications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(medication)
        });
    }

    static async addPatientFile(profileId: string, file: PatientFile): Promise<void> {
        await fetch(`${API_BASE_URL}/patients/${profileId}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(file)
        });
    }

    static async searchPatients(query: string): Promise<PatientProfile[]> {
        const res = await fetch(`${API_BASE_URL}/patients/search?q=${encodeURIComponent(query)}`, { headers: getAuthHeader() });
        return res.json();
    }

    static async addPatientIntake(data: Omit<PatientIntakeData, 'id'>): Promise<PatientIntakeData> {
        const res = await fetch(`${API_BASE_URL}/patients/intake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data)
        });
        return res.json();
    }
}

// --- EXPORTS FOR BACKWARD COMPATIBILITY (DEPRECATED) ---
export const mockUsers: User[] = [];
export const mockCases: Case[] = [];
export const mockComments: Comment[] = [];

// --- HELPER FUNCTIONS (Adapters for backward compatibility during refactor) ---

export const getDoctorProfileById = DataService.getDoctorProfile;
export const updateDoctorProfile = DataService.updateDoctorProfile;
export const updateCaseStatus = DataService.updateCaseStatus;
export const assignSpecialist = DataService.assignSpecialist;

// Wrappers to maintain old sync signature if needed, but preferably usage should switch to async await
export const addCaseComment = DataService.addComment;
export const getCaseComments = DataService.getCaseComments;

export const getPatientProfileById = DataService.getPatientProfile;
export const searchPatients = DataService.searchPatients;
export const addPatientIntakeData = DataService.addPatientIntake;
export const addPatientMedication = DataService.addPatientMedication;
export const addPatientFile = DataService.addPatientFile;

export const getAIActionItems = async (userId: string): Promise<AIActionItem[]> => {
    // TODO: Implement backend endpoint for action items
    return [];
};

// --- PRESENCE SIMULATION ---
// Disabled for now as it relies on mock data
export const getActiveUsersForCase = (caseId: string): User[] => {
    return [];
};

export const joinCase = (caseId: string, userId: string): void => { };
export const leaveCase = (caseId: string, userId: string): void => { };
export const startCaseDiscussionSimulation = (caseId: string, user: User) => { };
export const stopCaseDiscussionSimulation = () => { };

// --- GEMINI AI SERVICE ---

export class GeminiService {
    static async getAIAgentStats(userId: string): Promise<AIAgentStats> {
        // TODO: Implement backend
        return {
            id: 'agent-1',
            userId: userId,
            accuracy: 0.95,
            personalizationLevel: 0.8,
            casesAnalyzed: 10,
            feedbackProvided: 5
        };
    }

    static async getRecentUnratedSuggestion(userId: string): Promise<UnratedSuggestion | null> {
        return null;
    }

    static async submitAIFeedback(caseId: string, suggestionName: string, feedback: DiagnosisSuggestionFeedback): Promise<void> {
        return Promise.resolve();
    }

    static async getCaseInsights(caseData: Case, userId: string = 'anonymous'): Promise<AIInsights> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/insights?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify(caseData)
            });
            return await response.json();
        } catch (error) {
            console.error("AI Service Error:", error);
            return { diagnosisConfidence: 0.0, patientRisks: ["API Error"], keySymptoms: [] };
        }
    }

    static async getClinicalGuidelines(diagnosis: string): Promise<string> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/clinical_guidelines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ text: diagnosis })
            });
            const data = await response.json();
            return data.response;
        } catch (error) {
            return "Service unavailable. Please check your connection.";
        }
    }

    static async getAIChatResponse(caseData: Case, history: any[], newMessage: string, userId: string = 'anonymous', userRole: string = 'User'): Promise<string> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                    history: history,
                    message: newMessage,
                    context: `Medical Assistant for case: ${caseData.title}. Be concise.`,
                    userId: userId,
                    userRole: userRole
                })
            });
            const data = await response.json();
            return data.response;
        } catch (error) {
            return "AI Service unavailable.";
        }
    }

    static async explainToPatient(query: string, profile: PatientProfile): Promise<string> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/explain_patient`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ query, patient_name: profile.name })
            });
            const data = await response.json();
            return data.response;
        } catch (error) {
            return "Service unavailable.";
        }
    }

    static async getGeneralChatResponse(history: any[], newMessage: string, userId: string = 'anonymous'): Promise<string> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/general_chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ history, message: newMessage, userId })
            });
            const data = await response.json();
            return data.response;
        } catch (error) {
            return "Service unavailable.";
        }
    }

    static async extractCaseDetailsFromTranscript(transcript: string): Promise<ExtractedCaseData> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/extract_case`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ text: transcript })
            });
            return await response.json();
        } catch (e) {
            return { complaint: transcript, history: "", findings: "", diagnosis: "", missing_information: ["Extraction failed"] };
        }
    }

    static async augmentCaseDetailsFromHistory(data: ExtractedCaseData, patient: PatientProfile): Promise<AIContextualSuggestion[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/augment_case`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ extracted_data: data, baseline_illnesses: patient.baselineIllnesses })
            });
            return await response.json();
        } catch (e) { return []; }
    }

    static async analyzeSymptoms(input: string): Promise<SymptomAnalysisResult[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/analyze_symptoms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ text: input })
            });
            return await response.json();
        } catch (e) { throw new Error("Analysis failed."); }
    }

    static async analyzeImage(image: { data: string, mimeType: string }, prompt: string): Promise<string> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/analyze_image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ image_data: image.data, mime_type: image.mimeType, prompt })
            });
            const data = await response.json();
            return data.response;
        } catch (e) { throw new Error("Image analysis failed."); }
    }

    static async searchICD10Codes(query: string): Promise<{ code: string; description: string }[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/search_icd10`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ text: query })
            });
            return await response.json();
        } catch (error) { return []; }
    }

    static async formAssist(transcript: string, formSchema: any, currentData: any): Promise<{ updates: any, response: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/form_assist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                    transcript,
                    form_schema: formSchema,
                    current_data: currentData
                })
            });
            return await response.json();
        } catch (error) {
            console.error("Form Assist Error:", error);
            return { updates: {}, response: "Sorry, I couldn't process that request." };
        }
    }
}


import { User, Role, Case, Comment, AnonymisedPatientProfile, TreatmentOption, PatientProfile, PatientFile, DiagnosisSuggestion, AIInsights, Medication, PatientIntakeData, AIAgentStats, AIActionItem, DiagnosisSuggestionFeedback, ExtractedCaseData, SymptomAnalysisResult, AIContextualSuggestion, DoctorProfile, Certification, UnratedSuggestion, MedicalRecord, UploadedFile, LabResult } from '../types/index';
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
                const errData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errData.detail || 'Login failed');
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
        if (!response.ok) {
            const errData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errData.detail || 'Registration failed');
        }
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        return data.user;
    }

    static async loginWithGoogle(accessToken: string, role: Role): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken, role })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errData.detail || 'Google login failed');
        }
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
        if (res.status === 404) return undefined;
        if (!res.ok) throw new Error("Failed to fetch doctor profile");
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

    static async addCaseFile(caseId: string, file: UploadedFile): Promise<UploadedFile> {
        const res = await fetch(`${API_BASE_URL}/cases/${caseId}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(file)
        });
        return res.json();
    }

    static async addLabResult(caseId: string, result: LabResult): Promise<LabResult> {
        const res = await fetch(`${API_BASE_URL}/cases/${caseId}/results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(result)
        });
        return res.json();
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
        if (res.status === 404) return undefined;
        if (!res.ok) throw new Error("Failed to fetch patient profile");
        return res.json();
    }

    static async updatePatientProfile(id: string, update: any): Promise<PatientProfile> {
        const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(update)
        });
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

    static async getPatientRecords(patientId: string): Promise<MedicalRecord[]> {
        const res = await fetch(`${API_BASE_URL}/patients/${patientId}/records`, { headers: getAuthHeader() });
        return res.json();
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

    // --- Admin ---
    // getUsers is already defined above in User & Auth section

    static async deleteUser(userId: string): Promise<void> {
        await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
    }

    static async getAdminStats(): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/dashboard/admin/stats`, { headers: getAuthHeader() });
        return res.json();
    }

    static async getAdminConfig(): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/dashboard/admin/config`, { headers: getAuthHeader() });
        return res.json();
    }

    static async updateAdminConfig(features: any): Promise<void> {
        await fetch(`${API_BASE_URL}/dashboard/admin/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ features })
        });
    }

    static async getSystemLogs(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/dashboard/admin/logs`, { headers: getAuthHeader() });
        return res.json();
    }

    // --- Billing ---
    static async getTransactions(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/billing/admin/transactions`, { headers: getAuthHeader() });
        return res.json();
    }

    static async getCostEstimate(caseId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/${caseId}`, { headers: getAuthHeader() });
        if (res.status === 404) return null;
        return res.json();
    }

    static async generateCostEstimate(caseId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/estimate/${caseId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        return res.json();
    }

    static async uploadFile(file: File, caseId?: string): Promise<{ url: string, name: string, type: string }> {
        const formData = new FormData();
        formData.append('file', file);
        if (caseId) {
            formData.append('case_id', caseId);
        }

        const res = await fetch(`${API_BASE_URL}/files/upload`, {
            method: 'POST',
            headers: { ...getAuthHeader() },
            body: formData
        });

        if (!res.ok) throw new Error("File upload failed");
        return res.json();
    }
    static async approveCostEstimate(caseId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/estimate/${caseId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        return res.json();
    }

    static async rejectCostEstimate(caseId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/estimate/${caseId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        return res.json();
    }

    static async getPendingEstimates(role: string): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/billing/admin/estimates/pending?role=${role}`, { headers: getAuthHeader() });
        return res.json();
    }

    static async createPayPalOrder(amount: number, currency: string = "USD"): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/paypal/create-order?amount=${amount}&currency=${currency}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Create PayPal Order Failed");
        return res.json();
    }

    static async capturePayPalOrder(orderId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/paypal/capture-order?order_id=${orderId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Capture PayPal Order Failed");
        return res.json();
    }

    static async createStripePaymentIntent(amount: number, currency: string = "USD"): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/stripe/create-payment-intent?amount=${amount}&currency=${currency}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Create Stripe Intent Failed");
        return res.json();
    }

    static async verifyStripePayment(intentId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/stripe/verify-payment?intent_id=${intentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Verify Stripe Payment Failed");
        return res.json();
    }
    // --- Token Ecosystem ---
    static async getTokenBalance(): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/tokens/balance`, {
            headers: getAuthHeader()
        });
        return res.json();
    }

    static async createResearchGroup(name: string, topic: string, members: string[]): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/tokens/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ name, topic, members })
        });
        if (!res.ok) throw new Error("Failed to create group");
        return res.json();
    }

    static async contributeToResearch(groupId: string, dataType: string, dataId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/tokens/contribute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ group_id: groupId, data_type: dataType, data_id: dataId })
        });
        if (!res.ok) throw new Error("Contribution failed");
        return res.json();
    }

    static async getResearchGroups(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/tokens/groups`, { headers: getAuthHeader() });
        return res.json();
    }

    static async joinResearchGroup(groupId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/tokens/groups/${groupId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Failed to join group");
        return res.json();
    }

    static async createStripeConnectAccount(email?: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/stripe/connect-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error("Failed to create connect account");
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
        try {
            const res = await fetch(`${API_BASE_URL}/ai/stats/${userId}`, { headers: getAuthHeader() });
            return res.json();
        } catch (e) {
            console.error("Failed to fetch AI stats", e);
            // Fallback mock
            return {
                id: 'agent-1',
                userId: userId,
                accuracy: 0.85,
                personalizationLevel: 0.6,
                casesAnalyzed: 0,
                feedbackProvided: 0
            };
        }
    }

    static async getRecentUnratedSuggestion(userId: string): Promise<UnratedSuggestion | null> {
        try {
            const res = await fetch(`${API_BASE_URL}/ai/unrated/${userId}`, { headers: getAuthHeader() });
            if (res.status === 404) return null;
            return res.json();
        } catch (e) { return null; }
    }

    static async submitAIFeedback(caseId: string, suggestionName: string, feedback: DiagnosisSuggestionFeedback): Promise<void> {
        await fetch(`${API_BASE_URL}/ai/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({
                case_id: caseId,
                suggestion_name: suggestionName,
                rating: feedback.rating,
                comments: feedback.comments
            })
        });
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
                    context: `Medical Assistant for case: ${caseData.title}. Be concise.`
                })
            });
            const data = await response.json();
            return data.response;
        } catch (error) {
            return "AI Service unavailable.";
        }
    }

    static async explainToPatient(diagnosis: string, plan: string, patientAge: number): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/explain_patient`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ diagnosis, plan, patient_age: patientAge })
            });
            return await response.json();
        } catch (error) {
            return { explanation: "Service unavailable." };
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

    static async analyzeFile(file: File, type: string = "general", prompt?: string): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (prompt) {
            formData.append('prompt', prompt);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/ai/analyze_file`, {
                method: 'POST',
                headers: { ...getAuthHeader() }, // No Content-Type for FormData
                body: formData
            });
            if (!response.ok) throw new Error("Analysis failed");
            return await response.json();
        } catch (e) { throw new Error("File analysis failed."); }
    }

    static async analyzeImage(file: File, type: string = "general", prompt?: string): Promise<any> {
        return this.analyzeFile(file, type, prompt);
    }

    static async transcribeAudio(file: Blob): Promise<{ transcript: string }> {
        const formData = new FormData();
        formData.append('file', file, 'audio.wav');

        try {
            const response = await fetch(`${API_BASE_URL}/ai/transcribe`, {
                method: 'POST',
                headers: { ...getAuthHeader() },
                body: formData
            });
            return await response.json();
        } catch (e) { return { transcript: "" }; }
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

    static async generateDailyQuestions(profileSummary: string): Promise<{ questions: string[] }> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/generate_daily_questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ profile_summary: profileSummary })
            });
            return await response.json();
        } catch (error) {
            return { questions: [] };
        }
    }

    static async getPatientReport(caseId: string): Promise<{ report: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/report/patient/${caseId}`, { headers: getAuthHeader() });
            return await response.json();
        } catch (e) { return { report: "Service unavailable" }; }
    }

    static async getClinicalPlan(caseId: string): Promise<{ plan: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/plan/${caseId}`, { headers: getAuthHeader() });
            return await response.json();
        } catch (e) { return { plan: "Service unavailable" }; }
    }

    static async uploadPatientRecord(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/ai/patient/upload_record`, {
                method: 'POST',
                headers: { ...getAuthHeader() },
                body: formData
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Upload failed");
            }
            return await response.json();
        } catch (e: any) { throw new Error(e.message || "File upload failed."); }
    }

    static async analyzeRecord(recordId: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/patient/analyze_record/${recordId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Analysis failed");
            }
            return await response.json();
        } catch (e: any) { throw new Error(e.message || "Analysis request failed."); }
    }


    static async chatWithPatientAgent(history: any[], newMessage: string): Promise<string> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/patient/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ history, message: newMessage })
            });
            const data = await response.json();
            return data.response;
        } catch (error) {
            return "Patient Agent unavailable.";
        }
    }

    // -- NEW: Agent Orchestrator Chat --
    static async agentChat(message: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/agent_chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ message })
            });
            return await response.json();
        } catch (e) {
            console.error("Agent chat failed", e);
            throw e;
        }
    }

    static async executeAgentCapability(capability: string, params: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/agent_task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ task: capability, payload: params })
            });
            if (!response.ok) throw new Error("Agent task failed");
            return await response.json();
        } catch (e) {
            console.error("Execute Agent Capability Failed", e);
            throw e;
        }
    }

    static async seedAgentCapabilities(): Promise<void> {
        await fetch(`${API_BASE_URL}/bus/seed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
    }

    static async findAgentCapability(query: string): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/bus/find`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ query })
        });
        return res.json();
    }


    static async updateUserConsents(gdpr: boolean, share: boolean, marketing: boolean): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/users/me/consents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ gdpr_consent: gdpr, data_sharing_consent: share, marketing_consent: marketing })
        });
        if (!res.ok) throw new Error("Failed to update consents");
        return res.json();
    }

    // --- Billing Config ---
    static async getBillingConfig(): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/config`, { headers: getAuthHeader() });
        return res.json();
    }

    static async updateBillingConfig(config: any): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(config)
        });
        if (!res.ok) throw new Error("Failed to update billing config");
        return res.json();
    }


}


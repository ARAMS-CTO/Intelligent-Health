
import { GoogleGenAI, Type } from "@google/genai";
import { User, Role, Case, Comment, AnonymisedPatientProfile, TreatmentOption, PatientProfile, PatientFile, DiagnosisSuggestion, AIInsights, Medication, PatientIntakeData, AIAgentStats, AIActionItem, DiagnosisSuggestionFeedback, ExtractedCaseData, SymptomAnalysisResult, AIContextualSuggestion, DoctorProfile, Certification, UnratedSuggestion } from '../types/index';
import { appEvents } from './events';

// --- CONFIGURATION ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.warn("Missing API_KEY environment variable. AI features will not function.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY || "DUMMY_KEY" });

// TOGGLE THIS FOR REAL BACKEND INTEGRATION
const USE_MOCK_DATA = true; 
const API_BASE_URL = '/api'; // Base URL for your future backend

// --- MOCK DATA STORE (Internal use only) ---
const internalMockUsers: User[] = [
    { id: 'user-doc-1', name: 'Dr. Evelyn Reed', email: 'e.reed@hospital.com', role: Role.Doctor, level: 5, credits: 1250, doctorProfileId: 'doc-profile-1' },
    { id: 'user-doc-google', name: 'Dr. Hamidreza Sanati', email: 'h.sanati@google.com', role: Role.Doctor, level: 9, credits: 4000, doctorProfileId: 'doc-profile-sanati' },
    { id: 'user-spec-1', name: 'Dr. Kenji Tanaka', email: 'k.tanaka@hospital.com', role: Role.Specialist, level: 8, credits: 3400 },
    { id: 'user-rad-1', name: 'Dr. Anya Sharma', email: 'a.sharma@hospital.com', role: Role.Radiologist, level: 6, credits: 1500 },
    { id: 'user-nurse-1', name: 'Nurse David Chen', email: 'd.chen@hospital.com', role: Role.Nurse, level: 4, credits: 800 },
    { id: 'user-patient-1', name: 'John Doe', email: 'j.doe@email.com', role: Role.Patient, level: 2, credits: 150, patientProfileId: 'patient-1' },
    { id: 'user-patient-aram', name: 'Aram Ghannadzadeh', email: 'a.ghannadzadeh@email.com', role: Role.Patient, level: 1, credits: 100, patientProfileId: 'patient-aram-1' },
    { id: 'user-admin-1', name: 'Sarah Jenkins', email: 's.jenkins@hospital.com', role: Role.Admin, level: 10, credits: 99999 },
    { id: 'user-ai-1', name: 'Case Analysis AI', email: 'ai@hospital.com', role: Role.AIEngineer, level: 99, credits: Infinity },
];

let internalMockDoctorProfiles: DoctorProfile[] = [
    {
        id: 'doc-profile-1',
        userId: 'user-doc-1',
        specialty: 'Cardiology',
        yearsOfExperience: 12,
        bio: 'Dr. Evelyn Reed is a board-certified cardiologist with over a decade of experience in managing complex cardiovascular conditions.',
        certifications: [
            { id: 'cert-1', name: 'Board Certified in Cardiology', issuingBody: 'American Board of Internal Medicine', year: 2012, url: '#' },
            { id: 'cert-2', name: 'Advanced Cardiac Life Support (ACLS)', issuingBody: 'American Heart Association', year: 2023, url: '#' },
        ],
        profilePictureUrl: '', 
    },
    {
        id: 'doc-profile-sanati',
        userId: 'user-doc-google',
        specialty: 'Cardiology',
        yearsOfExperience: 18,
        bio: 'Dr. Hamidreza Sanati is a distinguished Cardiologist at Fakeeh University Hospital in Dubai, UAE. He is a leader in interventional cardiology.',
        certifications: [
            { id: 'cert-3', name: 'Fellow of the American College of Cardiology (FACC)', issuingBody: 'American College of Cardiology', year: 2008, url: '#' },
            { id: 'cert-4', name: 'Board Certified in Interventional Cardiology', issuingBody: 'American Board of Internal Medicine', year: 2006, url: '#' },
        ],
        profilePictureUrl: 'https://i.pravatar.cc/150?u=doc-profile-sanati',
    }
];

const patientProfile1: AnonymisedPatientProfile = { age: 68, sex: 'Male', comorbidities: ['Hypertension', 'Type 2 Diabetes'] };
const patientProfile2: AnonymisedPatientProfile = { age: 41, sex: 'Male', comorbidities: ['Mildly elevated cholesterol'] };

let internalMockCases: Case[] = [
    {
        id: 'case-1', title: 'Acute DVT in Left Leg', creatorId: 'user-doc-1', patientId: 'patient-1', createdAt: '2024-07-28T10:00:00Z',
        patientProfile: patientProfile1,
        complaint: 'Patient presents with a swollen, painful, and reddened left calf for the past 3 days.',
        history: 'Recent long-haul flight (14 hours). No prior history of VTE. Takes Metformin and Lisinopril.',
        findings: 'Positive Homans\' sign, significant calf tenderness. Wells score: 3. D-dimer elevated.',
        diagnosis: 'Confirmed Acute Deep Vein Thrombosis (DVT) of the left lower limb, provoked by recent travel.',
        icd10Code: 'I80.2',
        tags: ['DVT', 'Vascular', 'Emergency', 'Ultrasound'],
        files: [
            { id: 'file-1', name: 'duplex_scan.pdf', type: 'Doppler Scan', url: '#' },
            { id: 'file-lab-1', name: 'cbc_coag_profile.pdf', type: 'Lab Report', url: '#' }
        ],
        labResults: [
            { test: 'D-dimer', value: '2.5', unit: 'μg/mL', referenceRange: '< 0.5', interpretation: 'Abnormal-High' },
            { test: 'Hemoglobin', value: '14.2', unit: 'g/dL', referenceRange: '13.5-17.5', interpretation: 'Normal' },
            { test: 'Platelets', value: '250', unit: 'x10^9/L', referenceRange: '150-450', interpretation: 'Normal' },
            { test: 'INR', value: '1.1', unit: '', referenceRange: '0.8-1.2', interpretation: 'Normal' },
        ],
        status: 'Under Review',
    },
    {
        id: 'case-2', title: 'Acute Bilateral Pulmonary Embolism', creatorId: 'user-doc-google', patientId: 'patient-aram-1', createdAt: '2024-07-29T09:00:00Z',
        patientProfile: patientProfile2,
        complaint: 'A 41-year-old male presented to the Emergency Department with a one-hour history of acute, severe shortness of breath.',
        history: 'No significant past medical history. No recent surgeries or long-distance travel. Reports a more sedentary lifestyle recently.',
        findings: 'On arrival: Tachycardic (115 bpm), Tachypneic (24/min), SpO2 92% on room air. Lungs clear on auscultation. D-dimer markedly elevated. ECG shows sinus tachycardia with S1Q3T3 pattern.',
        diagnosis: 'High clinical suspicion for acute Pulmonary Embolism (PE). Patient started on therapeutic anticoagulation.',
        icd10Code: 'I26.9',
        tags: ['PE', 'Cardiology', 'Pulmonology', 'CTPA', 'Emergency'],
        files: [{ id: 'file-2', name: 'ctpa_report.pdf', type: 'CT', url: '#' }, { id: 'file-3', name: 'ecg.jpg', type: 'ECG', url: '#' }],
        status: 'Open',
        specialistId: 'user-spec-1', 
        specialistAssignmentTimestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), 
    }
];

let internalMockComments: Comment[] = [
    { id: 'comment-1', caseId: 'case-1', userId: 'user-spec-1', userName: 'Dr. Kenji Tanaka', userRole: Role.Specialist, timestamp: '2024-07-28T11:00:00Z', text: 'Classic presentation. Given the Wells score and D-dimer, I agree with proceeding to duplex ultrasound.' },
    { id: 'comment-2', caseId: 'case-1', userId: 'user-nurse-1', userName: 'Nurse David Chen', userRole: Role.Nurse, timestamp: '2024-07-28T11:15:00Z', text: 'Patient is comfortable and has been advised to keep the leg elevated.' },
    { id: 'comment-3', caseId: 'case-2', userId: 'user-doc-1', userName: 'Dr. Evelyn Reed', userRole: Role.Doctor, timestamp: '2024-07-29T09:30:00Z', text: "High suspicion for PE based on presentation and vitals. D-dimer is back and it's > 4.0. Starting patient on a heparin drip now." },
];

const mockPatientFiles1: PatientFile[] = [
    { id: 'pfile-1', name: 'Complete Blood Count - Jan 2024', type: 'Lab Test', uploadDate: '2024-07-20', url: '#' },
    { id: 'pfile-2', name: 'Chest X-Ray Report - Dec 2023', type: 'Radiology Report', uploadDate: '2024-07-20', url: '#' },
    { id: 'pfile-3', name: 'Discharge Summary (Knee Surgery) - 2022', type: 'Discharge Summary', uploadDate: '2024-07-20', url: '#' },
];

const mockMedications1: Medication[] = [
    { id: 'med-1', name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
    { id: 'med-2', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily with meals' },
];

const internalMockPatientProfiles: PatientProfile[] = [
    {
        id: 'patient-1',
        identifier: 'MRN-123456789',
        name: 'John Doe',
        personalDetails: { dob: '1956-05-15', bloodType: 'O+' },
        allergies: ['Penicillin'],
        baselineIllnesses: ['Hypertension', 'Type 2 Diabetes', 'Seasonal Allergies'],
        medications: mockMedications1,
        files: mockPatientFiles1,
        visitHistory: [
            { id: 'visit-1', date: '2024-06-15', doctor: 'Dr. Miller', reason: 'Annual Checkup', summary: 'Routine checkup, vitals stable.' },
            { id: 'visit-2', date: '2024-02-10', doctor: 'Dr. Smith', reason: 'Flu-like symptoms', summary: 'Diagnosed with seasonal influenza.' }
        ]
    },
    {
        id: 'patient-aram-1',
        identifier: 'MRN-AG-1984',
        name: 'Aram Ghannadzadeh',
        personalDetails: { dob: '1984-05-04', bloodType: 'A+' },
        allergies: ['None known'],
        baselineIllnesses: ['Mildly elevated cholesterol'],
        medications: [
            { id: 'med-5', name: 'Atorvastatin', dosage: '10mg', frequency: 'Once daily' }
        ],
        files: [],
        visitHistory: [
            { id: 'visit-3', date: '2024-07-29', doctor: 'ER Physician', reason: 'Shortness of breath', summary: 'Initial presentation leading to PE diagnosis.' },
        ]
    }
];

let mockAIAgentStats: AIAgentStats = {
    id: 'agent-1',
    userId: 'user-doc-1',
    accuracy: 0.93,
    personalizationLevel: 0.78,
    casesAnalyzed: 42,
    feedbackProvided: 15,
};

let mockUnratedSuggestionForDashboard: UnratedSuggestion | null = {
    caseId: 'case-2',
    caseTitle: 'Acute Bilateral Pulmonary Embolism',
    suggestion: {
        name: 'Myocardial Infarction',
        probability: 0.15,
        rationale: "Chest pain and SOB are classic for MI. However, the pleuritic nature of the pain and S1Q3T3 are more specific for PE.",
        supportingFindings: ['Shortness of breath', 'Chest pain']
    }
};

let mockAIActionItems: AIActionItem[] = [
    { caseId: 'case-2', caseTitle: 'Acute Bilateral Pulmonary Embolism', patientInfo: '41 y/o Male', suggestionName: 'Pulmonary Embolism', confidence: 0.92 },
    { caseId: 'case-1', caseTitle: 'Acute DVT in Left Leg', patientInfo: '68 y/o Male', suggestionName: 'Cellulitis', confidence: 0.10 }
];

const internalMockIntakeData: PatientIntakeData[] = [];

// --- DATA SERVICE LAYER ---
// This class handles switching between mock data and real API calls

export class DataService {
    // --- User & Auth ---
    static async login(email: string, role: Role): Promise<User | null> {
        if (USE_MOCK_DATA) {
             await new Promise(r => setTimeout(r, 500));
             if (email === 'h.sanati@google.com') {
                 const googleUser = internalMockUsers.find(u => u.email === 'h.sanati@google.com');
                 return googleUser || null;
             }
             const foundUser = internalMockUsers.find(u => u.role === role);
             if (foundUser) {
                 return { ...foundUser, email, name: foundUser.name || email.split('@')[0] };
             }
             return {
                 id: `user-${Date.now()}`,
                 name: email.split('@')[0],
                 email: email,
                 role: role,
                 level: 1,
                 credits: 100,
             };
        } else {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role })
            });
            if (!response.ok) throw new Error('Login failed');
            return response.json();
        }
    }

    static async getUsers(): Promise<User[]> {
        if (USE_MOCK_DATA) {
             await new Promise(r => setTimeout(r, 300));
             return internalMockUsers;
        }
        const res = await fetch(`${API_BASE_URL}/users`);
        return res.json();
    }

    static async getDoctorProfile(profileId: string): Promise<DoctorProfile | undefined> {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 500));
            return internalMockDoctorProfiles.find(p => p.id === profileId);
        }
        const res = await fetch(`${API_BASE_URL}/doctors/${profileId}`);
        return res.json();
    }

    static async updateDoctorProfile(profileId: string, updates: Partial<DoctorProfile>): Promise<DoctorProfile | undefined> {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 800));
             const index = internalMockDoctorProfiles.findIndex(p => p.id === profileId);
            if (index !== -1) {
                internalMockDoctorProfiles[index] = { ...internalMockDoctorProfiles[index], ...updates };
                return internalMockDoctorProfiles[index];
            }
            return undefined;
        }
         const res = await fetch(`${API_BASE_URL}/doctors/${profileId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return res.json();
    }

    // --- Cases ---
    static async getCases(): Promise<Case[]> {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 600)); 
            return [...internalMockCases];
        }
        const res = await fetch(`${API_BASE_URL}/cases`);
        return res.json();
    }

    static async getCaseById(id: string): Promise<Case | undefined> {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 400));
            return internalMockCases.find(c => c.id === id);
        }
        const res = await fetch(`${API_BASE_URL}/cases/${id}`);
        if (res.status === 404) return undefined;
        return res.json();
    }

    static async createCase(caseData: Omit<Case, 'id' | 'createdAt' | 'status' | 'files'>): Promise<Case> {
         if (USE_MOCK_DATA) {
            const newCase: Case = {
                id: `case-${Date.now()}`,
                createdAt: new Date().toISOString(),
                status: 'Open',
                files: [],
                ...caseData
            };
            internalMockCases.unshift(newCase);
            return newCase;
        }
        const res = await fetch(`${API_BASE_URL}/cases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(caseData)
        });
        return res.json();
    }

    static async updateCase(caseId: string, updates: Partial<Case>): Promise<void> {
        if (USE_MOCK_DATA) {
            const idx = internalMockCases.findIndex(c => c.id === caseId);
            if (idx !== -1) {
                internalMockCases[idx] = { ...internalMockCases[idx], ...updates };
            }
            return;
        }
         await fetch(`${API_BASE_URL}/cases/${caseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    }
    
    static async updateCaseStatus(caseId: string, newStatus: Case['status']): Promise<void> {
        if (USE_MOCK_DATA) {
            const caseIndex = internalMockCases.findIndex(c => c.id === caseId);
            if (caseIndex !== -1) {
                const oldStatus = internalMockCases[caseIndex].status;
                internalMockCases[caseIndex].status = newStatus;
                appEvents.emit('notification', {
                    type: 'info',
                    title: 'Case Status Updated',
                    message: `Status for "${internalMockCases[caseIndex].title}" changed from ${oldStatus} to ${newStatus}.`,
                    link: `/#/case/${caseId}`
                });
            }
            return;
        }
        await fetch(`${API_BASE_URL}/cases/${caseId}/status`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }) 
        });
    }

    static async assignSpecialist(caseId: string, specialistId: string): Promise<void> {
        if (USE_MOCK_DATA) {
            const caseToUpdate = internalMockCases.find(c => c.id === caseId);
            const specialist = internalMockUsers.find(u => u.id === specialistId);
            if (caseToUpdate && specialist) {
                caseToUpdate.specialistId = specialistId;
                caseToUpdate.specialistAssignmentTimestamp = new Date().toISOString();
                 appEvents.emit('notification', {
                    type: 'success',
                    title: 'Specialist Assigned',
                    message: `${specialist.name} has been assigned to "${caseToUpdate.title}".`,
                    link: `/#/case/${caseId}`
                });
            }
            return;
        }
        await fetch(`${API_BASE_URL}/cases/${caseId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ specialistId })
        });
    }

    // --- Comments ---
    static async getAllComments(): Promise<Comment[]> {
        if (USE_MOCK_DATA) {
             await new Promise(r => setTimeout(r, 300));
             return internalMockComments;
        }
         const res = await fetch(`${API_BASE_URL}/comments`);
         return res.json();
    }

    static async getCaseComments(caseId: string): Promise<Comment[]> {
         if (USE_MOCK_DATA) {
             // await new Promise(r => setTimeout(r, 200)); 
             return internalMockComments
                .filter(c => c.caseId === caseId)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
         }
         const res = await fetch(`${API_BASE_URL}/cases/${caseId}/comments`);
         return res.json();
    }

    static async addComment(comment: Comment): Promise<void> {
        if (USE_MOCK_DATA) {
            internalMockComments.push(comment);
            appEvents.emit('notification', {
                type: 'info',
                title: `New Comment`,
                message: `${comment.userName}: ${comment.text.substring(0, 50)}...`,
                link: `/#/case/${comment.caseId}`
            });
            return;
        }
        await fetch(`${API_BASE_URL}/comments`, {
            method: 'POST',
             headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(comment)
        });
    }

    // --- Dashboard ---
    static async getDashboardStats(userId: string): Promise<{ overdue: number, updates: number, assignments: number }> {
        if (USE_MOCK_DATA) {
            await new Promise(r => setTimeout(r, 400));
            const now = new Date();
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

            const overdue = internalMockCases.filter(c =>
                (c.status === 'Open' || c.status === 'Under Review') &&
                new Date(c.createdAt) < threeDaysAgo
            ).length;

            const updates = internalMockComments.filter(c =>
                new Date(c.timestamp) > twentyFourHoursAgo
            ).length;

            const assignments = internalMockCases.filter(c =>
                c.specialistId === userId &&
                c.specialistAssignmentTimestamp &&
                new Date(c.specialistAssignmentTimestamp) > twentyFourHoursAgo
            ).length;
            
            return { overdue, updates, assignments };
        }
        const res = await fetch(`${API_BASE_URL}/dashboard/stats`);
        return res.json();
    }

    static async getRecentActivity(): Promise<Comment[]> {
        if (USE_MOCK_DATA) {
             await new Promise(r => setTimeout(r, 300));
             return internalMockComments
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 5);
        }
        const res = await fetch(`${API_BASE_URL}/dashboard/activity`);
        return res.json();
    }

    // --- Patients ---
    static async getPatientProfile(id: string): Promise<PatientProfile | undefined> {
        if (USE_MOCK_DATA) {
             await new Promise(r => setTimeout(r, 400));
            return internalMockPatientProfiles.find(p => p.id === id);
        }
        const res = await fetch(`${API_BASE_URL}/patients/${id}`);
        return res.json();
    }

    static async addPatientMedication(profileId: string, medication: Medication): Promise<void> {
        if (USE_MOCK_DATA) {
             await new Promise(r => setTimeout(r, 300));
             const profile = internalMockPatientProfiles.find(p => p.id === profileId);
             if (profile) profile.medications.push(medication);
             return;
        }
        await fetch(`${API_BASE_URL}/patients/${profileId}/medications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(medication)
        });
    }

    static async addPatientFile(profileId: string, file: PatientFile): Promise<void> {
        if (USE_MOCK_DATA) {
             await new Promise(r => setTimeout(r, 300));
             const profile = internalMockPatientProfiles.find(p => p.id === profileId);
             if (profile) profile.files.push(file);
             return;
        }
         await fetch(`${API_BASE_URL}/patients/${profileId}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(file)
        });
    }

     static async searchPatients(query: string): Promise<PatientProfile[]> {
        if (USE_MOCK_DATA) {
             await new Promise(r => setTimeout(r, 300));
             if (!query) return [];
             return internalMockPatientProfiles.filter(p => 
                p.name.toLowerCase().includes(query.toLowerCase()) || 
                p.identifier?.toLowerCase().includes(query.toLowerCase())
            );
        }
        const res = await fetch(`${API_BASE_URL}/patients/search?q=${encodeURIComponent(query)}`);
        return res.json();
    }

    static async addPatientIntake(data: Omit<PatientIntakeData, 'id'>): Promise<PatientIntakeData> {
        if (USE_MOCK_DATA) {
             await new Promise(r => setTimeout(r, 500));
             const newPatient = { id: `patient-${Date.now()}`, ...data };
             internalMockIntakeData.push(newPatient);
             return newPatient;
        }
         const res = await fetch(`${API_BASE_URL}/patients/intake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    }
}

// --- EXPORTS FOR BACKWARD COMPATIBILITY (DEPRECATED) ---
// Exporting these primarily for the simulation loop which is contained in this file.
// External components should prefer DataService.
export { internalMockUsers as mockUsers, internalMockCases as mockCases, internalMockComments as mockComments };

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
    return new Promise(resolve => setTimeout(() => resolve(mockAIActionItems), 500));
};

// --- PRESENCE SIMULATION ---
let commentSimulationInterval: number | null = null;
let mockPresence: Record<string, string[]> = {};

export const getActiveUsersForCase = (caseId: string): User[] => {
    const userIds = mockPresence[caseId] || [];
    return internalMockUsers.filter(u => userIds.includes(u.id));
};

export const joinCase = (caseId: string, userId: string): void => {
    if (!mockPresence[caseId]) mockPresence[caseId] = [];
    if (!mockPresence[caseId].includes(userId)) {
        mockPresence[caseId].push(userId);
        appEvents.emit(`presence-change:${caseId}`);
    }
};

export const leaveCase = (caseId: string, userId: string): void => {
    if (mockPresence[caseId]) {
        mockPresence[caseId] = mockPresence[caseId].filter(id => id !== userId);
        appEvents.emit(`presence-change:${caseId}`);
    }
};

const sampleMedicalComments = [
    "Have we considered the possibility of an underlying infection?",
    "The lab results for CRP are slightly elevated.",
    "Let's schedule a follow-up CT scan to monitor the progression.",
    "No signs of acute ischemia on ECG.",
];

export const startCaseDiscussionSimulation = (caseId: string, user: User) => {
    if (commentSimulationInterval) clearInterval(commentSimulationInterval);
    commentSimulationInterval = window.setInterval(() => {
        if (Math.random() > 0.7) {
            const randomUser = internalMockUsers[Math.floor(Math.random() * internalMockUsers.length)];
            if (randomUser.id === user.id) return;
            DataService.addComment({
                id: `sim-comment-${Date.now()}`,
                caseId: caseId,
                userId: randomUser.id,
                userName: randomUser.name,
                userRole: randomUser.role,
                timestamp: new Date().toISOString(),
                text: sampleMedicalComments[Math.floor(Math.random() * sampleMedicalComments.length)]
            });
        }
    }, 15000);
};

export const stopCaseDiscussionSimulation = () => {
    if (commentSimulationInterval) {
        clearInterval(commentSimulationInterval);
        commentSimulationInterval = null;
    }
};

// --- GEMINI AI SERVICE ---

export class GeminiService {
    static async getAIAgentStats(userId: string): Promise<AIAgentStats> {
        return new Promise(resolve => setTimeout(() => resolve(mockAIAgentStats), 500));
    }

    static async getRecentUnratedSuggestion(userId: string): Promise<UnratedSuggestion | null> {
        if (mockUnratedSuggestionForDashboard) {
             return new Promise(resolve => setTimeout(() => resolve(mockUnratedSuggestionForDashboard), 500));
        }
        return null;
    }
    
    static async submitAIFeedback(caseId: string, suggestionName: string, feedback: DiagnosisSuggestionFeedback): Promise<void> {
        if (mockUnratedSuggestionForDashboard && mockUnratedSuggestionForDashboard.caseId === caseId && mockUnratedSuggestionForDashboard.suggestion.name === suggestionName) {
            mockUnratedSuggestionForDashboard = null;
        }
        mockAIAgentStats.feedbackProvided++;
        return Promise.resolve();
    }

    static async getCaseInsights(caseData: Case): Promise<AIInsights> {
        try {
            const model = "gemini-2.5-flash";
            const prompt = `Analyze this clinical case.
            Patient: ${caseData.patientProfile.age}y ${caseData.patientProfile.sex}.
            Complaint: ${caseData.complaint}. History: ${caseData.history}. Findings: ${caseData.findings}.
            Return JSON: { "diagnosisConfidence": number (0-1), "patientRisks": string[], "keySymptoms": string[] }`;

            const response = await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            diagnosisConfidence: { type: Type.NUMBER },
                            patientRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
                            keySymptoms: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            });
            return response.text ? JSON.parse(response.text) : { diagnosisConfidence: 0, patientRisks: [], keySymptoms: [] };
        } catch (error) {
             console.error("AI Service Error:", error);
             return { diagnosisConfidence: 0.85, patientRisks: ["API Error - Mock Data", "Risk of recurrence"], keySymptoms: ["Pain", "Swelling"] };
        }
    }

    static async getClinicalGuidelines(diagnosis: string): Promise<string> {
         try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Summarize clinical guidelines for ${diagnosis} in markdown.`,
            });
            return response.text || "No guidelines found.";
        } catch (error) {
            return "Service unavailable. Please check your connection or API key.";
        }
    }

    static async getAIChatResponse(caseData: Case, history: any[], newMessage: string): Promise<string> {
        try {
            const chat = ai.chats.create({
                model: "gemini-2.5-flash",
                config: { systemInstruction: `Medical Assistant for case: ${caseData.title}. Be concise.` }
            });
            const response = await chat.sendMessage({ message: newMessage });
            return response.text || "I didn't understand that.";
        } catch (error) {
            return "AI Service unavailable.";
        }
    }
    
    static async explainToPatient(query: string, profile: PatientProfile): Promise<string> {
         try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Explain this medical query to patient ${profile.name}: "${query}". Use simple language.`,
            });
            return response.text || "I couldn't generate an explanation.";
        } catch (error) {
            return "Service unavailable.";
        }
    }

    static async getGeneralChatResponse(history: any[], newMessage: string): Promise<string> {
         try {
            const chat = ai.chats.create({
                model: "gemini-2.5-flash",
                config: { systemInstruction: "Helpful AI health assistant. General info only." }
            });
            const response = await chat.sendMessage({ message: newMessage });
            return response.text || "I didn't understand.";
        } catch (error) {
            return "Service unavailable.";
        }
    }

    static async extractCaseDetailsFromTranscript(transcript: string): Promise<ExtractedCaseData> {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Extract case details from: "${transcript}". Return JSON: { "complaint": string, "history": string, "findings": string, "diagnosis": string, "missing_information": string[] }`,
                config: { responseMimeType: "application/json" }
            });
            return response.text ? JSON.parse(response.text) : {};
        } catch(e) {
            return { complaint: transcript, history: "", findings: "", diagnosis: "", missing_information: ["Extraction failed"] };
        }
    }

    static async augmentCaseDetailsFromHistory(data: ExtractedCaseData, patient: PatientProfile): Promise<AIContextualSuggestion[]> {
        try {
             const response = await ai.models.generateContent({
                 model: "gemini-2.5-flash",
                 contents: `Given extracted data ${JSON.stringify(data)} and patient history ${JSON.stringify(patient.baselineIllnesses)}, suggest checks. Return JSON array: [{ "suggestion": string, "rationale": string }]`,
                 config: { responseMimeType: "application/json" }
             });
             return response.text ? JSON.parse(response.text) : [];
        } catch(e) { return []; }
    }

    static async analyzeSymptoms(input: string): Promise<SymptomAnalysisResult[]> {
        try {
             const response = await ai.models.generateContent({
                 model: "gemini-2.5-flash",
                 contents: `Analyze symptoms: "${input}". Suggest 3 conditions. Return JSON array: [{ "condition": string, "confidence": number, "explanation": string }]`,
                 config: { responseMimeType: "application/json" }
             });
             return response.text ? JSON.parse(response.text) : [];
        } catch(e) { throw new Error("Analysis failed."); }
    }

    static async analyzeImage(image: { data: string, mimeType: string }, prompt: string): Promise<string> {
        try {
             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ inlineData: { mimeType: image.mimeType, data: image.data } }, { text: prompt }]
             });
             return response.text || "No analysis provided.";
        } catch(e) { throw new Error("Image analysis failed."); }
    }

    static async searchICD10Codes(query: string): Promise<{ code: string; description: string }[]> {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Find 5 relevant ICD-10 codes for: "${query}". Return JSON array: [{ "code": string, "description": string }]`,
                config: { responseMimeType: "application/json" }
            });
            return response.text ? JSON.parse(response.text) : [];
        } catch (error) { return []; }
    }
}

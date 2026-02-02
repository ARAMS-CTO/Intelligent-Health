import { User, Role, Case, Comment, AnonymisedPatientProfile, TreatmentOption, PatientProfile, PatientFile, DiagnosisSuggestion, AIInsights, Medication, PatientIntakeData, AIAgentStats, AIActionItem, DiagnosisSuggestionFeedback, ExtractedCaseData, SymptomAnalysisResult, AIContextualSuggestion, DoctorProfile, Certification, UnratedSuggestion, MedicalRecord, UploadedFile, LabResult, AgentCapability, FeedbackTicket } from '../types/index';


import { appEvents } from './events';

// --- CONFIGURATION ---
const API_BASE_URL = '/api'; // Base URL for backend

// Helper to get token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * INTELLIGENT HEALTH API SERVICE
 * 
 * DataService: Handles unified data access for Users, Cases, Patients, and Integrations
 * GeminiService: Handles AI specific operations
 */

export class DataService {

    // --- Feedback & Support ---
    static async createFeedbackHelp(ticket: Partial<FeedbackTicket>): Promise<FeedbackTicket> {
        const res = await fetch(`${API_BASE_URL}/support/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(ticket)
        });
        if (!res.ok) throw new Error("Failed to submit feedback");
        return res.json();
    }

    static async getFeedbackTickets(): Promise<FeedbackTicket[]> {
        const res = await fetch(`${API_BASE_URL}/support/tickets`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async respondToFeedback(ticketId: string, response: string): Promise<FeedbackTicket> {
        const res = await fetch(`${API_BASE_URL}/support/tickets/${ticketId}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ response })
        });
        return res.json();
    }

    // --- Appointments ---
    static async getAppointments(filters?: { status?: string; fromDate?: string; toDate?: string }): Promise<any[]> {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.fromDate) params.append('from_date', filters.fromDate);
        if (filters?.toDate) params.append('to_date', filters.toDate);

        const res = await fetch(`${API_BASE_URL}/appointments?${params}`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async createAppointment(data: {
        doctorId: string;
        patientId: string;
        scheduledAt: string;
        durationMinutes?: number;
        type?: string;
        reason?: string;
        serviceId?: string;
        paymentStatus?: string;
        cost?: number;
    }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({
                doctor_id: data.doctorId,
                patient_id: data.patientId,
                scheduled_at: data.scheduledAt,
                duration_minutes: data.durationMinutes || 30,
                type: data.type || 'In-Person',
                reason: data.reason,
                service_id: data.serviceId,
                payment_status: data.paymentStatus,
                cost: data.cost
            })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to create appointment");
        }
        return res.json();
    }

    static async updateAppointment(id: string, updates: any): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error("Failed to update appointment");
        return res.json();
    }

    static async cancelAppointment(id: string): Promise<any> {
        return this.updateAppointment(id, { status: 'Cancelled' });
    }

    static async getAvailableSlots(doctorId: string, date: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/appointments/available-slots/${doctorId}?date=${date}`, { headers: getAuthHeader() });
        if (!res.ok) throw new Error("Failed to get slots");
        return res.json();
    }

    // --- Radiology ---
    static async getImagingStudies(filters?: { modality?: string; status?: string }): Promise<any[]> {
        const params = new URLSearchParams();
        if (filters?.modality && filters.modality !== 'All') params.append('modality', filters.modality);
        if (filters?.status && filters.status !== 'All') params.append('study_status', filters.status);

        const res = await fetch(`${API_BASE_URL}/radiology/studies?${params}`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async createImagingStudy(data: any): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/radiology/studies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to create study");
        return res.json();
    }

    static async draftRadiologyReport(studyId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/radiology/studies/${studyId}/report`, {
            method: 'POST',
            headers: getAuthHeader()
        });
        if (!res.ok) throw new Error("Failed to draft report");
        return res.json();
    }

    static async detectAbnormalities(studyId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/radiology/studies/${studyId}/detect`, {
            method: 'POST',
            headers: getAuthHeader()
        });
        if (!res.ok) throw new Error("Failed to detect abnormalities");
        return res.json();
    }

    // --- Notifications ---
    static async getNotifications(unreadOnly: boolean = false): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/notifications?unread_only=${unreadOnly}`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async getNotificationCount(): Promise<number> {
        const res = await fetch(`${API_BASE_URL}/notifications/count`, { headers: getAuthHeader() });
        if (!res.ok) return 0;
        const data = await res.json();
        return data.unread_count || 0;
    }

    static async markNotificationRead(id: string): Promise<void> {
        await fetch(`${API_BASE_URL}/ notifications / ${id}/read`, { method: 'POST', headers: getAuthHeader() });
    }

    static async markAllNotificationsRead(): Promise<void> {
        await fetch(`${API_BASE_URL}/ notifications / read - all`, { method: 'POST', headers: getAuthHeader() });
    }

    static async getNotificationPreferences(): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/notifications/preferences`, { headers: getAuthHeader() });
        if (!res.ok) return null;
        return res.json();
    }

    static async updateNotificationPreferences(prefs: any): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/notifications/preferences`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(prefs)
        });
        return res.json();
    }

    // --- Messaging ---
    static async sendMessage(recipientId: string, content: string, options?: { subject?: string; caseId?: string; priority?: string }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/messages/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({
                recipient_id: recipientId,
                content,
                subject: options?.subject,
                related_case_id: options?.caseId,
                priority: options?.priority || 'normal'
            })
        });
        if (!res.ok) throw new Error("Failed to send message");
        return res.json();
    }

    static async getInbox(unreadOnly: boolean = false): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/messages/inbox ? unread_only = ${unreadOnly} `, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async getSentMessages(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/messages/sent`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async getConversation(userId: string): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/messages/conversation / ${userId} `, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async markMessageRead(messageId: string): Promise<void> {
        await fetch(`${API_BASE_URL}/messages/${messageId}/read`, { method: 'POST', headers: getAuthHeader() });
    }

    static async getUnreadMessageCount(): Promise<number> {
        const res = await fetch(`${API_BASE_URL}/messages/unread-count`, { headers: getAuthHeader() });
        if (!res.ok) return 0;
        const data = await res.json();
        return data.unread_count || 0;
    }

    static async getConversations(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/messages/conversations`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    // --- Collaboration & Referrals ---
    static async createReferral(caseId: string, toDoctorId: string, reason: string, options?: { type?: string; priority?: string; notes?: string }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/collaboration/refer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({
                case_id: caseId,
                to_doctor_id: toDoctorId,
                collaboration_type: options?.type || 'consultation',
                reason,
                priority: options?.priority || 'normal',
                notes: options?.notes
            })
        });
        if (!res.ok) throw new Error("Failed to create referral");
        return res.json();
    }

    static async getIncomingReferrals(status?: string): Promise<any[]> {
        const params = status ? `?status=${status}` : '';
        const res = await fetch(`${API_BASE_URL}/collaboration/incoming${params}`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async getOutgoingReferrals(status?: string): Promise<any[]> {
        const params = status ? `?status=${status}` : '';
        const res = await fetch(`${API_BASE_URL}/collaboration/outgoing${params}`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async acceptReferral(referralId: string, notes?: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/collaboration/${referralId}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ notes })
        });
        if (!res.ok) throw new Error("Failed to accept referral");
        return res.json();
    }

    static async declineReferral(referralId: string, reason: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/collaboration/${referralId}/decline?reason=${encodeURIComponent(reason)}`, {
            method: 'POST',
            headers: getAuthHeader()
        });
        if (!res.ok) throw new Error("Failed to decline referral");
        return res.json();
    }

    static async getCaseCollaborations(caseId: string): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/collaboration/case/${caseId}`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async getPendingReferralCount(): Promise<number> {
        const res = await fetch(`${API_BASE_URL}/collaboration/pending-count`, { headers: getAuthHeader() });
        if (!res.ok) return 0;
        const data = await res.json();
        return data.pending_count || 0;
    }

    static async getAvailableSpecialists(specialty?: string): Promise<any[]> {
        const params = specialty ? `?specialty=${encodeURIComponent(specialty)}` : '';
        const res = await fetch(`${API_BASE_URL}/collaboration/specialists${params}`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    // --- Vitals Tracking ---
    static async recordVital(data: {
        type: string;
        value: string;
        unit: string;
        systolic?: number;
        diastolic?: number;
        notes?: string;
        source?: string;
    }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/vitals/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to record vital");
        return res.json();
    }

    static async getVitals(options?: { type?: string; days?: number; limit?: number }): Promise<any[]> {
        const params = new URLSearchParams();
        if (options?.type) params.append('vital_type', options.type);
        if (options?.days) params.append('days', options.days.toString());
        if (options?.limit) params.append('limit', options.limit.toString());

        const res = await fetch(`${API_BASE_URL}/vitals/?${params}`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async getVitalsSummary(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/vitals/summary`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async getLatestVital(type: string): Promise<any | null> {
        const res = await fetch(`${API_BASE_URL}/vitals/latest/${type}`, { headers: getAuthHeader() });
        if (!res.ok) return null;
        return res.json();
    }

    static async deleteVital(vitalId: string): Promise<void> {
        await fetch(`${API_BASE_URL}/ vitals / ${vitalId} `, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
    }

    static async getVitalAlerts(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/vitals/alerts`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    // --- Care Plan Management ---
    static async createCarePlan(data: {
        title: string;
        description?: string;
        target_end_date?: string;
        goals?: Array<{
            category: string;
            title: string;
            description?: string;
            target_date?: string;
            tasks?: Array<{ title: string; frequency?: string }>;
        }>;
    }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/careplan/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to create care plan");
        return res.json();
    }

    static async getCarePlans(status?: string): Promise<any[]> {
        const params = status ? `? status = ${status} ` : '';
        const res = await fetch(`${API_BASE_URL}/careplan/${params} `, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async getCarePlan(planId: string): Promise<any | null> {
        const res = await fetch(`${API_BASE_URL}/careplan/${planId} `, { headers: getAuthHeader() });
        if (!res.ok) return null;
        return res.json();
    }

    static async addCarePlanGoal(planId: string, goal: {
        category: string;
        title: string;
        description?: string;
        target_date?: string;
        priority?: number;
        tasks?: Array<{ title: string; frequency?: string }>;
    }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/careplan/${planId}/goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(goal)
        });
        if (!res.ok) throw new Error("Failed to add goal");
        return res.json();
    }

    static async addCarePlanTask(goalId: string, task: {
        title: string;
        description?: string;
        frequency?: string;
        due_date?: string;
    }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/careplan/goals/${goalId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(task)
        });
        if (!res.ok) throw new Error("Failed to add task");
        return res.json();
    }

    static async completeTask(taskId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/careplan/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: getAuthHeader()
        });
        if (!res.ok) throw new Error("Failed to complete task");
        return res.json();
    }

    static async uncompleteTask(taskId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/careplan/tasks/${taskId}/uncomplete`, {
            method: 'POST',
            headers: getAuthHeader()
        });
        if (!res.ok) throw new Error("Failed to uncomplete task");
        return res.json();
    }

    static async deleteCarePlan(planId: string): Promise<void> {
        await fetch(`${API_BASE_URL}/ careplan / ${planId} `, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
    }

    // --- Health Timeline ---
    static async getTimeline(options?: { type?: string; months?: number; importantOnly?: boolean }): Promise<any[]> {
        const params = new URLSearchParams();
        if (options?.type) params.append('event_type', options.type);
        if (options?.months) params.append('months', options.months.toString());
        if (options?.importantOnly) params.append('important_only', 'true');

        const res = await fetch(`${API_BASE_URL}/timeline/ ? ${params} `, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async getTimelineGrouped(options?: { type?: string; months?: number }): Promise<any[]> {
        const params = new URLSearchParams();
        if (options?.type) params.append('event_type', options.type);
        if (options?.months) params.append('months', options.months.toString());

        const res = await fetch(`${API_BASE_URL}/timeline/grouped ? ${params} `, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async getTimelineEventTypes(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/timeline/types`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async createTimelineEvent(event: {
        type: string;
        title: string;
        description?: string;
        provider?: string;
        location?: string;
        is_important?: boolean;
        event_date: string;
    }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/timeline/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(event)
        });
        if (!res.ok) throw new Error("Failed to create event");
        return res.json();
    }

    static async deleteTimelineEvent(eventId: string): Promise<void> {
        await fetch(`${API_BASE_URL}/timeline/${eventId} `, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
    }

    // --- User & Auth ---
    static async login(email: string, role: Role, password?: string): Promise<User | null> {
        const pwd = password || "password";
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

    static async register(email: string, role: Role, password?: string, name?: string, inviteCode?: string): Promise<User> {
        const pwd = password || "password";
        const userName = name || email.split('@')[0];
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role, password: pwd, name: userName, invite_code: inviteCode })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errData.detail || 'Registration failed');
            }
            const data = await response.json();
            // Auto login after register
            localStorage.setItem('token', data.access_token);
            return data.user;
        } catch (e) {
            console.error("Register error", e);
            throw e;
        }
    }

    static async deleteUser(userId: string): Promise<void> {
        const res = await fetch(`${API_BASE_URL}/users/${userId} `, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!res.ok) throw new Error("Failed to delete user");
    }

    static async updateUser(userId: string, updates: any): Promise<User> {
        const res = await fetch(`${API_BASE_URL}/users/${userId} `, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error("Failed to update user");
        return res.json();
    }

    static async resetUserPassword(userId: string, password: string): Promise<void> {
        const res = await fetch(`${API_BASE_URL}/users/${userId}/reset_password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ password })
        });
        if (!res.ok) throw new Error("Failed to reset password");
    }

    static async loginWithGoogle(accessToken: string, role: Role = Role.Patient): Promise<User> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: accessToken, role })
            });

            if (!response.ok) throw new Error("Google login failed");
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            return data.user;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async loginWithConcordium(accountAddress: string, message: string, signature: string): Promise<User> {
        try {
            const response = await fetch(`${API_BASE_URL}/concordium/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                    account_address: accountAddress,
                    message: message,
                    signature: signature
                })
            });

            if (!response.ok) throw new Error("Concordium login failed");
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            // Ideally backend returns 'user' object too, verify structure or fetch me
            // For now assuming backend returns everything needed or we fetch /auth/me
            const meRes = await fetch(`${API_BASE_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${data.access_token}` } });
            return await meRes.json();
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async linkConcordiumWallet(accountAddress: string, message: string, signature: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/concordium/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({
                account_address: accountAddress,
                message: message,
                signature: signature
            })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to link wallet");
        }
    }

    static async unlinkConcordiumWallet(): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/concordium/unlink`, {
            method: 'POST',
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error("Failed to unlink wallet");
    }

    static async getConcordiumChallenge(accountAddress: string): Promise<{ challenge: string; nonce: string; expiresIn: number }> {
        const response = await fetch(`${API_BASE_URL}/concordium/challenge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account_address: accountAddress })
        });
        if (!response.ok) throw new Error("Failed to get challenge");
        const data = await response.json();
        return { challenge: data.challenge, nonce: data.nonce, expiresIn: data.expires_in };
    }

    static async getConcordiumStatus(): Promise<{ walletLinked: boolean; walletAddress: string | null; accessGrantsGiven: number; accessGrantsReceived: number }> {
        const response = await fetch(`${API_BASE_URL}/concordium/status`, { headers: getAuthHeader() });
        if (!response.ok) return { walletLinked: false, walletAddress: null, accessGrantsGiven: 0, accessGrantsReceived: 0 };
        const data = await response.json();
        return {
            walletLinked: data.wallet_linked,
            walletAddress: data.wallet_address,
            accessGrantsGiven: data.access_grants_given,
            accessGrantsReceived: data.access_grants_received
        };
    }

    static async grantRecordAccess(doctorAddress: string, recordIds: string[], expiryDays: number = 30): Promise<{ txHash: string; expiresAt: string }> {
        const response = await fetch(`${API_BASE_URL}/concordium/grant-access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ doctor_address: doctorAddress, record_ids: recordIds, expiry_days: expiryDays })
        });
        if (!response.ok) throw new Error("Failed to grant access");
        const data = await response.json();
        return { txHash: data.tx_hash, expiresAt: data.expires_at };
    }

    static async revokeRecordAccess(doctorAddress: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/concordium/revoke-access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ doctor_address: doctorAddress })
        });
        if (!response.ok) throw new Error("Failed to revoke access");
    }

    static async getAccessGrants(role: 'patient' | 'doctor' = 'patient'): Promise<any[]> {
        const response = await fetch(`${API_BASE_URL}/concordium/access-grants?role=${role}`, { headers: getAuthHeader() });
        if (!response.ok) return [];
        const data = await response.json();
        return data.grants || [];
    }

    static async requestZKPProof(attribute: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/concordium/zkp/request/${attribute}`, { headers: getAuthHeader() });
        if (!response.ok) throw new Error("Failed to request ZKP");
        return response.json();
    }

    // --- Family Groups ---
    static async getFamilyGroups(): Promise<{ groups: any[] }> {
        const res = await fetch(`${API_BASE_URL}/family/groups`, { headers: getAuthHeader() });
        if (!res.ok) return { groups: [] };
        return res.json();
    }

    static async getFamilyGroup(groupId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/family/groups/${groupId}`, { headers: getAuthHeader() });
        if (!res.ok) throw new Error("Group not found");
        return res.json();
    }

    static async createFamilyGroup(name: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/family/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error("Failed to create group");
        return res.json();
    }

    static async addFamilyMember(groupId: string, member: { name: string; relationship: string; canViewRecords?: boolean; canBookAppointments?: boolean }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/family/groups/${groupId}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({
                name: member.name,
                relationship: member.relationship,
                can_view_records: member.canViewRecords ?? true,
                can_book_appointments: member.canBookAppointments ?? true
            })
        });
        if (!res.ok) throw new Error("Failed to add member");
        return res.json();
    }

    static async getFamilyMembers(): Promise<any[]> {
        // Flatten members from all groups or use specific endpoint
        // For now, let's assume a direct members endpoint exists or we fetch from default group
        const res = await fetch(`${API_BASE_URL}/family/members`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async removeFamilyMember(groupId: string, memberId: string): Promise<void> {
        const res = await fetch(`${API_BASE_URL}/family/groups/${groupId}/members/${memberId}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!res.ok) throw new Error("Failed to remove member");
    }

    // --- Telemedicine Consultations ---
    static async getConsultations(status?: string): Promise<any[]> {
        const url = status ? `${API_BASE_URL}/consultations?status=${status}` : `${API_BASE_URL}/consultations`;
        const res = await fetch(url, { headers: getAuthHeader() });
        if (!res.ok) return [];
        const data = await res.json();
        return data.consultations || [];
    }

    static async createConsultation(patientId: string, type: string = 'Video', appointmentId?: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/consultations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ patient_id: patientId, type, appointment_id: appointmentId })
        });
        if (!res.ok) throw new Error("Failed to create consultation");
        return res.json();
    }

    static async startTelemedicineSession(data: { doctor_id: string; appointment_id?: string; type: string }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/telemedicine/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to create consultation");
        return res.json();
    }

    static async endTelemedicineSession(sessionId: string, notes?: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/telemedicine/${sessionId}/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ notes })
        });
        if (!res.ok) throw new Error("Failed to end session");
        return res.json();
    }

    static async startConsultation(consultationId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/consultations/${consultationId}/start`, { method: 'POST', headers: getAuthHeader() });
        if (!res.ok) throw new Error("Failed to start");
        return res.json();
    }

    static async endConsultation(consultationId: string, notes?: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/consultations/${consultationId}/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ notes })
        });
        if (!res.ok) throw new Error("Failed to end");
        return res.json();
    }

    static async getConsultationJoinInfo(consultationId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/consultations/${consultationId}/join`, { headers: getAuthHeader() });
        if (!res.ok) throw new Error("Failed to get join info");
        return res.json();
    }

    // --- Dentistry ---
    static async getDentalChart(patientId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/dental/chart/${patientId}`, { headers: getAuthHeader() });
        if (!res.ok) throw new Error("Failed to get dental chart");
        return res.json();
    }

    static async updateToothStatus(patientId: string, data: { tooth_number: number; condition: string; notes?: string }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/dental/chart/${patientId}/tooth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to update tooth");
        return res.json();
    }

    static async getDentalHistory(patientId: string): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/dental/history/${patientId}`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async logProcedure(data: { patient_id: string; tooth_number?: number; procedure_code: string; description: string; notes?: string }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/dental/procedure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to log procedure");
        return res.json();
    }

    // Existing methods continue below...

    static async getUsers(): Promise<User[]> {
        try {
            const res = await fetch(`${API_BASE_URL}/users/`, { headers: getAuthHeader() });
            if (!res.ok) return [];
            return res.json();
        } catch (e) {
            return [];
        }
    }

    static async getDoctorProfile(profileId: string): Promise<DoctorProfile | undefined> {
        const res = await fetch(`${API_BASE_URL}/doctors/${profileId}`, { headers: getAuthHeader() });
        if (!res.ok) return undefined;
        return res.json();
    }

    static async updateDoctorProfile(profileId: string, updates: Partial<DoctorProfile>): Promise<DoctorProfile | undefined> {
        const res = await fetch(`${API_BASE_URL}/doctors/${profileId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(updates)
        });
        if (!res.ok) return undefined;
        return res.json();
    }


    // --- Cases ---
    static async getCases(): Promise<Case[]> {
        try {
            const res = await fetch(`${API_BASE_URL}/cases/`, { headers: getAuthHeader() });
            if (!res.ok) return [];
            return res.json();
        } catch (e) {
            return [];
        }
    }

    static async getCaseById(id: string): Promise<Case | undefined> {
        const res = await fetch(`${API_BASE_URL}/cases/${id}`, { headers: getAuthHeader() });
        if (!res.ok) return undefined;
        return res.json();
    }

    static async createCase(newCase: Partial<Case>): Promise<Case> {
        const res = await fetch(`${API_BASE_URL}/cases/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(newCase)
        });
        if (!res.ok) throw new Error("Failed to create case");
        return res.json();
    }

    static async updateCase(id: string, updates: Partial<Case>): Promise<Case> {
        const res = await fetch(`${API_BASE_URL}/cases/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(updates)
        });
        return res.json();
    }

    static async updateCaseStage(id: string, stage: string): Promise<Case> {
        // Optimistic update wrapper or specific endpoint if needed
        return this.updateCase(id, { status: stage as any });
    }

    static async addComment(caseId: string, content: string): Promise<Comment> {
        const res = await fetch(`${API_BASE_URL}/cases/${caseId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ content })
        });
        return res.json();
    }

    static async getAllComments(): Promise<Comment[]> {
        try {
            const res = await fetch(`${API_BASE_URL}/cases/comments/all`, { headers: getAuthHeader() });
            if (!res.ok) return [];
            return res.json();
        } catch (e) {
            return [];
        }
    }

    // --- Patients ---
    static async getPatients(): Promise<PatientProfile[]> {
        try {
            const res = await fetch(`${API_BASE_URL}/patients/`, { headers: getAuthHeader() });
            if (!res.ok) return [];
            return res.json();
        } catch (e) {
            return [];
        }
    }

    static async getPatientById(id: string): Promise<PatientProfile | undefined> {
        try {
            const res = await fetch(`${API_BASE_URL}/patients/${id}`, { headers: getAuthHeader() });
            if (!res.ok) return undefined;
            return res.json();
        } catch (e) {
            return undefined;
        }
    }

    static async updatePatientProfile(id: string, updates: Partial<PatientProfile>): Promise<PatientProfile> {
        const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(updates)
        });
        return res.json();
    }

    static async getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
        try {
            const res = await fetch(`${API_BASE_URL}/patients/${patientId}/records`, { headers: getAuthHeader() });
            if (!res.ok) return [];
            return res.json();
        } catch (e) {
            return [];
        }
    }

    static async addMedicalRecord(patientId: string, record: Partial<MedicalRecord>): Promise<MedicalRecord> {
        const res = await fetch(`${API_BASE_URL}/patients/${patientId}/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(record)
        });
        return res.json();
    }

    static async getPatientHealthData(patientId: string, days: number = 7): Promise<Record<string, { value: number, unit: string, timestamp: string }[]>> {
        try {
            const res = await fetch(`${API_BASE_URL}/patients/${patientId}/health_data?days=${days}`, { headers: getAuthHeader() });
            if (!res.ok) return {};
            return res.json();
        } catch (e) {
            return {};
        }
    }

    // --- Dashboard ---
    static async getDashboardStats(userId: string): Promise<{ overdue: number, updates: number, assignments: number }> {
        try {
            const res = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers: getAuthHeader() });
            if (!res.ok) return { overdue: 0, updates: 0, assignments: 0 };
            return res.json();
        } catch (e) {
            return { overdue: 0, updates: 0, assignments: 0 };
        }
    }

    static async getRecentActivity(): Promise<Comment[]> {
        try {
            const res = await fetch(`${API_BASE_URL}/dashboard/activity`, { headers: getAuthHeader() });
            if (!res.ok) return [];
            return res.json();
        } catch (e) {
            return [];
        }
    }

    // --- File Upload ---
    static async uploadFile(file: File, caseId?: string, patientId?: string): Promise<{ url: string, name: string, type: string }> {
        const formData = new FormData();
        formData.append('file', file);
        if (caseId) {
            formData.append('case_id', caseId);
        }
        if (patientId) {
            formData.append('patient_id', patientId);
        }

        const res = await fetch(`${API_BASE_URL}/files/upload`, {
            method: 'POST',
            headers: { ...getAuthHeader() },
            body: formData
        });

        if (!res.ok) throw new Error("File upload failed");
        return res.json();
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

    // --- Integrations (Native Support) ---
    static async getIntegrationStatus(): Promise<{ integrations: IntegrationStatus[] }> {
        try {
            const res = await fetch(`${API_BASE_URL}/integrations/status`, { headers: getAuthHeader() });
            if (!res.ok) return { integrations: [] };
            return res.json();
        } catch (e) {
            return { integrations: [] };
        }
    }

    static async connectProvider(provider: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/integrations/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ provider })
        });
        if (!res.ok) throw new Error("Connect failed");
        return res.json();
    }

    static async disconnectProvider(provider: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/integrations/disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ provider })
        });
        if (!res.ok) throw new Error("Disconnect failed");
        return res.json();
    }

    static async syncIntegrations(): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/integrations/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({})
        });
        if (!res.ok) throw new Error("Sync failed");
        return res.json();
    }

    // --- Agent & Admin Management ---
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

    static async getAdminConfig(): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/dashboard/admin/config`, { headers: getAuthHeader() });
        if (!res.ok) return { features: {} };
        return res.json();
    }

    static async updateAdminConfig(config: any): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/dashboard/admin/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ features: config })
        });
        if (!res.ok) throw new Error("Failed to update config");
        return res.json();
    }

    static async getAgents(): Promise<AgentCapability[]> {
        try {
            const res = await fetch(`${API_BASE_URL}/agents/`, { headers: getAuthHeader() });
            if (!res.ok) {
                // Return empty list if unauthorized/error to prevent crash
                return [];
            }
            return res.json();
        } catch (e) {
            return [];
        }
    }

    static async updateAgent(agentId: string, updates: any): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/agents/${agentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error("Failed to update agent");
        return res.json();
    }

    static async testAgent(agentId: string, payload: any): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/agents/${agentId}/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Agent Test Failed");
        }
        return res.json();
    }

    static async seedAgentCapabilities(): Promise<void> {
        await fetch(`${API_BASE_URL}/ agents / seed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
    }

    static async findAgentCapability(query: string): Promise<any[]> {
        try {
            const res = await fetch(`${API_BASE_URL}/bus/find`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ query })
            });
            if (!res.ok) return [];
            return res.json();
        } catch (e) {
            return [];
        }
    }

    static async updateUserConsents(gdpr: boolean, share: boolean, marketing: boolean): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/users/me / consents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ gdpr_consent: gdpr, data_sharing_consent: share, marketing_consent: marketing })
        });
        if (!res.ok) throw new Error("Failed to update consents");
        return res.json();
    }

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

    // --- Admin Stats ---
    static async getAdminStats(): Promise<any> {
        try {
            const res = await fetch(`${API_BASE_URL}/dashboard/admin / stats`, { headers: getAuthHeader() });
            if (!res.ok) return {};
            return res.json();
        } catch (e) {
            return {};
        }
    }

    static async getSystemLogs(): Promise<any[]> {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/logs`, { headers: getAuthHeader() });
            if (!res.ok) return [];
            return res.json();
        } catch (e) {
            return [];
        }
    }

    // --- Financials ---
    static async getPendingEstimates(role: string): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/billing/admin / estimates / pending ? role = ${role} `, { headers: getAuthHeader() });
        return res.json();
    }

    static async getCostEstimate(caseId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/estimates / ${caseId} `, { headers: getAuthHeader() });
        if (!res.ok) return null;
        return res.json();
    }

    static async generateCostEstimate(caseId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/estimates / ${caseId}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Failed to generate estimate");
        return res.json();
    }

    static async approveCostEstimate(caseId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/estimates/${caseId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Failed to approve estimate");
        return res.json();
    }

    static async rejectCostEstimate(caseId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/estimates/${caseId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Failed to reject estimate");
        return res.json();
    }

    // --- Research Community ---
    static async getResearchGroups(): Promise<any[]> {
        try {
            const res = await fetch(`${API_BASE_URL}/research/groups`, { headers: getAuthHeader() });
            if (!res.ok) return [];
            return res.json();
        } catch (e) {
            return [];
        }
    }

    static async getTokenBalance(): Promise<{ balance: number, total_earned: number }> {
        const res = await fetch(`${API_BASE_URL}/research/balance`, { headers: getAuthHeader() });
        return res.json();
    }

    static async createResearchGroup(name: string, topic: string, members: string[]): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/research/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ name, topic, members })
        });
        if (!res.ok) throw new Error("Failed to create group");
        return res.json();
    }

    static async joinResearchGroup(groupId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/research/groups/${groupId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Failed to join group");
        return res.json();
    }

    // --- Financials --- (Already exists above, but adding missing Transaction method here or near other financial methods)
    static async getTransactions(): Promise<any[]> {
        try {
            const res = await fetch(`${API_BASE_URL}/billing/transactions`, { headers: getAuthHeader() });
            if (!res.ok) return [];
            return res.json();
        } catch (e) {
            return [];
        }
    }

    // --- PayPal ---
    static async createPayPalOrder(amount: number, currency: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/paypal/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ amount, currency })
        });
        if (!res.ok) throw new Error("Failed to create PayPal order");
        return res.json();
    }

    static async capturePayPalOrder(orderID: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/paypal/capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ orderID })
        });
        if (!res.ok) throw new Error("Failed to capture PayPal order");
        return res.json();
    }

    // --- Stripe ---
    static async createStripePaymentIntent(amount: number, currency: string): Promise<{ clientSecret: string, id: string }> {
        const res = await fetch(`${API_BASE_URL}/billing/stripe/create-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ amount, currency })
        });
        if (!res.ok) throw new Error("Failed to create payment intent");
        return res.json();
    }

    static async verifyStripePayment(paymentId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/billing/stripe/verify/${paymentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Payment verification failed");
        return res.json();
    }

    static async createStripeConnectAccount(): Promise<{ onboarding_url: string }> {
        const res = await fetch(`${API_BASE_URL}/billing/stripe/connect/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Failed to create connect account");
        return res.json();
    }

    static async contributeToResearch(groupId: string, type: string, referenceId: string): Promise<{ tokens_earned: number }> {
        const res = await fetch(`${API_BASE_URL}/research/contribute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ group_id: groupId, contribution_type: type, reference_id: referenceId })
        });
        if (!res.ok) throw new Error("Contribution failed");
        return res.json();
    }

    // --- Helper Aliases for components using them as standalone imports ---
    static getPatientProfile = DataService.getPatientById;
    static addPatientIntake = async (data: any) => { /* Mock or future impl */ return data; }; // Placeholder if not strictly defined
    static addPatientMedication = async (id: string, med: any) => { /* Placeholder */ };
    static addPatientFile = async (id: string, file: any) => { /* Placeholder */ };
    static searchPatients = async (q: string) => { return [] as PatientProfile[]; };
    static updateCaseStatus = DataService.updateCaseStage;
    static assignSpecialist = async (caseId: string, specialistId: string) => { };
    static getCaseComments = async (caseId: string) => { return [] as Comment[]; };

    // --- Pharmacy ---
    static async getPharmacyQueue(status?: string): Promise<any[]> {
        try {
            const url = status ? `${API_BASE_URL}/pharmacy/queue?status=${status}` : `${API_BASE_URL}/pharmacy/queue`;
            const res = await fetch(url, { headers: getAuthHeader() });
            if (!res.ok) {
                console.error("Failed to fetch pharmacy queue", res.status);
                return [];
            }
            return res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    // --- Nurse Tasks ---
    static async getNurseTasks(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/nurse/tasks`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async executeNurseTask(taskId: string, payload: { notes?: string, vitals?: any, file_url?: string }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/nurse/tasks/${taskId}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to execute task");
        return res.json();
    }

    static async dispensePrescription(rxId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/pharmacy/${rxId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ status: 'Dispensed' })
        });
        if (!res.ok) throw new Error("Failed to dispense");
        return res.json();
    }

    static async checkDrugInteraction(patientId: string, medicationName: string, dosage: string): Promise<any> {
        try {
            const res = await fetch(`${API_BASE_URL}/pharmacy/check_interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ patient_id: patientId, medication_name: medicationName, dosage })
            });
            if (!res.ok) return { status: "unknown", message: "Check failed" };
            return res.json();
        } catch (e) {
            return { status: "error", message: "Network error during check" };
        }
    }

    static async createPrescription(rx: any): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/pharmacy/prescribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(rx)
        });
        if (!res.ok) throw new Error("Failed to prescribe");
        return res.json();
    }

    // --- Labs ---
    static async recommendLabs(caseId: string): Promise<any> {
        try {
            const res = await fetch(`${API_BASE_URL}/lab/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ case_id: caseId })
            });
            return await res.json();
        } catch (e) {
            console.error("Lab Recommendation Error:", e);
            return { status: "error", message: "Service unavailable" };
        }
    }

    static async orderLab(caseId: string, testName: string, notes?: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/lab/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ case_id: caseId, test_name: testName, notes })
        });
        if (!res.ok) throw new Error("Failed to order lab");
        return res.json();
    }

    static async getPendingLabs(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/lab/pending`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async recordLabResult(labId: string, result: any): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/lab/${labId}/result`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(result)
        });
        if (!res.ok) throw new Error("Failed to record result");
        return res.json();
    }



    static async getIntegrationAuthUrl(provider: string, redirectUrl?: string): Promise<string> {
        let url = `${API_BASE_URL}/integrations/auth/${provider}`;
        if (redirectUrl) {
            url += `?redirect_url=${encodeURIComponent(redirectUrl)}`;
        }
        const res = await fetch(url, { headers: getAuthHeader() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to get auth URL");
        return data.url;
    }

    static async syncProvider(provider: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/integrations/sync/${provider}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Sync failed");
        return res.json();
    }

    // --- External AI Integrations (Status Checking) ---
    static async getIntegrationList(): Promise<{ provider: string, status: string }[]> {
        const res = await fetch(`${API_BASE_URL}/integrations/list`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async connectAI(provider: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/integrations/connect_ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ provider })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Failed" }));
            throw new Error(err.detail || "Connection Failed");
        }
        return res.json();
    }

    static async disconnectAI(provider: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/integrations/disconnect_ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ provider })
        });
        if (!res.ok) throw new Error("Disconnect Failed");
        return res.json();
    }

    // --- Credits ---
    static async getCreditBalance(): Promise<{ balance: number, tier: string }> {
        const res = await fetch(`${API_BASE_URL}/credits/balance`, { headers: getAuthHeader() });
        return res.json();
    }

    static async deductCredits(amount: number, reason: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/credits/deduct`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ amount, reason })
        });
        if (!res.ok) throw new Error("Insufficient credits");
        return res.json();
    }

    // --- Referrals ---
    static async getReferralStats(): Promise<{ referral_count: number, credits_earned: number, invite_code: string | null }> {
        const res = await fetch(`${API_BASE_URL}/referrals/stats`, { headers: getAuthHeader() });
        if (!res.ok) return { referral_count: 0, credits_earned: 0, invite_code: null };
        return res.json();
    }

    static async getLeaderboard(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/referrals/leaderboard`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }


    // --- NEW: Public / Transparency / Ecosystem API ---

    static async getPublicEstimate(data: { procedure_name: string, insurance_tier: string, symptoms?: string }): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/billing/estimate/public`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (e) {
            console.error("Estimate Error:", e);
            throw e;
        }
    }



    // --- Specialized Zones Data ---

    static async getCardiologyData(patientId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/cardiology/data/${patientId}`, { headers: getAuthHeader() });
        if (!res.ok) {
            // Fallback if backend fails, ensuring UI resilience
            return {
                bp: "120/80", o2: "98%", hr: 72,
                conditions: ["Hypertension (Controlled)"], lastEcg: "2025-01-15", status: "Stable"
            };
        }
        return res.json();
    }

    static async getOphthalmologyData(patientId: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/ophthalmology/data/${patientId}`, { headers: getAuthHeader() });
        if (!res.ok) {
            return {
                visualAcuityOD: "20/20", visualAcuityOS: "20/25",
                iop: "16 mmHg", cupDiscRatio: "0.3", lastExam: "2024-11-10",
                prescription: { sphere: "-1.25", cylinder: "-0.50", axis: 90 }
            };
        }
        return res.json();
    }

    // --- Admin User Management ---
    static async getAdminUsers(search?: string): Promise<any[]> {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        const res = await fetch(`${API_BASE_URL}/admin/users${query}`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return res.json();
    }

    static async adminUserAction(userId: string, action: 'deactivate' | 'credits' | 'reset-password', payload?: any): Promise<any> {
        const urlMap = {
            'deactivate': `${API_BASE_URL}/admin/users/${userId}/deactivate`,
            'credits': `${API_BASE_URL}/admin/users/${userId}/credits?amount=${payload?.amount || 0}`,
            'reset-password': `${API_BASE_URL}/admin/users/${userId}/reset-password`,
        };
        const res = await fetch(urlMap[action], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
        });
        if (!res.ok) throw new Error("Action failed");
        return res.json();
    }
    // --- Family / Pediatrics ---


    static async addChildAccount(child: { name: string, dob: string, gender: string }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/users/me/family`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(child)
        });
        if (!res.ok) throw new Error("Failed to add child");
        return res.json();
    }

    static async getAiSpecialistConsult(params: { specialty: string, query: string, context?: any }): Promise<{ message: string, actions: any[] }> {
        try {
            // For now, let's try to map to the existing GeminiService endpoint or mock it better
            const response = await fetch(`${API_BASE_URL}/ai/specialist_consult`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                    query: params.query,
                    domain: params.specialty,
                    context: params.context
                })
            });

            if (response.ok) return await response.json();

            // Fallback for demo if online fail
            return {
                message: "Offline visualization mode. Real RAG requires backend. (Mock: ACS protocol involves MONA...)",
                actions: []
            };
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
}

// --- Integrations Export ---

export interface IntegrationStatus {
    provider: string;
    status: string;
    last_sync: string;
}

export type HealthIntegrationStatus = IntegrationStatus;

// --- GEMINI AI SERVICE ---

export class GeminiService {
    static async consultSpecialist(query: string, caseData: string, domain?: string): Promise<{ status: string, domain: string, message: string, actions: any[] }> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/specialist_consult`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ query, case_data: caseData, domain })
            });

            if (!response.ok) throw new Error("Specialist consult failed");
            return await response.json();
        } catch (error) {
            console.error("Specialist Consult Error:", error);
            return {
                status: "error",
                domain: "Unknown",
                message: "Could not reach the specialist.",
                actions: []
            };
        }
    }

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

    static async getPatientChatResponse(history: any[], newMessage: string): Promise<string> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/agent_chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                    history: history,
                    message: newMessage
                })
            });
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error("Patient Chat Error:", error);
            return "My connection to the medical brain is currently shaky. Please try again later.";
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
            // Use the stateful upload endpoint that saves to DB
            const response = await fetch(`${API_BASE_URL}/ai/patient/upload_record`, {
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

    static async generateComprehensiveReport(patientId: string): Promise<{ report: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/report/comprehensive/${patientId}`, { headers: getAuthHeader() });
            return await response.json();
        } catch (e) { return { report: "Service unavailable" }; }
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

    static async executeWorkflow(workflowName: string, caseId: string, payload?: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/workflow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ workflow_name: workflowName, case_id: caseId, payload })
            });
            return await response.json();
        } catch (error) {
            console.error("Workflow Error:", error);
            return { error: "Workflow failed." };
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

    // -- Patient Agent Capabilities --
    static async getDailyCheckupQuestions(): Promise<{ questions: string[], greeting: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/agent_task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ task: 'daily_checkup', payload: {} })
            });
            return await response.json();
        } catch (e) {
            return { questions: ["How are you feeling today?", "Did you take your medications?", "Any new symptoms?"], greeting: "Good morning!" };
        }
    }

    static async getMedicationReminders(medications: string[]): Promise<{ reminders: any[] }> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/agent_task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ task: 'medication_reminder', payload: { medications } })
            });
            return await response.json();
        } catch (e) {
            return { reminders: [] };
        }
    }

    static async getHealthSummary(): Promise<{ summary: string, recommendations: string[], wellness_score: number }> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/agent_task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ task: 'generate_health_summary', payload: {} })
            });
            return await response.json();
        } catch (e) {
            return { summary: "Unable to generate summary.", recommendations: [], wellness_score: 0 };
        }
    }

    // -- Research Agent Capabilities --
    static async researchCondition(query: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/agent_task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ task: 'research_condition', payload: { query } })
            });
            return await response.json();
        } catch (e) {
            return { error: "Research failed" };
        }
    }

    static async findClinicalGuidelines(condition: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/agent_task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ task: 'find_guidelines', payload: { condition } })
            });
            return await response.json();
        } catch (e) {
            return { error: "Guidelines search failed" };
        }
    }

    static async checkDrugInteractions(medications: string[]): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/agent_task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ task: 'check_drug_interaction', payload: { medications } })
            });
            return await response.json();
        } catch (e) {
            return { error: "Interaction check failed", interactions: [], safe: true };
        }
    }

    static async chatWithSpecialist(zone: string, contextId: string | null, query: string): Promise<{ reply: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/specialist_chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ zone, context: { contextId }, query })
            });
            if (!response.ok) throw new Error("Specialist chat failed");
            return await response.json();
        } catch (e) {
            console.error("Specialist Chat Error:", e);
            throw e;
        }
    }

    static async getMedicalRecords(patientId: string): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/patients/${patientId}/records`, {
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
            });
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("Fetch Records Error:", e);
            return [];
        }
    }

    // --- Concordium Blockchain ---

    static async getConcordiumChallenge(address: string): Promise<{ challenge: string, nonce: string }> {
        const res = await fetch(`${API_BASE_URL}/concordium/challenge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account_address: address })
        });
        if (!res.ok) throw new Error("Failed to get challenge");
        return res.json();
    }

    static async linkConcordiumWallet(address: string, message: string, signature: string, publicKey?: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/concordium/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({
                account_address: address,
                message,
                signature,
                public_key: publicKey
            })
        });
        if (!res.ok) throw new Error("Failed to link wallet");
        return res.json();
    }

    static async connectConcordiumWallet(address: string, message: string, signature: string, publicKey?: string): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/concordium/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                account_address: address,
                message,
                signature,
                public_key: publicKey
            })
        });
        if (!res.ok) throw new Error("Failed to connect wallet");
        return res.json();
    }

    // --- NEW: Public / Transparency / Ecosystem API ---

    static async getPublicEstimate(data: { procedure_name: string, insurance_tier: string, symptoms?: string }): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/billing/estimate/public`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (e) {
            console.error("Estimate Error:", e);
            throw e;
        }
    }

    static async getPublicSystemLogs(): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/system/public/logs`, {
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("Logs Error:", e);
            return [];
        }
    }

    static async getIoTDeviceData(patientId: string): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/iot/vitals/${patientId}`, {
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("IoT Error:", e);
            // Fallback for visual continuity if server fails
            return [];
        }
    }
}

// --- EXPORTS FOR BACKWARD COMPATIBILITY (DEPRECATED) ---
export const mockUsers: User[] = [];
export const mockCases: Case[] = [];
export const mockComments: Comment[] = [];

// --- HELPER FUNCTIONS (Adapters for backward compatibility during refactor) ---

export const getDoctorProfileById = DataService.getDoctorProfile;
export const updateDoctorProfile = DataService.updateDoctorProfile;
export const updateCaseStatus = DataService.updateCaseStage;
export const assignSpecialist = DataService.assignSpecialist;

// Wrappers to maintain old sync signature if needed, but preferably usage should switch to async await
export const addCaseComment = DataService.addComment;
export const getCaseComments = DataService.getCaseComments;

export const getPatientProfileById = DataService.getPatientById;
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

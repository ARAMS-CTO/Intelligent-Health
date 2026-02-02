import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../components/Auth';
import { DataService, GeminiService } from '../services/api';
import { ICONS } from '../constants/index';
import { MedicalRecord } from '../types/index';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';
import { CreditBalance } from '../components/CreditBalance';
import { ReferralCard } from '../components/ReferralCard';
import { VitalsSummary } from '../components/VitalsTracker';
import { MessagingCenter, QuickMessageButton } from '../components/MessagingCenter';
import { TelemedicineQuickActions } from '../components/VideoConsultation';


// --- Inline Components ---

const HealthRecordsList = ({ records, onUpload, onGenerateSummary, t }: { records: MedicalRecord[], onUpload: (file: File) => void, onGenerateSummary: (id: string) => void, t: any }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploading(true);
            try {
                await onUpload(e.target.files[0]);
            } catch (err) {
                console.error(err);
                showToast.error("Upload failed");
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <>
            <div className="glass-card p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        {ICONS.document} {t('dashboard.my_health_records', 'My Health Records')}
                    </h3>
                    <label className="cursor-pointer bg-primary text-white font-bold py-2 px-4 rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2">
                        {isUploading ? <span className="animate-spin">⌛</span> : ICONS.plus}
                        <span>{t('dashboard.upload_record', 'Upload Record')}</span>
                        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} disabled={isUploading} />
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {records.length === 0 ? (
                        <p className="text-gray-500 italic col-span-2 text-center py-8">{t('dashboard.no_records', 'No records uploaded yet.')}</p>
                    ) : (
                        records.map((rec) => (
                            <div
                                key={rec.id}
                                onClick={() => setSelectedRecord(rec)}
                                className="border border-slate-200 dark:border-slate-700 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                            {rec.type === 'Lab' ? ICONS.lab : rec.type === 'Prescription' ? ICONS.medication : ICONS.document}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">{rec.title || "Untitled Record"}</h4>
                                            <p className="text-xs text-gray-500">{new Date(rec.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-md">{rec.type}</span>
                                </div>
                                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg truncate">
                                    <span className="font-bold text-indigo-500 mr-1">{t('dashboard.ai_summary', 'AI Summary')}:</span>
                                    {rec.aiSummary || t('dashboard.pending', 'Pending...')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {selectedRecord && (
                <Modal isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)}>
                    <div className="p-6 max-w-2xl mx-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{selectedRecord.title}</h2>
                                <p className="text-sm text-gray-500">{new Date(selectedRecord.createdAt).toLocaleString()} • {selectedRecord.type}</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                {selectedRecord.type === 'Lab' ? ICONS.lab : ICONS.document}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-6">
                            <h3 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
                                {ICONS.ai} {t('dashboard.ai_analysis_summary', 'AI Analysis & Summary')}
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {selectedRecord.aiSummary || t('dashboard.no_summary', 'No summary available.')}
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <a href={selectedRecord.fileUrl} target="_blank" rel="noreferrer"
                                className={`px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors ${!selectedRecord.fileUrl ? 'pointer-events-none opacity-50' : ''}`}>
                                {t('dashboard.download_file', 'Download File')}
                            </a>
                            <button onClick={() => setSelectedRecord(null)} className="px-4 py-2 rounded-xl font-bold bg-primary text-white hover:bg-primary-hover transition-colors">
                                {t('common.close', 'Close')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

// Upcoming Appointments Widget
const UpcomingAppointments = ({ t }: { t: any }) => {
    const [appointments, setAppointments] = useState<any[]>([]);

    useEffect(() => {
        // Mock appointments
        setAppointments([
            { id: '1', doctor: 'Dr. Sarah Chen', specialty: 'Primary Care', date: new Date(Date.now() + 86400000 * 2), type: 'check-up', status: 'confirmed' },
            { id: '2', doctor: 'Dr. Michael Ross', specialty: 'Cardiology', date: new Date(Date.now() + 86400000 * 5), type: 'follow-up', status: 'pending' },
            { id: '3', doctor: 'Dr. Emily Watson', specialty: 'Dermatology', date: new Date(Date.now() + 86400000 * 10), type: 'consultation', status: 'confirmed' },
        ]);
    }, []);

    return (
        <div className="glass-card p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    📅 {t('dashboard.upcoming_appointments', 'Upcoming Appointments')}
                </h3>
                <a href="/appointments" className="text-xs font-bold text-primary hover:underline">{t('common.view_all', 'View All')}</a>
            </div>
            <div className="space-y-3">
                {appointments.map(apt => (
                    <div key={apt.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-primary">{apt.date.toLocaleDateString('en', { month: 'short' })}</span>
                            <span className="text-lg font-black text-primary">{apt.date.getDate()}</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">{apt.doctor}</h4>
                            <p className="text-xs text-slate-500">{apt.specialty} • {apt.type}</p>
                        </div>
                        <div className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${apt.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                            {apt.status}
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-4 py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors">
                + {t('dashboard.book_appointment', 'Book New Appointment')}
            </button>
        </div>
    );
};

// Medication Reminders Widget
const MedicationReminders = ({ t }: { t: any }) => {
    const [medications, setMedications] = useState<any[]>([]);

    useEffect(() => {
        setMedications([
            { id: '1', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', nextDose: '8:00 PM', taken: false, icon: '💊' },
            { id: '2', name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', nextDose: 'Tomorrow 9:00 AM', taken: true, icon: '💉' },
            { id: '3', name: 'Vitamin D3', dosage: '2000 IU', frequency: 'Once daily', nextDose: 'Tomorrow 9:00 AM', taken: true, icon: '☀️' },
        ]);
    }, []);

    const markTaken = (id: string) => {
        setMedications(prev => prev.map(m => m.id === id ? { ...m, taken: true } : m));
        showToast.success('Medication marked as taken!');
    };

    return (
        <div className="glass-card p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    💊 {t('dashboard.medication_tracker', 'Medication Tracker')}
                </h3>
                <a href="/medications" className="text-xs font-bold text-primary hover:underline">{t('common.manage', 'Manage')}</a>
            </div>
            <div className="space-y-3">
                {medications.map(med => (
                    <div key={med.id} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${med.taken ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800'
                        }`}>
                        <div className="text-2xl">{med.icon}</div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm">{med.name} <span className="font-normal text-slate-500">{med.dosage}</span></h4>
                            <p className="text-xs text-slate-500">{med.frequency} • Next: {med.nextDose}</p>
                        </div>
                        {!med.taken ? (
                            <button
                                onClick={() => markTaken(med.id)}
                                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors"
                            >
                                Take Now
                            </button>
                        ) : (
                            <span className="text-green-600 text-xs font-bold flex items-center gap-1">✓ Taken</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Health Goals Widget
const HealthGoals = ({ t }: { t: any }) => {
    const goals = [
        { id: '1', name: 'Daily Steps', target: 10000, current: 7234, unit: 'steps', icon: '🚶' },
        { id: '2', name: 'Water Intake', target: 8, current: 5, unit: 'glasses', icon: '💧' },
        { id: '3', name: 'Sleep', target: 8, current: 6.5, unit: 'hours', icon: '😴' },
        { id: '4', name: 'Exercise', target: 30, current: 20, unit: 'mins', icon: '🏃' },
    ];

    return (
        <div className="glass-card p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    🎯 {t('dashboard.todays_health_goals', "Today's Health Goals")}
                </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {goals.map(goal => {
                    const progress = Math.min((goal.current / goal.target) * 100, 100);
                    return (
                        <div key={goal.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{goal.icon}</span>
                                <span className="text-xs font-bold text-slate-500">{goal.name}</span>
                            </div>
                            <div className="text-xl font-black text-slate-800 dark:text-white">
                                {goal.current}<span className="text-sm font-normal text-slate-400">/{goal.target} {goal.unit}</span>
                            </div>
                            <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-primary' : 'bg-amber-500'
                                        }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Quick Actions Widget
const QuickActions = () => {
    const actions = [
        { id: '1', name: 'Start Telemedicine', icon: '📹', color: 'from-blue-500 to-cyan-500', href: '/telemedicine' },
        { id: '2', name: 'Find Care', icon: '🔍', color: 'from-indigo-500 to-purple-500', href: '/care-finder' },
        { id: '3', name: 'View Lab Results', icon: '🧪', color: 'from-purple-500 to-pink-500', href: '/lab-results' },
        { id: '4', name: 'Message Doctor', icon: '💬', color: 'from-green-500 to-emerald-500', href: '/messages' },
        { id: '5', name: 'Emergency Help', icon: '🚨', color: 'from-red-500 to-orange-500', href: '/emergency' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {actions.map(action => (
                <a
                    key={action.id}
                    href={action.href}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${action.color} text-white text-center hover:shadow-lg hover:scale-[1.02] transition-all`}
                >
                    <div className="text-3xl mb-2">{action.icon}</div>
                    <div className="text-xs font-bold">{action.name}</div>
                </a>
            ))}
        </div>
    );
};

const PatientVitalsWidget = ({ healthData, profile, t }: { healthData: any, profile: any, t: any }) => {
    const getLatest = (type: string) => {
        if (!healthData || !healthData[type] || healthData[type].length === 0) return null;
        return healthData[type][0];
    };

    const steps = getLatest('steps');
    const heartRate = getLatest('heart_rate');

    return (
        <div className="glass-card p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    {ICONS.activity} {t('dashboard.live_vitals', 'Live Vitals & Trends')}
                </h3>
                <div className="flex gap-2">
                    <a href="/health-trends" className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors">
                        {t('dashboard.view_charts', 'View Charts')} ↗
                    </a>
                    <a href="/body-map" className="px-3 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors">
                        {t('dashboard.digital_twin', 'Digital Twin')} ↗
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Steps (Today)</div>
                    <div className="text-2xl font-black text-blue-900 dark:text-blue-100">{steps ? steps.value : '--'}</div>
                    <div className="text-xs text-blue-400 dark:text-blue-500 mt-1">{steps ? 'Synced via App' : 'No data'}</div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                    <div className="text-xs text-red-600 dark:text-red-400 font-bold uppercase mb-1">Heart Rate</div>
                    <div className="text-2xl font-black text-red-900 dark:text-red-100">{heartRate ? `${heartRate.value} bpm` : '--'}</div>
                    <div className="text-xs text-red-400 dark:text-red-500 mt-1">{heartRate ? 'Avg. Last 24h' : 'No data'}</div>
                </div>
                <a href="/body-map" className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl border border-transparent text-white hover:shadow-lg transition-all transform hover:scale-[1.02] flex flex-col justify-center items-center text-center cursor-pointer group">
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🧘‍♂️</div>
                    <div className="text-xs font-bold uppercase">{t('dashboard.open_digital_twin', 'Open Digital Twin')}</div>
                </a>
                <a href="/data-sharing" className="p-4 bg-slate-800 dark:bg-slate-700 rounded-xl border border-slate-700 text-white hover:shadow-lg transition-all transform hover:scale-[1.02] flex flex-col justify-center items-center text-center cursor-pointer group">
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🛡️</div>
                    <div className="text-xs font-bold uppercase">{t('dashboard.blockchain_security', 'Blockchain Security')}</div>
                </a>
            </div>
        </div>
    );
};

const PatientAgentChat = ({ patientName, t }: { patientName: string, t: any }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: t('dashboard.agent.greeting', `Hello ${patientName}, I am your personal health assistant. How can I help you today?`, { name: patientName }) }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const response = await GeminiService.getPatientChatResponse(messages, userMsg);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: t('dashboard.agent.connection_error', "Sorry, I'm having trouble connecting right now.") }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-card rounded-2xl flex flex-col h-[400px]">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary/10 to-indigo-500/10 rounded-t-2xl">
                <h3 className="font-bold flex items-center gap-2 text-primary">
                    {ICONS.ai} {t('dashboard.agent.title', 'Personal Health Agent')}
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && <div className="flex justify-start"><div className="bg-gray-100 dark:bg-slate-700 p-3 rounded-2xl animate-pulse">{t('dashboard.agent.thinking', 'Thinking...')}</div></div>}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-slate-700">
                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 focus:ring-2 focus:ring-primary"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={t('dashboard.agent.placeholder', "Ask about your health...")}
                    />
                    <button onClick={handleSend} disabled={isLoading} className="p-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors">
                        {ICONS.send}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Dashboard ---

const PatientDashboard: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'agent'>('overview');
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [healthData, setHealthData] = useState<any>({});
    const [statsProfile, setStatsProfile] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            if (user?.patientProfileId) {
                try {
                    const recs = await DataService.getMedicalRecords(user.patientProfileId);
                    setRecords(recs);
                    const hData = await DataService.getPatientHealthData(user.patientProfileId);
                    setHealthData(hData);
                    const profile = await DataService.getPatientProfile(user.patientProfileId);
                    setStatsProfile(profile);
                } catch (e) {
                    console.error("Failed to load records", e);
                }
            }
        };
        loadData();
    }, [user]);

    const handleUploadRecord = async (file: File) => {
        const tempId = "temp-" + Date.now();
        const tempRecord: MedicalRecord = {
            id: tempId,
            title: file.name,
            type: "Processing...",
            createdAt: new Date().toISOString(),
            aiSummary: "Uploading and analyzing...",
            fileUrl: "",
            patientId: user?.patientProfileId || "",
            uploaderId: user?.id || "",
            contentText: ""
        };
        setRecords(prev => [tempRecord, ...prev]);

        try {
            const result = await GeminiService.analyzeFile(file, "medical_record");
            if (user?.patientProfileId) {
                setTimeout(async () => {
                    try {
                        const recs = await DataService.getMedicalRecords(user.patientProfileId!);
                        const found = recs.some(r => r.id === result.record_id);
                        if (recs.length > 0 && found) {
                            setRecords(recs);
                        } else {
                            setRecords(prev => prev.map(r => r.id === tempId ? {
                                ...r,
                                id: result.record_id || r.id,
                                type: result.analysis?.document_type || result.analysis?.type || "Document",
                                aiSummary: result.analysis?.summary || "Summary generated.",
                                title: result.analysis?.title || file.name
                            } : r));
                        }
                    } catch (e) {
                        setRecords(prev => prev.map(r => r.id === tempId ? {
                            ...r,
                            id: result.record_id || r.id,
                            type: result.analysis?.document_type || "Document",
                            aiSummary: result.analysis?.summary || "Summary generated.",
                            title: result.analysis?.title || file.name
                        } : r));
                    }
                }, 1000);
            }
            showToast.success(`Analysis Complete: ${result.analysis?.document_type || "Document"} processed.`);
        } catch (e: any) {
            console.error("Upload failed", e);
            setRecords(prev => prev.filter(r => r.id !== tempId));
            showToast.error("Upload/Analysis failed.");
        }
    };

    const handleGenerateSummary = async (recordId: string) => {
        showToast.info("Feature coming soon");
    };

    if (!user) return <div className="p-8 text-center">Please log in.</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-heading font-black text-gray-900 dark:text-white">
                        {t('dashboard.welcome_back', 'Welcome back')}, <span className="text-primary">{user.name?.split(' ')[0] || t('common.patient', 'Patient')}</span>
                    </h1>
                    <p className="text-gray-500 mt-1">{t('dashboard.personal_health_center', 'Your personal health command center')}</p>
                </div>
                <div className="flex gap-3">
                    <a href="/telemedicine" className="px-4 py-2 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
                        📹 {t('dashboard.start_telemedicine', 'Start Telemedicine')}
                    </a>
                </div>
            </header>

            {/* Profile Completion Banner */}
            {!user.patientProfileId && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/50 text-amber-600 rounded-xl">
                            {ICONS.user}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100">{t('dashboard.complete_profile', 'Complete Your Profile')}</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-200/70">{t('dashboard.complete_profile_desc', 'We need your medical history to provide personalized AI insights.')}</p>
                        </div>
                    </div>
                    <button onClick={() => window.location.href = '/patient-intake'} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg transition-all">
                        Go to Intake →
                    </button>
                </div>
            )}

            {/* Quick Actions */}
            <QuickActions />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {['overview', 'records', 'agent'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all capitalize ${activeTab === tab
                                    ? 'bg-white dark:bg-slate-700 shadow-sm'
                                    : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                {tab === 'overview' && '📊 '}{tab === 'records' && '📁 '}{tab === 'agent' && '🤖 '}
                                {t(`dashboard.tabs.${tab}`, tab)}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-fade-in">
                            <PatientVitalsWidget healthData={healthData} profile={statsProfile} t={t} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <UpcomingAppointments t={t} />
                                <MedicationReminders t={t} />
                            </div>
                            <HealthGoals t={t} />
                            <HealthRecordsList records={records.slice(0, 4)} onUpload={handleUploadRecord} onGenerateSummary={handleGenerateSummary} t={t} />
                        </div>
                    )}

                    {activeTab === 'records' && (
                        <div className="animate-fade-in">
                            <HealthRecordsList records={records} onUpload={handleUploadRecord} onGenerateSummary={handleGenerateSummary} t={t} />
                        </div>
                    )}

                    {activeTab === 'agent' && (
                        <div className="animate-fade-in lg:hidden">
                            <PatientAgentChat patientName={user.name?.split(' ')[0] || 'User'} t={t} />
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="hidden lg:block space-y-6">
                    <CreditBalance />
                    <ReferralCard />
                    <PatientAgentChat patientName={user.name?.split(' ')[0] || 'User'} t={t} />
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;

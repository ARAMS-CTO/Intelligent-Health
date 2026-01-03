import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService, GeminiService } from '../services/api';
import { ICONS } from '../constants/index';
import { MedicalRecord } from '../types/index';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

// Components (We will extract these later or keep inline for speed)
const HealthRecordsList = ({ records, onUpload }: { records: MedicalRecord[], onUpload: (file: File) => void }) => {
    const [isUploading, setIsUploading] = useState(false);

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
        <div className="glass-card p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    {ICONS.document} My Health Records
                </h3>
                <label className="cursor-pointer bg-primary text-white font-bold py-2 px-4 rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2">
                    {isUploading ? <span className="animate-spin">⌛</span> : ICONS.plus}
                    <span>Upload Record</span>
                    <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} disabled={isUploading} />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {records.length === 0 ? (
                    <p className="text-gray-500 italic col-span-2 text-center py-8">No records uploaded yet.</p>
                ) : (
                    records.map((rec) => (
                        <div key={rec.id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
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
                            {rec.aiSummary && (
                                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                                    <span className="font-bold text-indigo-500">AI Summary:</span> {rec.aiSummary}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const PatientAppointments = ({ cases }: { cases: any[] }) => {
    return (
        <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                {ICONS.calendar} Active Cases & Visits
            </h3>
            <div className="space-y-4">
                {cases.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div>
                            <h4 className="font-bold">{c.title}</h4>
                            <p className="text-sm text-gray-500">{c.status} • {new Date(c.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button className="text-primary font-bold text-sm hover:underline">View Details</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PatientAgentChat = ({ patientName }: { patientName: string }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: `Hello ${patientName}, I am your personal health assistant. I have access to your uploaded records. How can I help you today?` }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            // Real RAG Chat
            const response = await GeminiService.chatWithPatientAgent(messages, userMsg);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-card rounded-2xl flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary/10 to-indigo-500/10 rounded-t-2xl">
                <h3 className="font-bold flex items-center gap-2 text-primary">
                    {ICONS.ai} Personal Health Agent
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
                {isLoading && <div className="flex justify-start"><div className="bg-gray-100 dark:bg-slate-700 p-3 rounded-2xl animate-pulse">Thinking...</div></div>}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-slate-700">
                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 focus:ring-2 focus:ring-primary"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about your cholesterol, results..."
                    />
                    <button onClick={handleSend} disabled={isLoading} className="p-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors">
                        {ICONS.send}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PatientDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'agent'>('overview');

    // Mock Data (Replace with API calls)
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [cases, setCases] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (user?.patientProfileId) {
                try {
                    const recs = await DataService.getPatientRecords(user.patientProfileId);
                    setRecords(recs);
                } catch (e) {
                    console.error("Failed to load records", e);
                }
            } else if (user?.role === 'Patient') {
                // Try to fetch profile if ID is missing (backend might have resolved it)
                // Or fetch current user profile logic
                // For now, if no ID, we can't fetch.
                // But wait, user object might not have patientProfileId if it wasn't populated on login or refetch.
                // Let's assume we can rely on DataService if we implemented it to look up by user ID?
                // Current getPatientRecords takes patientId. 
                // Note: user.patientProfileId property exists on User interface?
            }
        };
        loadData();
    }, [user]);

    const handleUploadRecord = async (file: File) => {
        try {
            const result = await GeminiService.uploadPatientRecord(file);

            // Re-fetch records to get the full DB object with URL
            if (user?.patientProfileId) {
                const recs = await DataService.getPatientRecords(user.patientProfileId);
                setRecords(recs);
            } else {
                // Fallback optimistic update if partial data
                setRecords(prev => [{
                    id: result.record_id,
                    title: result.analysis.title,
                    type: result.analysis.type,
                    createdAt: new Date().toISOString(),
                    aiSummary: result.analysis.summary,
                    fileUrl: result.file_url || "",
                    patientId: user?.id || "",
                    uploaderId: user?.id || "",
                    contentText: ""
                }, ...prev]);
            }
            showToast.success(`Analysis Complete: ${result.analysis.type} processed.`);
        } catch (e: any) {
            console.error("Upload failed", e);
            throw e;
        }
    };

    if (!user) return <div className="p-8 text-center">Please log in.</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <header className="mb-8">
                <h1 className="text-4xl font-heading font-black text-gray-900 dark:text-white">
                    Welcome, <span className="text-primary">{user.name || 'Patient'}</span>
                </h1>
                <p className="text-gray-500 mt-2">Manage your health journey with AI-powered insights.</p>
            </header>

            {!user.patientProfileId && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/50 text-amber-600 rounded-xl">
                            {ICONS.user}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100">Complete Your Profile</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-200/70">We need your medical history to provide personalized AI insights.</p>
                        </div>
                    </div>
                    <button onClick={() => window.location.href = '/patient-intake'} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1">
                        Go to Intake &rarr;
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <button onClick={() => setActiveTab('overview')} className={`p-4 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-gray-50'}`}>Overview</button>
                        <button onClick={() => setActiveTab('records')} className={`p-4 rounded-xl font-bold transition-all ${activeTab === 'records' ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-gray-50'}`}>Records</button>
                        <button onClick={() => setActiveTab('agent')} className={`p-4 rounded-xl font-bold transition-all ${activeTab === 'agent' ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-gray-50'}`}>AI Agent</button>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    {ICONS.calendar} Active Cases & Visits <span className="text-xs text-text-muted font-normal">(Coming Soon)</span>
                                </h3>
                                {user?.role === 'Admin' ? (
                                    <>
                                        <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] px-2 py-1 rounded font-bold shadow opacity-80 z-10">Mock Data Preview</div>
                                        <div className="space-y-4 opacity-75">
                                            {[1, 2].map(i => (
                                                <div key={i} className="flex justify-between items-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                                    <div>
                                                        <h4 className="font-bold">Follow-up Consultation</h4>
                                                        <p className="text-sm text-gray-500">Scheduled • Oct {10 + i}, 2025</p>
                                                    </div>
                                                    <button className="text-primary font-bold text-sm hover:underline" disabled>View Details</button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-8 text-center text-gray-400 italic border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                        Appointment Scheduling & Case Tracking coming in v2.0
                                    </div>
                                )}
                            </div>

                            <HealthRecordsList records={records.slice(0, 3)} onUpload={handleUploadRecord} />
                        </div>
                    )}

                    {activeTab === 'records' && (
                        <div className="animate-fade-in">
                            <HealthRecordsList records={records} onUpload={handleUploadRecord} />
                        </div>
                    )}

                    {activeTab === 'agent' && (
                        <div className="animate-fade-in block lg:hidden">
                            <PatientAgentChat patientName={user.name?.split(' ')[0] || 'User'} />
                        </div>
                    )}
                </div>

                <div className="hidden lg:block lg:col-span-1">
                    <PatientAgentChat patientName={user.name?.split(' ')[0] || 'User'} />
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;

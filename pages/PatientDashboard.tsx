import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService, GeminiService } from '../services/api';
import { ICONS } from '../constants/index';
import { MedicalRecord } from '../types/index';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

// Components (We will extract these later or keep inline for speed)
const HealthRecordsList = ({ records, onUpload, onGenerateSummary }: { records: MedicalRecord[], onUpload: (file: File) => void, onGenerateSummary: (id: string) => void }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);

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

    const handleGenerateClick = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setAnalyzingIds(prev => [...prev, id]);
        try {
            await onGenerateSummary(id);
        } catch (err) {
            console.error(err);
            showToast.error("Analysis failed");
        } finally {
            setAnalyzingIds(prev => prev.filter(x => x !== id));
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

                            {/* AI Summary Section */}
                            <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                                <span className="font-bold text-indigo-500">AI Summary:</span>
                                {(!rec.aiSummary || rec.aiSummary === "Pending Analysis" || rec.aiSummary === "No AI summary available.") ? (
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="italic text-gray-400">Not available</span>
                                        <button
                                            onClick={(e) => handleGenerateClick(e, rec.id)}
                                            disabled={analyzingIds.includes(rec.id)}
                                            className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-xs hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center gap-1"
                                        >
                                            {analyzingIds.includes(rec.id) ? (
                                                <>Processing...</>
                                            ) : (
                                                <>{ICONS.ai} Generate Summary</>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <span className="ml-1">{rec.aiSummary}</span>
                                )}
                            </div>
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

const PatientVitals = ({ healthData, profile }: { healthData: any, profile: any }) => {
    // Helper to get latest value
    const getLatest = (type: string) => {
        if (!healthData || !healthData[type] || healthData[type].length === 0) return null;
        return healthData[type][0];
    };

    const steps = getLatest('steps');
    const heartRate = getLatest('heart_rate');
    const weight = getLatest('weight'); // From integration
    // Fallback to profile weight/height if not in integration data
    const displayWeight = weight ? `${weight.value.toFixed(1)} ${weight.unit}` : (profile?.weight ? `${profile.weight} kg` : '--');
    const displayHeight = profile?.height ? `${profile.height} cm` : '--';

    return (
        <div className="glass-card p-6 rounded-2xl mb-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                {ICONS.activity} Recent Vitals & Activity
            </h3>
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
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1">Weight</div>
                    <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{displayWeight}</div>
                    <div className="text-xs text-emerald-400 dark:text-emerald-500 mt-1">Recorded</div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase mb-1">Height</div>
                    <div className="text-2xl font-black text-purple-900 dark:text-purple-100">{displayHeight}</div>
                    <div className="text-xs text-purple-400 dark:text-purple-500 mt-1">Profile</div>
                </div>
            </div>
            <div className="mt-4 text-center">
                <a href="/patient/integrations" className="text-primary text-sm font-bold hover:underline">Manage Integrations & Sync Data &rarr;</a>
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
    const [healthData, setHealthData] = useState<any>({});
    const [statsProfile, setStatsProfile] = useState<any>(null); // To store profile even if we don't have full object from context

    const [dailyCheckup, setDailyCheckup] = useState<{ questions: string[], greeting: string } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (user?.patientProfileId) {
                try {
                    const recs = await DataService.getMedicalRecords(user.patientProfileId);
                    setRecords(recs);

                    // Fetch Health Data & Profile
                    const hData = await DataService.getPatientHealthData(user.patientProfileId);
                    setHealthData(hData);

                    const profile = await DataService.getPatientProfile(user.patientProfileId);
                    setStatsProfile(profile);

                    // Fetch Daily Checkup (Patient Agent)
                    const checkup = await GeminiService.getDailyCheckupQuestions();
                    setDailyCheckup(checkup);

                } catch (e) {
                    console.error("Failed to load records", e);
                }
            } else if (user?.role === 'Patient') {
                // Try to load simple checkup even without profile
                const checkup = await GeminiService.getDailyCheckupQuestions();
                setDailyCheckup(checkup);
            }
        };
        loadData();
    }, [user]);

    const handleUploadRecord = async (file: File) => {
        try {
            const result = await GeminiService.uploadPatientRecord(file);

            // Re-fetch records to get the full DB object with URL
            if (user?.patientProfileId) {
                const recs = await DataService.getMedicalRecords(user.patientProfileId);
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

    const handleGenerateSummary = async (recordId: string) => {
        try {
            const result = await GeminiService.analyzeRecord(recordId);

            if (result.status === 'error') {
                showToast.error(result.message || "AI Analysis Failed");
                return;
            }

            // Update State
            // Update State
            setRecords(prev => prev.map(r => {
                if (r.id === recordId) {
                    // Check if analysis is nested or direct
                    const analysis = result.analysis || result;
                    return {
                        ...r,
                        aiSummary: analysis.summary || "Summary generated.",
                        type: analysis.type || "Document",
                        title: analysis.title || r.title,
                        contentText: analysis.content_text || "",
                    };
                }
                return r;
            }));

            showToast.success("AI Summary Generated!");
        } catch (e: any) {
            console.error("Analysis Failed", e);
            showToast.error(e.message || "Analysis request failed");
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
                {dailyCheckup && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl">
                        <h4 className="font-bold text-blue-800 dark:text-blue-100 flex items-center gap-2">
                            {ICONS.ai} {dailyCheckup.greeting}
                        </h4>
                        <div className="mt-2 space-y-2">
                            {dailyCheckup.questions.map((q, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="bg-white dark:bg-slate-700 px-2 rounded-full text-xs font-bold text-primary border border-gray-100 dark:border-slate-600">?</span>
                                    {q}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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

                            <PatientVitals healthData={healthData} profile={statsProfile} />

                            <HealthRecordsList records={records.slice(0, 3)} onUpload={handleUploadRecord} onGenerateSummary={handleGenerateSummary} />
                        </div>
                    )}

                    {activeTab === 'records' && (
                        <div className="animate-fade-in">
                            <HealthRecordsList records={records} onUpload={handleUploadRecord} onGenerateSummary={handleGenerateSummary} />
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

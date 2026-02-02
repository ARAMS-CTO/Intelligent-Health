import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ICONS } from '../constants/index';
import { showToast } from '../components/Toast';

interface SharedData {
    patient_name: string;
    generated_at: string;
    expires_at: string;
    sections: {
        history?: {
            baseline_illnesses: string[];
            allergies: string[];
        };
        medications?: any[];
        records?: any[];
    }
}

const SharedView: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [data, setData] = useState<SharedData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/sharing/view/${token}`);
                if (!res.ok) {
                    if (res.status === 410) throw new Error("This link has expired.");
                    if (res.status === 404) throw new Error("Invalid link.");
                    throw new Error("Failed to load shared data.");
                }
                const json = await res.json();
                setData(json);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchData();
    }, [token]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-8 text-center border-l-4 border-danger">
                <div className="text-danger text-4xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-text-main mb-2">Access Denied</h1>
                <p className="text-text-muted">{error}</p>
            </div>
        </div>
    );

    if (!data) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">Medical Record Share</h1>
                        <p className="text-sm text-text-muted">Patient: <span className="font-bold text-primary">{data.patient_name}</span></p>
                    </div>
                    <div className="text-right text-xs text-text-muted bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                        <p>Expires: {new Date(data.expires_at).toLocaleString()}</p>
                    </div>
                </div>

                {/* History Section */}
                {data.sections.history && (
                    <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700">
                        <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                            {ICONS.user} Medical History
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                <h3 className="text-xs font-bold text-red-600 uppercase mb-2">Allergies</h3>
                                <div className="flex flex-wrap gap-2">
                                    {data.sections.history.allergies?.map(a => <span key={a} className="bg-white px-2 py-1 rounded border border-red-200 text-xs font-bold text-red-700">{a}</span>) || "None"}
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                <h3 className="text-xs font-bold text-blue-600 uppercase mb-2">Conditions</h3>
                                <div className="flex flex-wrap gap-2">
                                    {data.sections.history.baseline_illnesses?.map(i => <span key={i} className="bg-white px-2 py-1 rounded border border-blue-200 text-xs font-bold text-blue-700">{i}</span>) || "None"}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Medications Section */}
                {data.sections.medications && (
                    <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700">
                        <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                            {ICONS.pill} Current Medications
                        </h2>
                        <div className="space-y-2">
                            {data.sections.medications.map((m, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <span className="font-bold text-text-main">{m.name}</span>
                                    <span className="text-sm text-text-muted">{m.dosage} - {m.frequency}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Records Section */}
                {data.sections.records && (
                    <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700">
                        <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                            {ICONS.upload} Shared Documents
                        </h2>
                        <div className="space-y-4">
                            {data.sections.records.map((r, idx) => (
                                <div key={idx} className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between mb-2">
                                        <div className="flex gap-3">
                                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                                {ICONS.upload}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-main">{r.title || r.type}</p>
                                                <p className="text-xs text-text-muted">{new Date(r.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <a href={r.url} target="_blank" rel="noreferrer" className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg h-fit flex items-center">
                                            View
                                        </a>
                                    </div>
                                    {r.summary && (
                                        <div className="bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-600 p-3 rounded-lg text-sm text-text-main">
                                            <span className="text-primary font-bold text-xs uppercase block mb-1">AI Summary</span>
                                            {r.summary}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedView;

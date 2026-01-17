
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { useTranslation } from 'react-i18next';
import { Case } from '../types';

const LabDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation('dashboard');
    const [labs, setLabs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLab, setSelectedLab] = useState<any | null>(null);
    const [resultForm, setResultForm] = useState({ value: '', unit: '', reference_range: '', interpretation: '' });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const pending = await DataService.getPendingLabs();
            setLabs(pending);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleRecordResult = async () => {
        if (!selectedLab) return;
        try {
            await DataService.recordLabResult(selectedLab.id, resultForm);
            loadData(); // Refresh
            setSelectedLab(null);
            setResultForm({ value: '', unit: '', reference_range: '', interpretation: '' });
        } catch (e) {
            alert("Failed to record result");
        }
    };

    if (!user) return null;

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen p-8">
            <header className="mb-12 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white">
                        Laboratory <span className="text-primary">Services</span>
                    </h1>
                    <p className="text-slate-500 mt-2">Test Processing & Results</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 rounded-2xl border border-blue-200/50 bg-blue-50/50 dark:bg-blue-900/10">
                    <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2">Pending Samples</h4>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">{labs.length}</p>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Test Queue</h3>
                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400">Loading requests...</div>
                    ) : labs.length === 0 ? (
                        <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                            <div className="text-4xl mb-4 opacity-50">🧪</div>
                            <p className="font-bold text-slate-500">No pending lab requests.</p>
                        </div>
                    ) : (
                        labs.map(lab => (
                            <div key={lab.id} className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-2xl">🩸</div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white">{lab.test}</h4>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Case #{lab.case_id?.slice(0, 8)} • Ordered: {new Date(lab.ordered_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedLab(lab)}
                                    className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-hover text-sm"
                                >
                                    Enter Results
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Result Modal */}
            {selectedLab && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Record Results: {selectedLab.test}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Value</label>
                                <input
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2"
                                    value={resultForm.value}
                                    onChange={e => setResultForm({ ...resultForm, value: e.target.value })}
                                    placeholder="e.g. 120"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2"
                                        value={resultForm.unit}
                                        onChange={e => setResultForm({ ...resultForm, unit: e.target.value })}
                                        placeholder="e.g. mg/dL"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ref Range</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2"
                                        value={resultForm.reference_range}
                                        onChange={e => setResultForm({ ...resultForm, reference_range: e.target.value })}
                                        placeholder="e.g. 70-100"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Interpretation/Notes</label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 h-24"
                                    value={resultForm.interpretation}
                                    onChange={e => setResultForm({ ...resultForm, interpretation: e.target.value })}
                                    placeholder="Normal findings..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 justify-end">
                            <button
                                onClick={() => setSelectedLab(null)}
                                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRecordResult}
                                className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover"
                            >
                                Submit Results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabDashboard;

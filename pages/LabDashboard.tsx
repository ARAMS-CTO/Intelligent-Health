
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { useTranslation } from 'react-i18next';
import { Case } from '../types';

const LabDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation('dashboard');
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const allCases = await DataService.getCases();
                // Filter for Lab/Imaging related cases
                const labCases = allCases.filter(c =>
                    c.tags.some(tag => ['Lab', 'Blood', 'Test', 'Biospy'].includes(tag)) ||
                    c.title.toLowerCase().includes('lab') ||
                    c.title.toLowerCase().includes('blood')
                );
                setCases(labCases);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user]);

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
                <button className="bg-primary text-white font-bold py-3 px-6 rounded-2xl hover:bg-primary-hover transition-colors flex items-center gap-2">
                    {ICONS.plus} Record Results
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quick Stats */}
                <div className="glass-card p-6 rounded-2xl border border-blue-200/50 bg-blue-50/50 dark:bg-blue-900/10">
                    <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2">Pending Samples</h4>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">{cases.length}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-green-200/50 bg-green-50/50 dark:bg-green-900/10">
                    <h4 className="font-bold text-green-700 dark:text-green-300 mb-2">Completed Today</h4>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">14</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-amber-200/50 bg-amber-50/50 dark:bg-amber-900/10">
                    <h4 className="font-bold text-amber-700 dark:text-amber-300 mb-2">Urgent Requests</h4>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">2</p>
                </div>
            </div>

            <div className="mt-12">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Test Queue</h3>
                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400">Loading requests...</div>
                    ) : cases.length === 0 ? (
                        <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                            <div className="text-4xl mb-4 opacity-50">🧪</div>
                            <p className="font-bold text-slate-500">No pending lab requests.</p>
                        </div>
                    ) : (
                        cases.map(c => (
                            <div key={c.id} className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50 flex justify-between items-center hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-2xl">🩸</div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white">{c.title}</h4>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{c.patientId.slice(0, 8)} • Urgency: Normal</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider self-center">Received</span>
                                    <button className="text-primary font-bold hover:underline text-sm">Update Status</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabDashboard;

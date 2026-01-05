
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { useTranslation } from 'react-i18next';
import { Case } from '../types';

const RadiologyDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation('dashboard');
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const allCases = await DataService.getCases();
                // Filter for Lab/Imaging related cases
                // Assuming 'Imaging' or 'X-Ray' tags or type matches
                const radiologyCases = allCases.filter(c =>
                    c.tags.some(tag => ['X-Ray', 'MRI', 'CT', 'Ultrasound', 'Imaging'].includes(tag)) ||
                    c.title.toLowerCase().includes('scan') ||
                    c.title.toLowerCase().includes('x-ray')
                );
                setCases(radiologyCases);
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
                        Radiology <span className="text-primary">Center</span>
                    </h1>
                    <p className="text-slate-500 mt-2">Imaging Requests & Analysis</p>
                </div>
                <button className="bg-primary text-white font-bold py-3 px-6 rounded-2xl hover:bg-primary-hover transition-colors flex items-center gap-2">
                    {ICONS.plus} New Scan Upload
                </button>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {isLoading ? (
                    <div className="text-center py-12 text-slate-400">Loading requests...</div>
                ) : cases.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="text-4xl mb-4 opacity-50">☢️</div>
                        <p className="font-bold text-slate-500">No pending imaging requests.</p>
                    </div>
                ) : (
                    cases.map(c => (
                        <div key={c.id} className="glass-card p-6 rounded-3xl border border-white/20 dark:border-slate-700/50 hover:shadow-xl transition-all flex justify-between items-center group">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
                                        {c.tags.find(t => ['X-Ray', 'MRI', 'CT'].includes(t)) || 'Imaging'}
                                    </span>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-primary transition-colors">{c.title}</h3>
                                </div>
                                <p className="text-slate-500 text-sm max-w-xl">{c.complaint}</p>
                                <div className="mt-4 flex items-center gap-4 text-xs font-bold text-slate-400">
                                    <span>Patient ID: {c.patientId.slice(0, 8)}</span>
                                    <span>•</span>
                                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    Details
                                </button>
                                <button className="px-5 py-2.5 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-colors">
                                    Upload Report
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-12 p-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-[32px] border border-indigo-500/20">
                <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
                    {ICONS.ai} AI Assistant for Radiologists
                </h3>
                <p className="text-slate-600 dark:text-slate-300 max-w-3xl mb-6">
                    Use the AI Copilot (bottom right) to draft reports, analyze complex DICOM metadata, or check standard guidelines for incidental findings.
                </p>
            </div>
        </div>
    );
};

export default RadiologyDashboard;

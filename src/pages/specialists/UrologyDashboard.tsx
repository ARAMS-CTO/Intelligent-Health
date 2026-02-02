import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
// import { ClinicalVoiceRecorder } from '../../components/ClinicalVoiceRecorder'; // Removed
// import { showToast } from '../../components/Toast'; // Removed
import { SpecialistAgentChat } from '../../components/specialized/SpecialistAgentChat';

const UrologyDashboard: React.FC = () => {
    const { t } = useTranslation();
    // const [note, setNote] = useState(""); // Unused

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-amber-400">
                        Urology Dept
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Kidney Function & Urinary Health
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-primary">
                        {ICONS.plus} Lab Request
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Dialysis Patients</div>
                    <div className="text-2xl font-bold">4</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Stones Analysis</div>
                    <div className="text-2xl font-bold">7</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Procedures</div>
                    <div className="text-2xl font-bold">2</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Pending Labs</div>
                    <div className="text-2xl font-bold text-blue-500">15</div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6 rounded-3xl min-h-[400px]">
                    <h3 className="text-xl font-bold mb-4">Kidney Function Monitor (eGFR)</h3>
                    <div className="w-full h-64 bg-slate-50 dark:bg-slate-800/50 rounded-xl relative overflow-hidden p-4">
                        {/* Mock Graph Bars */}
                        <div className="flex items-end justify-between h-40 mt-10 gap-2">
                            {[90, 88, 85, 82, 75, 78, 80, 85, 89, 92, 90, 88].map((val, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity mb-1">{val}</div>
                                    <div
                                        className={`w-full rounded-t-lg transition-all hover:opacity-80 ${val < 80 ? 'bg-amber-400' : 'bg-blue-400'}`}
                                        style={{ height: `${val}%` }}
                                    ></div>
                                    <div className="text-[10px] text-slate-400">M{i + 1}</div>
                                </div>
                            ))}
                        </div>
                        <div className="absolute top-4 right-4 text-xs font-mono text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded shadow">
                            Trend: Stable (+2.1%)
                        </div>
                    </div>
                </div>

                <div className="flex flex-col h-full min-h-[400px]">
                    <SpecialistAgentChat
                        zone="urology"
                        contextId="kidney_stones_analysis"
                        className="h-full shadow-lg"
                    />
                </div>
            </div>
        </div>
    );
};

export default UrologyDashboard;

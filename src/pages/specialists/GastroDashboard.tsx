import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
// import { ClinicalVoiceRecorder } from '../../components/ClinicalVoiceRecorder'; // Removed
// import { showToast } from '../../components/Toast'; // Removed
import { SpecialistAgentChat } from '../../components/specialized/SpecialistAgentChat';

const GastroDashboard: React.FC = () => {
    const { t } = useTranslation();
    // const [procedureNote, setProcedureNote] = useState(""); // Unused

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-400">
                        Gastroenterology Dept
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Digestive System Analysis & Endoscopy
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-primary">
                        {ICONS.plus} Schedule Endoscopy
                    </button>
                    <button className="btn-secondary">
                        Diet Plan
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Endoscopies Today</div>
                    <div className="text-2xl font-bold">6</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Colonoscopies</div>
                    <div className="text-2xl font-bold">3</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Emergency Cases</div>
                    <div className="text-2xl font-bold text-red-500">1</div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-3xl h-full">
                    <h3 className="text-xl font-bold mb-4">Procedure Schedule</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                            <div>
                                <div className="font-bold">09:00 AM</div>
                                <div className="text-sm text-text-secondary">Upper GI Endoscopy</div>
                            </div>
                            <div className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-lg">Confirmed</div>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                            <div>
                                <div className="font-bold">11:00 AM</div>
                                <div className="text-sm text-text-secondary">Colonoscopy - Patient #442</div>
                            </div>
                            <div className="text-sm px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg">Prep Check</div>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl h-full space-y-4">
                    <h3 className="text-xl font-bold mb-4">AI Analysis - Polyp Detection</h3>
                    <div className="h-48 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-700">
                        <div className="absolute top-2 left-2 text-xs text-green-500 font-mono flex items-center gap-1">
                            <span className="animate-pulse">●</span> REC 00:14:22
                        </div>
                        <div className="text-slate-500 text-sm">Main Camera Feed</div>

                        {/* Mock Polyp Detection Box */}
                        <div className="absolute top-1/3 left-1/4 w-16 h-16 border-2 border-red-500 rounded-lg animate-pulse flex items-start justify-end">
                            <div className="bg-red-500 text-white text-[9px] font-bold px-1">98% Polyp</div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[400px]">
                        <SpecialistAgentChat
                            zone="gastroenterology"
                            contextId="polyp_detection_main"
                            className="h-full shadow-lg"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GastroDashboard;

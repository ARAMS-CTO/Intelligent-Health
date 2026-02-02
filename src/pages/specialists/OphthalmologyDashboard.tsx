import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
// import { ClinicalVoiceRecorder } from '../../components/ClinicalVoiceRecorder'; // Removed
// import { showToast } from '../../components/Toast'; // Removed
import { SpecialistAgentChat } from '../../components/specialized/SpecialistAgentChat';

const OphthalmologyDashboard: React.FC = () => {
    const { t } = useTranslation();
    // const [note, setNote] = useState(""); // Unused

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                        Ophthalmology Dept
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Vision Analysis & Retinal Imaging
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-primary">
                        {ICONS.plus} New Scan
                    </button>
                    <button className="btn-secondary">
                        Vision Tests
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Retinal Scans</div>
                    <div className="text-2xl font-bold">12</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Glaucoma Alerts</div>
                    <div className="text-2xl font-bold text-amber-500">2</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Surgeries (Cataract)</div>
                    <div className="text-2xl font-bold">5</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Diabetic Screening</div>
                    <div className="text-2xl font-bold text-blue-500">8</div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-3xl h-full">
                    <h3 className="text-xl font-bold mb-4">OCT / Retinal Imaging</h3>
                    <div className="aspect-video bg-black rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-700">
                        {/* Simulation of Retinal Scan */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(244,63,94,0.3),transparent_60%)]"></div>
                        <div className="absolute inset-0 bg-[conic-gradient(at_center,transparent,rgba(255,255,255,0.05))] opacity-50"></div>
                        <div className="w-full text-center z-10">
                            <span className="text-xs text-rose-400 font-mono">Analyzing Macula...</span>
                            <div className="w-64 h-2 bg-slate-800 rounded-full mx-auto mt-2 overflow-hidden">
                                <div className="h-full bg-rose-500 w-2/3 animate-[shimmer_1s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button className="flex-1 btn-secondary text-xs">Left Eye (OS)</button>
                        <button className="flex-1 btn-primary text-xs">Right Eye (OD)</button>
                    </div>
                </div>

                <div className="flex flex-col h-full min-h-[500px]">
                    <SpecialistAgentChat
                        zone="ophthalmology"
                        contextId="retinal_scan_main"
                        className="h-full shadow-lg"
                    />
                </div>
            </div>
        </div>
    );
};

export default OphthalmologyDashboard;

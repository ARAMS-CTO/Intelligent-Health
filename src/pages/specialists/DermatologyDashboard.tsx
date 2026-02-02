import React from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
// import { ClinicalVoiceRecorder } from '../../components/ClinicalVoiceRecorder'; // Removed
// import { showToast } from '../../components/Toast'; // Removed
import { SpecialistAgentChat } from '../../components/specialized/SpecialistAgentChat';

const DermatologyDashboard: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-rose-400">
                        Dermatology Dept
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Skin Logic & Lesion Analysis
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-primary">
                        {ICONS.plus} New Scan
                    </button>
                    <button className="btn-secondary">
                        Biopsy Log
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Scans Analyzed</div>
                    <div className="text-2xl font-bold">42</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">High Risk Lesions</div>
                    <div className="text-2xl font-bold text-red-500">2</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Biopsies Needed</div>
                    <div className="text-2xl font-bold text-amber-500">5</div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-3xl h-full">
                    <h3 className="text-xl font-bold mb-4">AI Skin Analysis</h3>
                    <div className="aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-xl flex flex-col items-center justify-center p-4">
                        <div className="w-full h-full bg-slate-900 rounded-lg mb-2 relative overflow-hidden group">
                            {/* Scanning Grid */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                            {/* Heatmap Overlay */}
                            <div className="absolute top-1/4 left-1/3 w-32 h-32 rounded-full bg-red-500/30 blur-xl animate-pulse"></div>
                            <div className="absolute top-10 left-10 w-20 h-20 border-2 border-red-500 rounded-full animate-ping opacity-20"></div>

                            {/* Crosshair Cursor */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="w-64 h-[1px] bg-cyan-500/50"></div>
                                <div className="absolute h-64 w-[1px] bg-cyan-500/50"></div>
                            </div>

                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white border border-white/10 text-xs px-3 py-1.5 rounded-lg flex flex-col items-end">
                                <span className="font-bold text-red-400">High Risk (Melanoma)</span>
                                <span className="text-[10px] opacity-70">Confidence: 94%</span>
                            </div>
                        </div>
                        <button className="btn-primary w-full mt-2">Upload Dermoscopy Image</button>
                    </div>
                </div>

                <div className="flex flex-col h-full min-h-[500px]">
                    <SpecialistAgentChat
                        zone="dermatology"
                        contextId="skin_analysis_main"
                        className="h-full shadow-xl"
                    />
                </div>
            </div>
        </div>
    );
};

export default DermatologyDashboard;

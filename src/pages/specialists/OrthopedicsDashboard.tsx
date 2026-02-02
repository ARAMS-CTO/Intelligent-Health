import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
// import { ClinicalVoiceRecorder } from '../../components/ClinicalVoiceRecorder'; // Removed
import { SpecialistAgentChat } from '../../components/specialized/SpecialistAgentChat';

const OrthopedicsDashboard: React.FC = () => {
    const { t } = useTranslation();
    const [lastNote, setLastNote] = useState("");
    const [kneeContext, setKneeContext] = useState<string>("bone_density_main");

    // Context options for knee specialization
    const kneeContextOptions = [
        { id: 'acl_tear', label: 'ACL Injury', icon: '🦵' },
        { id: 'meniscus_tear', label: 'Meniscus', icon: '🔵' },
        { id: 'knee_replacement', label: 'TKA/Surgery', icon: '🏥' },
        { id: 'bone_density_main', label: 'General', icon: '🦴' }
    ];

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-400">
                        Orthopedics Dept
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Musculoskeletal Analysis & Surgery Scheduling
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-primary">
                        {ICONS.plus} New X-Ray Request
                    </button>
                    <button className="btn-secondary">
                        Surgery Calendar
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Pending X-Rays</div>
                    <div className="text-2xl font-bold">14</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">ACL Reconstructions</div>
                    <div className="text-2xl font-bold text-blue-500">6</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">Meniscus Repairs</div>
                    <div className="text-2xl font-bold text-teal-500">4</div>
                </div>
                <div className="glass-card p-4 rounded-2xl">
                    <div className="text-sm text-text-secondary">TKA (Knee Replacements)</div>
                    <div className="text-2xl font-bold">2</div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-3xl h-full space-y-6">
                    <div>
                        <h3 className="text-xl font-bold mb-4">Bone Density Analysis</h3>
                        <div className="h-64 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.2),transparent_70%)]"></div>
                            <div className="text-cyan-400 font-mono text-xs flex flex-col items-center gap-2">
                                <span className="text-4xl animate-pulse">🦴</span>
                                <span className="tracking-widest uppercase">3D Model Rendering</span>
                                <span className="text-[10px] opacity-70">Awaiting DICOM Input</span>
                            </div>

                            {/* Scanning Line */}
                            <div className="absolute top-0 w-full h-1 bg-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-[scan_3s_ease-in-out_infinite]"></div>
                        </div>
                    </div>

                    {/* Knee Context Selector */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-sm text-slate-500 mb-3">AI Focus Area:</h4>
                        <div className="flex flex-wrap gap-2">
                            {kneeContextOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setKneeContext(opt.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${kneeContext === opt.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {opt.icon} {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-full min-h-[500px]">
                    <SpecialistAgentChat
                        zone="orthopedics"
                        contextId={kneeContext}
                        className="h-full shadow-lg"
                        key={kneeContext} // Re-mount chat when context changes
                    />
                </div>
            </div>
        </div>
    );
};

export default OrthopedicsDashboard;

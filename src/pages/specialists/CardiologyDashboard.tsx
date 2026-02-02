import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants';
// import { DataService } from '../../services/api'; // Removed as unused
import { SpecialistAgentChat } from '../../components/specialized/SpecialistAgentChat';


const CardiologyDashboard: React.FC = () => {
    // const { t } = useTranslation(); // Unused
    const [ecgData, setEcgData] = useState<number[]>([]);

    useEffect(() => {
        // Simulate real-time ECG data
        const interval = setInterval(() => {
            setEcgData(prev => {
                const newData = [...prev, Math.random() * 50 + 25];
                if (newData.length > 50) newData.shift();
                return newData;
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-400 flex items-center gap-3">
                        <span className="text-4xl">🫀</span> Cardiology Dept
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Advanced Arrythmia Detection & AI-Driven Protocols
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-primary bg-red-600 hover:bg-red-700 border-red-500">
                        {ICONS.plus} Urgent Consult
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Col: Live Monitoring (7 cols) */}
                <div className="col-span-1 lg:col-span-7 space-y-6">
                    <div className="glass-card p-6 rounded-3xl overflow-hidden border-t-4 border-red-500 relative">
                        <div className="absolute top-4 right-4 flex gap-2">
                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded animate-pulse">LIVE FEED</span>
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">ICU-04</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Real-time Telemetry</h3>
                        <div className="h-64 bg-slate-900 rounded-xl overflow-hidden relative border border-slate-700 shadow-inner">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-20 pointer-events-none">
                                {[...Array(72)].map((_, i) => (
                                    <div key={i} className="border border-green-500/30"></div>
                                ))}
                            </div>

                            {/* ECG Path Simulation */}
                            <svg className="w-full h-full" preserveAspectRatio="none">
                                <polyline
                                    points={ecgData.map((d, i) => `${i * (100 / 50)},${100 - d}`).join(' ')}
                                    fill="none"
                                    stroke="#00ff00"
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                    className="drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]"
                                />
                            </svg>
                        </div>
                        <div className="flex justify-between mt-4">
                            <div className="text-center">
                                <div className="text-xs text-slate-400">HR (bpm)</div>
                                <div className="text-2xl font-mono font-bold text-green-500">88</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-slate-400">BP (mmHg)</div>
                                <div className="text-2xl font-mono font-bold text-blue-400">120/80</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-slate-400">SpO2 (%)</div>
                                <div className="text-2xl font-mono font-bold text-amber-400">98</div>
                            </div>
                        </div>
                    </div>

                    {/* Risk Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card p-4 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
                            <div className="bg-red-100 p-3 rounded-full text-red-600 text-xl">⚠️</div>
                            <div>
                                <div className="font-bold text-red-900 dark:text-red-300">High Risk</div>
                                <div className="text-xs text-text-muted">3 Patients need attention</div>
                            </div>
                        </div>
                        <div className="glass-card p-4 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
                            <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 text-xl">✅</div>
                            <div>
                                <div className="font-bold text-emerald-900 dark:text-emerald-300">Stable</div>
                                <div className="text-xs text-text-muted">12 Patients monitoring</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: AI Agent RAG (5 cols) */}
                <div className="col-span-1 lg:col-span-5 h-full min-h-[600px]">
                    <div className="glass-card rounded-3xl h-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl">
                        {/* Integrated Analysis Chat */}
                        <SpecialistAgentChat
                            zone="cardiology"
                            contextId="cardio_dashboard_main"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardiologyDashboard;

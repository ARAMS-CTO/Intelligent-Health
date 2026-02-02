import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';
import { DataService } from '../services/api';

const EcosystemPage: React.FC = () => {
    const { t } = useTranslation();
    const [heartRate, setHeartRate] = useState(72);
    const [spo2, setSpo2] = useState(98);

    // Live Telemetry from IoT Network
    useEffect(() => {
        const fetchTelemetry = async () => {
            const data = await DataService.getIoTDeviceData('public_demo_user');
            if (data && data.length > 0) {
                // Find Apple Watch or first device
                const device = data.find((d: any) => d.device_id.includes('watch')) || data[0];
                if (device) {
                    setHeartRate(device.metrics.heart_rate);
                    setSpo2(device.metrics.spo2);
                }
            }
        };

        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 2000); // 2s polling
        return () => clearInterval(interval);
    }, []);

    const actors = [
        { id: 'patient', x: 50, y: 50, icon: ICONS.user, label: 'Patient', color: 'text-primary' },
        { id: 'doctor', x: 50, y: 20, icon: ICONS.specialist, label: 'Doctor', color: 'text-blue-500' },
        { id: 'lab', x: 80, y: 35, icon: ICONS.microscope, label: 'Lab', color: 'text-amber-500' },
        { id: 'pharma', x: 80, y: 65, icon: ICONS.pill, label: 'Pharma', color: 'text-red-500' },
        { id: 'insurance', x: 50, y: 80, icon: ICONS.billing, label: 'Insurance', color: 'text-green-500' },
        { id: 'nurse', x: 20, y: 65, icon: ICONS.nurse, label: 'Nurse', color: 'text-cyan-500' },
        { id: 'ai', x: 20, y: 35, icon: ICONS.ai, label: 'AI Swarm', color: 'text-purple-500' },
    ];

    return (
        <div className="min-h-screen bg-background pt-20 pb-10">
            {/* Hero */}
            <section className="container mx-auto px-4 mb-20 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    Live Connectivity
                </div>
                <h1 className="text-4xl sm:text-6xl font-heading font-black text-text-main tracking-tighter mb-6">
                    The Neural Network <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">of Modern Care.</span>
                </h1>
                <p className="text-xl text-text-muted max-w-2xl mx-auto">
                    A unified heartbeat where every stakeholder—from labs to insurance—is synchronized in real-time, eliminating data silos forever.
                </p>
            </section>

            {/* Neural Network Visualization */}
            <section className="container mx-auto px-4 mb-24">
                <div className="bg-slate-900 rounded-[40px] p-8 lg:p-12 relative overflow-hidden shadow-2xl border border-slate-700 min-h-[600px] flex items-center justify-center">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                    <div className="relative w-full max-w-3xl aspect-square lg:aspect-video text-white">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                            {/* Connections */}
                            <g className="opacity-40">
                                {actors.map((start, i) =>
                                    actors.slice(i + 1).map((end, j) => (
                                        <line
                                            key={`${start.id}-${end.id}`}
                                            x1={start.x} y1={start.y}
                                            x2={end.x} y2={end.y}
                                            stroke="currentColor"
                                            strokeWidth="0.2"
                                            className="text-slate-500 animate-pulse"
                                        />
                                    ))
                                )}
                                {/* Active Data Packets (Simulated) */}
                                <circle r="1" fill="#4ADE80">
                                    <animateMotion dur="2s" repeatCount="indefinite" path={`M 50 50 L 80 35`} />
                                </circle>
                                <circle r="1" fill="#38BDF8">
                                    <animateMotion dur="3s" repeatCount="indefinite" path={`M 20 35 L 50 50`} />
                                </circle>
                                <circle r="1" fill="#F472B6">
                                    <animateMotion dur="4s" repeatCount="indefinite" path={`M 50 50 L 50 80`} />
                                </circle>
                            </g>

                            {/* Nodes */}
                            {actors.map(actor => (
                                <g key={actor.id} className="group cursor-pointer hover:scale-110 transition-transform origin-center">
                                    <circle cx={actor.x} cy={actor.y} r="6" className={`fill-slate-800 stroke-2 ${actor.color.replace('text-', 'stroke-')}`} />
                                    <foreignObject x={actor.x - 3} y={actor.y - 3} width="6" height="6">
                                        <div className={`w-full h-full flex items-center justify-center ${actor.color}`}>
                                            {React.cloneElement(actor.icon as any, { className: "w-3 h-3" })}
                                        </div>
                                    </foreignObject>
                                    <text x={actor.x} y={actor.y + 10} textAnchor="middle" fontSize="3" fill="white" className="font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        {actor.label}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>

                    {/* Overlay Stats */}
                    <div className="absolute top-8 left-8 p-4 bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Network Status</p>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-sm font-mono text-green-400">All Systems Nominal</span>
                        </div>
                        <p className="text-xs text-slate-500">Latency: 12ms</p>
                    </div>
                </div>
            </section>

            {/* Live Telemetry Features */}
            <section className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
                <div className="glass-card p-8 rounded-3xl border border-white/20 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-heading font-bold text-text-main flex items-center gap-2">
                            {ICONS.activity} High-Fidelity Vitals
                        </h2>
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded text-xs font-bold animate-pulse">DEMO</span>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl">
                            <div>
                                <p className="text-sm text-text-muted font-bold uppercase">Heart Rate</p>
                                <p className="text-3xl font-black text-text-main tabular-nums">{heartRate} <span className="text-sm font-medium text-text-muted">BPM</span></p>
                            </div>
                            <div className="h-10 w-32">
                                <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                                    <path d="M0 10 L20 10 L25 2 L30 18 L35 10 L100 10" fill="none" stroke="#EF4444" strokeWidth="2" className="animate-[dash_1s_linear_infinite]" strokeDasharray="100" strokeDashoffset="100" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl">
                            <div>
                                <p className="text-sm text-text-muted font-bold uppercase">Blood Oxygen</p>
                                <p className="text-3xl font-black text-text-main tabular-nums">{spo2}% <span className="text-sm font-medium text-text-muted">SpO2</span></p>
                            </div>
                            <div className="text-blue-500 font-bold text-xl">
                                {ICONS.check}
                            </div>
                        </div>
                        <p className="text-xs text-text-muted mt-4">
                            Data synced every second from connected wearables (Apple Watch, Fitbit, Oura).
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-3xl font-heading font-bold text-text-main">Universal Patient History</h2>
                    <p className="text-lg text-text-muted leading-relaxed">
                        Never answer "When was your last Tetanus shot?" again. Our Timeline View aggregates data from every specialist you've ever visited into a single, scrollable narrative.
                    </p>
                    <ul className="space-y-4">
                        {[
                            "Radiology images from 2018",
                            "Prescriptions from last week",
                            "Lab results from 3 different clinics",
                            "Surgical notes from your specialist"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                </div>
                                <span className="font-bold text-text-main text-sm">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
};

export default EcosystemPage;

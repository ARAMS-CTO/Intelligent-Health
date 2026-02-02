import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';

const TriagePage: React.FC = () => {
    const navigate = useNavigate();
    const [symptom, setSymptom] = useState('');

    const handleStart = () => {
        // In a real app, this would pass the symptom to the case creation
        navigate('/patient-dashboard?action=new-case');
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-widest mb-4">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        AI Clinical Triage
                    </div>
                    <h1 className="text-4xl md:text-6xl font-heading font-black text-text-main mb-6">
                        What's troubling you today?
                    </h1>
                    <p className="text-xl text-text-muted max-w-2xl mx-auto">
                        Our AI Triage system analyzes your symptoms in real-time to prioritize your care and match you with the right specialist.
                    </p>
                </div>

                <div className="glass-card p-8 md:p-12 rounded-[40px] border border-white/20 dark:border-slate-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>

                    <div className="space-y-8 relative z-10">
                        <div>
                            <label className="block text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Describe your symptoms</label>
                            <textarea
                                value={symptom}
                                onChange={(e) => setSymptom(e.target.value)}
                                className="w-full h-40 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                placeholder="e.g. I have a severe headache on the left side and sensitivity to light..."
                            />
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                onClick={handleStart}
                                className="flex-1 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold py-5 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all text-lg flex items-center justify-center gap-3"
                            >
                                <span>Start Assessment</span>
                                {React.cloneElement(ICONS.ai as any, { className: 'w-6 h-6' })}
                            </button>
                            <button className="px-8 py-5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-text-muted hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                Emergency Call (911)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                    {[
                        { title: "Instant Analysis", desc: "Results in < 30 seconds", icon: ICONS.ai },
                        { title: "Specialist Match", desc: "Direct route to experts", icon: ICONS.specialist },
                        { title: "Private & Secure", desc: "HIPAA Compliant", icon: ICONS.security }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-6 glass-card rounded-2xl border border-white/10">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                {React.cloneElement(item.icon as any, { className: 'w-6 h-6' })}
                            </div>
                            <div>
                                <h3 className="font-bold text-text-main">{item.title}</h3>
                                <p className="text-sm text-text-muted">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TriagePage;

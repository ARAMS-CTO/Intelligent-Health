import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
// @ts-ignore
import { Case } from '../types/index';
import Breadcrumbs from '../components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../components/Toast';
// @ts-ignore
import { GeminiService } from '../services/api';

const EmergencyDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [cases, setCases] = useState<Case[]>([]);
    const [stats, setStats] = useState({ critical: 0, waiting: 0, beds: 4 });

    useEffect(() => {
        DataService.getCases().then(all => {
            // Mock filtering for emergency
            setCases(all.filter(c => c.status === 'Open'));
            setStats({
                critical: all.filter(c => c.tags.includes('Critical')).length,
                waiting: all.filter(c => c.status === 'Open').length,
                beds: 4 // Static for now
            });
        });
    }, []);

    const handleSimulateTriage = async () => {
        const symptoms = ["Chest pain radiating to left arm", "Severe difficulty breathing", "Unresponsive", "Minor cut on finger"];
        const randomSymptom = symptoms[Math.floor(Math.random() * symptoms.length)];

        // Use the Agent Bus!
        try {
            showToast.info(`Simulating Incoming Patient: ${randomSymptom}... routing to Nurse Agent.`);
            const result = await GeminiService.executeAgentCapability('triage_patient', {
                symptoms: randomSymptom,
                vitals: { hr: 110, bp: '150/90' }
            });
            showToast.success(`Agent Result: Priority ${result.priority} - ${result.recommended_action}`);
            console.log(result.rationale);
        } catch (e) {
            showToast.error("Agent Bus Error");
        }
    };

    return (
        <div className="bg-slate-900 min-h-screen text-white p-4 md:p-8 font-mono">
            <div className="container mx-auto">
                <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                    <h1 className="text-4xl font-black text-red-500 tracking-tighter uppercase flex items-center gap-3">
                        <span className="animate-pulse">🚨</span> ER Control
                    </h1>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase tracking-widest">System Status</p>
                        <p className="text-green-400 font-bold uppercase">Operational</p>
                    </div>
                </header>

                {/* Big Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-none flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-red-500">{stats.critical}</span>
                        <span className="text-xs uppercase tracking-widest text-red-400 mt-2">Critical</span>
                    </div>
                    <div className="bg-slate-800/50 p-6 flex flex-col items-center justify-center border border-slate-700">
                        <span className="text-4xl font-black text-yellow-500">{stats.waiting}</span>
                        <span className="text-xs uppercase tracking-widest text-slate-400 mt-2">Waiting Room</span>
                    </div>
                    <div className="bg-slate-800/50 p-6 flex flex-col items-center justify-center border border-slate-700">
                        <span className="text-4xl font-black text-blue-400">{stats.beds}</span>
                        <span className="text-xs uppercase tracking-widest text-slate-400 mt-2">Open Beds</span>
                    </div>
                    <button onClick={() => navigate('/create-case')} className="bg-red-600 hover:bg-red-700 text-white p-6 flex flex-col items-center justify-center transition-colors shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                        <span className="text-3xl font-bold">+</span>
                        <span className="text-xs uppercase tracking-widest font-bold mt-2">Rapid Intake</span>
                    </button>
                    <button onClick={handleSimulateTriage} className="bg-slate-700 hover:bg-slate-600 text-white p-6 flex flex-col items-center justify-center transition-colors border-l border-slate-600">
                        <span className="text-3xl font-bold">⚡</span>
                        <span className="text-xs uppercase tracking-widest font-bold mt-2">Auto-Triage Test</span>
                    </button>
                </div>

                {/* Tracking Board */}
                <div className="bg-slate-800 border border-slate-700">
                    <div className="bg-slate-900 p-4 border-b border-slate-700 grid grid-cols-12 gap-4 font-bold text-xs uppercase tracking-wider text-slate-400">
                        <div className="col-span-1">Triage</div>
                        <div className="col-span-2">Time In</div>
                        <div className="col-span-4">Patient / Chief Complaint</div>
                        <div className="col-span-2">Vitals</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1">Action</div>
                    </div>
                    <div className="divide-y divide-slate-700">
                        {cases.map((c, i) => (
                            <div key={c.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-700/50 transition-colors">
                                <div className="col-span-1 font-black text-xl text-yellow-500">#{i + 1}</div>
                                <div className="col-span-2 text-sm font-mono text-slate-300">
                                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="col-span-4">
                                    <div className="font-bold text-lg text-white">{c.patientProfile.sex === 'Male' ? 'M' : 'F'} {c.patientProfile.age}</div>
                                    <div className="text-xs text-slate-400 uppercase truncate text-red-300">{c.complaint || "Trauma / Unknown"}</div>
                                </div>
                                <div className="col-span-2 text-xs font-mono text-slate-400">
                                    BP: 120/80<br />HR: 90
                                </div>
                                <div className="col-span-2">
                                    <span className="bg-slate-700 text-white text-[10px] font-bold px-2 py-1 uppercase">{c.status}</span>
                                </div>
                                <div className="col-span-1">
                                    <button onClick={() => navigate(`/case/${c.id}`)} className="text-xs font-bold text-blue-400 hover:text-white border border-blue-400 hover:bg-blue-600 px-3 py-1 uppercase transition-all">
                                        Open
                                    </button>
                                </div>
                            </div>
                        ))}
                        {cases.length === 0 && (
                            <div className="p-8 text-center text-slate-500 italic">No active patients. Standby.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyDashboard;

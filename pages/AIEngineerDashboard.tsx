
import React from 'react';
import { useAuth } from '../components/Auth';
import { ICONS } from '../constants/index';

const AIEngineerDashboard: React.FC = () => {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen p-8 font-mono">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-slate-800 dark:text-white">
                    AI <span className="text-primary">Engineering</span>
                </h1>
                <p className="text-slate-500 mt-2">Model Fine-Tuning & Agent Orchestration</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-6 rounded-2xl border-l-4 border-primary">
                    <h3 className="font-bold text-lg mb-4">Gemini 2.0 Flash Status</h3>
                    <div className="flex items-center gap-2 text-green-500 font-bold">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        Operational (Latency: 142ms)
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl border-l-4 border-indigo-500">
                    <h3 className="font-bold text-lg mb-4">Vector DB (Chroma)</h3>
                    <div className="flex items-center gap-2 text-green-500 font-bold">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        Connected (Docs: 1,420)
                    </div>
                </div>
            </div>

            <div className="mt-8 glass-card p-8 rounded-[32px]">
                <h3 className="font-bold text-xl mb-6">Agent Configuration</h3>
                <div className="space-y-4">
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">Nurse Agent (Triage)</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                        </div>
                        <p className="text-sm text-slate-500">Routing logic: Urgency &gt; Department Availability</p>
                    </div>
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">Research Agent (Claude)</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                        </div>
                        <p className="text-sm text-slate-500">External Search: PubMed, CDC Guidelines</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIEngineerDashboard;

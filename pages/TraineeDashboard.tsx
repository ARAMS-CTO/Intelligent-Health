
import React, { useState } from 'react';
import { useAuth } from '../components/Auth';
import { ICONS } from '../constants/index';

const TraineeDashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen p-8">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-slate-800 dark:text-white">
                    Medical <span className="text-primary">Training Portal</span>
                </h1>
                <p className="text-slate-500 mt-2">Learning Resources & Supervised Case Review</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Assigned Cases (Read Only) */}
                <div className="glass-card p-8 rounded-[32px] border border-white/20 dark:border-slate-700/50 col-span-2">
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-6">Assigned for Review</h3>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-slate-500">No cases assigned for shadowing currently.</p>
                    </div>
                </div>

                {/* Educational Resources */}
                <div className="glass-card p-8 rounded-[32px] border border-white/20 dark:border-slate-700/50">
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-6">Learning Hub</h3>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                            <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">{ICONS.document}</span>
                            <div>
                                <p className="font-bold text-slate-700 dark:text-slate-200">Clinical Guidelines v2.0</p>
                                <p className="text-xs text-slate-500">Updated yesterday</p>
                            </div>
                        </li>
                        <li className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                            <span className="p-2 bg-purple-100 text-purple-600 rounded-lg">{ICONS.ai}</span>
                            <div>
                                <p className="font-bold text-slate-700 dark:text-slate-200">AI Diagnostic Triage</p>
                                <p className="text-xs text-slate-500">Video Module</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default TraineeDashboard;

import React, { useState } from 'react';
import { EyeModel } from './EyeModel';
import { SpecialistAgentChat } from '../specialized/SpecialistAgentChat';

interface OphthalmologyDashboardProps {
    data: any;
}

export const OphthalmologyDashboard: React.FC<OphthalmologyDashboardProps> = ({ data }) => {
    const [selectedPart, setSelectedPart] = useState<string | null>(null);

    // Use passed data or fallbacks
    const vitals = [
        { label: "Intraocular Pressure (IOP)", value: data?.iop || "--", status: "normal" },
        { label: "Visual Acuity (OD)", value: data?.visualAcuityOD || "--", status: "normal" },
        { label: "Visual Acuity (OS)", value: data?.visualAcuityOS || "--", status: "warning" },
        { label: "Cup-to-Disc Ratio", value: data?.cupDiscRatio || "--", status: "normal" }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Ophthalmology Zone</h2>
                    <p className="text-slate-500">Vision & Eye Health</p>
                </div>
                {/* Back button handled by parent, but we could add specific actions here */}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Visualizer */}
                        <div className="glass-card p-6 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                            <EyeModel
                                onPartSelect={setSelectedPart}
                                selectedPart={selectedPart}
                            />
                        </div>

                        {/* Diagnostics Panel */}
                        <div className="space-y-6">
                            <div className="glass-card p-6">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <span>👁️</span> Diagnostic Vitals
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {vitals.map((v, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <span className="text-sm text-slate-500">{v.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-800 dark:text-white">{v.value}</span>
                                                <span className={`w-2 h-2 rounded-full ${v.status === 'normal' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
                                    Book Eye Exam
                                </button>
                                <button className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
                                    Update Prescription
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Specialist */}
                <div className="space-y-6">
                    <SpecialistAgentChat zone="ophthalmology" contextId={selectedPart} />
                </div>
            </div>
        </div>
    );
};

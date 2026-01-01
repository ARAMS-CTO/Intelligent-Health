import React, { useState } from 'react';
import { GeminiService } from '../../services/api';
import { ICONS } from '../../constants/index';
import { Case } from '../../types/index';

interface ClinicalPlanSectionProps {
    caseData: Case;
    isOffline: boolean;
}

export const ClinicalPlanSection: React.FC<ClinicalPlanSectionProps> = ({ caseData, isOffline }) => {
    const [clinicalPlan, setClinicalPlan] = useState("");
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    const handleGeneratePlan = async () => {
        setIsGeneratingPlan(true);
        try {
            const res = await GeminiService.getClinicalPlan(caseData.id);
            setClinicalPlan(res.plan || "Could not generate plan.");
            setIsOpen(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    return (
        <>
            {/* Button in header */}
            <button
                onClick={handleGeneratePlan}
                disabled={isOffline || isGeneratingPlan}
                className="text-sm bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95"
            >
                {ICONS.ai}
                <span>{isGeneratingPlan ? "Generating..." : "Clinical Plan"}</span>
            </button>

            {/* Collapsible Section */}
            <div className="border-b border-white/10 dark:border-slate-700/50 last:border-b-0">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex justify-between items-center py-5 px-6 text-left font-bold text-text-main hover:bg-white/10 dark:hover:bg-slate-800/30 focus:outline-none transition-all duration-300 group"
                >
                    <div className="flex items-center gap-3 text-lg">AI Clinical Plan</div>
                    <div className={`p-1.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-text-muted'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </button>
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-6 pt-2 bg-transparent text-sm text-text-secondary whitespace-pre-wrap leading-relaxed animate-fade-in">
                        {!clinicalPlan ? (
                            <div className="flex flex-col items-center py-8">
                                <p className="text-text-muted mb-4 text-center">Generate a comprehensive treatment plan including medications, investigations, and monitoring.</p>
                                <button
                                    onClick={handleGeneratePlan}
                                    disabled={isGeneratingPlan || isOffline}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    {isGeneratingPlan ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            {ICONS.ai}
                                            <span>Generate Plan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="markdown-prose dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                    {clinicalPlan}
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={handleGeneratePlan} className="text-sm text-primary underline hover:text-primary-hover">Regenerate Plan</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

import React, { useState } from 'react';
import { ICONS } from '../../constants';
import { DataService } from '../../services/api';
import { showToast } from '../Toast';
import { Case } from '../../types';

interface AgentsConsoleProps {
    caseData: Case;
    onUpdate: () => void;
}

const AGENTS = [
    { id: 'emergency', name: 'Emergency Unit', role: 'Critical Response', icon: ICONS.riskHigh, color: 'bg-red-500', capability: 'emergency_protocol' },
    { id: 'lab', name: 'Lab Tech AI', role: 'Laboratory', icon: ICONS.microscope, color: 'bg-indigo-500', capability: 'analyze_labs' },
    { id: 'rad', name: 'Radiology AI', role: 'Imaging', icon: ICONS.imageAnalysis, color: 'bg-blue-500', capability: 'analyze_image' },
    { id: 'ins', name: 'Insurance Validator', role: 'Billing', icon: ICONS.billing, color: 'bg-green-600', capability: 'check_eligibility' },
    { id: 'price', name: 'Cost Estimator', role: 'Billing', icon: ICONS.billing, color: 'bg-emerald-500', capability: 'estimate_cost' },
    { id: 'rehab', name: 'Rehab Specialist', role: 'Recovery', icon: ICONS.activity, color: 'bg-teal-500', capability: 'generate_rehab_plan' },
    { id: 'psych', name: 'Wellness Support', role: 'Psychology', icon: ICONS.ai, color: 'bg-purple-500', capability: 'coping_strategies' },
    { id: 'nurse', name: 'Triage Nurse', role: 'Nursing', icon: ICONS.nurse, color: 'bg-pink-500', capability: 'triage' },
    { id: 'patient', name: 'Patient Advocate', role: 'Support', icon: ICONS.user, color: 'bg-orange-400', capability: 'explain_diagnosis' },
    { id: 'researcher', name: 'Research Librarian', role: 'Research', icon: ICONS.document, color: 'bg-cyan-500', capability: 'research_condition' },
    { id: 'guidelines', name: 'Guidelines Expert', role: 'Evidence', icon: ICONS.check, color: 'bg-lime-500', capability: 'find_guidelines' },
    { id: 'interactions', name: 'Drug Checker', role: 'Pharmacy', icon: ICONS.medication, color: 'bg-amber-500', capability: 'check_drug_interaction' },
];

export const AgentsConsole: React.FC<AgentsConsoleProps> = ({ caseData, onUpdate }) => {
    const [activeAgent, setActiveAgent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [customInput, setCustomInput] = useState("");

    const handleConsult = async (agentId: string, capability: string, params: any = {}) => {
        setLoading(true);
        setResult(null);
        setActiveAgent(agentId);

        try {
            // Contextual params based on caseData
            const contextParams = {
                ...params,
                case_id: caseData.id,
                symptoms: caseData.complaint,
                vitals: "BP 120/80, HR 80 (Mock)", // Ideally fetching from vitals record
                diagnosis: caseData.diagnosis,
                plan: "See clinical plan",
                condition: caseData.diagnosis // For rehab
            };

            const response = await DataService.executeAgentCapability(capability, contextParams);
            setResult(response);
        } catch (error) {
            console.error("Agent Error:", error);
            showToast.error("Agent unavailable.");
        } finally {
            setLoading(false);
        }
    };

    const renderAgentModal = () => {
        if (!activeAgent) return null;
        const agent = AGENTS.find(a => a.id === activeAgent);
        if (!agent) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 dark:border-slate-700">
                    <div className={`p-6 ${agent.color} text-white flex justify-between items-center`}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">{agent.icon}</div>
                            <div>
                                <h3 className="text-2xl font-bold font-heading">{agent.name}</h3>
                                <p className="opacity-90 text-sm font-medium tracking-wider uppercase">{agent.role}</p>
                            </div>
                        </div>
                        <button onClick={() => { setActiveAgent(null); setResult(null); }} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                        {!result && !loading && (
                            <div className="text-center py-10 space-y-4">
                                <p className="text-lg text-text-muted">Initiating consultation...</p>
                                {/* Auto-trigger for simple agents, or form for complex ones */}
                                {agent.id === 'emergency' && (
                                    <button
                                        onClick={() => handleConsult(agent.id, agent.capability)}
                                        className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-red-500/30 transition-all hover:scale-105"
                                    >
                                        GENERATE EMERGENCY PROTOCOL
                                    </button>
                                )}
                                {agent.id !== 'emergency' && (
                                    <button
                                        onClick={() => handleConsult(agent.id, agent.capability)}
                                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all"
                                    >
                                        Start Consultation
                                    </button>
                                )}
                            </div>
                        )}

                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${agent.color.replace('bg-', 'border-')}`}></div>
                                <p className="text-text-muted font-bold animate-pulse">Consulting Specialist...</p>
                            </div>
                        )}

                        {result && (
                            <div className="space-y-6 animate-fade-in text-left">
                                {/* Generic JSON fallback for dev/other agents */}
                                {/* <pre>{JSON.stringify(result, null, 2)}</pre> */}

                                {/* --- Emergency Protocol --- */}
                                {result.steps && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl">
                                            <h4 className="font-bold text-lg text-red-700 dark:text-red-400 mb-2">CRITICAL PROTOCOL</h4>
                                            <ol className="list-decimal pl-5 space-y-2 text-text-main font-medium">
                                                {result.steps.map((step: string, i: number) => (
                                                    <li key={i}>{step}</li>
                                                ))}
                                            </ol>
                                        </div>
                                        {result.equipment_needed && (
                                            <div className="flex flex-wrap gap-2">
                                                {result.equipment_needed.map((item: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-xs font-bold uppercase tracking-wide">{item}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* --- Insurance Validator --- */}
                                {agent.capability === 'check_eligibility' && (
                                    <div className="space-y-4">
                                        <div className={`p-6 rounded-2xl text-center border-2 ${result.status === 'Approved' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'}`}>
                                            <h4 className="text-3xl font-bold font-heading mb-1">{result.status.toUpperCase()}</h4>
                                            <p className="text-sm font-bold uppercase tracking-widest opacity-70">Eligibility Status</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <p className="text-xs text-text-muted uppercase font-bold">Coverage</p>
                                                <p className="text-xl font-bold text-text-main">{result.coverage_percentage}%</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <p className="text-xs text-text-muted uppercase font-bold">Copay</p>
                                                <p className="text-xl font-bold text-text-main">{result.copay}</p>
                                            </div>
                                        </div>
                                        {result.notes && (
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg text-sm text-text-main">
                                                <strong>Note:</strong> {result.notes}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* --- Pricing / Cost Estimator --- */}
                                {agent.capability === 'estimate_cost' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-2xl shadow-lg">
                                            <div>
                                                <p className="text-sm opacity-70 font-bold uppercase">Estimated Total</p>
                                                <h4 className="text-3xl font-bold font-mono">${result.estimated_total?.toLocaleString()}</h4>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm opacity-70 font-bold uppercase">Patient Pay</p>
                                                <h4 className="text-3xl font-bold font-mono text-emerald-400">${result.patient_responsibility_est?.toLocaleString()}</h4>
                                            </div>
                                        </div>

                                        {result.breakdown && (
                                            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                                        <tr>
                                                            <th className="p-3 text-left font-bold text-text-muted">Item</th>
                                                            <th className="p-3 text-right font-bold text-text-muted">Cost</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                        {result.breakdown.map((item: any, i: number) => (
                                                            <tr key={i} className="hover:bg-slate-50/50">
                                                                <td className="p-3 text-text-main">{item.item}</td>
                                                                <td className="p-3 text-right font-mono text-text-main">${item.cost?.toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* --- Psychology --- */}
                                {agent.capability === 'coping_strategies' && (
                                    <div className="space-y-4">
                                        {result.daily_affirmation && (
                                            <div className="p-6 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl text-center italic font-serif text-lg text-purple-900 dark:text-purple-100 shadow-sm border border-purple-200/50">
                                                "{result.daily_affirmation}"
                                            </div>
                                        )}

                                        <h4 className="font-bold text-text-main flex items-center gap-2">Recommended Strategies</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {result.strategies && result.strategies.map((strat: any, i: number) => (
                                                <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                                    <h5 className="font-bold text-primary mb-1">{strat.title}</h5>
                                                    <p className="text-xs text-text-muted mb-2">{strat.duration_mins} mins</p>
                                                    <p className="text-sm text-text-main">{strat.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* --- Radiology / Imaging --- */}
                                {agent.capability === 'analyze_image' && (
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-xl font-bold font-heading text-text-main">{result.modality || "Imaging"} Analysis</h4>
                                                <p className="text-sm text-text-muted font-medium">{result.body_part || "Unknown Region"}</p>
                                            </div>
                                            {result.urgency && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${result.urgency === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' :
                                                    result.urgency === 'Urgent' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                        'bg-green-100 text-green-700 border-green-200'
                                                    }`}>
                                                    {result.urgency}
                                                </span>
                                            )}
                                        </div>

                                        {result.status === 'warning' ? (
                                            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200 text-sm">
                                                <strong>Note:</strong> {result.message}
                                            </div>
                                        ) : (
                                            <>
                                                {/* Impression Card */}
                                                <div className={`p-5 rounded-xl border-l-4 ${result.abnormalities_detected ? 'bg-red-50 border-red-500 dark:bg-red-900/10' : 'bg-green-50 border-green-500 dark:bg-green-900/10'}`}>
                                                    <p className="text-xs uppercase font-bold opacity-60 mb-1">Impression</p>
                                                    <p className="font-bold text-text-main leading-relaxed">{result.impression}</p>
                                                </div>

                                                {/* Findings List */}
                                                {result.findings && (
                                                    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                                        <h5 className="font-bold text-text-main mb-2">Detailed Findings</h5>
                                                        <ul className="list-disc pl-5 space-y-1 text-sm text-text-light">
                                                            {result.findings.map((finding: string, i: number) => (
                                                                <li key={i}>{finding}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Recommendations */}
                                                {result.recommendations && (
                                                    <div className="flex flex-col gap-2">
                                                        <p className="text-xs font-bold uppercase text-text-muted">Recommendations</p>
                                                        {result.recommendations.map((rec: string, i: number) => (
                                                            <div key={i} className="flex items-center gap-2 text-sm text-text-main">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                                {rec}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* --- Lab Tech AI --- */}
                                {agent.capability === 'analyze_labs' && (
                                    <div className="space-y-4">
                                        {result.status === 'warning' ? (
                                            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200 text-sm">
                                                <strong>Note:</strong> {result.message}
                                            </div>
                                        ) : (
                                            <>
                                                {/* Significance */}
                                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 rounded-r-xl">
                                                    <h4 className="font-bold text-lg text-indigo-700 dark:text-indigo-400 mb-2">Clinical Significance</h4>
                                                    <p className="text-text-main font-medium leading-relaxed">{result.clinical_significance}</p>
                                                </div>

                                                {/* Abnormalities */}
                                                {result.abnormalities && result.abnormalities.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h5 className="font-bold text-text-main">Abnormalities Detected</h5>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {result.abnormalities.map((item: any, i: number) => (
                                                                <div key={i} className={`p-3 rounded-lg border-l-4 ${item.flag === 'Critical' ? 'bg-red-50 border-red-500' :
                                                                    item.flag === 'High' ? 'bg-orange-50 border-orange-400' :
                                                                        'bg-blue-50 border-blue-400'
                                                                    }`}>
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="font-bold text-text-main">{item.test}</span>
                                                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${item.flag === 'Critical' ? 'bg-red-200 text-red-800' :
                                                                            item.flag === 'High' ? 'bg-orange-200 text-orange-800' :
                                                                                'bg-blue-200 text-blue-800'
                                                                            }`}>{item.flag}</span>
                                                                    </div>
                                                                    <p className="text-sm text-text-light">{item.explanation}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Follow-up */}
                                                {result.recommended_followup && (
                                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                                        <p className="text-xs font-bold uppercase text-text-muted mb-2">Recommended Follow-up</p>
                                                        <ul className="list-disc pl-5 space-y-1 text-sm text-text-main">
                                                            {result.recommended_followup.map((rec: string, i: number) => (
                                                                <li key={i}>{rec}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* --- Rehab Specialist --- */}
                                {agent.capability === 'generate_rehab_plan' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500 rounded-r-xl">
                                            <h4 className="font-bold text-lg text-teal-700 dark:text-teal-400 mb-2">Recovery Overview</h4>
                                            <p className="text-text-main font-medium leading-relaxed">{result.overview}</p>
                                            <p className="mt-2 text-sm text-text-muted"><strong>Est. Time:</strong> {result.estimated_recovery_time}</p>
                                        </div>

                                        {/* Phases */}
                                        {result.timeline && (
                                            <div className="space-y-4">
                                                <h5 className="font-bold text-text-main">Phased Recovery Plan</h5>
                                                {result.timeline.map((phase: any, i: number) => (
                                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 font-bold text-text-main flex justify-between">
                                                            <span>{phase.phase_name}</span>
                                                            <span className="text-xs uppercase bg-teal-100 dark:bg-teal-900 text-teal-700 px-2 py-0.5 rounded-full">Phase {i + 1}</span>
                                                        </div>
                                                        <div className="p-4 space-y-3">
                                                            {/* Goals */}
                                                            <div>
                                                                <p className="text-xs font-bold uppercase text-text-muted mb-1">Goals</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {phase.goals && phase.goals.map((goal: string, j: number) => (
                                                                        <span key={j} className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-md text-xs font-medium text-text-main border border-slate-200 dark:border-slate-600">{goal}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {/* Exercises */}
                                                            <div>
                                                                <p className="text-xs font-bold uppercase text-text-muted mb-1">Exercises</p>
                                                                <ul className="space-y-2">
                                                                    {phase.exercises && phase.exercises.map((ex: any, k: number) => (
                                                                        <li key={k} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700 last:border-0 pb-1 last:pb-0">
                                                                            <span className="text-text-main font-medium">{ex.name}</span>
                                                                            <span className="text-text-muted text-xs">{ex.sets} • {ex.frequency}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Precautions */}
                                        {result.precautions && (
                                            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl">
                                                <h5 className="font-bold text-orange-800 dark:text-orange-400 mb-2 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.37-1.21 3.006 0l5.25 10.002c.586 1.117-.23 2.4-1.503 2.4H4.504c-1.274 0-2.09-1.283-1.503-2.4l5.25-10.002zM10 14a1 1 0 110-2 1 1 0 010 2zm0-5a1 1 0 00-1 1v2a1 1 0 102 0V10a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                    Precautions
                                                </h5>
                                                <ul className="list-disc pl-5 space-y-1 text-sm text-text-main">
                                                    {result.precautions.map((p: string, i: number) => (
                                                        <li key={i}>{p}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {!result.steps && !['check_eligibility', 'estimate_cost', 'coping_strategies', 'analyze_image', 'analyze_labs', 'generate_rehab_plan'].includes(agent.capability) && (
                                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-white/10 dark:border-slate-700 shadow-sm">
                                        <pre className="whitespace-pre-wrap text-sm font-mono text-text-main overflow-x-auto">
                                            {JSON.stringify(result, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold font-heading text-text-main flex items-center gap-2">
                <span className="p-2 bg-primary/10 rounded-lg text-primary">{ICONS.users}</span>
                Specialist Network
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {AGENTS.map(agent => (
                    <button
                        key={agent.id}
                        onClick={() => setActiveAgent(agent.id)}
                        className={`
                            relative overflow-hidden group p-4 rounded-2xl border border-white/10 dark:border-slate-700 
                            bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 
                            transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left
                        `}
                    >
                        <div className={`absolute top-0 right-0 p-16 opacity-5 group-hover:opacity-10 transition-opacity rounded-bl-full ${agent.color}`}></div>

                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg mb-4 ${agent.color} group-hover:scale-110 transition-transform duration-300`}>
                            {agent.icon}
                        </div>

                        <h4 className="font-bold text-text-main text-lg leading-tight mb-1">{agent.name}</h4>
                        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">{agent.role}</p>

                        {/* Status Indicator (Mock) */}
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                    </button>
                ))}
            </div>

            {renderAgentModal()}
        </div>
    );
};

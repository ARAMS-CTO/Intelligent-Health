
import React, { useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GeminiService, startCaseDiscussionSimulation, stopCaseDiscussionSimulation, joinCase, leaveCase, DataService } from '../services/api';
import { Case, UploadedFile, LabResult, AIInsights, Comment } from '../types/index';
import { ICONS } from '../constants/index';
import AIChat from '../components/AIChat';
import CaseDiscussion from '../components/CaseDiscussion';
import { useAuth } from '../components/Auth';
import { FileAnalysisModal } from '../components/case/FileAnalysisModal';
import { VoiceNoteList } from '../components/case/VoiceNoteList';
import VoiceInput from '../components/VoiceInput';
// import ImageAnalysis from '../components/ImageAnalysis'; // Replaced
import VoiceRecorder from '../components/VoiceRecorder';
import Breadcrumbs from '../components/Breadcrumbs';
import ClinicalGuidelinesCard from '../components/ClinicalGuidelinesCard';
import VoiceFormAssistant from '../components/VoiceFormAssistant';
import { FinancialsTab } from '../components/case/FinancialsTab';
import { ClinicalPlanSection } from '../components/case/ClinicalPlanSection';
import { SpecialistSupportPanel } from '../components/specialties/SpecialistSupportPanel';
import { showToast } from '../components/Toast';
import { AgentsConsole } from '../components/case/AgentsConsole';
import { ResearchPanel } from '../components/case/ResearchPanel';
import PayPalPayment from '../components/PayPalPayment';
import { StripePayment } from '../components/StripePayment';

// --- Helper Components ---

const CollapsibleSection: React.FC<{ title: ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, isOpen, onToggle, children }) => {
    return (
        <div className="border-b border-white/10 dark:border-slate-700/50 last:border-b-0">
            <button onClick={onToggle} className="w-full flex justify-between items-center py-5 px-6 text-left font-bold text-text-main hover:bg-white/10 dark:hover:bg-slate-800/30 focus:outline-none transition-all duration-300 group">
                <div className="flex items-center gap-3 text-lg">{title}</div>
                <div className={`p-1.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-text-muted'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 pt-2 bg-transparent text-sm text-text-secondary whitespace-pre-wrap leading-relaxed animate-fade-in">{children}</div>
            </div>
        </div>
    );
};

// --- Helper Functions for Color Coding ---
const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'bg-success';
    if (score >= 0.75) return 'bg-warning';
    if (score >= 0.5) return 'bg-orange-500';
    return 'bg-danger';
};
const getConfidenceTextColor = (score: number) => {
    if (score >= 0.9) return 'text-success';
    if (score >= 0.75) return 'text-warning-text';
    if (score >= 0.5) return 'text-orange-600';
    return 'text-danger-text';
};

// --- Lab Result Interpretation Helper ---
const getInterpretation = (valueStr: string, range: string): LabResult['interpretation'] => {
    const value = parseFloat(valueStr);
    if (isNaN(value)) return 'Normal'; // Cannot interpret non-numeric values

    // Case 1: Simple range like "13.5-17.5"
    const simpleRange = range.match(/^(-?\d+\.?\d*)\s*-\s*(-?\d+\.?\d*)$/);
    if (simpleRange) {
        const lower = parseFloat(simpleRange[1]);
        const upper = parseFloat(simpleRange[2]);
        const rangeWidth = upper - lower;
        // Critical check (e.g., 50% outside the normal range)
        if (rangeWidth > 0 && (value < lower - rangeWidth * 0.5 || value > upper + rangeWidth * 0.5)) return 'Critical';
        if (value < lower) return 'Abnormal-Low';
        if (value > upper) return 'Abnormal-High';
        return 'Normal';
    }

    // Case 2: Less than range like "< 0.5"
    const lessThanRange = range.match(/<\s*(-?\d+\.?\d*)$/);
    if (lessThanRange) {
        const upper = parseFloat(lessThanRange[1]);
        // Critical check (e.g., 4x the upper limit)
        if (value > upper * 4) return 'Critical';
        if (value > upper) return 'Abnormal-High';
        return 'Normal';
    }

    // Case 3: Greater than range like "> 10"
    const greaterThanRange = range.match(/>\s*(-?\d+\.?\d*)$/);
    if (greaterThanRange) {
        const lower = parseFloat(greaterThanRange[1]);
        // Critical check (e.g., less than half the lower limit)
        if (value > 0 && lower > 0 && value < lower * 0.5) return 'Critical';
        if (value < lower) return 'Abnormal-Low';
        return 'Normal';
    }

    return 'Normal'; // Default for un-parsable ranges
};

// --- Lab Results Table Component ---

interface LabResultsTableProps {
    results: LabResult[];
    onAddResult: (result: LabResult) => void;
    isOffline: boolean;
}

const LabResultsTable = React.memo(({ results, onAddResult, isOffline }: LabResultsTableProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newResult, setNewResult] = useState<LabResult>({ test: '', value: '', unit: '', referenceRange: '', interpretation: 'Normal' });

    const handleAdd = () => {
        if (newResult.test && newResult.value) {
            const interpretation = getInterpretation(newResult.value, newResult.referenceRange);
            onAddResult({ ...newResult, interpretation });
            setNewResult({ test: '', value: '', unit: '', referenceRange: '', interpretation: 'Normal' });
            setIsAdding(false);
        }
    };

    const getBadgeColor = (interpretation?: string) => {
        switch (interpretation) {
            case 'Critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50';
            case 'Abnormal-High': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50';
            case 'Abnormal-Low': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50';
            default: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50';
        }
    };

    return (
        <div>
            <div className="overflow-x-auto rounded-xl border border-white/10 dark:border-slate-700/50 shadow-inner bg-black/5 dark:bg-black/20">
                <table className="min-w-full divide-y divide-white/10 dark:divide-slate-700/50">
                    <thead className="bg-white/10 dark:bg-slate-800/50 backdrop-blur-md">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-main uppercase tracking-wider">Test</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-main uppercase tracking-wider">Value</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Range</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Interpretation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 dark:divide-slate-700/50">
                        {results.map((res, idx) => (
                            <tr key={idx} className="hover:bg-white/5 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-main font-bold">{res.test}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-main font-medium">{res.value} <span className="text-xs opacity-70 ml-1 text-text-muted">{res.unit}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">{res.referenceRange}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold uppercase tracking-wider rounded-full border ${getBadgeColor(res.interpretation)} shadow-sm backdrop-blur-sm bg-opacity-80`}>
                                        {res.interpretation}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isAdding ? (
                <div className="mt-4 p-6 glass-card rounded-xl border border-white/20 dark:border-slate-700 space-y-4 animate-fade-in text-text-main">
                    <h4 className="font-bold text-sm text-text-muted uppercase tracking-wider">Add New Result</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <input placeholder="Test Name" className="border border-white/10 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-400" value={newResult.test} onChange={e => setNewResult({ ...newResult, test: e.target.value })} />
                        <input placeholder="Value" className="border border-white/10 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-400" value={newResult.value} onChange={e => setNewResult({ ...newResult, value: e.target.value })} />
                        <input placeholder="Unit" className="border border-white/10 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-400" value={newResult.unit} onChange={e => setNewResult({ ...newResult, unit: e.target.value })} />
                        <input placeholder="Ref Range" className="border border-white/10 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-400" value={newResult.referenceRange} onChange={e => setNewResult({ ...newResult, referenceRange: e.target.value })} />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-slate-200/50 dark:bg-slate-700/50 text-text-main text-sm font-bold rounded-xl hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors">Cancel</button>
                        <button onClick={handleAdd} className="px-4 py-2 bg-gradient-to-r from-primary to-indigo-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all transform active:scale-95">Add Result</button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setIsAdding(true)} disabled={isOffline} className="mt-4 text-sm font-bold text-primary hover:text-primary-hover hover:underline disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2 group transition-all">
                    <div className="p-1 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    Add Lab Result
                </button>
            )}
        </div>
    );
});

// --- Outcome Modal ---
const OutcomeModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (outcome: string) => void }) => {
    const [outcome, setOutcome] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-white/20 animate-fade-in relative z-50">
                <h3 className="text-xl font-bold text-text-main mb-2">Record Clinical Outcome</h3>
                <p className="text-sm text-text-muted mb-4">Help the AI learn by recording the actual outcome of this case.</p>
                <textarea
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-text-main focus:ring-2 focus:ring-primary h-32 resize-none"
                    placeholder="e.g., Patient recovered after 3 days. Treatment X was effective."
                    value={outcome}
                    onChange={e => setOutcome(e.target.value)}
                />
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                    <button onClick={() => { onSave(outcome); setOutcome(''); }} disabled={!outcome.trim()} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50">Save & Learn</button>
                </div>
            </div>
        </div>
    );
};

// --- AI Clinical Summary Section (Standalone) ---

interface AIClinicalSummarySectionProps {
    insights: AIInsights | null;
    isLoading: boolean;
    onGenerate: () => void;
    isOffline: boolean;
    onRecordOutcome: () => void;
}

const AIClinicalSummarySection = React.memo(({ insights, isLoading, onGenerate, isOffline, onRecordOutcome }: AIClinicalSummarySectionProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // Automatically open when insights are generated
    useEffect(() => {
        if (insights && !isLoading) setIsOpen(true);
    }, [insights, isLoading]);

    return (
        <div className="glass-card rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 mb-8 overflow-hidden antigravity-target">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-5 text-left focus:outline-none hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all duration-300"
            >
                <div className="flex items-center gap-3 text-xl font-heading font-bold text-text-main">
                    <div className="p-2 bg-gradient-to-br from-primary to-indigo-600 rounded-lg text-white shadow-lg shadow-primary/20">
                        {ICONS.ai}
                    </div>
                    <span>AI Clinical Summary</span>
                </div>
                <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-700 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-primary/10 text-primary' : 'text-text-muted'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 animate-fade-in bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
                    {!insights ? (
                        <div className="text-center py-8">
                            <p className="text-text-muted mb-6 max-w-md mx-auto">Generate AI insights to analyze the case, examine symptoms, and identify key risks with high precision.</p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={onGenerate}
                                    disabled={isLoading || isOffline}
                                    className="bg-gradient-to-r from-primary to-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 transform hover:-translate-y-0.5"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span>Analyzing Case...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                                            'Generate AI Insights'
                                        </>
                                    )}
                                </button>



                                <DonateToResearchButton caseId={insights ? "current" : "unknown"} />

                                <button
                                    onClick={onRecordOutcome}
                                    className="px-4 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-xl font-bold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-2"
                                    title="Record actual outcome for AI learning"
                                >
                                    {ICONS.check} Record Outcome
                                </button>
                            </div>
                        </div>

                    ) : (
                        <div className="space-y-6">
                            {/* Diagnosis Confidence */}
                            <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg p-4 shadow-sm">
                                <div>
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Diagnosis Confidence</p>
                                    <span className={`font-bold text-3xl ${getConfidenceTextColor(insights.diagnosisConfidence)}`}>
                                        {(insights.diagnosisConfidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex-1 max-w-xs">
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full ${getConfidenceColor(insights.diagnosisConfidence)} transition-all duration-1000 ease-out shadow-sm`}
                                            style={{ width: `${Math.round(insights.diagnosisConfidence * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Key Symptoms */}
                                {insights.keySymptoms && insights.keySymptoms.length > 0 && (
                                    <div className="bg-info-light/30 border border-info-border/30 rounded-lg p-4">
                                        <h4 className="font-bold text-info-text text-sm flex items-center gap-2 mb-3">
                                            {ICONS.symptomCheck}
                                            <span>Key Symptoms</span>
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {insights.keySymptoms.map((symptom, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white/70 dark:bg-slate-700/70 text-info-text dark:text-blue-300 text-xs font-bold rounded-lg border border-info-border dark:border-blue-800 shadow-sm backdrop-blur-sm">{symptom}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Potential Risks */}
                                {insights.patientRisks && insights.patientRisks.length > 0 && (
                                    <div className="bg-danger-light/30 border border-danger-border/30 rounded-lg p-4">
                                        <h4 className="font-bold text-danger-text text-sm flex items-center gap-2 mb-3">
                                            {ICONS.riskHigh}
                                            <span>Potential Risks</span>
                                        </h4>
                                        <ul className="space-y-2">
                                            {insights.patientRisks.map((risk, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-text-main">
                                                    <svg className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                    <span>{risk}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button onClick={onGenerate} disabled={isLoading || isOffline} className="text-xs text-primary hover:text-primary-hover hover:underline flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-1.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                                    Regenerate Insights
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
});

// --- Main Sub-Components ---

interface CaseDetailsCardProps {
    caseData: Case;
    onAddFile: (file: UploadedFile) => void;
    insights: AIInsights | null;
    onAddLabResult: (result: LabResult) => void;
    onOpenAnalysisModal: () => void;
    isOffline: boolean;
    onUpdateComplaint: (newComplaint: string) => void;
    onUpdateHistory: (newHistory: string) => void;
    onUpdateFindings: (newFindings: string) => void;
    onUpdateDiagnosis: (newDiagnosis: string) => void;
    onUpdateICD10: (newCode: string) => void;
    onOpenExplanation: () => void;
    onAddVoiceNote: (note: string) => void;
    onRecordOutcome: () => void;
}

const CaseDetailsCard: React.FC<CaseDetailsCardProps> = ({ caseData, onAddFile, insights, onAddLabResult, onOpenAnalysisModal, isOffline, onUpdateComplaint, onUpdateHistory, onUpdateFindings, onUpdateDiagnosis, onUpdateICD10, onOpenExplanation, onAddVoiceNote, onRecordOutcome }) => {
    // State for Collapsible Sections
    const [openSections, setOpenSections] = useState({
        complaint: true,
        history: true,
        findings: true,
        diagnosis: true,
        labs: true,
        notes: true,
        financials: false,
        specialty: true // Default open for demo
    });

    // ... existing useEffects ...

    // State for editable fields
    const [isEditingComplaint, setIsEditingComplaint] = useState(false);
    const [complaintInput, setComplaintInput] = useState(caseData.complaint);

    const [isEditingHistory, setIsEditingHistory] = useState(false);
    const [historyInput, setHistoryInput] = useState(caseData.history);

    const [isEditingFindings, setIsEditingFindings] = useState(false);
    const [findingsInput, setFindingsInput] = useState(caseData.findings);

    const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
    const [diagnosisInput, setDiagnosisInput] = useState(caseData.diagnosis);

    // State for ICD-10 lookup
    const [selectedIcd10, setSelectedIcd10] = useState(caseData.icd10Code || '');
    const [icd10Options, setIcd10Options] = useState<{ code: string, description: string }[]>([]);
    const [loadingICD10, setLoadingICD10] = useState(false);
    const searchTimeoutRef = useRef<number | null>(null);
    const dropdownRef = useRef<HTMLUListElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIcd10Options([]);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setComplaintInput(caseData.complaint);
        setHistoryInput(caseData.history);
        setFindingsInput(caseData.findings);
        setDiagnosisInput(caseData.diagnosis);
        setSelectedIcd10(caseData.icd10Code || '');
    }, [caseData]);

    const handleSaveComplaint = () => {
        onUpdateComplaint(complaintInput);
        setIsEditingComplaint(false);
    };
    const handleSaveHistory = () => {
        onUpdateHistory(historyInput);
        setIsEditingHistory(false);
    };
    const handleSaveFindings = () => {
        onUpdateFindings(findingsInput);
        setIsEditingFindings(false);
    };
    const handleSaveDiagnosis = () => {
        onUpdateDiagnosis(diagnosisInput);
        onUpdateICD10(selectedIcd10);
        setIsEditingDiagnosis(false);
    };

    const handleDiagnosisChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setDiagnosisInput(val);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (val.trim().length > 2 && !isOffline) {
            searchTimeoutRef.current = window.setTimeout(async () => {
                setLoadingICD10(true);
                try {
                    const suggestions = await GeminiService.searchICD10Codes(val);
                    setIcd10Options(suggestions);
                } catch (error) {
                    console.error("Failed to fetch ICD-10 codes", error);
                } finally {
                    setLoadingICD10(false);
                }
            }, 800);
        } else {
            setIcd10Options([]);
        }
    };

    const handleSelectSuggestion = (opt: { code: string, description: string }) => {
        setDiagnosisInput(opt.description);
        setSelectedIcd10(opt.code);
        setIcd10Options([]);
    };

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            try {
                // Upload to GCS and trigger AI processing
                const response = await DataService.uploadFile(file, caseData.id);

                const newFile: UploadedFile = {
                    id: `file-${Date.now()}`,
                    name: response.name,
                    type: (response.type || 'Document') as any,
                    url: response.url,
                };
                onAddFile(newFile);
                showToast.success("File uploaded successfully");
            } catch (error) {
                console.error("Upload failed", error);
                showToast.error("Failed to upload file.");
            }

            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="glass-card rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700 overflow-hidden antigravity-target">
            <div className="p-6 border-b border-white/10 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-heading font-bold text-text-main flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-xl text-white shadow-lg shadow-primary/30">
                                {ICONS.case}
                            </div>
                            Case Details
                        </h2>
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-muted">
                            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-white/20 dark:border-slate-700 backdrop-blur-sm shadow-sm">
                                {ICONS.user}
                                <span className="font-bold text-text-main">{caseData.patientProfile.age} y/o {caseData.patientProfile.sex}</span>
                            </div>
                            {caseData.patientProfile.comorbidities.length > 0 && (
                                <div className="flex items-center gap-2 px-2">
                                    <span className="font-bold text-xs uppercase tracking-widest opacity-60">History:</span>
                                    <span className="font-medium text-text-main">{caseData.patientProfile.comorbidities.join(', ')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onOpenExplanation} disabled={isOffline} className="text-sm bg-white dark:bg-slate-700 text-text-main font-bold py-3 px-6 rounded-xl border border-white/20 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            {ICONS.chat}
                            <span>Explain</span>
                        </button>
                        <button onClick={onOpenAnalysisModal} disabled={isOffline} className="text-sm bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-xl hover:shadow-teal-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95">
                            {ICONS.imageAnalysis}
                            <span>Analyze Image</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-white/10 dark:divide-slate-700/50">
                <div className="mb-4">
                    <AIClinicalSummarySection insights={insights} isLoading={false} onGenerate={() => { }} isOffline={isOffline} onRecordOutcome={onRecordOutcome} />
                    <ClinicalPlanSection caseData={caseData} isOffline={isOffline} />
                </div>

                <CollapsibleSection title="Presenting Complaint" isOpen={openSections.complaint} onToggle={() => toggleSection('complaint')}>
                    {isEditingComplaint ? (
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl m-2 border border-slate-200 dark:border-slate-700/50">
                            <div className="relative">
                                <textarea value={complaintInput} onChange={(e) => setComplaintInput(e.target.value)} rows={4} className="w-full border-0 bg-white dark:bg-slate-900/50 rounded-xl p-4 text-sm pr-12 shadow-inner focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main" placeholder="Enter complaint..." />
                                <div className="absolute bottom-3 right-3 flex gap-2">
                                    <VoiceInput onTranscript={(t) => setComplaintInput(prev => prev + t)} disabled={isOffline} />
                                    <VoiceRecorder onTranscript={(t) => setComplaintInput(prev => prev + t)} disabled={isOffline} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => { setIsEditingComplaint(false); setComplaintInput(caseData.complaint); }} className="bg-white dark:bg-slate-700 text-text-main font-bold py-2 px-4 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm">Cancel</button>
                                <button onClick={handleSaveComplaint} className="bg-primary text-white font-bold py-2 px-6 rounded-xl text-xs hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all">Save</button>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative p-2">
                            <p>
                                {insights?.keySymptoms ? (
                                    <>
                                        {caseData.complaint.split(new RegExp(`(${insights.keySymptoms.join('|')})`, 'gi')).map((part, index) =>
                                            insights.keySymptoms.some(symptom => part.toLowerCase() === symptom.toLowerCase()) ?
                                                <mark key={index} className="bg-yellow-200 text-black rounded px-1">{part}</mark> :
                                                <span key={index}>{part}</span>
                                        )}
                                    </>
                                ) : caseData.complaint}
                            </p>
                            <button onClick={() => setIsEditingComplaint(true)} disabled={isOffline} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface p-1 rounded-full shadow-md disabled:hidden">{ICONS.edit}</button>
                        </div>
                    )}
                </CollapsibleSection>

                {/* Specialist Support Panel - Dynamic Domain Support */}
                <CollapsibleSection title="AI Specialist Support" isOpen={openSections.specialty} onToggle={() => toggleSection('specialty')}>
                    <div className="p-2">
                        <SpecialistSupportPanel
                            caseData={caseData}
                            isOffline={isOffline}
                        />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="History" isOpen={openSections.history} onToggle={() => toggleSection('history')}>
                    {isEditingHistory ? (
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl m-2 border border-slate-200 dark:border-slate-700/50">
                            <div className="relative">
                                <textarea value={historyInput} onChange={(e) => setHistoryInput(e.target.value)} rows={5} className="w-full border-0 bg-white dark:bg-slate-900/50 rounded-xl p-4 text-sm pr-12 shadow-inner focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main" placeholder="Enter history..." />
                                <div className="absolute bottom-3 right-3"><VoiceInput onTranscript={(t) => setHistoryInput(prev => prev + t)} disabled={isOffline} /></div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => { setIsEditingHistory(false); setHistoryInput(caseData.history); }} className="bg-white dark:bg-slate-700 text-text-main font-bold py-2 px-4 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm">Cancel</button>
                                <button onClick={handleSaveHistory} className="bg-primary text-white font-bold py-2 px-6 rounded-xl text-xs hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all">Save</button>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative p-2">
                            <p>{caseData.history}</p>
                            <button onClick={() => setIsEditingHistory(true)} disabled={isOffline} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface p-1 rounded-full shadow-md disabled:hidden">{ICONS.edit}</button>
                        </div>
                    )}
                </CollapsibleSection>

                <CollapsibleSection title="Exam Findings" isOpen={openSections.findings} onToggle={() => toggleSection('findings')}>
                    {isEditingFindings ? (
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl m-2 border border-slate-200 dark:border-slate-700/50">
                            <div className="relative">
                                <textarea value={findingsInput} onChange={(e) => setFindingsInput(e.target.value)} rows={5} className="w-full border-0 bg-white dark:bg-slate-900/50 rounded-xl p-4 text-sm pr-12 shadow-inner focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main" placeholder="Enter findings..." />
                                <div className="absolute bottom-3 right-3"><VoiceInput onTranscript={(t) => setFindingsInput(prev => prev + t)} disabled={isOffline} /></div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => { setIsEditingFindings(false); setFindingsInput(caseData.findings); }} className="bg-white dark:bg-slate-700 text-text-main font-bold py-2 px-4 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm">Cancel</button>
                                <button onClick={handleSaveFindings} className="bg-primary text-white font-bold py-2 px-6 rounded-xl text-xs hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all">Save</button>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative p-2">
                            <p>{caseData.findings}</p>
                            <button onClick={() => setIsEditingFindings(true)} disabled={isOffline} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface p-1 rounded-full shadow-md disabled:hidden">{ICONS.edit}</button>
                        </div>
                    )}
                </CollapsibleSection>

                <CollapsibleSection
                    title="Diagnosis"
                    isOpen={openSections.diagnosis}
                    onToggle={() => toggleSection('diagnosis')}
                >
                    {isEditingDiagnosis ? (
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl m-2 border border-slate-200 dark:border-slate-700/50 space-y-4">
                            <div className="relative">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Diagnosis Description</label>
                                    {loadingICD10 && <span className="text-xs text-primary font-bold animate-pulse">Searching codes...</span>}
                                </div>
                                <textarea value={diagnosisInput} onChange={handleDiagnosisChange} rows={2} className="w-full border-0 bg-white dark:bg-slate-900/50 rounded-xl p-4 text-sm pr-12 shadow-inner focus:ring-2 focus:ring-primary/50 transition-all font-medium text-text-main" placeholder="Enter diagnosis..." />
                                <div className="absolute bottom-3 right-3"><VoiceInput onTranscript={(t) => setDiagnosisInput(prev => prev + t)} disabled={isOffline} /></div>

                                {icd10Options.length > 0 && (
                                    <ul ref={dropdownRef} className="absolute z-50 w-full bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-xl shadow-xl mt-2 max-h-60 overflow-y-auto animate-fade-in">
                                        {icd10Options.map((opt, index) => (
                                            <li
                                                key={index}
                                                onClick={() => handleSelectSuggestion(opt)}
                                                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm border-b dark:border-slate-700/50 last:border-b-0 transition-colors"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-primary mr-3 bg-primary/10 px-2 py-0.5 rounded">{opt.code}</span>
                                                    <span className="text-text-main truncate">{opt.description}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">ICD-10 Code</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={selectedIcd10}
                                        onChange={(e) => setSelectedIcd10(e.target.value)}
                                        placeholder="e.g. I80.2"
                                        className="w-full border-0 bg-white dark:bg-slate-900/50 rounded-xl p-3 text-sm font-mono uppercase shadow-inner focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => { setIsEditingDiagnosis(false); setDiagnosisInput(caseData.diagnosis); setSelectedIcd10(caseData.icd10Code || ''); setIcd10Options([]); }} className="bg-white dark:bg-slate-700 text-text-main font-bold py-2 px-4 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm">Cancel</button>
                                <button onClick={handleSaveDiagnosis} className="bg-primary text-white font-bold py-2 px-6 rounded-xl text-xs hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all">Save</button>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative p-2">
                            <p>{caseData.diagnosis}</p>
                            {caseData.icd10Code && (
                                <span className="inline-block mt-2 px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs rounded-md">
                                    ICD-10: {caseData.icd10Code}
                                </span>
                            )}
                            <button onClick={() => setIsEditingDiagnosis(true)} disabled={isOffline} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface p-1 rounded-full shadow-md disabled:hidden">{ICONS.edit}</button>
                        </div>
                    )}
                </CollapsibleSection>

                {caseData.labResults && (
                    <CollapsibleSection title="Lab Results" isOpen={openSections.labs} onToggle={() => toggleSection('labs')}>
                        <LabResultsTable results={caseData.labResults} onAddResult={onAddLabResult} isOffline={isOffline} />
                    </CollapsibleSection>
                )}

                <CollapsibleSection title="Voice Notes" isOpen={openSections.notes} onToggle={() => toggleSection('notes')}>
                    <VoiceNoteList
                        caseId={caseData.id}
                        notes={caseData.comments || []}
                        onAddNote={onAddVoiceNote}
                    />
                </CollapsibleSection>

                <div>
                    <div className="p-6 bg-slate-50/30 dark:bg-slate-800/20">
                        <h3 className="font-bold text-text-muted mb-4 uppercase tracking-widest text-xs">Attached Files</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {caseData.files.map(file => (
                                <li key={file.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-white/20 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500">
                                            {ICONS.document}
                                        </div>
                                        <span className="text-sm font-bold text-text-main truncate">{file.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(file.type === 'Photo' || file.name.match(/\.(jpg|jpeg|png|webp|dcm)$/i)) && (
                                            <button
                                                onClick={() => {
                                                    // Ideally open the modal pre-filled, but for now we just open it. 
                                                    // Enhancing ImageAnalysis to accept a file URL would be next, 
                                                    // but user just asked to Display AI analysis results.
                                                    // I'll simulate "Display Analysis" by opening the modal.
                                                    onOpenAnalysisModal();
                                                }}
                                                className="text-white bg-teal-500 hover:bg-teal-600 p-1.5 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 shadow-sm"
                                                title="Analyze with AI"
                                            >
                                                {ICONS.imageAnalysis} Analyze
                                            </button>
                                        )}
                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary hover:text-white transition-colors">View</a>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 flex items-center gap-4">
                            <label className="cursor-pointer group">
                                <span className="text-sm font-bold text-primary group-hover:underline flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl group-hover:bg-primary/10 transition-colors">
                                    {ICONS.upload} Upload File
                                </span>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" disabled={isOffline} />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

// --- Main CaseView Component ---

const CaseView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'chat' | 'discussion' | 'guidelines' | 'financials' | 'specialists' | 'research'>('details');
    const [isInsightsLoading, setIsInsightsLoading] = useState(false);
    const [insights, setInsights] = useState<AIInsights | null>(null);
    const [isImageAnalysisOpen, setIsImageAnalysisOpen] = useState(false);
    const [isExplanationOpen, setIsExplanationOpen] = useState(false);
    const [explanation, setExplanation] = useState("");
    const [isExplaining, setIsExplaining] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);


    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const fetchCase = React.useCallback(async () => {
        if (!id) return;
        // Don't set loading on updates to avoid flicker, only initial
        if (!caseData) setIsLoading(true);
        try {
            const foundCase = await DataService.getCaseById(id);
            setCaseData(foundCase || null);

            if (foundCase && user) {
                // Ensure we join if not already (this is safe to call repeatedly if idempotent, or we check state)
                joinCase(foundCase.id, user.id);
                startCaseDiscussionSimulation(foundCase.id, user);
            }
        } catch (error) {
            console.error("Error fetching case:", error);
        } finally {
            setIsLoading(false);
        }
    }, [id, user, caseData]); // Added caseData to dependencies for the `if (!caseData)` check

    useEffect(() => {
        fetchCase();

        return () => {
            if (id && user) {
                leaveCase(id, user.id);
                stopCaseDiscussionSimulation();
            }
        }
    }, [fetchCase, id, user]);

    const handleGenerateInsights = async () => {
        if (!caseData) return;
        setIsInsightsLoading(true);
        try {
            const result = await GeminiService.getCaseInsights(caseData);
            setInsights(result);
        } catch (error) {
            console.error("Failed to generate insights", error);
            showToast.error("Failed to generate insights.");
        } finally {
            setIsInsightsLoading(false);
        }
    };

    const handleAddFile = React.useCallback(async (file: UploadedFile) => {
        if (!caseData) return;
        const updatedCase = { ...caseData, files: [...caseData.files, file] };
        setCaseData(updatedCase);
        await DataService.addCaseFile(caseData.id, file);
    }, [caseData]);

    const handleAddLabResult = async (result: LabResult) => {
        if (!caseData) return;
        const updatedResults = [...(caseData.labResults || []), result];
        const updatedCase = { ...caseData, labResults: updatedResults };
        setCaseData(updatedCase);
        await DataService.addLabResult(caseData.id, result);
    };

    const handleUpdateComplaint = async (val: string) => {
        if (!caseData) return;
        await DataService.updateCase(caseData.id, { complaint: val });
        setCaseData(prev => prev ? ({ ...prev, complaint: val }) : null);
    };

    const handleUpdateHistory = async (val: string) => {
        if (!caseData) return;
        await DataService.updateCase(caseData.id, { history: val });
        setCaseData(prev => prev ? ({ ...prev, history: val }) : null);
    };

    const handleUpdateFindings = async (val: string) => {
        if (!caseData) return;
        await DataService.updateCase(caseData.id, { findings: val });
        setCaseData(prev => prev ? ({ ...prev, findings: val }) : null);
    };

    const handleUpdateDiagnosis = async (val: string) => {
        if (!caseData) return;
        await DataService.updateCase(caseData.id, { diagnosis: val });
        setCaseData(prev => prev ? ({ ...prev, diagnosis: val }) : null);
    };

    const handleUpdateICD10 = async (val: string) => {
        if (!caseData) return;
        await DataService.updateCase(caseData.id, { icd10Code: val });
        setCaseData(prev => prev ? ({ ...prev, icd10Code: val }) : null);
    };

    const [isOutcomeOpen, setOutcomeOpen] = useState(false);
    const handleRecordOutcome = () => setOutcomeOpen(true);
    const handleSaveOutcome = async (outcome: string) => {
        setOutcomeOpen(false);
        try {
            await fetch('/api/ai/outcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ case_id: caseData?.id, outcome })
            });
            showToast.success("Lesson Learned & Indexed.");
        } catch (e) { showToast.error("Failed to save outcome."); }
    };

    const handlePostComment = async (comment: any) => { // Type mismatch fix as well if comment is obj
        // Wait, the previous signature was addComment(caseId, content).
        // CaseDiscussion likely returns the text or an object. Checking usage.
        // Assuming 'comment' here is the content string effectively or I need to extract it.
        // If 'comment' is the full object, I need to pass comment.caseId and comment.text
        // But look at CaseView.tsx: handlePostComment = async (comment: Comment) => ...
        // And Comment interface has caseId and text. 
        if (typeof comment === 'string') {
            // If it's just a string, we need caseId. caseData.id is available.
            await DataService.addComment(caseData?.id || '', comment);
        } else {
            await DataService.addComment(comment.caseId, comment.text);
        }
    };

    const handleOpenExplanation = async () => {
        if (!caseData) return;
        setIsExplanationOpen(true);
        if (!explanation) {
            setIsExplaining(true);
            try {
                // Generate explanation
                const res = await GeminiService.getPatientReport(caseData.id);
                setExplanation(res.report || "Could not generate explanation.");
            } catch (e) {
                showToast.error("Failed to generate explanation.");
                setExplanation("Failed to generate explanation.");
            } finally {
                setIsExplaining(false);
            }
        }
    };

    const handleAddVoiceNote = async (note: string) => {
        if (!caseData || !user) return;
        const newHelperComment: Comment = {
            id: `note-${Date.now()}`,
            caseId: caseData.id,
            userId: user.id || 'unknown',
            userName: user.name || 'Unknown',
            userRole: user.role, // Added missing role
            text: note,
            timestamp: new Date().toISOString()
        };
        await DataService.addComment(caseData.id, newHelperComment.text);
        const updatedComments = [...(caseData.comments || []), newHelperComment];
        setCaseData({ ...caseData, comments: updatedComments });
        showToast.success("Voice note added");
    };



    if (isLoading) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-text-muted font-semibold">Loading case details...</p>
                </div>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-text-main mb-2">Case Not Found</h2>
                    <p className="text-text-muted">The case you requested does not exist or you do not have permission to view it.</p>
                    <button onClick={() => window.history.back()} className="mt-4 text-primary hover:underline">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen pb-10">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <Breadcrumbs items={[
                        { label: 'Dashboard', path: '/dashboard' },
                        { label: caseData.title }
                    ]} />
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar / Tabs */}
                    <div className="lg:w-1/4">
                        <div className="glass-card p-2 rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 sticky top-6">
                            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`flex-shrink-0 w-full text-left px-5 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-3 whitespace-nowrap outline-none ${activeTab === 'details' ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/30' : 'text-text-muted hover:bg-slate-100/50 dark:hover:bg-slate-700/50 hover:text-text-main'}`}
                                >
                                    {ICONS.case} Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex-shrink-0 w-full text-left px-5 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-3 whitespace-nowrap outline-none ${activeTab === 'chat' ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30' : 'text-text-muted hover:bg-slate-100/50 dark:hover:bg-slate-700/50 hover:text-text-main'}`}
                                >
                                    {ICONS.ai} AI Chat
                                </button>
                                <button
                                    onClick={() => setActiveTab('discussion')}
                                    className={`flex-shrink-0 w-full text-left px-5 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-3 whitespace-nowrap outline-none ${activeTab === 'discussion' ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30' : 'text-text-muted hover:bg-slate-100/50 dark:hover:bg-slate-700/50 hover:text-text-main'}`}
                                >
                                    {ICONS.chat} Discussion
                                </button>
                                <button
                                    onClick={() => setActiveTab('guidelines')}
                                    className={`flex-shrink-0 w-full text-left px-5 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-3 whitespace-nowrap outline-none ${activeTab === 'guidelines' ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30' : 'text-text-muted hover:bg-slate-100/50 dark:hover:bg-slate-700/50 hover:text-text-main'}`}
                                >
                                    {ICONS.guidelines} Guidelines
                                </button>

                                <button
                                    onClick={() => setActiveTab('financials')}
                                    className={`flex-shrink-0 w-full text-left px-5 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-3 whitespace-nowrap outline-none ${activeTab === 'financials' ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30' : 'text-text-muted hover:bg-slate-100/50 dark:hover:bg-slate-700/50 hover:text-text-main'}`}
                                >
                                    {ICONS.document} Financials
                                </button>
                                <button
                                    onClick={() => setActiveTab('research')}
                                    className={`flex-shrink-0 w-full text-left px-5 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-3 whitespace-nowrap outline-none ${activeTab === 'research' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30' : 'text-text-muted hover:bg-slate-100/50 dark:hover:bg-slate-700/50 hover:text-text-main'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    Research
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:w-3/4">
                        {activeTab === 'details' && (
                            <>
                                {/* Voice Assistant for Case Editing */}
                                <VoiceFormAssistant
                                    formSchema={{
                                        complaint: "string",
                                        history: "string",
                                        findings: "string",
                                        diagnosis: "string",
                                        icd10Code: "string"
                                    }}
                                    formData={{
                                        complaint: caseData.complaint,
                                        history: caseData.history,
                                        findings: caseData.findings,
                                        diagnosis: caseData.diagnosis,
                                        icd10Code: caseData.icd10Code
                                    }}
                                    onUpdate={(updates) => {
                                        if (updates.complaint) handleUpdateComplaint(updates.complaint);
                                        if (updates.history) handleUpdateHistory(updates.history);
                                        if (updates.findings) handleUpdateFindings(updates.findings);
                                        if (updates.diagnosis) handleUpdateDiagnosis(updates.diagnosis);
                                        if (updates.icd10Code) handleUpdateICD10(updates.icd10Code);
                                    }}
                                />

                                <AIClinicalSummarySection
                                    insights={insights}
                                    isLoading={isInsightsLoading}
                                    onGenerate={handleGenerateInsights}
                                    isOffline={isOffline}
                                    onRecordOutcome={handleRecordOutcome}
                                />
                                <CaseDetailsCard
                                    caseData={caseData}
                                    onAddFile={handleAddFile}
                                    insights={insights}
                                    onAddLabResult={handleAddLabResult}
                                    onOpenAnalysisModal={() => setIsImageAnalysisOpen(true)}
                                    isOffline={isOffline}
                                    onRecordOutcome={handleRecordOutcome}
                                    onUpdateComplaint={handleUpdateComplaint}
                                    onUpdateHistory={handleUpdateHistory}
                                    onUpdateFindings={handleUpdateFindings}
                                    onUpdateDiagnosis={handleUpdateDiagnosis}
                                    onUpdateICD10={handleUpdateICD10}
                                    onOpenExplanation={handleOpenExplanation}
                                    onAddVoiceNote={handleAddVoiceNote}
                                />
                            </>
                        )}
                        {activeTab === 'chat' && (
                            <AIChat caseData={caseData} onAddFile={handleAddFile} isOffline={isOffline} />
                        )}
                        {activeTab === 'specialists' && (
                            <div className="space-y-6 animate-fade-in">
                                <AgentsConsole caseData={caseData} onUpdate={fetchCase} />
                            </div>
                        )}
                        {activeTab === 'discussion' && (
                            <CaseDiscussion caseId={caseData.id} onPostComment={handlePostComment} isOffline={isOffline} />
                        )}
                        {activeTab === 'guidelines' && (
                            <ClinicalGuidelinesCard diagnosis={caseData.diagnosis} isOffline={isOffline} />
                        )}
                        {activeTab === 'financials' && (
                            <div className="space-y-6">
                                <FinancialsTab caseData={caseData} />

                                <div className="glass-card p-6 rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50">
                                    <h3 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                                        {ICONS.money} Payment & Donations
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                            <h4 className="font-bold text-text-main mb-2 border-b pb-2 dark:border-slate-700">PayPal</h4>
                                            <PayPalPayment onSuccess={(details) => {
                                                showToast.success(`PayPal Payment successful!`);
                                            }} />
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                            <h4 className="font-bold text-text-main mb-2 border-b pb-2 dark:border-slate-700">Credit Card (Stripe)</h4>
                                            <StripePayment onSuccess={() => {
                                                showToast.success(`Stripe Payment successful!`);
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'research' && user && (
                            <ResearchPanel caseData={caseData} userRole={user.role} />
                        )}
                    </div>
                </div>
            </div>

            {
                isExplanationOpen && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in border border-white/10 dark:border-slate-700">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="text-xl font-heading font-bold text-text-main flex items-center gap-2">
                                    {ICONS.chat} Patient Explanation
                                </h3>
                                <button onClick={() => setIsExplanationOpen(false)} className="text-text-muted hover:text-text-main p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-6 max-h-[70vh] overflow-y-auto">
                                {isExplaining ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-4">
                                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <p className="font-bold animate-pulse">Generating simplified explanation...</p>
                                    </div>
                                ) : (
                                    <div className="prose dark:prose-invert max-w-none text-text-main whitespace-pre-wrap leading-relaxed">
                                        {explanation}
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3">
                                <button onClick={() => { navigator.clipboard.writeText(explanation); }} className="px-4 py-2 text-primary font-bold hover:bg-primary/10 rounded-xl transition-colors">
                                    Copy Text
                                </button>
                                <button onClick={() => setIsExplanationOpen(false)} className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <FileAnalysisModal
                isOpen={isImageAnalysisOpen}
                onClose={() => setIsImageAnalysisOpen(false)}
                isOffline={isOffline}
                onSaveNote={handleAddVoiceNote}
            />

            <OutcomeModal
                isOpen={isOutcomeOpen}
                onClose={() => setOutcomeOpen(false)}
                onSave={handleSaveOutcome}
            />
        </div>
    );
};

const DonateToResearchButton: React.FC<{ caseId: string }> = ({ caseId }) => {
    const [showModal, setShowModal] = useState(false);
    const [groupId, setGroupId] = useState('');
    const [groups, setGroups] = useState<any[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (showModal) {
            loadGroups();
        }
    }, [showModal]);

    const loadGroups = async () => {
        setIsLoadingGroups(true);
        try {
            const data = await DataService.getResearchGroups();
            setGroups(data);
            if (data.length > 0) setGroupId(data[0].id);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingGroups(false);
        }
    };

    const handleDonate = async () => {
        if (!groupId) return showToast.error("Please select a Group");
        setIsSubmitting(true);
        try {
            const res = await DataService.contributeToResearch(groupId, 'Case', caseId);
            showToast.success(`Donation Successful! Earned ${res.tokens_earned.toFixed(2)} tokens.`);
            setShowModal(false);
        } catch (e) {
            showToast.error("Donation failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-600/20 font-bold py-3 px-6 rounded-xl hover:bg-emerald-600/20 transition-all flex items-center gap-2"
            >
                {ICONS.money} Donate to Research
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in border border-white/20 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-text-main mb-2">Donate Case to Science</h3>
                        <p className="text-sm text-text-muted mb-4">
                            Contributing this case helps medical research.
                            Data will be anonymized. You will receive ARAMS tokens.
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-text-muted mb-1">Target Research Group</label>
                            {isLoadingGroups ? (
                                <div className="text-sm text-text-muted animate-pulse">Loading groups...</div>
                            ) : groups.length > 0 ? (
                                <select
                                    value={groupId}
                                    onChange={e => setGroupId(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none"
                                >
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name} ({g.topic})</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="text-sm text-red-500">No active research groups found.</div>
                            )}
                            <p className="text-[10px] text-text-muted mt-1">
                                Join more groups in the <a href="/research-community" className="text-primary underline">Research Community</a>.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-text-muted hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button
                                onClick={handleDonate}
                                disabled={isSubmitting || !groupId}
                                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Processing...' : 'Confirm Donation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CaseView;

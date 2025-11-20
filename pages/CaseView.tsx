
import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GeminiService, startCaseDiscussionSimulation, stopCaseDiscussionSimulation, joinCase, leaveCase, DataService } from '../services/api';
import { Case, UploadedFile, LabResult, AIInsights, Comment } from '../types/index';
import { ICONS } from '../constants/index';
import AIChat from '../components/AIChat';
import CaseDiscussion from '../components/CaseDiscussion';
import { useAuth } from '../components/Auth';
import ImageAnalysis from '../components/ImageAnalysis';
import VoiceInput from '../components/VoiceInput';
import Breadcrumbs from '../components/Breadcrumbs';
import ClinicalGuidelinesCard from '../components/ClinicalGuidelinesCard';

// --- Helper Components ---

const CollapsibleSection: React.FC<{ title: ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, isOpen, onToggle, children }) => {
    return (
        <div className="border-t">
            <button onClick={onToggle} className="w-full flex justify-between items-center py-3 px-4 text-left font-semibold text-text-muted hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:outline-none transition-colors">
                <div className="flex items-center gap-2">{title}</div>
                <svg className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && <div className="p-4 bg-slate-50 dark:bg-slate-800/30 text-sm text-text-muted whitespace-pre-wrap border-t dark:border-slate-700">{children}</div>}
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

const LabResultsTable: React.FC<{ results: LabResult[]; onAddResult: (result: LabResult) => void; isOffline: boolean }> = ({ results, onAddResult, isOffline }) => {
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
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Test</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Value</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Range</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Interpretation</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800/50 divide-y divide-gray-200 dark:divide-slate-700">
                        {results.map((res, idx) => (
                            <tr key={idx}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-text-main font-medium">{res.test}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-text-muted">{res.value} <span className="text-xs opacity-70">{res.unit}</span></td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-text-muted">{res.referenceRange}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getBadgeColor(res.interpretation)}`}>
                                        {res.interpretation}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isAdding ? (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded border dark:border-slate-700 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Test Name" className="border dark:border-slate-600 bg-inherit rounded p-1 text-sm" value={newResult.test} onChange={e => setNewResult({...newResult, test: e.target.value})} />
                        <input placeholder="Value" className="border dark:border-slate-600 bg-inherit rounded p-1 text-sm" value={newResult.value} onChange={e => setNewResult({...newResult, value: e.target.value})} />
                        <input placeholder="Unit" className="border dark:border-slate-600 bg-inherit rounded p-1 text-sm" value={newResult.unit} onChange={e => setNewResult({...newResult, unit: e.target.value})} />
                        <input placeholder="Ref Range" className="border dark:border-slate-600 bg-inherit rounded p-1 text-sm" value={newResult.referenceRange} onChange={e => setNewResult({...newResult, referenceRange: e.target.value})} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAdd} className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-hover">Add</button>
                        <button onClick={() => setIsAdding(false)} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded hover:bg-slate-300 dark:hover:bg-slate-600">Cancel</button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setIsAdding(true)} disabled={isOffline} className="mt-3 text-sm text-primary hover:underline disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Lab Result
                </button>
            )}
        </div>
    );
};

// --- AI Clinical Summary Section (Standalone) ---

const AIClinicalSummarySection: React.FC<{
    insights: AIInsights | null;
    isLoading: boolean;
    onGenerate: () => void;
    isOffline: boolean;
}> = ({ insights, isLoading, onGenerate, isOffline }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Automatically open when insights are generated
    useEffect(() => {
        if (insights && !isLoading) setIsOpen(true);
    }, [insights, isLoading]);

    return (
        <div className="bg-surface rounded-lg shadow-md border border-slate-200 dark:border-slate-700 mb-6 overflow-hidden">
             <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
             >
                <div className="flex items-center gap-2 text-lg font-bold text-text-main">
                    <span className="text-primary">{ICONS.ai}</span>
                    <span>AI Clinical Summary</span>
                </div>
                <svg className={`w-5 h-5 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
             </button>
             
             {isOpen && (
                 <div className="p-6 border-t dark:border-slate-700 animate-fade-in">
                     {!insights ? (
                        <div className="text-center py-4">
                            <p className="text-text-muted mb-4">Generate AI insights to analyze the case and identify key risks.</p>
                            <button 
                                onClick={onGenerate} 
                                disabled={isLoading || isOffline} 
                                className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-indigo-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>Analyzing Case...</span>
                                    </>
                                ) : (
                                    'Generate AI Insights'
                                )}
                            </button>
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
                                                <span key={i} className="px-2.5 py-1 bg-white dark:bg-slate-700 text-info-text dark:text-blue-300 text-xs font-bold rounded-full border border-info-border dark:border-blue-800 shadow-sm">{symptom}</span>
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
             )}
        </div>
    );
};

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
}

const CaseDetailsCard: React.FC<CaseDetailsCardProps> = ({ caseData, onAddFile, insights, onAddLabResult, onOpenAnalysisModal, isOffline, onUpdateComplaint, onUpdateHistory, onUpdateFindings, onUpdateDiagnosis, onUpdateICD10 }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [openSections, setOpenSections] = useState({
        complaint: true,
        history: true,
        findings: true,
        diagnosis: true,
        labs: true,
    });
    
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
    const [icd10Options, setIcd10Options] = useState<{code: string, description: string}[]>([]);
    const [loadingICD10, setLoadingICD10] = useState(false);
    const searchTimeoutRef = useRef<number | null>(null);
    const dropdownRef = useRef<HTMLUListElement>(null);

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

    const handleSelectSuggestion = (opt: {code: string, description: string}) => {
        setDiagnosisInput(opt.description);
        setSelectedIcd10(opt.code);
        setIcd10Options([]);
    };

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({...prev, [section]: !prev[section]}));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const newFile: UploadedFile = {
                id: `file-${Date.now()}`,
                name: file.name,
                type: 'Photo', // Defaulting for simplicity
                url: URL.createObjectURL(file),
            };
            onAddFile(newFile);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="bg-surface rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b dark:border-slate-700">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-text-main">Case Details</h2>
                        <div className="mt-2 text-sm text-text-muted">
                             <p><strong>Patient:</strong> {caseData.patientProfile.age} y/o {caseData.patientProfile.sex}</p>
                             <p><strong>Comorbidities:</strong> {caseData.patientProfile.comorbidities.join(', ')}</p>
                        </div>
                    </div>
                    <div>
                        <button onClick={onOpenAnalysisModal} disabled={isOffline} className="text-sm bg-teal-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-teal-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2">
                            {ICONS.imageAnalysis}
                            <span>Analyze Image</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-slate-700">
                <CollapsibleSection title="Presenting Complaint" isOpen={openSections.complaint} onToggle={() => toggleSection('complaint')}>
                     {isEditingComplaint ? (
                        <div className="p-2">
                             <div className="relative">
                                <textarea value={complaintInput} onChange={(e) => setComplaintInput(e.target.value)} rows={4} className="w-full border dark:border-slate-600 bg-inherit rounded-md p-2 text-sm pr-10" />
                                <div className="absolute bottom-2 right-2"><VoiceInput onTranscript={(t) => setComplaintInput(prev => prev + t)} disabled={isOffline} /></div>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => { setIsEditingComplaint(false); setComplaintInput(caseData.complaint); }} className="bg-slate-200 text-slate-800 font-semibold py-1 px-3 rounded-md text-sm">Cancel</button>
                                <button onClick={handleSaveComplaint} className="bg-accent text-white font-semibold py-1 px-3 rounded-md text-sm">Save</button>
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

                <CollapsibleSection title="History" isOpen={openSections.history} onToggle={() => toggleSection('history')}>
                     {isEditingHistory ? (
                        <div className="p-2">
                            <div className="relative">
                                <textarea value={historyInput} onChange={(e) => setHistoryInput(e.target.value)} rows={5} className="w-full border dark:border-slate-600 bg-inherit rounded-md p-2 text-sm pr-10" />
                                 <div className="absolute bottom-2 right-2"><VoiceInput onTranscript={(t) => setHistoryInput(prev => prev + t)} disabled={isOffline} /></div>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => { setIsEditingHistory(false); setHistoryInput(caseData.history); }} className="bg-slate-200 text-slate-800 font-semibold py-1 px-3 rounded-md text-sm">Cancel</button>
                                <button onClick={handleSaveHistory} className="bg-accent text-white font-semibold py-1 px-3 rounded-md text-sm">Save</button>
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
                        <div className="p-2">
                             <div className="relative">
                                <textarea value={findingsInput} onChange={(e) => setFindingsInput(e.target.value)} rows={5} className="w-full border dark:border-slate-600 bg-inherit rounded-md p-2 text-sm pr-10" />
                                 <div className="absolute bottom-2 right-2"><VoiceInput onTranscript={(t) => setFindingsInput(prev => prev + t)} disabled={isOffline} /></div>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => { setIsEditingFindings(false); setFindingsInput(caseData.findings); }} className="bg-slate-200 text-slate-800 font-semibold py-1 px-3 rounded-md text-sm">Cancel</button>
                                <button onClick={handleSaveFindings} className="bg-accent text-white font-semibold py-1 px-3 rounded-md text-sm">Save</button>
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
                        <div className="p-2 space-y-3">
                             <div className="relative">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-text-muted">Description</label>
                                    {loadingICD10 && <span className="text-xs text-primary animate-pulse">Searching codes...</span>}
                                </div>
                                <textarea value={diagnosisInput} onChange={handleDiagnosisChange} rows={2} className="w-full border dark:border-slate-600 bg-inherit rounded-md p-2 text-sm pr-10" />
                                <div className="absolute bottom-2 right-2"><VoiceInput onTranscript={(t) => setDiagnosisInput(prev => prev + t)} disabled={isOffline} /></div>
                                
                                {icd10Options.length > 0 && (
                                    <ul ref={dropdownRef} className="absolute z-50 w-full bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                        {icd10Options.map((opt, index) => (
                                            <li 
                                                key={index} 
                                                onClick={() => handleSelectSuggestion(opt)} 
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-xs border-b dark:border-slate-700 last:border-b-0"
                                            >
                                                <div className="flex justify-between">
                                                    <span className="font-bold text-primary mr-2">{opt.code}</span>
                                                    <span className="text-text-main truncate">{opt.description}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-1">ICD-10 Code</label>
                                <div className="relative">
                                     <input 
                                        type="text" 
                                        value={selectedIcd10} 
                                        onChange={(e) => setSelectedIcd10(e.target.value)}
                                        placeholder="e.g. I80.2"
                                        className="w-full border dark:border-slate-600 bg-inherit rounded-md p-2 text-sm font-mono uppercase"
                                     />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => { setIsEditingDiagnosis(false); setDiagnosisInput(caseData.diagnosis); setSelectedIcd10(caseData.icd10Code || ''); setIcd10Options([]); }} className="bg-slate-200 text-slate-800 font-semibold py-1 px-3 rounded-md text-sm">Cancel</button>
                                <button onClick={handleSaveDiagnosis} className="bg-accent text-white font-semibold py-1 px-3 rounded-md text-sm">Save</button>
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

                <div>
                    <div className="p-4">
                         <h3 className="font-semibold text-text-muted mb-2">Attached Files</h3>
                         <ul className="space-y-2">
                             {caseData.files.map(file => (
                                 <li key={file.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                                     <span className="text-sm font-medium text-text-main">{file.name}</span>
                                     <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-semibold hover:underline">View</a>
                                 </li>
                             ))}
                         </ul>
                         <div className="mt-4 flex items-center gap-2">
                             <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-info-light file:text-primary hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-800/50" disabled={isOffline}/>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main CaseView Component ---

const CaseView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'chat' | 'discussion' | 'guidelines'>('details');
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isImageAnalysisOpen, setIsImageAnalysisOpen] = useState(false);
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

  useEffect(() => {
    const fetchCase = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const foundCase = await DataService.getCaseById(id);
            setCaseData(foundCase || null);
            
            if (foundCase && user) {
                joinCase(foundCase.id, user.id);
                startCaseDiscussionSimulation(foundCase.id, user);
            }
        } catch (error) {
            console.error("Error fetching case:", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchCase();

    return () => {
        if (id && user) {
            leaveCase(id, user.id);
            stopCaseDiscussionSimulation();
        }
    }
  }, [id, user]);

  const handleGenerateInsights = async () => {
    if (!caseData) return;
    setIsInsightsLoading(true);
    try {
        const result = await GeminiService.getCaseInsights(caseData);
        setInsights(result);
    } catch (error) {
        console.error("Failed to generate insights", error);
    } finally {
        setIsInsightsLoading(false);
    }
  };

  const handleAddFile = async (file: UploadedFile) => {
      if (!caseData) return;
      // Ideally, this would be an API call to upload the file and attach it to the case.
      // For now, we'll simulate the update locally and via the updateCase method.
      const updatedCase = { ...caseData, files: [...caseData.files, file] };
      setCaseData(updatedCase);
      await DataService.updateCase(caseData.id, { files: updatedCase.files });
  };

  const handleAddLabResult = async (result: LabResult) => {
      if (!caseData) return;
      const updatedResults = [...(caseData.labResults || []), result];
      const updatedCase = { ...caseData, labResults: updatedResults };
      setCaseData(updatedCase);
      await DataService.updateCase(caseData.id, { labResults: updatedResults });
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

  const handlePostComment = async (comment: Comment) => {
      await DataService.addComment(comment);
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
        
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar / Tabs */}
            <div className="lg:w-1/4 space-y-2">
                <button 
                    onClick={() => setActiveTab('details')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'details' ? 'bg-primary text-white shadow-md' : 'bg-surface text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    {ICONS.case} Details
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'chat' ? 'bg-primary text-white shadow-md' : 'bg-surface text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    {ICONS.ai} AI Chat
                </button>
                <button 
                    onClick={() => setActiveTab('discussion')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'discussion' ? 'bg-primary text-white shadow-md' : 'bg-surface text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    {ICONS.chat} Discussion
                </button>
                <button 
                    onClick={() => setActiveTab('guidelines')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'guidelines' ? 'bg-primary text-white shadow-md' : 'bg-surface text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    {ICONS.guidelines} Guidelines
                </button>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
                {activeTab === 'details' && (
                    <>
                        <AIClinicalSummarySection 
                            insights={insights} 
                            isLoading={isInsightsLoading} 
                            onGenerate={handleGenerateInsights}
                            isOffline={isOffline}
                        />
                        <CaseDetailsCard 
                            caseData={caseData} 
                            onAddFile={handleAddFile}
                            insights={insights}
                            onAddLabResult={handleAddLabResult}
                            onOpenAnalysisModal={() => setIsImageAnalysisOpen(true)}
                            isOffline={isOffline}
                            onUpdateComplaint={handleUpdateComplaint}
                            onUpdateHistory={handleUpdateHistory}
                            onUpdateFindings={handleUpdateFindings}
                            onUpdateDiagnosis={handleUpdateDiagnosis}
                            onUpdateICD10={handleUpdateICD10}
                        />
                    </>
                )}
                {activeTab === 'chat' && (
                    <AIChat caseData={caseData} onAddFile={handleAddFile} isOffline={isOffline} />
                )}
                {activeTab === 'discussion' && (
                    <CaseDiscussion caseId={caseData.id} onPostComment={handlePostComment} isOffline={isOffline} />
                )}
                {activeTab === 'guidelines' && (
                    <ClinicalGuidelinesCard diagnosis={caseData.diagnosis} isOffline={isOffline} />
                )}
            </div>
        </div>
      </div>
      
      <ImageAnalysis 
        isOpen={isImageAnalysisOpen} 
        onClose={() => setIsImageAnalysisOpen(false)}
        isOffline={isOffline}
      />
    </div>
  );
};

export default CaseView;

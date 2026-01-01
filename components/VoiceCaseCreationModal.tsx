import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExtractedCaseData, PatientProfile, AIContextualSuggestion } from '../types/index';
import { GeminiService, searchPatients } from '../services/api';
import { ICONS } from '../constants/index';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

interface VoiceCaseCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProceed: (data: ExtractedCaseData) => void;
}

type Step = 'patient-selection' | 'recording' | 'transcribing' | 'augmenting' | 'reviewing' | 'error';

const VoiceCaseCreationModal: React.FC<VoiceCaseCreationModalProps> = ({ isOpen, onClose, onProceed }) => {
    const [step, setStep] = useState<Step>('patient-selection');
    const [transcript, setTranscript] = useState('');
    const [extractedData, setExtractedData] = useState<ExtractedCaseData | null>(null);
    const [contextualSuggestions, setContextualSuggestions] = useState<AIContextualSuggestion[]>([]);
    const [error, setError] = useState('');
    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for patient selection
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [patientSearchResults, setPatientSearchResults] = useState<PatientProfile[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);

    const resetState = useCallback(() => {
        setStep('patient-selection');
        setTranscript('');
        setExtractedData(null);
        setError('');
        setPatientSearchQuery('');
        setPatientSearchResults([]);
        setSelectedPatient(null);
        setContextualSuggestions([]);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    // Fix: Hoisted function to resolve "used before declaration" error.
    const handleExtractAndAugmentDetails = useCallback(async () => {
        // Use a ref-based transcript check or accept argument would be better, but relying on state for now
        // If coming from file upload, we hope state is updated. 
        if (transcript.trim().length < 10) {
            // Check if we are in transcribing step, maybe give it a moment? 
            // No, just fail if short.
            // BUT: If the user just spoke, `transcript` is updated via `onresult`.
            // If uploaded, `transcript` updated via `handleFileUpload`.
            setError("The transcript is too short. Please provide more details.");
            setStep('error');
            return;
        }
        if (!selectedPatient) {
            setError("No patient selected.");
            setStep('error');
            return;
        }

        try {
            // Step 1: Initial Extraction
            const initialData = await GeminiService.extractCaseDetailsFromTranscript(transcript);
            setExtractedData({ ...initialData, patientId: selectedPatient.id });

            // Step 2: AI Augmentation
            setStep('augmenting');
            const suggestions = await GeminiService.augmentCaseDetailsFromHistory(initialData, selectedPatient);
            setContextualSuggestions(suggestions);

            setStep('reviewing');
        } catch (e: any) {
            setError(e.message || "An unknown error occurred while analyzing the transcript.");
            setStep('error');
        }
    }, [transcript, selectedPatient]);



    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setTranscript("Transcribing audio file...");
        try {
            const { transcript: text } = await GeminiService.transcribeAudio(file);
            if (!text) throw new Error("No transcript generated.");

            // Update state and trigger processing
            setTranscript(text);
            setStep('transcribing');
        } catch (e: any) {
            setError("Failed to process audio file.");
            setStep('error');
        }
    };

    // I need to add this function to replacement. And Ref.



    useEffect(() => {
        if (isOpen) {
            resetState();
        }
    }, [isOpen, resetState]);

    useEffect(() => {
        if (!isSpeechRecognitionSupported) {
            setError("Speech recognition is not supported in your browser.");
            setStep('error');
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = '';
        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setTranscript(finalTranscript + interimTranscript);
        };
        recognition.onerror = (event: any) => setError(`Speech recognition error: ${event.error}.`);
        recognition.onend = () => setStep(prev => prev === 'recording' ? 'transcribing' : prev);

        return () => recognition.stop();
    }, []);

    useEffect(() => {
        // Trigger AI extraction when recording stops
        if (step === 'transcribing') {
            handleExtractAndAugmentDetails();
        }
    }, [step, handleExtractAndAugmentDetails]);


    const handlePatientSearch = async (query: string) => {
        setPatientSearchQuery(query);
        if (query.length > 2) {
            const results = await searchPatients(query);
            setPatientSearchResults(results);
        } else {
            setPatientSearchResults([]);
        }
    };

    const handleSelectPatient = (patient: PatientProfile) => {
        setSelectedPatient(patient);
        setStep('recording');
    }

    const handleToggleRecording = () => {
        if (step === 'recording') {
            recognitionRef.current?.stop();
            // The onend event will trigger the transition to 'transcribing'
        } else if (selectedPatient) {
            setTranscript('');
            setStep('recording');
            recognitionRef.current?.start();
        }
    };

    if (!isOpen) return null;



    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card rounded-2xl shadow-2xl w-full max-w-3xl min-h-[500px] flex flex-col animate-fade-in border border-white/20 dark:border-slate-700">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700/50">
                    <h2 className="text-2xl font-heading font-bold text-text-main flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-primary to-indigo-600 rounded-lg text-white shadow-md">
                            {ICONS.createCaseVoice}
                        </div>
                        AI Case Creation
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-main p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 p-8 flex items-center justify-center">
                    {step === 'patient-selection' && (
                        <div className="w-full max-w-lg">
                            <h3 className="text-xl font-heading font-bold text-text-main mb-6 text-center">Select Patient</h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={patientSearchQuery}
                                    onChange={(e) => handlePatientSearch(e.target.value)}
                                    placeholder="Search by name or MRN..."
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                    autoFocus
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>

                            <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                                {patientSearchResults.map(p => (
                                    <button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left p-4 hover:bg-primary/5 dark:hover:bg-slate-700/50 rounded-xl border border-transparent hover:border-primary/20 transition-all flex justify-between items-center group">
                                        <div>
                                            <p className="font-bold text-text-main group-hover:text-primary transition-colors">{p.name}</p>
                                            <p className="text-xs text-text-muted font-mono">{p.identifier}</p>
                                        </div>
                                        <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'recording' && (
                        <div className="text-center w-full">
                            <h3 className="text-xl font-heading font-bold text-text-main mb-2">Listening...</h3>
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Patient:</span>
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">{selectedPatient?.name}</span>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 min-h-[120px] text-left relative overflow-hidden mb-8 shadow-inner">
                                <p className="text-lg text-text-main leading-relaxed">{transcript || <span className="text-slate-400 italic">Start speaking or upload audio...</span>}</p>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"></div>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <button onClick={handleToggleRecording} className="w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl bg-danger shadow-danger/30 hover:shadow-danger/50 animate-pulse hover:scale-105">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v6a1 1 0 11-2 0V7z" clipRule="evenodd" /></svg>
                                </button>
                                <p className="text-sm text-text-muted font-medium mb-2">Click to Stop Recording</p>

                                <div className="flex items-center gap-2 w-full max-w-xs">
                                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                                    <span className="text-xs text-text-muted font-bold uppercase">OR</span>
                                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                                </div>

                                <input
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-primary hover:text-primary-hover font-bold text-sm flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary/5 transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    Upload Audio File
                                </button>
                            </div>
                        </div>
                    )}

                    {(step === 'transcribing' || step === 'augmenting') && (
                        <div className="text-center flex flex-col items-center justify-center">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                                <div className="relative bg-white dark:bg-slate-800 p-4 rounded-full shadow-lg border border-slate-100 dark:border-slate-700">
                                    <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                </div>
                            </div>

                            <h3 className="text-2xl font-heading font-bold text-text-main mb-2">{step === 'augmenting' ? 'Analyzing Medical Context' : 'Processing Speech'}</h3>
                            <p className="text-text-muted max-w-xs">{step === 'augmenting' ? 'Cross-referencing with patient history and generating insights...' : 'converting audio to text and structuring data...'}</p>
                        </div>
                    )}

                    {step === 'reviewing' && (
                        <div className="w-full h-full flex flex-col">
                            <h3 className="text-xl font-heading font-bold text-text-main mb-6 text-center">Review Analysis</h3>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2 pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                                {/* Extracted Details */}
                                <div className="space-y-4">
                                    <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm">
                                        <h4 className="font-bold text-text-main mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <span className="w-1.5 h-4 bg-primary rounded-full"></span> Extracted Details
                                        </h4>
                                        <div className="space-y-3">
                                            {Object.entries(extractedData || {}).map(([key, value]) => {
                                                if (key === 'missing_information' || key === 'patientId' || !value) return null;
                                                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                                return (
                                                    <div key={key}>
                                                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-1">{formattedKey}</label>
                                                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-text-main">{String(value)}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                {/* Suggestions */}
                                <div className="space-y-4">
                                    <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm h-full">
                                        <h4 className="font-bold text-text-main mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <span className="w-1.5 h-4 bg-accent rounded-full"></span> AI Insight
                                        </h4>

                                        {extractedData?.missing_information && (
                                            <div className="mb-4 p-4 bg-warning/5 border border-warning/20 rounded-xl">
                                                <h5 className="font-bold text-warning-text flex items-center gap-2 text-xs uppercase tracking-wider mb-2">{ICONS.riskModerate} Consider Adding</h5>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {extractedData.missing_information.map((item, index) => <li key={index} className="text-warning-text text-sm font-medium">{item}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {contextualSuggestions.map((item, index) => (
                                                <div key={index} className="p-4 bg-info/5 border border-info/20 rounded-xl hover:shadow-md transition-shadow">
                                                    <h5 className="font-bold text-info-text flex items-center gap-2 text-xs uppercase tracking-wider mb-2">{ICONS.ai} Suggestion</h5>
                                                    <p className="text-info-text text-sm font-bold mb-1">{item.suggestion}</p>
                                                    <p className="text-text-muted text-xs leading-relaxed bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg">{item.rationale}</p>
                                                </div>
                                            ))}
                                            {contextualSuggestions.length === 0 && !extractedData?.missing_information && (
                                                <div className="text-center py-8 opacity-60">
                                                    <p className="text-sm text-text-muted italic">Analysis complete. No critical missing info detected.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="text-center w-full max-w-md">
                            <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-heading font-bold text-text-main mb-2">Analysis Failed</h3>
                            <p className="text-text-muted mb-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-sm">{error}</p>
                            <button onClick={resetState} className="bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-primary-hover hover:shadow-primary/30 transition-all">Try Again</button>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-center backdrop-blur-sm">
                    {step === 'reviewing' ? (
                        <div className="flex justify-center gap-4 w-full max-w-md">
                            <button onClick={resetState} className="flex-1 bg-white dark:bg-slate-800 text-text-muted font-bold py-3 px-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">Discard</button>
                            <button onClick={() => extractedData && onProceed(extractedData)} className="flex-1 bg-gradient-to-r from-accent to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all">Create Case</button>
                        </div>
                    ) : (
                        step === 'patient-selection' ? <p className="text-sm text-text-muted font-medium">Select a patient to begin recording.</p> : null
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceCaseCreationModal;
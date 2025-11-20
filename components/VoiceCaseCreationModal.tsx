import React, { useState, useEffect, useRef, useCallback } from 'react';
// Fix: Import from '../types/index' to get the correct PatientProfile type with visitHistory.
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
    }, []);

    // Fix: Hoisted function to resolve "used before declaration" error.
    const handleExtractAndAugmentDetails = useCallback(async () => {
        if (transcript.trim().length < 10) {
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

    const renderContent = () => {
        switch (step) {
            case 'patient-selection':
                return (
                    <div>
                        <h3 className="text-xl font-semibold text-text-main mb-4">Step 1: Select Patient</h3>
                        <input
                            type="text"
                            value={patientSearchQuery}
                            onChange={(e) => handlePatientSearch(e.target.value)}
                            placeholder="Search by name or MRN..."
                            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="mt-4 max-h-60 overflow-y-auto">
                            {patientSearchResults.map(p => (
                                <button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left p-3 hover:bg-slate-100 rounded-md">
                                    <p className="font-semibold">{p.name}</p>
                                    <p className="text-sm text-text-muted">ID: {p.identifier}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'recording':
                return (
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-text-main mb-2">Step 2: Recording...</h3>
                        <p className="text-text-muted mb-4">Patient: <strong className="text-text-main">{selectedPatient?.name}</strong></p>
                        <p className="text-sm bg-slate-100 p-4 rounded-lg min-h-[80px] text-left">{transcript || "Start speaking..."}</p>
                    </div>
                );
            case 'transcribing':
            case 'augmenting':
                return (
                     <div className="text-center flex flex-col items-center justify-center">
                        <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <h3 className="text-xl font-semibold text-text-main">{step === 'augmenting' ? 'Cross-Referencing Patient History...' : 'AI is Analyzing Transcript...'}</h3>
                        <p className="text-text-muted mt-2">{step === 'augmenting' ? 'Generating contextual suggestions.' : 'Extracting key information.'}</p>
                    </div>
                );
            case 'reviewing':
                return (
                    <div>
                        <h3 className="text-xl font-semibold text-text-main mb-4">Step 3: Review AI Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[50vh] overflow-y-auto pr-2">
                            {/* Extracted Details */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-text-main border-b pb-2">Extracted Details</h4>
                                {Object.entries(extractedData || {}).map(([key, value]) => {
                                    if (key === 'missing_information' || key === 'patientId' || !value) return null;
                                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                    return (
                                        <div key={key}>
                                            <label className="block text-sm font-bold text-text-muted">{formattedKey}</label>
                                            <p className="text-text-main bg-slate-100 p-2 rounded-md mt-1 text-sm">{String(value)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Suggestions */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-text-main border-b pb-2">AI Suggestions</h4>
                                {extractedData?.missing_information && (
                                    <div className="p-3 bg-warning-light border-l-4 border-warning rounded-r-md">
                                        <h5 className="font-bold text-warning-text flex items-center gap-2 text-sm">{ICONS.riskModerate} <span>Consider Adding</span></h5>
                                        <ul className="list-disc list-inside mt-2 text-warning-text text-xs">
                                            {extractedData.missing_information.map((item, index) => <li key={index}>{item}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {contextualSuggestions.map((item, index) => (
                                    <div key={index} className="p-3 bg-info-light border-l-4 border-info rounded-r-md">
                                        <h5 className="font-bold text-info-text flex items-center gap-2 text-sm">{ICONS.ai} <span>AI Suggests</span></h5>
                                        <p className="mt-1 text-info-text text-sm font-semibold">{item.suggestion}</p>
                                        <p className="mt-1 text-info-text text-xs italic"><strong>Rationale:</strong> {item.rationale}</p>
                                    </div>
                                ))}
                                {contextualSuggestions.length === 0 && !extractedData?.missing_information && <p className="text-sm text-text-muted italic">No specific suggestions from AI.</p>}
                            </div>
                        </div>
                    </div>
                );
             case 'error':
                return (
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-danger-text mb-4">An Error Occurred</h3>
                        <p className="text-text-muted bg-danger-light p-4 rounded-lg">{error}</p>
                    </div>
                );
        }
    };
    
    const renderFooter = () => {
         switch (step) {
            case 'reviewing':
                return (
                    <div className="flex justify-between gap-4 w-full">
                        <button onClick={resetState} className="bg-slate-200 text-slate-800 font-bold py-2 px-6 rounded-md hover:bg-slate-300 transition">Start Over</button>
                        <button onClick={() => extractedData && onProceed(extractedData)} className="bg-accent text-white font-bold py-2 px-6 rounded-md hover:bg-accent-hover transition">Proceed to Create Case</button>
                    </div>
                );
            case 'error':
                 return <button onClick={resetState} className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-primary-hover transition">Try Again</button>;
            case 'patient-selection':
                return <p className="text-sm text-text-muted">Select a patient to begin.</p>;
            case 'recording':
                 return (
                    <button onClick={handleToggleRecording} className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors shadow-lg bg-danger animate-pulse`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v6a1 1 0 11-2 0V7z" clipRule="evenodd" /></svg>
                    </button>
                 );
            default:
                return null;
        }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg shadow-xl w-full max-w-3xl min-h-[500px] flex flex-col animate-fade-in">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">{ICONS.createCaseVoice} AI Case Creation</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          
          <div className="flex-1 p-8 flex items-center justify-center">
            {renderContent()}
          </div>
          
          <div className="p-6 border-t bg-slate-50 flex items-center justify-center">
             {renderFooter()}
          </div>
        </div>
      </div>
    );
};

export default VoiceCaseCreationModal;
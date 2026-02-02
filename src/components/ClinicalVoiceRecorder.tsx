import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';

interface ClinicalVoiceRecorderProps {
    specialty: string;
    onNoteGenerated?: (note: string) => void;
    compact?: boolean;
}

export const ClinicalVoiceRecorder: React.FC<ClinicalVoiceRecorderProps> = ({ specialty, onNoteGenerated, compact = false }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                setTranscript(prev => prev + finalTranscript + (interimTranscript ? ' ' + interimTranscript : ''));
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsRecording(false);
            };
        }
    }, []);

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            processNote();
        } else {
            setTranscript('');
            recognitionRef.current?.start();
            setIsRecording(true);
        }
    };

    const processNote = async () => {
        setIsProcessing(true);
        // Simulate AI formatting
        await new Promise(r => setTimeout(r, 1500));

        let formattedNote = transcript;
        if (!formattedNote) formattedNote = "Patient presents with symptoms consistent with " + specialty + " pathology. [AI: No audio detected, using template placeholder]";

        // Add specialty specific formatting simulation
        formattedNote = `[${specialty.toUpperCase()} CLINICAL NOTE]\n\nSUBJECTIVE: ${formattedNote}\n\nAI ANALYSIS: Draft created based on voice input. Please review for accuracy.`;

        setIsProcessing(false);
        if (onNoteGenerated) onNoteGenerated(formattedNote);
    };

    if (compact) {
        return (
            <button
                onClick={toggleRecording}
                className={`p-3 rounded-full shadow-lg transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                title="Dictate Note"
            >
                {ICONS.microphone}
            </button>
        );
    }

    return (
        <div className="glass-card p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${isRecording ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {ICONS.microphone}
                    </div>
                    <h3 className="font-bold text-sm">Voice Dictation</h3>
                </div>
                {isRecording && <span className="text-xs text-red-500 font-bold animate-pulse">● REC</span>}
            </div>

            <div className="relative bg-slate-50 dark:bg-slate-800 rounded-xl p-3 min-h-[80px] max-h-[150px] overflow-y-auto border border-slate-200 dark:border-slate-700 mb-3">
                {transcript || <span className="text-slate-400 italic text-sm">Tap microphone to start dictating {specialty} notes...</span>}
                {isProcessing && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Processing...
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={toggleRecording}
                className={`w-full py-2 rounded-xl font-bold transition-all text-sm ${isRecording
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600'
                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700'
                    }`}
            >
                {isRecording ? 'Stop & Transcribe' : 'Start Recording'}
            </button>
        </div>
    );
};

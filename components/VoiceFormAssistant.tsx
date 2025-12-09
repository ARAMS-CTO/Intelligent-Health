import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from '../services/api';

interface VoiceFormAssistantProps {
    formSchema: any;
    formData: any;
    onUpdate: (updates: any) => void;
}

const VoiceFormAssistant: React.FC<VoiceFormAssistantProps> = ({ formSchema, formData, onUpdate }) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Enable continuous listening
            recognitionRef.current.interimResults = true; // Get real-time results
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex;
                const text = event.results[current][0].transcript;
                const isFinal = event.results[current].isFinal;

                setTranscript(text);

                // Clear existing silence timer
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

                // If final result or silence detected, process
                if (isFinal) {
                    handleProcessTranscript(text);
                } else {
                    // Debounce processing for natural pauses (2 seconds silence)
                    silenceTimerRef.current = setTimeout(() => {
                        handleProcessTranscript(text);
                    }, 2000);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    setIsListening(false);
                }
            };

            recognitionRef.current.onend = () => {
                // Auto-restart if supposed to be listening (unless stopped manually)
                if (isListening) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        setIsListening(false);
                    }
                }
            };
        }
    }, [isListening]); // Re-bind if listening state changes significantly

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            recognitionRef.current?.stop();
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        } else {
            setTranscript('');
            setAiResponse('');
            setIsListening(true);
            try {
                recognitionRef.current?.start();
            } catch (e) {
                console.error("Failed to start recognition:", e);
            }
        }
    };

    const handleProcessTranscript = async (text: string) => {
        if (!text.trim()) return;

        setIsProcessing(true);
        try {
            const result = await GeminiService.formAssist(text, formSchema, formData);

            if (result.updates && Object.keys(result.updates).length > 0) {
                onUpdate(result.updates);
            }

            if (result.response) {
                setAiResponse(result.response);
                speakResponse(result.response);
            }
            // Clear transcript after successful processing to ready for next phrase
            setTranscript('');
        } catch (error) {
            console.error("Error processing voice command:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const speakResponse = (text: string) => {
        if ('speechSynthesis' in window) {
            // Cancel current speech to speak new response immediately
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    if (!recognitionRef.current) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {/* AI Response Bubble */}
            {(aiResponse || transcript) && (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl border dark:border-slate-700 max-w-xs mb-2 animate-fade-in transition-all">
                    {transcript && <p className="text-xs text-text-muted mb-1 italic">"{transcript}"</p>}
                    {isProcessing && <p className="text-xs text-primary font-semibold animate-pulse">Thinking...</p>}
                    {aiResponse && !isProcessing && <p className="text-sm text-text-main font-medium">{aiResponse}</p>}
                </div>
            )}

            {/* Mic Button with Visualizer Effect */}
            <button
                onClick={toggleListening}
                className={`relative p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center overflow-hidden ${isListening
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-primary hover:bg-primary-hover'
                    }`}
                title={isListening ? "Stop Listening" : "Start Voice Assistant"}
            >
                {/* Pulsing Rings for Visual Feedback */}
                {isListening && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping"></span>
                        <span className="absolute inset-0 rounded-full bg-white opacity-10 animate-pulse delay-75"></span>
                    </>
                )}

                {isListening ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default VoiceFormAssistant;

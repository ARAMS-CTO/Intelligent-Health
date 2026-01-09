import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { GeminiService, DataService } from '../services/api';
import { useAuth } from './Auth';
import { AVATARS } from '../constants/index';

export const AIAssistantWidget: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string, avatar?: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [activeAgent, setActiveAgent] = useState<{ name: string, role: string, avatar: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            // @ts-ignore
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                handleSend(text);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const newMsg = { role: 'user' as const, text };
        setMessages(prev => [...prev, newMsg]);
        setTranscript('');
        setIsProcessing(true);
        setActiveAgent(null); // Reset agent on new turn

        try {
            // Context aware prompt
            let context = `Current Page: ${location.pathname}. `;
            if (location.pathname.includes('/cases/')) context += "Focus on the active case details.";

            // Use Agent Chat routing
            let responseText = "";
            let agentInfo = null;

            if (selectedImage) {
                // Multimodal Flow
                // 1. Upload File
                const uploadRes = await DataService.uploadFile(selectedImage);

                // 2. Chat with URL reference
                const visionPrompt = text ? text : "Analyze this image.";
                // We pass the URL in the text for the backend to extract? 
                // Or we need a specific 'agentChatWithImage' method?
                // Let's append the context:
                const contextWithImage = `${context} [Image Context: ${uploadRes.url}]`;

                const result = await GeminiService.agentChat(visionPrompt + ` ${contextWithImage}`);
                responseText = result.response;
                agentInfo = result.agent;
                setSelectedImage(null);
            } else {
                const result = await GeminiService.agentChat(text + ` [Context: ${context}]`);
                responseText = result.response || result.message;
                agentInfo = result.agent;
            }

            // Handle Agent Info if present
            let avatar = undefined;
            if (agentInfo) {
                setActiveAgent({
                    name: agentInfo.name,
                    role: agentInfo.role,
                    avatar: AVATARS[agentInfo.role as keyof typeof AVATARS] || AVATARS.Default
                });
                avatar = AVATARS[agentInfo.role as keyof typeof AVATARS] || AVATARS.Default;
            } else {
                // Fallback to copilot? (Orchestrator fallback)
                setActiveAgent({ name: "Copilot", role: "Assistant", avatar: AVATARS.Default });
            }

            const aiMsg = { role: 'model' as const, text: responseText || "I processed that.", avatar };
            setMessages(prev => [...prev, aiMsg]);

            // Speak response with Agent Voice
            speak(responseText, agentInfo?.role);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting." }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const speak = (text: string, role?: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);

            // Dynamic Voice Selection
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                let voice = null;
                if (role?.includes("Doctor")) {
                    voice = voices.find(v => v.name.includes("Male") || v.name.includes("David") || v.lang === "en-US") || voices[0];
                } else if (role?.includes("Nurse")) {
                    voice = voices.find(v => v.name.includes("Female") || v.name.includes("Zira") || v.name.includes("Samantha")) || voices[0];
                } else if (role?.includes("Research")) {
                    voice = voices.find(v => v.name.includes("UK") || v.lang === "en-GB") || voices[0];
                } else {
                    voice = voices.find(v => v.default) || voices[0];
                }
                if (voice) utterance.voice = voice;
            }

            window.speechSynthesis.speak(utterance);
        }
    };

    if (!user || user.role === 'Patient') return null; // Only for staff

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end transition-all duration-300 ${isOpen ? 'w-96' : 'w-auto'}`}>
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl mb-4 w-full h-[500px] flex flex-col border border-white/40 dark:border-gray-700/50 overflow-hidden animate-fade-in">
                    <div className="bg-gradient-to-r from-primary to-indigo-600 text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <span className="font-bold">{activeAgent ? activeAgent.role : "AI Copilot"}</span>
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{activeAgent ? activeAgent.name : "Beta"}</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 mt-16 space-y-3">
                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-indigo-600/20 rounded-2xl flex items-center justify-center">
                                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                </div>
                                <p className="font-medium">Hi Dr. {user.name.split(' ')[1] || user.name}!</p>
                                <p className="text-sm">How can I assist you today?</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2 animate-fade-in`}>
                                {m.role === 'model' && (
                                    <img
                                        src={m.avatar || AVATARS.Default}
                                        className="w-8 h-8 rounded-full border border-slate-200 bg-white"
                                        alt="Agent"
                                    />
                                )}
                                <div className={`max-w-[85%] rounded-2xl p-3 px-4 text-sm ${m.role === 'user'
                                    ? 'bg-gradient-to-r from-primary to-indigo-600 text-white rounded-br-sm shadow-lg'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm shadow-md'
                                    }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {isProcessing && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 px-4 text-sm border border-gray-200 dark:border-gray-700 shadow-md flex items-center gap-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <span className="text-gray-500">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2">
                        <button
                            onClick={toggleListening}
                            className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </button>

                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setSelectedImage(e.target.files[0]);
                                    setTranscript(prev => prev || "Analyze this image");
                                }
                            }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-2.5 rounded-xl transition-all ${selectedImage ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            title="Upload Image"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </button>

                        <input
                            type="text"
                            className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none placeholder:text-gray-400"
                            placeholder="Type or speak..."
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend(transcript)}
                        />
                        <button
                            onClick={() => handleSend(transcript)}
                            disabled={!transcript.trim()}
                            className="p-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-hover hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl shadow-primary/30 transition-all duration-300 hover:scale-110 flex items-center gap-2 group animate-fade-in"
                >
                    <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {isProcessing && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
                    {isProcessing && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}
                </button>
            )}
        </div>
    );
};

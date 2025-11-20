


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GeminiService } from '../services/api';
import { ICONS } from '../constants/index';
import VoiceInput from './VoiceInput';
import { SymptomAnalysisResult } from '../types/index';

interface Message {
  author: 'user' | 'ai';
  content: string;
}

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'chat' | 'symptom-checker';

const AIChatbot: React.FC<AIChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { author: 'ai', content: 'Hello! How can I help you today? Remember, I can provide general health information but not medical advice.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('chat');

  // State for Symptom Checker
  const [symptomsInput, setSymptomsInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysisResult[] | null>(null);
  const [symptomError, setSymptomError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset state when closing
      setMode('chat');
      setAnalysisResult(null);
      setSymptomsInput('');
      setSymptomError('');
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (userInput.trim() === '') return;

    const currentInput = userInput;
    const newMessages: Message[] = [...messages, { author: 'user', content: currentInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponse = await GeminiService.getGeneralChatResponse(newMessages, currentInput);
      setMessages(prev => [...prev, { author: 'ai', content: aiResponse }]);
    } catch (error: any) {
      console.error("Failed to get AI response:", error);
      setMessages(prev => [...prev, { author: 'ai', content: `Error: ${error.message || 'An unknown error occurred.'}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, userInput]);

  const handleAnalyzeSymptoms = async () => {
    if (symptomsInput.trim() === '') return;
    setIsLoading(true);
    setAnalysisResult(null);
    setSymptomError('');

    try {
        const results = await GeminiService.analyzeSymptoms(symptomsInput);
        setAnalysisResult(results);
    } catch(e: any) {
        setSymptomError(e.message || "An unexpected error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) return null;
  
  const ChatView = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.author === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">AI</div>
            )}
            <div className={`p-3 rounded-2xl max-w-xs md:max-w-md ${msg.author === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-slate-200 text-text-main dark:bg-slate-700 rounded-bl-none'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">AI</div>
              <div className="p-3 rounded-2xl bg-slate-200 text-text-main dark:bg-slate-700 rounded-bl-none">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                </div>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t dark:border-slate-700 bg-surface">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Ask a health question..."
            className="flex-1 border dark:border-slate-600 bg-inherit rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <VoiceInput onTranscript={(transcript) => setUserInput(prev => prev + transcript)} disabled={isLoading} />
          <button onClick={handleSendMessage} disabled={isLoading || userInput.trim() === ''} className="bg-primary text-white p-2 rounded-full hover:bg-primary-hover transition disabled:bg-gray-400 disabled:cursor-not-allowed">
            {ICONS.send}
          </button>
        </div>
      </div>
    </>
  );

  const SymptomCheckerView = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="p-4 bg-info-light dark:bg-blue-900/50 border-l-4 border-info rounded-r-md mb-4">
            <h3 className="font-bold text-info-text dark:text-blue-300">Symptom Checker</h3>
            <p className="text-sm text-info-text dark:text-blue-300 mt-1">
                Enter your symptoms below to see a list of potential conditions. This tool is for informational purposes only and is not a substitute for professional medical advice.
            </p>
        </div>

        {analysisResult ? (
            <div className="space-y-3 animate-fade-in">
                <h4 className="font-bold text-text-main">Potential Conditions:</h4>
                {analysisResult.map((result, index) => (
                    <div key={index} className="p-4 border dark:border-slate-700 rounded-lg bg-surface">
                        <div className="flex justify-between items-center mb-2">
                            <h5 className="font-bold text-primary">{result.condition}</h5>
                            <span className="font-semibold text-sm text-text-main">{ (result.confidence * 100).toFixed(0) }% Likelihood</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-2">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${result.confidence * 100}%` }}></div>
                        </div>
                        <p className="text-sm text-text-muted">{result.explanation}</p>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center text-text-muted py-8">
                {ICONS.symptomCheck}
                <p className="mt-2">Results will appear here.</p>
            </div>
        )}
        {symptomError && <p className="text-danger-text bg-danger-light dark:bg-red-900/50 dark:text-red-300 p-2 rounded-md mt-4">{symptomError}</p>}
      </div>
      <div className="p-4 border-t dark:border-slate-700 bg-surface">
        <textarea
          value={symptomsInput}
          onChange={(e) => setSymptomsInput(e.target.value)}
          placeholder="e.g., 'Headache, fever, and sore throat for 2 days...'"
          className="w-full border dark:border-slate-600 bg-inherit rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary mb-2"
          rows={3}
          disabled={isLoading}
        />
        <button onClick={handleAnalyzeSymptoms} disabled={isLoading || symptomsInput.trim() === ''} className="w-full bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-accent-hover transition disabled:bg-gray-400">
          {isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div 
        className="bg-surface w-full max-w-lg h-[80vh] max-h-[600px] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col animate-slide-up-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                {ICONS.ai}
                AI Health Assistant
            </h2>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-1 flex text-sm">
                <button
                    onClick={() => setMode('chat')}
                    className={`px-3 py-1 rounded-full ${mode === 'chat' ? 'bg-primary text-white shadow' : 'text-text-muted'}`}
                >
                    Chat
                </button>
                <button
                    onClick={() => setMode('symptom-checker')}
                    className={`px-3 py-1 rounded-full ${mode === 'symptom-checker' ? 'bg-primary text-white shadow' : 'text-text-muted'}`}
                >
                    Symptoms
                </button>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {mode === 'chat' ? <ChatView /> : <SymptomCheckerView />}
      </div>
    </div>
  );
};

export default AIChatbot;
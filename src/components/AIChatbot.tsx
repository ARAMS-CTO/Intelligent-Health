


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GeminiService } from '../services/api';
import { ICONS } from '../constants/index';
import VoiceInput from './VoiceInput';
import { SymptomAnalysisResult } from '../types/index';
import { useAuth } from './Auth';

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
  const { user } = useAuth();
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
      const aiResponse = await GeminiService.getGeneralChatResponse(newMessages, currentInput, user?.id);
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
    } catch (e: any) {
      setSymptomError(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Render Chat View
  const renderChatView = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.author === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            {msg.author === 'ai' && (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-lg shadow-primary/30">
                {ICONS.ai}
              </div>
            )}
            <div className={`p-4 rounded-2xl max-w-[85%] shadow-md backdrop-blur-sm ${msg.author === 'user' ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-tr-none shadow-primary/20' : 'bg-white/80 dark:bg-slate-700/80 text-text-main dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-600 shadow-sm'}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
            {msg.author === 'user' && (
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500 font-bold text-xs border border-slate-200 dark:border-slate-700">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-primary/30">
              {ICONS.ai}
            </div>
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-tl-none shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md">
        <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 p-2 rounded-2xl border border-white/20 dark:border-slate-700/50 focus-within:ring-2 focus-within:ring-primary/30 transition-all shadow-lg">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Ask a health question..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 placeholder:text-slate-400 font-medium"
            disabled={isLoading}
          />
          <div className="flex items-center gap-1">
            <VoiceInput onTranscript={(transcript) => setUserInput(prev => prev + transcript)} disabled={isLoading} />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || userInput.trim() === ''}
              className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary-hover transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700"
            >
              {ICONS.send}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-center text-text-muted mt-2 opacity-60">AI can make mistakes. Please verify important info.</p>
      </div>
    </>
  );

  // Render Symptom Checker View
  const renderSymptomCheckerView = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        <div className="p-5 bg-gradient-to-br from-info/10 to-blue-500/10 dark:from-info/20 dark:to-blue-900/20 border border-info/20 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-info rounded-lg text-white shadow-md shadow-info/20">
              {ICONS.symptomCheck}
            </div>
            <h3 className="font-bold text-info-text dark:text-info text-lg">Symptom Checker</h3>
          </div>
          <p className="text-sm text-text-muted leading-relaxed font-medium">
            Describe how you're feeling. I'll analyze your input against common medical patterns. This is <span className="text-text-main font-bold">informational only</span>.
          </p>
        </div>

        {analysisResult ? (
          <div className="space-y-4 animate-fade-in pr-1">
            <h4 className="font-bold text-text-main text-sm uppercase tracking-widest pl-1">Analysis Results</h4>
            {analysisResult.map((result, index) => (
              <div key={index} className="p-5 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-bold text-primary text-base">{result.condition}</h5>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${result.confidence > 0.7 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {(result.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 mb-4 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                  <div className="bg-gradient-to-r from-primary to-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${result.confidence * 100}%` }}></div>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{result.explanation}</p>
              </div>
            ))}
          </div>
        ) : !isLoading && (
          <div className="text-center py-12 flex flex-col items-center justify-center gap-4 opacity-40">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl">
              {ICONS.search}
            </div>
            <p className="font-medium">Enter symptoms below to begin analysis</p>
          </div>
        )}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-text-muted font-medium animate-pulse">Running diagnostic analysis...</p>
          </div>
        )}
        {symptomError && (
          <div className="text-danger-text bg-danger/10 border border-danger/20 p-4 rounded-xl flex items-start gap-3">
            <svg className="h-5 w-5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="text-sm font-medium">{symptomError}</span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md">
        <textarea
          value={symptomsInput}
          onChange={(e) => setSymptomsInput(e.target.value)}
          placeholder="e.g., 'Headache, fever, and sore throat for 2 days...'"
          className="w-full bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-white/20 dark:border-slate-700/50 p-4 focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all text-sm font-medium resize-none mb-4 shadow-inner"
          rows={3}
          disabled={isLoading}
        />
        <button
          onClick={handleAnalyzeSymptoms}
          disabled={isLoading || symptomsInput.trim() === ''}
          className="w-full bg-gradient-to-r from-accent to-indigo-600 text-white font-bold py-3.5 px-4 rounded-2xl hover:shadow-lg hover:shadow-accent/20 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : ICONS.search}
          {isLoading ? 'Analyzing Clinical Signals...' : 'Analyze Symptoms'}
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="glass-card bg-white/90 dark:bg-slate-900/90 w-full max-w-lg h-[80vh] sm:h-[650px] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col animate-slide-up-fade-in border border-white/40 dark:border-slate-700 relative overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-500"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 blur-3xl rounded-full"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 dark:border-slate-700/50 relative z-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-heading font-bold text-text-main flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-primary to-indigo-600 rounded-xl text-white shadow-lg shadow-primary/20">
                {ICONS.ai}
              </div>
              I-Hospital Assistant
            </h2>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-text-muted/60 pl-11">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              AI Agent Online
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl p-1 fle border border-white/20 dark:border-slate-700/50 backdrop-blur-sm">
              <div className="flex p-0.5">
                <button
                  onClick={() => setMode('chat')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${mode === 'chat' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setMode('symptom-checker')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${mode === 'symptom-checker' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                  Checker
                </button>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 transition-all group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {mode === 'chat' ? renderChatView() : renderSymptomCheckerView()}
      </div>
    </div>
  );
};

export default AIChatbot;

import React, { useState, useRef, useEffect } from 'react';
import { Case, UploadedFile } from '../types/index';
import { useAuth } from './Auth';
import { ICONS } from '../constants/index';
import { GeminiService } from '../services/api';
import VoiceInput from './VoiceInput';

interface Message {
  author: 'user' | 'ai' | 'system';
  content: string;
}

interface AIChatProps {
  caseData: Case;
  onAddFile: (file: UploadedFile) => void;
  isOffline: boolean;
}

const AIChat: React.FC<AIChatProps> = ({ caseData, onAddFile, isOffline }) => {
  const { user } = useAuth();

  const getInitialMessage = (): Message[] => {
    const hasLabResults = caseData.labResults && caseData.labResults.length > 0;
    let content = "I am the Case AI Assistant. Ask me to summarize the patient's history, list findings, or discuss the available documents.";
    if (hasLabResults) {
      content = "I am the Case AI Assistant. I see this case includes lab results. Would you like a summary, or an explanation of any abnormal values? You can also ask about the patient's history or exam findings.";
    }
    return [{ author: 'ai', content }];
  };

  const [messages, setMessages] = useState<Message[]>(getInitialMessage());
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset initial message when caseData changes
  useEffect(() => {
    setMessages(getInitialMessage());
  }, [caseData.id, caseData.labResults]);

  useEffect(() => {
    if (!searchQuery) { // Only auto-scroll when not searching
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, searchQuery]);

  const handleSendMessage = async () => {
    if (userInput.trim() === '' || !user) return;

    const newMessages: Message[] = [...messages, { author: 'user', content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiResponse = await GeminiService.getAIChatResponse(caseData, newMessages, userInput, user?.id, user?.role);
      setMessages([...newMessages, { author: 'ai', content: aiResponse }]);
    } catch (error: any) {
      console.error("Failed to get AI response:", error);
      setMessages([...newMessages, { author: 'system', content: `Error: ${error.message || 'An unknown error occurred.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const newFile: UploadedFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        type: 'Photo', // Defaulting for simplicity
        url: URL.createObjectURL(file), // Temporary URL
      };
      onAddFile(newFile);

      const uploadMessage: Message = { author: 'system', content: `File uploaded: ${file.name}` };
      const newMessages: Message[] = [...messages, uploadMessage];
      setMessages(newMessages);

      setIsLoading(true);

      const summaryRequest = `A new file named "${file.name}" has been uploaded. Acknowledge this and ask if I would like a summary.`;

      try {
        const aiResponse = await GeminiService.getAIChatResponse(caseData, newMessages, summaryRequest, user?.id);
        setMessages([...newMessages, { author: 'ai', content: aiResponse }]);
      } catch (error: any) {
        console.error("Failed to get AI response for file upload:", error);
        setMessages([...newMessages, { author: 'system', content: `Error processing ${file.name}: ${error.message}` }]);
      } finally {
        setIsLoading(false);
      }
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getAuthorDisplay = (author: Message['author']) => {
    if (author === 'user') return { name: user?.name || 'You', color: 'bg-gradient-to-br from-primary to-indigo-600 text-white', align: 'items-end', shadow: 'shadow-primary/20' };
    if (author === 'ai') return { name: 'AI Assistant', color: 'bg-white/80 dark:bg-slate-700/80 text-text-main border border-slate-200 dark:border-slate-600', align: 'items-start', shadow: 'shadow-sm' };
    return { name: 'System', color: 'bg-slate-100 dark:bg-slate-800 text-text-muted text-xs italic border border-slate-200 dark:border-slate-700', align: 'items-center', shadow: 'shadow-none' };
  };

  const hasLabResults = caseData.labResults && caseData.labResults.length > 0;

  let placeholderText = "e.g., 'Summarize the history' or 'What are the key findings?'";
  if (isOffline) {
    placeholderText = "Chat is disabled while offline.";
  } else if (hasLabResults) {
    placeholderText = "e.g., 'Summarize the lab results' or 'What are the key findings?'";
  }

  const filteredMessages = messages.filter(msg =>
    searchQuery ? msg.content.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-black rounded px-1">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="glass-card rounded-3xl p-6 shadow-2xl flex flex-col h-[650px] max-h-[85vh] antigravity-target border-white/20 dark:border-slate-700 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-text-main flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary to-indigo-600 rounded-xl text-white shadow-lg shadow-primary/30">
              {ICONS.ai}
            </div>
            AI Case Discussion
          </h2>
          <div className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
            Powered by Gemini
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Search conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-0 bg-white/50 dark:bg-slate-800/50 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm shadow-inner transition-all hover:bg-white/80 dark:hover:bg-slate-800/80 font-medium"
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 relative z-10 p-2">
        {filteredMessages.map((msg, index) => {
          const { name, color, align, shadow } = getAuthorDisplay(msg.author);
          if (msg.author === 'system') {
            const isError = msg.content.toLowerCase().startsWith('error:');
            return (
              <div key={index} className={`flex justify-center my-4`}>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm shadow-sm ${isError ? 'bg-red-100/80 text-red-800 border border-red-200' : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>
                  {highlightText(msg.content, searchQuery)}
                </span>
              </div>
            );
          }
          return (
            <div key={index} className={`flex flex-col ${align} max-w-[85%] animate-fade-in-up`}>
              <span className={`text-[10px] font-bold text-text-muted mb-1 px-1 uppercase tracking-wider opacity-70`}>{name}</span>
              <div className={`p-4 rounded-2xl shadow-md backdrop-blur-sm ${color} ${shadow} ${align === 'items-end' ? 'rounded-tr-none' : 'rounded-tl-none'} transition-all duration-300 hover:shadow-lg`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{highlightText(msg.content, searchQuery)}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 dark:border-slate-700/50 pt-4 mt-1 relative z-10">
        <div className="flex items-end gap-2 bg-white/60 dark:bg-slate-800/60 p-2 rounded-2xl border border-white/40 dark:border-slate-700/50 focus-within:ring-2 focus-within:ring-primary/30 transition-all shadow-lg backdrop-blur-md">
          <button onClick={triggerFileUpload} className="p-3 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200" disabled={isOffline} title="Upload File">
            {ICONS.upload}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isOffline}
          />
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={placeholderText}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-2 placeholder:text-slate-400 font-medium max-h-[120px] resize-none scrollbar-hide"
            disabled={isLoading || isOffline}
            rows={1}
            style={{ minHeight: '44px' }}
          />
          <div className="flex items-center gap-1 pb-1">
            <VoiceInput onTranscript={(transcript) => setUserInput(prev => prev + transcript)} disabled={isLoading || isOffline} />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || userInput.trim() === '' || isOffline}
              className="bg-gradient-to-r from-primary to-indigo-600 text-white p-3 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <div className="transform group-hover:translate-x-0.5 transition-transform">
                  {ICONS.send}
                </div>
              )}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-center text-text-muted mt-2 opacity-60">
          AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
};

export default React.memo(AIChat);

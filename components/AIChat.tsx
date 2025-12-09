
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
      const aiResponse = await GeminiService.getAIChatResponse(caseData, newMessages, userInput, user?.id);
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
    if (author === 'user') return { name: user?.name || 'You', color: 'bg-primary', align: 'items-end' };
    if (author === 'ai') return { name: 'AI Assistant', color: 'bg-slate-700 dark:bg-slate-600', align: 'items-start' };
    return { name: 'System', color: 'bg-gray-400', align: 'items-center' };
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
    <div className="bg-surface p-6 rounded-lg shadow-md flex flex-col h-[600px] max-h-[80vh]">
      <h2 className="text-2xl font-bold text-text-main mb-4">AI Case Discussion</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search conversation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border dark:border-slate-600 bg-inherit rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
        {filteredMessages.map((msg, index) => {
          const { name, color, align } = getAuthorDisplay(msg.author);
          if (msg.author === 'system') {
            const isError = msg.content.toLowerCase().startsWith('error:');
            return (
              <div key={index} className={`text-center text-sm py-2 ${isError ? 'text-danger font-semibold' : 'text-text-muted'}`}>
                <em>{highlightText(msg.content, searchQuery)}</em>
              </div>
            );
          }
          return (
            <div key={index} className={`flex flex-col ${align}`}>
              <span className="text-xs font-bold text-text-muted mb-1">{name}</span>
              <div className={`p-3 rounded-lg max-w-lg text-white ${color}`}>
                <p className="text-sm whitespace-pre-wrap">{highlightText(msg.content, searchQuery)}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t dark:border-slate-700 pt-4">
        <div className="flex items-center space-x-2">
          <button onClick={triggerFileUpload} className="p-2 text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition" disabled={isOffline}>
            {ICONS.upload}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isOffline}
          />
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder={placeholderText}
            className="flex-1 border dark:border-slate-600 bg-inherit rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading || isOffline}
          />
          <VoiceInput onTranscript={(transcript) => setUserInput(prev => prev + transcript)} disabled={isLoading || isOffline} />
          <button onClick={handleSendMessage} disabled={isLoading || userInput.trim() === '' || isOffline} className="bg-primary text-white p-2 rounded-full hover:bg-primary-hover transition disabled:bg-gray-400">
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : ICONS.send}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;

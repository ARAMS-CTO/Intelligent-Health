import React, { useState, useEffect, useRef } from 'react';
import { Case } from '../../types';
import { GeminiService } from '../../services/api';
import { ICONS } from '../../constants';

interface SpecialistSupportPanelProps {
    caseData: Case;
    isOffline?: boolean;
}

interface SpecialistResponse {
    status: string;
    domain: string;
    message: string;
    actions: { label: string; action: string; icon: string }[];
}

export const SpecialistSupportPanel: React.FC<SpecialistSupportPanelProps> = ({ caseData, isOffline = false }) => {
    const [activeDomain, setActiveDomain] = useState<string>("General");
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedActions, setSuggestedActions] = useState<{ label: string; action: string; icon: string }[]>([]);

    // Initial Analysis to Determine Domain
    useEffect(() => {
        const init = async () => {
            // We can do a quick "Check Domain" query
            // Or just wait for user interaction to identify.
            // Let's trigger an initial "Consult" to identify domain and get initial suggestions.
            if (!isOffline && messages.length === 0) {
                // Determine domain silently
                handleConsult("Initial assessment and domain classification.", true);
            }
        };
        init();
    }, [caseData.id]);

    const handleConsult = async (query: string, isInitial = false) => {
        setIsLoading(true);
        if (!isInitial) {
            setMessages(prev => [...prev, { role: 'user', content: query }]);
        }

        try {
            // Construct relevant case string
            const caseContext = `
            Complaint: ${caseData.complaint}
            History: ${caseData.history}
            Findings: ${caseData.findings}
            Vitals: ${JSON.stringify((caseData as any).vitals)}
            Diagnosis: ${caseData.diagnosis}
            `;

            const res = await GeminiService.consultSpecialist(query, caseContext, isInitial ? undefined : activeDomain);

            if (res.status === 'success') {
                setActiveDomain(res.domain);
                setSuggestedActions(res.actions || []);
                if (!isInitial) {
                    setMessages(prev => [...prev, { role: 'model', content: res.message }]);
                } else {
                    // Initial welcome message from specialist
                    setMessages([{ role: 'model', content: res.message }]);
                }
            } else {
                setMessages(prev => [...prev, { role: 'model', content: "Specialist currently unavailable." }]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            setInput("");
        }
    };

    const handleActionClick = (action: string, label: string) => {
        handleConsult(`Perform ${label} (${action})`);
    };

    const handleBoardReview = async () => {
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: "Requesting Multi-Disciplinary Board Review..." }]);
        try {
            const res = await GeminiService.executeWorkflow("comprehensive_patient_analysis", (caseData as any).id); // Ensure id exists or cast

            if (res.error) {
                setMessages(prev => [...prev, { role: 'model', content: `Error: ${res.error}` }]);
            } else {
                const summary = `**🏥 Board Review Completed**\n\n**Domain**: ${res.domain}\n\n**${res.domain} Specialist**: ${res.consultation_summary.specialist.message}\n\n**📋 Final Consensus**: ${res.final_recommendation.message || "Plan Generated."}`;
                setMessages(prev => [...prev, { role: 'model', content: summary }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', content: "Workflow failed." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getDomainColor = (domain: string) => {
        switch (domain) {
            case 'Cardiology': return 'from-red-500 to-rose-600';
            case 'Orthopedics': return 'from-amber-500 to-orange-600';
            case 'Pulmonology': return 'from-sky-400 to-blue-600';
            default: return 'from-primary to-indigo-600';
        }
    };

    const getDomainIcon = (domain: string) => {
        switch (domain) {
            case 'Cardiology': return ICONS.heart;
            case 'Orthopedics': return ICONS.activity;
            case 'Pulmonology': return '🫁';
            default: return ICONS.specialist;
        }
    };

    return (
        <div className="glass-card rounded-2xl border border-white/20 dark:border-slate-700 overflow-hidden shadow-xl animate-fade-in-up">
            {/* Header */}
            <div className={`p-4 bg-gradient-to-r ${getDomainColor(activeDomain)} text-white flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm dark:text-white text-2xl">
                        {getDomainIcon(activeDomain)}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{activeDomain} Specialist Support</h3>
                        <p className="text-xs opacity-90">AI Domain Expert • Context Aware</p>
                    </div>
                </div>
                {/* Domain Switcher / Status */}
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                    {activeDomain === "General" ? "Ready" : "Active"}
                </span>
            </div>

            <div className="p-0 flex flex-col md:flex-row h-[500px]">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && isLoading && (
                            <div className="flex justify-center items-center h-full text-text-muted animate-pulse">
                                Connecting to specialist...
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user'
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-white dark:bg-slate-800 text-text-main border border-slate-100 dark:border-slate-700 rounded-tl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && messages.length > 0 && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl rounded-tl-none border border-slate-100 dark:border-slate-700">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleConsult(input)}
                            placeholder={`Ask ${activeDomain} Specialist...`}
                            disabled={isLoading || isOffline}
                            className="flex-1 bg-slate-100 dark:bg-slate-900 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        />
                        <button
                            onClick={() => handleConsult(input)}
                            disabled={!input.trim() || isLoading || isOffline}
                            className="p-3 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                </div>

                {/* Sidebar: Suggested Actions / Context */}
                <div className="w-full md:w-64 bg-white dark:bg-slate-800 border-l border-slate-100 dark:border-slate-700 p-4 overflow-y-auto">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Suggested Actions</h4>
                    <div className="space-y-2">
                        {suggestedActions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => handleActionClick(action.action, action.label)}
                                disabled={isLoading || isOffline}
                                className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all group flex items-center gap-3"
                            >
                                <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm text-primary group-hover:scale-110 transition-transform`}>
                                    {/* Map icon string to ICON constant or render SVG if needed */}
                                    {ICONS[action.icon as keyof typeof ICONS] || ICONS.activity}
                                </div>
                                <span className="text-xs font-bold text-text-main group-hover:text-primary transition-colors">{action.label}</span>
                            </button>
                        ))}
                        {suggestedActions.length === 0 && (
                            <p className="text-xs text-text-muted italic text-center py-4">
                                No specific actions suggested yet. Start chatting to get assistance.
                            </p>
                        )}
                    </div>

                    <div className="mt-8">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Quick Protocols</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleConsult("Summarize relevant guidelines")} className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                                Guidelines
                            </button>
                            <button onClick={() => handleConsult("Identify contraindications")} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors">
                                Risks
                            </button>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Advanced Workflows</h4>
                        <button
                            onClick={handleBoardReview}
                            disabled={isLoading || isOffline}
                            className="w-full p-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">👥</span>
                            <div className="text-left">
                                <div className="text-xs font-bold">Start Board Review</div>
                                <div className="text-[10px] opacity-80">Orchestrator + Specialists</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

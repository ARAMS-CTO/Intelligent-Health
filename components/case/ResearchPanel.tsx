import React, { useState } from 'react';
import { Case } from '../../types';
import { GeminiService } from '../../services/api';
import { ICONS } from '../../constants';
import ReactMarkdown from 'react-markdown';

interface ResearchPanelProps {
    caseData: Case;
    userRole: string;
}

export const ResearchPanel: React.FC<ResearchPanelProps> = ({ caseData, userRole }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ query: string; response: string; timestamp: Date }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (customQuery?: string) => {
        const q = customQuery || query;
        if (!q.trim()) return;

        setIsLoading(true);
        try {
            // We use the Agent Chat endpoint which routes to ResearcherAgent based on intent
            const response = await GeminiService.agentChat(q);

            let content = "";
            if (response.result && (response.routed_to === 'research_condition' || response.routed_to === 'find_guidelines' || response.routed_to === 'drug_interaction_deep_dive')) {
                // Format the JSON result nicely
                content = "### Research Findings\n```json\n" + JSON.stringify(response.result, null, 2) + "\n```";
                // Ideally parse it better based on task type
                if (response.routed_to === 'research_condition') {
                    const r = response.result;
                    content = `### Summary\n${r.summary}\n\n**Recent Advancements:**\n${(r.recent_advancements || []).map((a: string) => `- ${a}`).join('\n')}`;
                } else if (response.routed_to === 'find_guidelines') {
                    const r = response.result;
                    content = `### Guideline: ${r.guideline_title}\n**Organization:** ${r.organization} (${r.year})\n\n**Key Recommendations:**\n${(r.key_recommendations || []).map((k: string) => `- ${k}`).join('\n')}`;
                }
            } else {
                content = response.response;
            }

            setResults(prev => [{ query: q, response: content, timestamp: new Date() }, ...prev]);
            setQuery('');
        } catch (e) {
            console.error(e);
            setResults(prev => [{ query: q, response: "Error performing research.", timestamp: new Date() }, ...prev]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestedQueries = [
        `Find clinical guidelines for ${caseData.diagnosis || '...'}`,
        `Research recent treatments for ${caseData.diagnosis || '...'}`,
        `Check drug interactions for current medications`,
        `Latest trials for ${caseData.diagnosis || '...'}`
    ];

    return (
        <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700 min-h-[600px] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-text-main">Medical Research Assistant</h2>
                    <p className="text-text-muted text-sm">Powered by AI Agent Bus & External Knowledge</p>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <input
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium text-text-main"
                    placeholder="Ask a research question (e.g., 'Find guidelines for sepsis')..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button
                    onClick={() => handleSearch()}
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 flex items-center gap-2"
                >
                    {isLoading ? <span className="animate-spin">C</span> : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    )}
                    Search
                </button>
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 mb-8">
                {suggestedQueries.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => handleSearch(q)}
                        className="px-3 py-1.5 bg-purple-50 dark:bg-slate-800 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
                    >
                        {q}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {results.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <div className="text-6xl mb-4">📚</div>
                        <p className="font-bold text-xl">No research yet</p>
                        <p className="text-sm">Ask a question to start exploring medical literature.</p>
                    </div>
                )}
                {results.map((res, idx) => (
                    <div key={idx} className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-5 border border-white/20 dark:border-slate-700 shadow-sm animate-fade-in">
                        <div className="flex justify-between items-start mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                            <h3 className="font-bold text-lg text-purple-700 dark:text-purple-400">"{res.query}"</h3>
                            <span className="text-xs text-text-muted">{res.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-sm">
                            <ReactMarkdown>{res.response}</ReactMarkdown>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

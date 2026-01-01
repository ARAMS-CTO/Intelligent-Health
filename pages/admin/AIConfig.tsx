import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataService, GeminiService } from '../../services/api';
import { showToast } from '../../components/Toast';
import { ICONS } from '../../constants/index';

const AIConfig: React.FC = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState({
        medLM: true,
        voiceAssistant: true,
        ragKnowledge: true,
        autoTriage: true
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const data = await DataService.getAdminConfig();
            if (data && data.features) {
                setConfig(prev => ({ ...prev, ...data.features }));
            }
        } catch (error) {
            console.error(error);
            showToast.error("Failed to load AI configuration");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (key: keyof typeof config) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await DataService.updateAdminConfig(config);
            showToast.success("AI Configuration updated successfully");
        } catch (error) {
            showToast.error("Failed to update configuration");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-text-muted">Loading configuration...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-heading font-bold text-text-main">AI System Configuration</h2>
                    <p className="text-text-muted">Manage global AI features and model behavior.</p>
                </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        {ICONS.ai}
                    </div>
                    <h3 className="text-lg font-bold text-text-main">Feature Flags</h3>
                </div>

                <div className="space-y-6">
                    {/* MedLM */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.medLM ? 'bg-primary/20 text-primary' : 'bg-slate-200 text-slate-400'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-text-main">MedLM-Medium Model</h4>
                                <p className="text-sm text-text-muted">Enable specialized medical language model for diagnosis support.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('medLM')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${config.medLM ? 'bg-primary' : 'bg-slate-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.medLM ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Voice Assistant */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.voiceAssistant ? 'bg-green-500/20 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-text-main">Voice Assistant</h4>
                                <p className="text-sm text-text-muted">Enable speech-to-text features for Case Forms and Patient Intake.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('voiceAssistant')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${config.voiceAssistant ? 'bg-green-500' : 'bg-slate-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.voiceAssistant ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* RAG Knowledge Base */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.ragKnowledge ? 'bg-blue-500/20 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-text-main">Knowledge Base (RAG)</h4>
                                <p className="text-sm text-text-muted">Allow AI to search internal guidelines and past cases for context.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('ragKnowledge')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${config.ragKnowledge ? 'bg-blue-500' : 'bg-slate-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.ragKnowledge ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Auto-Triage */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.autoTriage ? 'bg-orange-500/20 text-orange-600' : 'bg-slate-200 text-slate-400'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-text-main">Auto-Triage System</h4>
                                <p className="text-sm text-text-muted">Automatically assign priority levels to new patient cases.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('autoTriage')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${config.autoTriage ? 'bg-orange-500' : 'bg-slate-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.autoTriage ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Agent Capabilities Section */}
                <div className="mt-8 border-t border-slate-100 dark:border-slate-700/50 pt-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-main">Internal Agent Capabilities (MCP)</h3>
                            <p className="text-sm text-text-muted">Manage and test inter-agent routing capabilities.</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold">Registered Capabilities</h4>
                            <button onClick={async () => {
                                try {
                                    await GeminiService.seedAgentCapabilities();
                                    showToast.success("Capabilities seeded!");
                                } catch (e) { showToast.error("Failed to seed"); }
                            }} className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg font-bold hover:bg-indigo-200">
                                Seed Defaults
                            </button>
                        </div>

                        {/* Routing Test */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Test Capability Routing</label>
                            <div className="flex gap-2">
                                <input
                                    id="routing-query"
                                    type="text"
                                    placeholder="e.g. 'Patient has chest pain, check priority' or 'Check interaction between Aspirin and Warfarin'"
                                    className="flex-1 border bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button onClick={async () => {
                                    const input = (document.getElementById('routing-query') as HTMLInputElement).value;
                                    if (!input) return;
                                    try {
                                        const res = await GeminiService.findAgentCapability(input);
                                        showToast.info('Routing Result: ' + JSON.stringify(res, null, 2));
                                    } catch (e) { showToast.error("Error finding capability"); }
                                }} className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-600">
                                    Test Route
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIConfig;

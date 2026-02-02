import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataService } from '../../services/api';
import { showToast } from '../../components/Toast';
import { ICONS, AVATARS } from '../../constants/index';
import { AgentCapability } from '../../types/index';
import Modal from '../../components/Modal';

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

    // Agent State
    const [agents, setAgents] = useState<AgentCapability[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<AgentCapability | null>(null);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [testPayload, setTestPayload] = useState("{}");
    const [testResult, setTestResult] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        loadConfig();
        loadAgents();
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
        } finally {
            setIsLoading(false);
        }
    };

    const loadAgents = async () => {
        try {
            const data = await DataService.getAgents();
            setAgents(data);
        } catch (error) {
            console.error("Failed to load agents", error);
        }
    };

    const handleToggle = (key: keyof typeof config) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await DataService.updateAdminConfig(config);
            showToast.success("Global Configuration updated");
        } catch (error) {
            showToast.error("Failed to update configuration");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAgentToggle = async (agent: AgentCapability) => {
        try {
            // Safe access for snake_case vs camelCase
            const agentAny = agent as any;
            const currentStatus = agentAny.is_active !== undefined ? agentAny.is_active : agent.isActive;

            await DataService.updateAgent(agent.id, { is_active: !currentStatus } as any);

            // Re-fetch to be safe
            loadAgents();
            showToast.success(`Agent updated`);
        } catch (e) {
            showToast.error("Failed to update agent");
        }
    };

    const runTest = async () => {
        if (!selectedAgent) return;
        setIsTesting(true);
        setTestResult(null);
        try {
            const payload = JSON.parse(testPayload);
            const res = await DataService.testAgent(selectedAgent.id, payload);
            setTestResult(JSON.stringify(res, null, 2));
        } catch (e) {
            setTestResult("Error: Invalid JSON or Execution Failed");
        } finally {
            setIsTesting(false);
        }
    };

    const handleSeed = async () => {
        setIsLoading(true);
        try {
            await (DataService as any).seedAgentCapabilities();
            await loadAgents();
            showToast.success("Agents seeded successfully");
        } catch (error) {
            showToast.error("Seeding failed");
        } finally {
            setIsLoading(false);
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
                    <p className="text-text-muted">Manage global AI features and Autonomous Agents.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSeed}
                        className="bg-white border border-slate-200 text-slate-600 font-bold py-2 px-4 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
                        title="Reset/Seed Default Agents"
                    >
                        Seed Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary text-white font-bold py-2 px-6 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? "Saving..." : "Save Global Settings"}
                    </button>
                </div>
            </div>

            {/* Global Features */}
            <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        {ICONS.ai}
                    </div>
                    <h3 className="text-lg font-bold text-text-main">Global Feature Flags</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* MedLM */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.medLM ? 'bg-primary/20 text-primary' : 'bg-slate-200 text-slate-400'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-text-main">MedLM-Medium</h4>
                                <p className="text-xs text-text-muted">Specialized Medical LLM</p>
                            </div>
                        </div>
                        <button onClick={() => handleToggle('medLM')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.medLM ? 'bg-primary' : 'bg-slate-300'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.medLM ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Voice */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.voiceAssistant ? 'bg-green-500/20 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                {ICONS.voiceChat}
                            </div>
                            <div>
                                <h4 className="font-bold text-text-main">Voice Assistant</h4>
                                <p className="text-xs text-text-muted">Speech-to-Text Features</p>
                            </div>
                        </div>
                        <button onClick={() => handleToggle('voiceAssistant')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.voiceAssistant ? 'bg-green-500' : 'bg-slate-300'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.voiceAssistant ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Agent Console */}
            <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-main">Autonomous Agents Console</h3>
                            <p className="text-sm text-text-muted">Monitor and configure active AI agents.</p>
                        </div>
                    </div>
                    <button onClick={loadAgents} className="text-sm text-primary font-bold hover:underline">Refresh List</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-bold text-text-muted uppercase border-b border-slate-100 dark:border-slate-700">
                                <th className="p-4">Agent Role</th>
                                <th className="p-4">Capability</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {agents.map(agent => {
                                const agentAny = agent as any;
                                const isActive = agentAny.is_active !== undefined ? agentAny.is_active : agent.isActive;
                                const role = agentAny.agent_role || agent.agentRole;
                                const capability = agentAny.capability_name || agent.capabilityName;
                                const inputSchema = agentAny.input_schema || agent.inputSchema;

                                return (
                                    <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={AVATARS[role as keyof typeof AVATARS] || AVATARS.Default}
                                                    alt={role}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700 bg-slate-200"
                                                />
                                                <div>
                                                    <div className="font-bold text-text-main">{role}</div>
                                                    <div className="text-xs text-text-muted">{agent.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-primary">{capability}</div>
                                            <div className="text-xs text-text-muted truncate max-w-xs">{agent.description}</div>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleAgentToggle(agent)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border ${isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                                            >
                                                {isActive ? 'Active' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAgent(agent);
                                                        setTestPayload(JSON.stringify(inputSchema || {}, null, 2));
                                                        setIsTestModalOpen(true);
                                                        setTestResult(null);
                                                    }}
                                                    className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Test Agent"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {agents.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-text-muted">
                                        No agents found. Run Seeding?
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Test Modal */}
            <Modal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)}>
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">Test Agent: {(selectedAgent as any)?.capability_name || selectedAgent?.capabilityName}</h3>
                    <div>
                        <label className="block text-sm font-bold text-text-main mb-2">Input Payload (JSON)</label>
                        <textarea
                            value={testPayload}
                            onChange={(e) => setTestPayload(e.target.value)}
                            className="w-full h-32 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm"
                        />
                    </div>

                    {testResult && (
                        <div>
                            <label className="block text-sm font-bold text-text-main mb-2">Result</label>
                            <pre className="w-full max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs text-green-600">
                                {testResult}
                            </pre>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button onClick={() => setIsTestModalOpen(false)} className="px-4 py-2 text-text-muted font-bold hover:bg-slate-100 rounded-lg">Close</button>
                        <button
                            onClick={runTest}
                            disabled={isTesting}
                            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isTesting ? "Executing..." : "Run Test"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AIConfig;

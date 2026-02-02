import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';

interface AgentMetric {
    id: string;
    name: string;
    role: string;
    status: 'Active' | 'Paused' | 'Error';
    requestsToday: number;
    avgLatency: number;
    successRate: number;
    lastActive: string;
}

interface ModelConfig {
    id: string;
    name: string;
    provider: string;
    isDefault: boolean;
    latency: number;
    status: 'Operational' | 'Degraded' | 'Offline';
}

const AIEngineerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [selectedTab, setSelectedTab] = useState<'agents' | 'models' | 'logs' | 'config'>('agents');
    const [agents, setAgents] = useState<AgentMetric[]>([]);
    const [models, setModels] = useState<ModelConfig[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load agents
            const agentData = await DataService.getAgents();
            const mappedAgents: AgentMetric[] = agentData.map((a: any, idx: number) => ({
                id: a.id,
                name: a.capabilityName || a.capability_name || 'Agent',
                role: a.agentRole || a.agent_role || 'General',
                status: a.isActive !== false ? 'Active' : 'Paused',
                requestsToday: Math.floor(Math.random() * 500),
                avgLatency: Math.floor(Math.random() * 300) + 50,
                successRate: 85 + Math.floor(Math.random() * 15),
                lastActive: new Date(Date.now() - Math.random() * 3600000).toISOString()
            }));
            setAgents(mappedAgents.length ? mappedAgents : generateMockAgents());

            // Load logs
            const systemLogs = await DataService.getSystemLogs();
            setLogs(systemLogs.slice(0, 20));
        } catch (e) {
            console.error(e);
            setAgents(generateMockAgents());
        } finally {
            setIsLoading(false);
        }

        // Mock models
        setModels([
            { id: 'm1', name: 'Gemini 2.5 Flash', provider: 'Google', isDefault: true, latency: 142, status: 'Operational' },
            { id: 'm2', name: 'Gemini 2.5 Pro', provider: 'Google', isDefault: false, latency: 380, status: 'Operational' },
            { id: 'm3', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', isDefault: false, latency: 520, status: 'Operational' },
            { id: 'm4', name: 'GPT-4 Turbo', provider: 'OpenAI', isDefault: false, latency: 450, status: 'Degraded' },
            { id: 'm5', name: 'MedLM Large', provider: 'Google', isDefault: false, latency: 890, status: 'Offline' },
        ]);
    };

    const generateMockAgents = (): AgentMetric[] => [
        { id: 'a1', name: 'Triage Agent', role: 'Nurse', status: 'Active', requestsToday: 234, avgLatency: 156, successRate: 97, lastActive: new Date().toISOString() },
        { id: 'a2', name: 'Diagnosis Support', role: 'Doctor', status: 'Active', requestsToday: 456, avgLatency: 280, successRate: 94, lastActive: new Date().toISOString() },
        { id: 'a3', name: 'Research Agent', role: 'Researcher', status: 'Active', requestsToday: 89, avgLatency: 520, successRate: 91, lastActive: new Date().toISOString() },
        { id: 'a4', name: 'Patient Chat', role: 'Patient', status: 'Active', requestsToday: 678, avgLatency: 120, successRate: 99, lastActive: new Date().toISOString() },
        { id: 'a5', name: 'Integration Agent', role: 'System', status: 'Paused', requestsToday: 12, avgLatency: 340, successRate: 85, lastActive: new Date(Date.now() - 3600000).toISOString() },
        { id: 'a6', name: 'Cardiology Specialist', role: 'Specialist', status: 'Active', requestsToday: 45, avgLatency: 410, successRate: 96, lastActive: new Date().toISOString() },
    ];

    const totalRequests = agents.reduce((a, ag) => a + ag.requestsToday, 0);
    const avgLatency = agents.length ? Math.round(agents.reduce((a, ag) => a + ag.avgLatency, 0) / agents.length) : 0;
    const avgSuccess = agents.length ? Math.round(agents.reduce((a, ag) => a + ag.successRate, 0) / agents.length) : 0;

    if (!user) return null;

    return (
        <div className="bg-background min-h-screen p-6 lg:p-8 font-mono">
            <header className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-heading font-black text-text-main">
                    AI <span className="text-primary">Engineering Console</span>
                </h1>
                <p className="text-text-muted mt-2">Model Fine-Tuning, Agent Orchestration & System Monitoring</p>
            </header>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 p-5 rounded-2xl border border-primary/20">
                    <p className="text-sm text-text-muted mb-1">Active Agents</p>
                    <p className="text-3xl font-black text-primary">{agents.filter(a => a.status === 'Active').length}</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/50">
                    <p className="text-sm text-text-muted mb-1">Requests Today</p>
                    <p className="text-3xl font-black text-text-main">{totalRequests.toLocaleString()}</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/50">
                    <p className="text-sm text-text-muted mb-1">Avg Latency</p>
                    <p className="text-3xl font-black text-text-main">{avgLatency}ms</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/50">
                    <p className="text-sm text-text-muted mb-1">Success Rate</p>
                    <p className="text-3xl font-black text-accent">{avgSuccess}%</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/50">
                    <p className="text-sm text-text-muted mb-1">Models Online</p>
                    <p className="text-3xl font-black text-text-main">{models.filter(m => m.status !== 'Offline').length}/{models.length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {(['agents', 'models', 'logs', 'config'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`px-5 py-2 rounded-xl font-bold transition-all ${selectedTab === tab
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white/50 dark:bg-slate-800/50 text-text-muted hover:bg-primary/10'
                            }`}
                    >
                        {tab === 'agents' ? '🤖 Agents' : tab === 'models' ? '🧠 Models' : tab === 'logs' ? '📋 Logs' : '⚙️ Config'}
                    </button>
                ))}
            </div>

            {/* Agents Tab */}
            {selectedTab === 'agents' && (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-text-main">Agent Performance Metrics</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-text-muted">
                                <tr>
                                    <th className="px-6 py-4">Agent</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Requests</th>
                                    <th className="px-6 py-4">Latency</th>
                                    <th className="px-6 py-4">Success</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {agents.map(agent => (
                                    <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 font-bold text-text-main">{agent.name}</td>
                                        <td className="px-6 py-4 text-sm text-text-muted">{agent.role}</td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-2 text-sm font-bold ${agent.status === 'Active' ? 'text-green-600' : agent.status === 'Paused' ? 'text-yellow-600' : 'text-red-600'}`}>
                                                <span className={`w-2 h-2 rounded-full ${agent.status === 'Active' ? 'bg-green-500 animate-pulse' : agent.status === 'Paused' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                                {agent.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono">{agent.requestsToday}</td>
                                        <td className="px-6 py-4 font-mono">{agent.avgLatency}ms</td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${agent.successRate >= 95 ? 'text-green-600' : agent.successRate >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {agent.successRate}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-sm font-bold text-primary hover:underline">Configure</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Models Tab */}
            {selectedTab === 'models' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {models.map(model => (
                        <div key={model.id} className={`p-5 rounded-2xl border ${model.isDefault ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${model.status === 'Operational' ? 'bg-green-500 animate-pulse' : model.status === 'Degraded' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${model.status === 'Operational' ? 'bg-green-100 text-green-700' : model.status === 'Degraded' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {model.status}
                                    </span>
                                </div>
                                {model.isDefault && <span className="text-xs font-bold px-2 py-1 rounded bg-primary/20 text-primary">DEFAULT</span>}
                            </div>
                            <h4 className="font-bold text-lg text-text-main mb-1">{model.name}</h4>
                            <p className="text-sm text-text-muted mb-4">{model.provider}</p>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-text-muted">Latency: <span className="font-mono font-bold">{model.latency}ms</span></span>
                                <button className="font-bold text-primary hover:underline">
                                    {model.isDefault ? 'View' : 'Set Default'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Logs Tab */}
            {selectedTab === 'logs' && (
                <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm overflow-x-auto">
                    <div className="text-green-400 mb-4">&gt; AI System Logs (Last 20 entries)</div>
                    {logs.length === 0 ? (
                        <div className="text-slate-500">No logs available</div>
                    ) : (
                        <div className="space-y-1">
                            {logs.map((log, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <span className="text-slate-500">{new Date(log.timestamp || Date.now()).toLocaleTimeString()}</span>
                                    <span className={`${log.severity === 'ERROR' ? 'text-red-400' : log.severity === 'WARN' ? 'text-yellow-400' : 'text-green-400'}`}>
                                        [{log.severity || 'INFO'}]
                                    </span>
                                    <span className="text-slate-300">{log.eventType || log.event_type || 'System Event'} - {JSON.stringify(log.details || {}).slice(0, 80)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Config Tab */}
            {selectedTab === 'config' && (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-8">
                    <h3 className="font-bold text-text-main mb-6">System Configuration</h3>
                    <div className="space-y-6 max-w-2xl">
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-text-main">Enable MedLM Integration</p>
                                    <p className="text-xs text-text-muted">Use Google's specialized medical LLM</p>
                                </div>
                                <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
                            </label>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-text-main">Auto-Triage Mode</p>
                                    <p className="text-xs text-text-muted">Automatically assign urgency levels</p>
                                </div>
                                <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
                            </label>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-text-main">RAG Knowledge Base</p>
                                    <p className="text-xs text-text-muted">Enable retrieval-augmented generation</p>
                                </div>
                                <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
                            </label>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="font-bold text-text-main mb-2">Default Temperature</p>
                            <input type="range" min="0" max="100" defaultValue="30" className="w-full accent-primary" />
                            <div className="flex justify-between text-xs text-text-muted mt-1">
                                <span>0.0 (Precise)</span><span>1.0 (Creative)</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIEngineerDashboard;

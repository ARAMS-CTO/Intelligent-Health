import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import { SpecialistAgentChat } from '../components/specialized/SpecialistAgentChat';

// Types
interface LabRequest {
    id: string;
    test: string;
    case_id: string;
    ordered_at: string;
    priority: 'routine' | 'urgent' | 'stat';
    category: string;
    patient_name?: string;
    status: 'pending' | 'in_progress' | 'completed';
}

interface CompletedResult {
    id: string;
    test: string;
    value: string;
    unit: string;
    reference_range: string;
    interpretation: string;
    completed_at: string;
    is_critical: boolean;
    patient_name?: string;
}

const TEST_CATEGORIES = [
    { id: 'all', name: 'All Tests', icon: '🧪' },
    { id: 'blood', name: 'Blood Work', icon: '🩸' },
    { id: 'urine', name: 'Urinalysis', icon: '💧' },
    { id: 'chemistry', name: 'Chemistry Panel', icon: '⚗️' },
    { id: 'microbiology', name: 'Microbiology', icon: '🦠' },
    { id: 'imaging', name: 'Imaging', icon: '📷' },
];

const LabDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation('dashboard');
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    // State
    const [labs, setLabs] = useState<LabRequest[]>([]);
    const [completedResults, setCompletedResults] = useState<CompletedResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLab, setSelectedLab] = useState<LabRequest | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [resultForm, setResultForm] = useState({
        value: '',
        unit: '',
        reference_range: '',
        interpretation: '',
        is_critical: false
    });

    // Stats
    const [stats, setStats] = useState({
        pending: 0,
        inProgress: 0,
        completed: 0,
        critical: 0,
        avgTurnaround: '2.4h'
    });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const pending = await DataService.getPendingLabs();
            // Enrich with mock data for demo
            const enrichedLabs = pending.map((lab: any, idx: number) => ({
                ...lab,
                priority: ['routine', 'urgent', 'stat'][idx % 3] as 'routine' | 'urgent' | 'stat',
                category: ['blood', 'chemistry', 'urine', 'microbiology'][idx % 4],
                patient_name: `Patient ${idx + 1}`,
                status: 'pending' as const
            }));
            setLabs(enrichedLabs);

            // Mock completed results
            setCompletedResults([
                {
                    id: '1',
                    test: 'Complete Blood Count',
                    value: '14.2',
                    unit: 'g/dL',
                    reference_range: '12.0-16.0',
                    interpretation: 'Within normal limits',
                    completed_at: new Date(Date.now() - 3600000).toISOString(),
                    is_critical: false,
                    patient_name: 'John Smith'
                },
                {
                    id: '2',
                    test: 'Glucose (Fasting)',
                    value: '245',
                    unit: 'mg/dL',
                    reference_range: '70-100',
                    interpretation: 'CRITICAL: Hyperglycemia detected',
                    completed_at: new Date(Date.now() - 7200000).toISOString(),
                    is_critical: true,
                    patient_name: 'Sarah Johnson'
                },
                {
                    id: '3',
                    test: 'Lipid Panel',
                    value: '210',
                    unit: 'mg/dL',
                    reference_range: '<200',
                    interpretation: 'Borderline high cholesterol',
                    completed_at: new Date(Date.now() - 10800000).toISOString(),
                    is_critical: false,
                    patient_name: 'Mike Davis'
                },
            ]);

            // Update stats
            setStats({
                pending: enrichedLabs.length,
                inProgress: Math.floor(enrichedLabs.length * 0.3),
                completed: 47,
                critical: 3,
                avgTurnaround: '2.4h'
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleRecordResult = async () => {
        if (!selectedLab) return;
        try {
            await DataService.recordLabResult(selectedLab.id, resultForm);
            loadData();
            setSelectedLab(null);
            setResultForm({ value: '', unit: '', reference_range: '', interpretation: '', is_critical: false });
        } catch (e) {
            alert("Failed to record result");
        }
    };

    const generateAIInterpretation = () => {
        // Mock AI interpretation
        const interpretations = [
            'Values within normal physiological range. No immediate concerns.',
            'Slightly elevated levels detected. Recommend follow-up testing in 2 weeks.',
            'Results indicate possible dehydration. Patient should increase fluid intake.',
            'Normal findings consistent with healthy metabolism.'
        ];
        setResultForm(prev => ({
            ...prev,
            interpretation: interpretations[Math.floor(Math.random() * interpretations.length)]
        }));
    };

    const filteredLabs = selectedCategory === 'all'
        ? labs
        : labs.filter(lab => lab.category === selectedCategory);

    const getPriorityBadge = (priority: string) => {
        const styles = {
            stat: 'bg-red-500 text-white animate-pulse',
            urgent: 'bg-amber-500 text-white',
            routine: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
        };
        return styles[priority as keyof typeof styles] || styles.routine;
    };

    if (!user) return null;

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen p-8">
            {/* Header */}
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white">
                        Laboratory <span className="text-primary">Services</span>
                    </h1>
                    <p className="text-slate-500 mt-2">Test Processing, Results & Analytics</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsAiModalOpen(true)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-blue-500/30">
                        {ICONS.ai} Ask Lab AI
                    </button>
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                        📊 Export Report
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors flex items-center gap-2">
                        ➕ New Test Order
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="glass-card p-5 rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-500/20 rounded-lg">⏳</div>
                        <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">Pending</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.pending}</p>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg">🔬</div>
                        <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">In Progress</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.inProgress}</p>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-green-200/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/20 rounded-lg">✅</div>
                        <span className="text-xs font-bold uppercase text-green-600 dark:text-green-400">Completed Today</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.completed}</p>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-red-200/50 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/20 rounded-lg">🚨</div>
                        <span className="text-xs font-bold uppercase text-red-600 dark:text-red-400">Critical Values</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.critical}</p>
                </div>

                <div className="glass-card p-5 rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg">⚡</div>
                        <span className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400">Avg. Turnaround</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">{stats.avgTurnaround}</p>
                </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {TEST_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${selectedCategory === cat.id
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        <span>{cat.icon}</span>
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'pending'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                >
                    🧪 Test Queue ({filteredLabs.length})
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'completed'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                >
                    ✅ Completed Results ({completedResults.length})
                </button>
            </div>

            {/* Content */}
            {activeTab === 'pending' ? (
                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400">Loading requests...</div>
                    ) : filteredLabs.length === 0 ? (
                        <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                            <div className="text-4xl mb-4 opacity-50">🧪</div>
                            <p className="font-bold text-slate-500">No pending lab requests.</p>
                        </div>
                    ) : (
                        filteredLabs.map(lab => (
                            <div key={lab.id} className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50 hover:shadow-lg transition-all">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-2xl">
                                            {TEST_CATEGORIES.find(c => c.id === lab.category)?.icon || '🩸'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-800 dark:text-white">{lab.test}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getPriorityBadge(lab.priority)}`}>
                                                    {lab.priority}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium mt-1">
                                                {lab.patient_name} • Case #{lab.case_id?.slice(0, 8)} • Ordered: {new Date(lab.ordered_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedLab(lab)}
                                            className="bg-primary text-white font-bold py-2 px-5 rounded-xl hover:bg-primary-hover text-sm transition-colors"
                                        >
                                            Enter Results
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {completedResults.map(result => (
                        <div
                            key={result.id}
                            className={`glass-card p-6 rounded-2xl border transition-all ${result.is_critical
                                ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
                                : 'border-white/20 dark:border-slate-700/50'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl text-2xl ${result.is_critical ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                                        {result.is_critical ? '🚨' : '✅'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-800 dark:text-white">{result.test}</h4>
                                            {result.is_critical && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-red-500 text-white animate-pulse">
                                                    CRITICAL
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium mt-1">
                                            {result.patient_name} • Completed: {new Date(result.completed_at).toLocaleString()}
                                        </p>
                                        <div className="mt-3 flex items-center gap-6">
                                            <div>
                                                <span className="text-xs text-slate-400">Result</span>
                                                <p className={`font-bold text-lg ${result.is_critical ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
                                                    {result.value} <span className="text-sm font-normal text-slate-500">{result.unit}</span>
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400">Reference Range</span>
                                                <p className="font-medium text-slate-600 dark:text-slate-300">{result.reference_range}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">AI Interpretation:</span>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{result.interpretation}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        📋
                                    </button>
                                    <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        🖨️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Result Modal */}
            {selectedLab && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-primary/10 text-primary rounded-xl text-2xl">🧪</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Record Results</h3>
                                <p className="text-sm text-slate-500">{selectedLab.test}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Value *</label>
                                <input
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={resultForm.value}
                                    onChange={e => setResultForm({ ...resultForm, value: e.target.value })}
                                    placeholder="Enter value..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unit</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={resultForm.unit}
                                        onChange={e => setResultForm({ ...resultForm, unit: e.target.value })}
                                        placeholder="mg/dL"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reference Range</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={resultForm.reference_range}
                                        onChange={e => setResultForm({ ...resultForm, reference_range: e.target.value })}
                                        placeholder="70-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Interpretation</label>
                                    <button
                                        onClick={generateAIInterpretation}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        ✨ Generate with AI
                                    </button>
                                </div>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 h-24 resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={resultForm.interpretation}
                                    onChange={e => setResultForm({ ...resultForm, interpretation: e.target.value })}
                                    placeholder="Clinical interpretation..."
                                />
                            </div>

                            <label className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={resultForm.is_critical}
                                    onChange={e => setResultForm({ ...resultForm, is_critical: e.target.checked })}
                                    className="w-5 h-5 rounded text-red-500 focus:ring-red-500"
                                />
                                <div>
                                    <span className="font-bold text-red-700 dark:text-red-300">🚨 Mark as Critical Value</span>
                                    <p className="text-xs text-red-600 dark:text-red-400">Will trigger immediate physician notification</p>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-6 justify-end">
                            <button
                                onClick={() => setSelectedLab(null)}
                                className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRecordResult}
                                className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors"
                            >
                                Submit Results
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Assistant Modal */}
            <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)}>
                <div className="w-[800px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
                    <SpecialistAgentChat zone="lab" contextId="lab-protocols" />
                </div>
            </Modal>
        </div>
    );
};

export default LabDashboard;

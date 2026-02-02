import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { useNavigate } from 'react-router-dom';
import { Case } from '../types';

interface LearningModule {
    id: string;
    title: string;
    type: 'Video' | 'Document' | 'Quiz' | 'Simulation';
    duration: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    progress: number;
    completed: boolean;
}

const LEARNING_MODULES: LearningModule[] = [
    { id: 'lm1', title: 'Clinical Guidelines v2.0', type: 'Document', duration: '30 min', difficulty: 'Beginner', progress: 100, completed: true },
    { id: 'lm2', title: 'AI Diagnostic Triage', type: 'Video', duration: '45 min', difficulty: 'Intermediate', progress: 60, completed: false },
    { id: 'lm3', title: 'Emergency Response Protocols', type: 'Video', duration: '60 min', difficulty: 'Advanced', progress: 0, completed: false },
    { id: 'lm4', title: 'Patient Communication Skills', type: 'Simulation', duration: '40 min', difficulty: 'Beginner', progress: 30, completed: false },
    { id: 'lm5', title: 'Medical Ethics Assessment', type: 'Quiz', duration: '20 min', difficulty: 'Intermediate', progress: 0, completed: false },
    { id: 'lm6', title: 'Lab Result Interpretation', type: 'Document', duration: '35 min', difficulty: 'Intermediate', progress: 100, completed: true },
    { id: 'lm7', title: 'Imaging Analysis Basics', type: 'Video', duration: '50 min', difficulty: 'Advanced', progress: 15, completed: false },
    { id: 'lm8', title: 'Pharmacology Essentials', type: 'Quiz', duration: '25 min', difficulty: 'Beginner', progress: 100, completed: true },
];

const TraineeDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState<'cases' | 'learning' | 'feedback'>('cases');
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [moduleFilter, setModuleFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

    useEffect(() => {
        loadCases();
    }, []);

    const loadCases = async () => {
        setIsLoading(true);
        try {
            const allCases = await DataService.getCases();
            // Trainees can view cases (read-only shadowing)
            setCases(allCases.slice(0, 10)); // Limited view
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredModules = LEARNING_MODULES.filter(m => {
        if (moduleFilter === 'all') return true;
        if (moduleFilter === 'completed') return m.completed;
        if (moduleFilter === 'in-progress') return !m.completed && m.progress > 0;
        return true;
    });

    const getModuleIcon = (type: LearningModule['type']) => {
        switch (type) {
            case 'Video': return '🎬';
            case 'Document': return '📄';
            case 'Quiz': return '📝';
            case 'Simulation': return '🎮';
        }
    };

    const getDifficultyColor = (diff: LearningModule['difficulty']) => {
        switch (diff) {
            case 'Beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
            case 'Intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
            case 'Advanced': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
        }
    };

    const overallProgress = Math.round(LEARNING_MODULES.reduce((a, m) => a + m.progress, 0) / LEARNING_MODULES.length);
    const completedCount = LEARNING_MODULES.filter(m => m.completed).length;

    if (!user) return null;

    return (
        <div className="bg-background min-h-screen p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-heading font-black text-text-main">
                    Medical <span className="text-primary">Training Portal</span>
                </h1>
                <p className="text-text-muted mt-2">Learning Resources & Supervised Case Review</p>
            </header>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="md:col-span-2 bg-gradient-to-br from-primary/10 to-indigo-500/10 p-6 rounded-2xl border border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-text-main">Your Learning Progress</h3>
                            <p className="text-sm text-text-muted">{completedCount} of {LEARNING_MODULES.length} modules completed</p>
                        </div>
                        <div className="text-4xl font-black text-primary">{overallProgress}%</div>
                    </div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${overallProgress}%` }}></div>
                    </div>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-blue-200/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600">{ICONS.cases}</div>
                        <span className="text-sm font-medium text-text-muted">Cases to Review</span>
                    </div>
                    <p className="text-3xl font-black text-text-main">{cases.length}</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-purple-200/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600">{ICONS.certificate}</div>
                        <span className="text-sm font-medium text-text-muted">Study Hours</span>
                    </div>
                    <p className="text-3xl font-black text-text-main">24</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {(['cases', 'learning', 'feedback'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`px-5 py-2 rounded-xl font-bold transition-all ${selectedTab === tab
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white/50 dark:bg-slate-800/50 text-text-muted hover:bg-primary/10'
                            }`}
                    >
                        {tab === 'cases' ? '📋 Case Shadowing' : tab === 'learning' ? '📚 Learning Hub' : '💬 AI Feedback'}
                    </button>
                ))}
            </div>

            {/* Cases Tab - Read Only Shadowing */}
            {selectedTab === 'cases' && (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20">
                        <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                            ⚠️ <span className="font-medium">Read-Only Mode:</span> You can review cases assigned by your mentor but cannot make modifications.
                        </p>
                    </div>
                    {isLoading ? (
                        <div className="p-12 text-center text-text-muted">Loading cases...</div>
                    ) : cases.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-5xl mb-4">📋</div>
                            <h3 className="text-xl font-bold text-text-main mb-2">No Cases Assigned</h3>
                            <p className="text-text-muted">Your mentor will assign cases for you to review.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {cases.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => navigate(`/case/${c.id}`)}
                                    className="w-full p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${c.status === 'Open' ? 'bg-green-500' : c.status === 'Under Review' ? 'bg-yellow-500' : 'bg-slate-400'}`}></div>
                                        <div>
                                            <h4 className="font-bold text-text-main">{c.title}</h4>
                                            <p className="text-sm text-text-muted">Patient: {c.patientProfile?.age}yo {c.patientProfile?.sex} • {c.diagnosis || 'Pending diagnosis'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.status === 'Open' ? 'bg-green-100 text-green-700' : c.status === 'Under Review' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {c.status}
                                        </span>
                                        <p className="text-xs text-text-muted mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Learning Hub */}
            {selectedTab === 'learning' && (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-text-main">Learning Modules</h3>
                        <div className="flex gap-2">
                            {(['all', 'in-progress', 'completed'] as const).map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setModuleFilter(filter)}
                                    className={`px-3 py-1 text-sm rounded-lg font-medium transition-all ${moduleFilter === filter
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {filter === 'all' ? 'All' : filter === 'in-progress' ? 'In Progress' : 'Completed'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredModules.map(module => (
                            <div key={module.id} className={`p-5 rounded-xl border ${module.completed ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'} hover:shadow-lg transition-all`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{getModuleIcon(module.type)}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getDifficultyColor(module.difficulty)}`}>
                                            {module.difficulty}
                                        </span>
                                    </div>
                                    {module.completed && <span className="text-green-600 text-lg">✓</span>}
                                </div>
                                <h4 className="font-bold text-text-main mb-2">{module.title}</h4>
                                <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                                    <span>📺 {module.type}</span>
                                    <span>⏱️ {module.duration}</span>
                                </div>
                                {!module.completed && (
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-text-muted">Progress</span>
                                            <span className="font-bold text-primary">{module.progress}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${module.progress}%` }}></div>
                                        </div>
                                    </div>
                                )}
                                <button className="mt-4 w-full py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-lg transition-all">
                                    {module.completed ? 'Review Again' : module.progress > 0 ? 'Continue' : 'Start Module'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Feedback Tab */}
            {selectedTab === 'feedback' && (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            {ICONS.ai}
                        </div>
                        <h3 className="text-xl font-bold text-text-main">AI Learning Assistant</h3>
                        <p className="text-text-muted mt-2">Get personalized feedback on your clinical reasoning</p>
                    </div>
                    <div className="max-w-2xl mx-auto space-y-4">
                        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-text-main mb-2">📊 Your Performance Analysis</h4>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-black text-green-600">85%</p>
                                    <p className="text-xs text-text-muted">Accuracy</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-blue-600">12</p>
                                    <p className="text-xs text-text-muted">Cases Reviewed</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-purple-600">4.2</p>
                                    <p className="text-xs text-text-muted">Avg Rating</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 rounded-xl bg-gradient-to-r from-primary/5 to-indigo-500/5 border border-primary/20">
                            <h4 className="font-bold text-text-main mb-2">💡 AI Recommendations</h4>
                            <ul className="space-y-2 text-sm text-text-muted">
                                <li>• Focus on differential diagnosis skills - consider more alternatives</li>
                                <li>• Great attention to patient history details</li>
                                <li>• Review cardiology modules to improve ECG interpretation</li>
                            </ul>
                        </div>
                        <button className="w-full py-3 font-bold text-white bg-gradient-to-r from-primary to-indigo-600 rounded-xl shadow-lg hover:shadow-primary/30 transition-all">
                            Request Detailed AI Review
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TraineeDashboard;

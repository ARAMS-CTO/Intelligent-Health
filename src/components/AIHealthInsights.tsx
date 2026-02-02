import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/api';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';

interface HealthInsight {
    id: string;
    category: 'nutrition' | 'exercise' | 'sleep' | 'mental' | 'preventive' | 'medication';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
    action?: string;
    source?: string;
}

interface HealthScore {
    overall: number;
    nutrition: number;
    exercise: number;
    sleep: number;
    mentalHealth: number;
    preventiveCare: number;
}

export const AIHealthInsights: React.FC = () => {
    const [insights, setInsights] = useState<HealthInsight[]>([]);
    const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Mock insights
    const mockInsights: HealthInsight[] = [
        {
            id: '1',
            category: 'preventive',
            title: 'Flu Vaccine Due',
            description: 'Based on your records, you haven\'t received your annual flu vaccine. This year\'s vaccine protects against H1N1 and H3N2 strains.',
            priority: 'high',
            actionable: true,
            action: 'Schedule flu shot',
            source: 'CDC Guidelines'
        },
        {
            id: '2',
            category: 'medication',
            title: 'Medication Interaction Alert',
            description: 'Your current Lisinopril may interact with potassium supplements. Consider discussing alternatives with your doctor.',
            priority: 'high',
            actionable: true,
            action: 'Consult doctor',
            source: 'Drug Interaction Database'
        },
        {
            id: '3',
            category: 'exercise',
            title: 'Increase Daily Activity',
            description: 'Your step count has decreased by 25% this month. Aim for 8,000 steps daily to maintain cardiovascular health.',
            priority: 'medium',
            actionable: true,
            action: 'Set step goal',
            source: 'Health Tracker Data'
        },
        {
            id: '4',
            category: 'nutrition',
            title: 'Blood Sugar Management',
            description: 'Based on your recent glucose readings, consider reducing refined carbohydrate intake to maintain stable blood sugar.',
            priority: 'medium',
            actionable: true,
            action: 'View meal plan',
            source: 'Glucose Log Analysis'
        },
        {
            id: '5',
            category: 'sleep',
            title: 'Sleep Pattern Irregularity',
            description: 'Your sleep schedule varies by 2+ hours on weekends. Consistent sleep times improve overall health outcomes.',
            priority: 'low',
            actionable: false,
            source: 'Sleep Tracker'
        },
        {
            id: '6',
            category: 'mental',
            title: 'Stress Management',
            description: 'Elevated heart rate variability suggests increased stress. Consider mindfulness exercises or breathing techniques.',
            priority: 'medium',
            actionable: true,
            action: 'Start breathing exercise',
            source: 'Heart Rate Analysis'
        }
    ];

    const mockScore: HealthScore = {
        overall: 78,
        nutrition: 72,
        exercise: 65,
        sleep: 80,
        mentalHealth: 75,
        preventiveCare: 85
    };

    useEffect(() => {
        setTimeout(() => {
            setInsights(mockInsights);
            setHealthScore(mockScore);
            setIsLoading(false);
        }, 800);
    }, []);

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            nutrition: '🥗',
            exercise: '🏃',
            sleep: '😴',
            mental: '🧘',
            preventive: '🩺',
            medication: '💊'
        };
        return icons[category] || '💡';
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            nutrition: 'from-green-500 to-emerald-600',
            exercise: 'from-orange-500 to-red-600',
            sleep: 'from-indigo-500 to-purple-600',
            mental: 'from-pink-500 to-rose-600',
            preventive: 'from-blue-500 to-cyan-600',
            medication: 'from-amber-500 to-orange-600'
        };
        return colors[category] || 'from-slate-500 to-slate-600';
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    const handleGenerateNewInsights = async () => {
        setIsGenerating(true);
        try {
            // In production, call AI service
            await new Promise(resolve => setTimeout(resolve, 2000));
            showToast.success('New insights generated');
        } catch (e) {
            showToast.error('Failed to generate insights');
        } finally {
            setIsGenerating(false);
        }
    };

    const filteredInsights = selectedCategory
        ? insights.filter(i => i.category === selectedCategory)
        : insights;

    const categories = ['nutrition', 'exercise', 'sleep', 'mental', 'preventive', 'medication'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    🤖 AI Health Insights
                </h2>
                <button
                    onClick={handleGenerateNewInsights}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-sm rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isGenerating ? (
                        <>
                            <span className="animate-spin">⚡</span>
                            Analyzing...
                        </>
                    ) : (
                        <>
                            ✨ Refresh Insights
                        </>
                    )}
                </button>
            </div>

            {/* Health Score Overview */}
            {healthScore && (
                <div className="glass-card p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800/30">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Overall Health Score</h3>
                            <p className="text-sm text-slate-500">Based on your health data and activity</p>
                        </div>
                        <div className={`text-5xl font-black ${getScoreColor(healthScore.overall)}`}>
                            {healthScore.overall}
                            <span className="text-lg text-slate-400">/100</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                        {[
                            { key: 'nutrition', label: 'Nutrition', score: healthScore.nutrition },
                            { key: 'exercise', label: 'Exercise', score: healthScore.exercise },
                            { key: 'sleep', label: 'Sleep', score: healthScore.sleep },
                            { key: 'mentalHealth', label: 'Mental', score: healthScore.mentalHealth },
                            { key: 'preventiveCare', label: 'Preventive', score: healthScore.preventiveCare },
                        ].map(item => (
                            <div key={item.key} className="text-center">
                                <div className="relative w-16 h-16 mx-auto mb-2">
                                    <svg className="w-16 h-16 transform -rotate-90">
                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-200 dark:text-slate-700" />
                                        <circle
                                            cx="32" cy="32" r="28"
                                            stroke="currentColor" strokeWidth="4" fill="none"
                                            strokeDasharray={`${item.score * 1.76} 176`}
                                            className={getScoreColor(item.score)}
                                        />
                                    </svg>
                                    <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${getScoreColor(item.score)}`}>
                                        {item.score}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${!selectedCategory
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                >
                    All ({insights.length})
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedCategory === cat
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                    >
                        {getCategoryIcon(cat)}
                        <span className="capitalize hidden sm:inline">{cat}</span>
                    </button>
                ))}
            </div>

            {/* Insights List */}
            {isLoading ? (
                <div className="text-center py-12 text-slate-400">
                    <div className="animate-pulse text-4xl mb-2">🤖</div>
                    Analyzing your health data...
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredInsights.map(insight => (
                        <div
                            key={insight.id}
                            className="glass-card p-5 rounded-2xl border border-white/20 dark:border-slate-700/50 hover:shadow-lg transition-all"
                        >
                            <div className="flex items-start gap-4">
                                {/* Category Icon */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryColor(insight.category)} flex items-center justify-center text-xl text-white shadow-lg flex-shrink-0`}>
                                    {getCategoryIcon(insight.category)}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityStyle(insight.priority)}`}>
                                            {insight.priority}
                                        </span>
                                        <span className="text-xs text-slate-400 capitalize">{insight.category}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">{insight.title}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{insight.description}</p>

                                    <div className="flex items-center justify-between">
                                        {insight.source && (
                                            <span className="text-xs text-slate-400">📊 {insight.source}</span>
                                        )}
                                        {insight.actionable && insight.action && (
                                            <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors">
                                                {insight.action} →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* AI Disclaimer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                <p className="text-xs text-slate-500">
                    🤖 These insights are generated by AI based on your health data and should not replace professional medical advice.
                    Always consult your healthcare provider before making health decisions.
                </p>
            </div>
        </div>
    );
};

export default AIHealthInsights;

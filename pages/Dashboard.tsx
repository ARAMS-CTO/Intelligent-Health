
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GeminiService, updateCaseStatus, assignSpecialist, DataService } from '../services/api';
import { Case, Role, AIAgentStats, User, ExtractedCaseData, SymptomAnalysisResult, Comment } from '../types/index';
import { ICONS } from '../constants/index';
import CreateCaseForm from '../components/CreateCaseForm';
import EditCaseForm from '../components/EditCaseForm';
import { useAuth } from '../components/Auth';
import VoiceCaseCreationModal from '../components/VoiceCaseCreationModal';
import Breadcrumbs from '../components/Breadcrumbs';
import Modal from '../components/Modal';
import { useTranslation } from 'react-i18next';

// Helper function for relative date formatting
const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) {
        return 'just now';
    } else if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days < 7) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

const SymptomCheckerWidget: React.FC = () => {
    const [symptoms, setSymptoms] = useState('');
    const [results, setResults] = useState<SymptomAnalysisResult[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation('dashboard');

    const handleAnalyze = async () => {
        if (!symptoms.trim()) return;
        setIsLoading(true);
        try {
            const data = await GeminiService.analyzeSymptoms(symptoms);
            setResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-card rounded-[32px] p-8 antigravity-target transition-all duration-300 shadow-xl border border-white/20 dark:border-slate-700/50 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-colors"></div>

            <h3 className="font-heading font-bold text-xl text-text-main mb-6 flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-inner">
                    {ICONS.symptomCheck}
                </div>
                {t('symptomChecker.title')}
            </h3>

            <textarea
                className="w-full border-none bg-white/40 dark:bg-slate-900/40 rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none transition-all placeholder:text-slate-400 shadow-inner min-h-[120px]"
                placeholder={t('symptomChecker.placeholder')}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
            />

            <button
                onClick={handleAnalyze}
                disabled={isLoading || !symptoms.trim()}
                className="mt-6 w-full bg-gradient-to-r from-accent to-indigo-600 text-white font-bold py-4 px-6 rounded-2xl hover:shadow-2xl hover:shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex justify-center items-center gap-3 transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-accent/10"
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="font-black uppercase tracking-widest text-xs uppercase">{t('symptomChecker.analyzing')}</span>
                    </div>
                ) : (
                    <>
                        {ICONS.search}
                        <span className="font-black uppercase tracking-widest text-xs uppercase">{t('symptomChecker.analyzeButton')}</span>
                    </>
                )}
            </button>

            {results && (
                <div className="mt-8 space-y-4 animate-fade-in max-h-[400px] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 px-1">Clinical Patterns Found</p>
                    {results.map((r, i) => (
                        <div key={i} className="bg-white/60 dark:bg-slate-800/60 p-5 rounded-2xl border border-white/40 dark:border-slate-700/50 transition-all hover:shadow-xl hover:-translate-y-1 group/item">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-heading font-black text-base text-text-main group-hover/item:text-primary transition-colors">{r.condition}</span>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${r.confidence > 0.7 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                    {(r.confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full mb-4 overflow-hidden border border-slate-100 dark:border-slate-800">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${r.confidence > 0.7 ? 'bg-success' : r.confidence > 0.4 ? 'bg-warning' : 'bg-danger'}`}
                                    style={{ width: `${r.confidence * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed font-medium">{r.explanation}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Helper for trend icon
const TrendIcon = ({ value, threshold }: { value: number, threshold: number }) => {
    const isAbove = value >= threshold;

    if (isAbove) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-success" viewBox="0 0 20 20" fill="currentColor">
                <title>Above Average</title>
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-danger" viewBox="0 0 20 20" fill="currentColor">
            <title>Below Average</title>
            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
    );
};

const AIAgentCard: React.FC<{ user: User }> = ({ user }) => {
    const [stats, setStats] = useState<AIAgentStats | null>(null);
    const [unratedSuggestion, setUnratedSuggestion] = useState<any | null>(null);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState<'good' | 'bad' | null>(null);
    const [feedbackComment, setFeedbackComment] = useState('');
    const { t } = useTranslation('dashboard');

    const fetchAgentData = async () => {
        if (!user) return;
        const agentStats = await GeminiService.getAIAgentStats(user.id);
        setStats(agentStats);
        const suggestion = await GeminiService.getRecentUnratedSuggestion(user.id);
        setUnratedSuggestion(suggestion);
    };

    useEffect(() => {
        fetchAgentData();
    }, [user]);

    const handleOpenFeedbackModal = (rating: 'good' | 'bad') => {
        if (!unratedSuggestion) return;
        setFeedbackRating(rating);
        setIsFeedbackModalOpen(true);
    };

    const handleSubmitFeedback = async () => {
        if (!unratedSuggestion || !feedbackRating || isSubmittingFeedback) return;
        setIsSubmittingFeedback(true);

        await GeminiService.submitAIFeedback(
            unratedSuggestion.caseId,
            unratedSuggestion.suggestion.name,
            { rating: feedbackRating, comments: feedbackComment }
        );

        // Reset and refetch
        setIsFeedbackModalOpen(false);
        setFeedbackComment('');
        setFeedbackRating(null);
        setUnratedSuggestion(null);
        const agentStats = await GeminiService.getAIAgentStats(user.id);
        setStats(agentStats);
        setIsSubmittingFeedback(false);
    };

    if (!stats) {
        return (
            <div className="glass-card rounded-2xl p-6 flex items-center justify-center min-h-[200px] antigravity-target">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    const averageAccuracy = 0.85;
    const averagePersonalization = 0.60;

    const getAccuracyLevel = (val: number) => {
        if (val >= 0.9) return { label: 'Excellent', color: 'text-success-text dark:text-green-400', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600' };
        if (val >= 0.75) return { label: 'Good', color: 'text-warning-text dark:text-amber-400', bar: 'bg-gradient-to-r from-amber-400 to-amber-600' };
        return { label: 'Needs Work', color: 'text-danger-text dark:text-red-400', bar: 'bg-gradient-to-r from-red-400 to-red-600' };
    };

    const getPersonalizationLevel = (val: number) => {
        if (val >= 0.8) return { label: 'High', color: 'text-indigo-700 dark:text-indigo-300', bar: 'bg-gradient-to-r from-indigo-400 to-indigo-600' };
        if (val >= 0.5) return { label: 'Medium', color: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-gradient-to-r from-indigo-300 to-indigo-500' };
        return { label: 'Low', color: 'text-indigo-500 dark:text-indigo-500', bar: 'bg-gradient-to-r from-indigo-200 to-indigo-400' };
    };

    const accuracy = getAccuracyLevel(stats.accuracy);
    const personalization = getPersonalizationLevel(stats.personalizationLevel);

    return (
        <>
            <div className="rounded-[40px] shadow-2xl hover:shadow-primary/10 transition-shadow duration-500 flex flex-col bg-gradient-to-br from-white/90 to-indigo-50/90 dark:from-slate-800/90 dark:to-indigo-900/30 backdrop-blur-3xl border border-white/40 dark:border-slate-700/50 overflow-hidden antigravity-target group">
                <div className="p-8 flex-grow relative overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-all duration-700 opacity-50"></div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-heading font-black text-2xl text-text-main tracking-tight">
                                    {t('aiAgentCard.title')}
                                </h3>
                                <span className="bg-primary/20 text-primary text-[10px] uppercase font-black px-2.5 py-1 rounded-lg tracking-widest border border-primary/20 shadow-sm">Agent</span>
                            </div>
                            <p className="text-xs text-text-muted font-medium max-w-[220px] leading-relaxed opacity-70 italic">{t('aiAgentCard.description')}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-primary via-indigo-600 to-purple-600 rounded-[20px] shadow-xl shadow-primary/30 text-white transform transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500">
                            {ICONS.ai}
                        </div>
                    </div>

                    <div className="space-y-8 mb-10 relative z-10">
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('aiAgentCard.accuracy')}</span>
                                <span className={`text-xl font-heading font-black flex items-center gap-1 ${accuracy.color}`}>
                                    {(stats.accuracy * 100).toFixed(1)}%
                                    <TrendIcon value={stats.accuracy} threshold={averageAccuracy} />
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-black/20 rounded-full h-2.5 shadow-inner overflow-hidden border border-white/20 dark:border-slate-800">
                                <div
                                    className={`h-full rounded-full ${accuracy.bar} transition-all duration-1000 ease-elastic shadow-sm`}
                                    style={{ width: `${stats.accuracy * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('aiAgentCard.personalization')}</span>
                                <span className={`text-xl font-heading font-black flex items-center gap-1 ${personalization.color}`}>
                                    {(stats.personalizationLevel * 100).toFixed(0)}%
                                    <TrendIcon value={stats.personalizationLevel} threshold={averagePersonalization} />
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-black/20 rounded-full h-2.5 shadow-inner overflow-hidden border border-white/20 dark:border-slate-800">
                                <div
                                    className={`h-full rounded-full ${personalization.bar} transition-all duration-1000 ease-elastic shadow-sm`}
                                    style={{ width: `${stats.personalizationLevel * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-6 border-t border-white/20 dark:border-slate-700/30 relative z-10">
                        <div className="text-center p-4 bg-white/40 dark:bg-black/20 rounded-2xl border border-white/20 shadow-sm backdrop-blur-md">
                            <p className="font-heading font-black text-3xl text-text-main mb-1">{stats.casesAnalyzed}</p>
                            <p className="text-[9px] uppercase tracking-[0.2em] font-black text-text-muted opacity-60 px-1">{t('aiAgentCard.casesAnalyzed')}</p>
                        </div>
                        <div className="text-center p-4 bg-white/40 dark:bg-black/20 rounded-2xl border border-white/20 shadow-sm backdrop-blur-md">
                            <p className="font-heading font-black text-3xl text-text-main mb-1">{stats.feedbackProvided}</p>
                            <p className="text-[9px] uppercase tracking-[0.2em] font-black text-text-muted opacity-60 px-1">{t('aiAgentCard.feedbackProvided')}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/60 dark:bg-black/40 p-8 backdrop-blur-xl border-t border-white/20 dark:border-slate-700/50">
                    <h4 className="font-black text-[10px] text-text-muted mb-5 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(var(--color-accent),0.8)]"></span>
                        {t('aiAgentCard.reviewSuggestion')}
                    </h4>
                    {unratedSuggestion ? (
                        <div className="animate-fade-in space-y-5">
                            <p className="text-[11px] font-bold text-text-muted">
                                {t('aiAgentCard.fromCase')}: <Link to={`/case/${unratedSuggestion.caseId}`} className="text-primary hover:text-primary-hover transition-colors border-b border-primary/20 pb-0.5">{unratedSuggestion.caseTitle}</Link>
                            </p>
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-white/40 dark:border-slate-700 shadow-xl shadow-slate-200/20">
                                <p className="text-[9px] text-text-muted uppercase font-black mb-2 tracking-[0.15em] opacity-60">{t('aiAgentCard.aiSuggestedDiagnosis')}</p>
                                <p className="font-heading font-black text-text-main text-lg tracking-tight leading-tight">{unratedSuggestion.suggestion.name}</p>
                            </div>
                            <div className="text-center pt-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4 opacity-80">{t('aiAgentCard.wasHelpful')}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => handleOpenFeedbackModal('good')} disabled={isSubmittingFeedback} className="group flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-success-text hover:bg-success hover:text-white transition-all duration-500 shadow-sm transform hover:-translate-y-1">
                                        <div className="p-2 rounded-xl bg-success/10 group-hover:bg-white/20 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.758a1 1 0 00.97-1.22l-1.396-4.887A3.5 3.5 0 0010.5 6H7a1 1 0 00-1 1v3.333zM6 9V7a1 1 0 011-1h3.5a4.5 4.5 0 014.475 4.007l1.396 4.886A2 2 0 0113.758 18H7a2 2 0 01-2-2v-6.667z" /></svg>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{t('aiAgentCard.good')}</span>
                                    </button>
                                    <button onClick={() => handleOpenFeedbackModal('bad')} disabled={isSubmittingFeedback} className="group flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-danger-text hover:bg-danger hover:text-white transition-all duration-500 shadow-sm transform hover:-translate-y-1">
                                        <div className="p-2 rounded-xl bg-danger/10 group-hover:bg-white/20 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1H6.242a1 1 0 00-.97 1.22l1.396 4.887A3.5 3.5 0 009.5 14H13a1 1 0 001-1V9.667zM14 11v2a1 1 0 01-1 1H9.5a4.5 4.5 0 01-4.475-4.007l-1.396-4.886A2 2 0 016.242 2H13a2 2 0 012 2v6.667z" /></svg>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{t('aiAgentCard.bad')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 px-4 bg-primary/5 rounded-[32px] border border-dashed border-primary/20">
                            <p className="text-sm font-bold text-primary italic opacity-80">{t('aiAgentCard.allReviewed')}</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)}>
                <div className="glass p-8 rounded-[32px] shadow-2xl w-full max-w-md border border-white/20 dark:border-slate-700/50 backdrop-blur-3xl">
                    <h2 className="text-3xl font-heading font-black text-text-main mb-2 tracking-tight">AI Feedback</h2>
                    <p className="text-text-muted mb-8 border-b border-white/10 pb-5 text-sm font-medium italic">Improving results for <span className="text-primary font-bold not-italic">{unratedSuggestion?.suggestion.name}</span>.</p>
                    <div className="mb-6">
                        <label htmlFor="feedbackComment" className="block text-[10px] font-black text-text-muted mb-3 uppercase tracking-widest pl-1">Additional Observations (Optional)</label>
                        <textarea
                            id="feedbackComment"
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            rows={4}
                            className="w-full px-5 py-4 bg-white/40 dark:bg-black/20 border-none rounded-2xl shadow-inner focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-medium transition-all resize-none placeholder:text-slate-400"
                            placeholder="e.g., The diagnosis was accurate but suggested irrelevant tests..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-10">
                        <button onClick={() => setIsFeedbackModalOpen(false)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-text-muted hover:bg-white/10 transition-colors">Cancel</button>
                        <button onClick={handleSubmitFeedback} disabled={isSubmittingFeedback} className="bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 px-8 rounded-2xl hover:shadow-2xl hover:shadow-primary/20 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50">
                            {isSubmittingFeedback ? 'Processing...' : 'Submit Feedback'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

const MyDayWidget: React.FC<{ stats: { overdue: number, updates: number, assignments: number } | null }> = ({ stats }) => {
    const { t } = useTranslation('dashboard');

    const statItems = [
        { label: t('myDayWidget.overdue'), value: stats?.overdue || 0, icon: ICONS.clock, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' },
        { label: t('myDayWidget.updates'), value: stats?.updates || 0, icon: ICONS.chat, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
        { label: t('myDayWidget.assignments'), value: stats?.assignments || 0, icon: ICONS.userPlus, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' }
    ];

    return (
        <div className="glass-card rounded-[40px] p-10 antigravity-target border border-white/20 dark:border-slate-700/50 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-3xl rounded-full -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
                <h3 className="font-heading font-black text-3xl text-text-main tracking-tight">{t('myDayWidget.title')}</h3>
                <div className="px-5 py-2.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/50 shadow-sm backdrop-blur-md">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Next Sync: <span className="text-primary">14:00 PM</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
                {statItems.map((item, idx) => (
                    <div key={item.label} className="group/stat relative bg-white/40 dark:bg-slate-900/40 p-8 rounded-[32px] flex flex-col items-center text-center transition-all duration-500 hover:shadow-2xl border border-white/20 dark:border-slate-800 hover:bg-white/80 dark:hover:bg-slate-800/80 transform hover:-translate-y-2" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className={`${item.color} ${item.bg} ${item.border} p-5 rounded-[24px] mb-6 transition-all duration-500 group-hover/stat:scale-110 group-hover/stat:rotate-6 shadow-lg border backdrop-blur-sm group-hover/stat:shadow-primary/20`}>
                            {React.cloneElement(item.icon, { className: 'h-10 w-10 drop-shadow-sm' })}
                        </div>
                        <p className="text-6xl font-heading font-black text-text-main leading-none mb-3 tracking-tighter group-hover/stat:scale-105 transition-transform">{item.value}</p>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.25em] h-4">{item.label}</p>

                        {/* Hover Decoration */}
                        <div className={`absolute bottom-6 w-12 h-1 rounded-full ${item.color.replace('text-', 'bg-')} opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500`}></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TeamActivityFeed: React.FC<{ activity: Comment[] }> = ({ activity }) => {
    const { t } = useTranslation('dashboard');

    return (
        <div className="glass-card rounded-[40px] p-10 antigravity-target border border-white/20 dark:border-slate-700/50 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-heading font-black text-2xl text-text-main tracking-tight flex items-center gap-4">
                    <div className="p-3 bg-info/10 rounded-2xl text-info shadow-inner">
                        {ICONS.chat}
                    </div>
                    {t('teamActivityWidget.title')}
                </h3>
                <button className="text-[10px] font-black text-primary uppercase tracking-widest py-2 px-5 bg-primary/5 rounded-xl border border-primary/10 hover:bg-primary hover:text-white transition-all shadow-sm">View Archive</button>
            </div>

            <ul className="space-y-6">
                {activity.map((comment, idx) => (
                    <li key={comment.id} className="flex items-start gap-5 p-5 rounded-[28px] hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300 border border-transparent hover:border-white/40 dark:hover:border-slate-700/50 hover:shadow-lg animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="relative flex-shrink-0 group">
                            <div className="absolute -inset-1 bg-gradient-to-br from-primary to-indigo-600 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative w-14 h-14 rounded-[20px] bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center font-heading font-black text-lg text-slate-500 shadow-md group-hover:text-primary transition-colors border border-white dark:border-slate-600">
                                {comment.userName.charAt(0)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                            <p className="text-base text-text-main leading-normal font-medium mb-1">
                                <strong className="font-black text-text-main tracking-tight hover:text-primary transition-colors cursor-pointer">{comment.userName}</strong>
                                <span className="text-text-muted opacity-80 mx-1.5 font-normal tracking-tight italic">posted on</span>
                                <Link to={`/case/${comment.caseId}`} className="text-primary font-black decoration-primary/20 hover:decoration-primary underline underline-offset-4 decoration-2 transition-all">Case #{comment.caseId.slice(-4).toUpperCase()}</Link>
                            </p>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {formatRelativeDate(comment.timestamp)}
                                </span>
                                <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{comment.userRole}</span>
                            </div>
                        </div>
                    </li>
                ))}
                {activity.length === 0 && (
                    <div className="text-center py-20 px-10 border-4 border-dashed border-white/10 dark:border-slate-800 rounded-[40px] opacity-40">
                        <div className="text-4xl mb-4">{ICONS.chat}</div>
                        <p className="font-bold italic text-text-muted">No recent clinical activity recorded</p>
                    </div>
                )}
            </ul>
        </div>
    );
};

const CaseCard: React.FC<{
    caseData: Case & { lastCommentDate?: string; assignedSpecialist?: string; commentCount: number };
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onViewPatient: (patientId: string) => void;
    onAssignSpecialist: (caseId: string) => void;
    onStatusChange: (caseId: string, newStatus: Case['status']) => void;
}> = ({ caseData, onView, onEdit, onViewPatient, onAssignSpecialist, onStatusChange }) => {
    const [isStatusMenuOpen, setStatusMenuOpen] = useState(false);
    const statusRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation('dashboard');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-success/10 text-success border-success/20';
            case 'Under Review': return 'bg-warning/10 text-warning border-warning/20';
            case 'Closed': return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    const formatCardDate = (dateString?: string) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
                setStatusMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleStatusChange = (newStatus: Case['status']) => {
        onStatusChange(caseData.id, newStatus);
        setStatusMenuOpen(false);
    };

    return (
        <div className="glass-card rounded-[32px] flex flex-col antigravity-target transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-2 group overflow-hidden border border-white/20 dark:border-slate-700/50">
            <div className="p-8 flex-grow relative">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="font-heading font-black text-2xl text-text-main leading-tight cursor-pointer hover:text-primary transition-colors line-clamp-2 pr-4 tracking-tight" onClick={() => onView(caseData.id)} title={caseData.title}>
                        {caseData.title}
                    </h3>
                    <div className="relative shrink-0" ref={statusRef}>
                        <button
                            onClick={() => setStatusMenuOpen(!isStatusMenuOpen)}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-full flex items-center gap-2 border transition-all hover:brightness-95 active:scale-95 shadow-sm ${getStatusColor(caseData.status)}`}
                        >
                            <span>{caseData.status}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-300 ${isStatusMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                        {isStatusMenuOpen && (
                            <div className="absolute right-0 mt-3 w-48 glass-card rounded-2xl shadow-2xl z-50 animate-slide-up-fade-in border border-white/40 dark:border-slate-700/50 overflow-hidden backdrop-blur-3xl">
                                <div className="py-2">
                                    {(['Open', 'Under Review', 'Closed'] as const).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(status)}
                                            disabled={caseData.status === status}
                                            className="block w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-text-main hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-sm text-text-muted mb-8 line-clamp-3 leading-relaxed font-medium opacity-80">{caseData.complaint}</p>

                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted mb-6 bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-white/20 dark:border-slate-800 shadow-inner">
                    <div className="flex items-center gap-2 text-text-main">
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">{ICONS.user}</div>
                        <span>{caseData.patientProfile.age}Y • {caseData.patientProfile.sex}</span>
                    </div>
                    {caseData.patientProfile.comorbidities.length > 0 && (
                        <>
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                            <div className="truncate flex-1 italic text-[9px] lowercase font-bold" title={caseData.patientProfile.comorbidities.join(', ')}>
                                {caseData.patientProfile.comorbidities[0]}{caseData.patientProfile.comorbidities.length > 1 ? ` & ${caseData.patientProfile.comorbidities.length - 1} others` : ''}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                    {caseData.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700 shadow-sm px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg text-text-muted">{tag}</span>
                    ))}
                    {caseData.tags.length > 3 && (
                        <span className="text-[10px] font-black text-text-muted/40 py-1 ml-1 self-center">+{caseData.tags.length - 3}</span>
                    )}
                </div>
            </div>

            <div className="px-8 py-5 border-t border-white/10 dark:border-slate-700/30 bg-white/20 dark:bg-black/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                <div className="flex items-center gap-3">
                    {caseData.assignedSpecialist ? (
                        <>
                            <div className="p-1.5 bg-accent/10 rounded-lg text-accent">{ICONS.specialist}</div>
                            <span className="text-text-main font-black truncate max-w-[120px]">{caseData.assignedSpecialist}</span>
                        </>
                    ) : (
                        <button onClick={() => onAssignSpecialist(caseData.id)} className="flex items-center gap-2 text-primary hover:text-primary-hover transition-colors group/assign">
                            <div className="p-1.5 bg-primary/10 rounded-lg group-hover/assign:bg-primary transition-colors group-hover/assign:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <span>Assign</span>
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {caseData.lastCommentDate ? (
                        <>
                            <div className="opacity-40">{ICONS.clock}</div>
                            <span>{formatCardDate(caseData.lastCommentDate)}</span>
                        </>
                    ) : <span className="opacity-30 italic lowercase font-bold">no activity</span>}
                </div>
            </div>

            <div className="p-4 grid grid-cols-4 gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-t border-white/20 dark:border-slate-800">
                <button onClick={() => onView(caseData.id)} className="col-span-2 flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl hover:shadow-2xl hover:shadow-primary/20 transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-primary/10">
                    {t('caseCard.viewCase')}
                </button>
                <button onClick={() => onViewPatient(caseData.patientId)} className="col-span-1 flex items-center justify-center p-2 text-text-main bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700 rounded-2xl hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg transition-all" title={t('caseCard.viewPatientProfile')}>
                    {ICONS.user}
                </button>
                <button onClick={() => onEdit(caseData.id)} className="col-span-1 flex items-center justify-center p-2 text-text-main bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700 rounded-2xl hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg transition-all" title={t('caseCard.editCase')}>
                    {ICONS.edit}
                </button>
            </div>
        </div>
    );
};

const TokenBalanceWidget: React.FC = () => {
    const [balance, setBalance] = useState({ balance: 0, total_earned: 0 });
    const { t } = useTranslation('dashboard');

    useEffect(() => {
        DataService.getTokenBalance().then(setBalance).catch(console.error);
    }, []);

    return (
        <div className="glass-card rounded-[32px] p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border border-white/20 dark:border-slate-700/50">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full group-hover:bg-purple-500/20 transition-colors"></div>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-heading font-bold text-xl text-text-main flex items-center gap-2">
                        <span className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">{ICONS.money}</span>
                        ARAMS Wallet
                    </h3>
                    <p className="text-xs text-text-muted mt-1 ml-1">Research Incentives</p>
                </div>
                <Link to="/research-community" className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
                    View Ecosystem &rarr;
                </Link>
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <span className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Current Balance</span>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
                        {balance.balance.toFixed(2)} <span className="text-sm font-medium text-slate-400">Tokens</span>
                    </div>
                </div>
                <div className="flex justify-between items-center text-sm px-2">
                    <span className="text-text-muted">Lifetime Earned:</span>
                    <span className="font-bold text-green-600">+{balance.total_earned.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const [cases, setCases] = useState<Case[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [allComments, setAllComments] = useState<Comment[]>([]);
    const [dashboardStats, setDashboardStats] = useState<{ overdue: number, updates: number, assignments: number } | null>(null);
    const [recentActivity, setRecentActivity] = useState<Comment[]>([]);

    const [isLoadingCases, setIsLoadingCases] = useState(true);
    const [isCreateCaseModalOpen, setCreateCaseModalOpen] = useState(false);
    const caseStatuses: ('Open' | 'Under Review' | 'Closed')[] = ['Open', 'Under Review', 'Closed'];
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'specialist-asc'>('date-desc');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation('dashboard');

    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [editingCase, setEditingCase] = useState<Case | null>(null);

    const [isAssignSpecialistModalOpen, setAssignSpecialistModalOpen] = useState(false);
    const [selectedCaseIdForAssignment, setSelectedCaseIdForAssignment] = useState<string | null>(null);

    const [isVoiceCreateModalOpen, setVoiceCreateModalOpen] = useState(false);
    const [prefilledCaseData, setPrefilledCaseData] = useState<Partial<Case> | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoadingCases(true);
            try {
                const [fetchedCases, fetchedUsers, fetchedComments, stats, activity] = await Promise.all([
                    DataService.getCases(),
                    DataService.getUsers(),
                    DataService.getAllComments(),
                    user ? DataService.getDashboardStats(user.id) : Promise.resolve(null),
                    DataService.getRecentActivity()
                ]);

                setCases(fetchedCases);
                setUsers(fetchedUsers);
                setAllComments(fetchedComments);
                setDashboardStats(stats);
                setRecentActivity(activity);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoadingCases(false);
            }
        };
        loadData();
    }, [user]);

    const handleViewCase = (id: string) => navigate(`/case/${id}`);
    const handleViewPatientProfile = (patientId: string) => navigate(`/patient/${patientId}`);

    const handleCaseSubmit = async (caseData: Omit<Case, 'id' | 'creatorId' | 'createdAt' | 'files' | 'status'>) => {
        if (!user) return;
        try {
            const newCase = await DataService.createCase({
                ...caseData,
                creatorId: user.id
            });
            setCases(prevCases => [newCase, ...prevCases]);
            setCreateCaseModalOpen(false);
            setPrefilledCaseData(null);
        } catch (error) {
            console.error("Error creating case:", error);
        }
    };

    const handleProceedToForm = (data: ExtractedCaseData) => {
        const prefilled: Partial<Case> = {
            patientId: data.patientId || '',
            complaint: data.complaint || '',
            history: data.history || '',
            findings: data.findings || '',
            diagnosis: data.diagnosis || '',
            patientProfile: {
                age: data.patient_age || 0,
                sex: data.patient_sex || 'Male',
                comorbidities: []
            }
        };
        setPrefilledCaseData(prefilled);
        setVoiceCreateModalOpen(false);
        setCreateCaseModalOpen(true);
    };


    const handleOpenEditModal = (caseId: string) => {
        const caseToEdit = cases.find(c => c.id === caseId);
        if (caseToEdit) {
            setEditingCase(caseToEdit);
            setEditModalOpen(true);
        }
    };

    const handleOpenAssignSpecialistModal = (caseId: string) => {
        setSelectedCaseIdForAssignment(caseId);
        setAssignSpecialistModalOpen(true);
    };

    const handleAssignSpecialist = async (specialistId: string) => {
        if (!selectedCaseIdForAssignment) return;
        await assignSpecialist(selectedCaseIdForAssignment, specialistId);
        // Refetch cases to show update (or optimistically update)
        setCases(prev => prev.map(c => c.id === selectedCaseIdForAssignment ? { ...c, specialistId, status: 'Under Review' } : c));
        setAssignSpecialistModalOpen(false);
        setSelectedCaseIdForAssignment(null);
    };

    const handleStatusChange = async (caseId: string, newStatus: Case['status']) => {
        await updateCaseStatus(caseId, newStatus);
        setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
    };

    const handleUpdateCase = async (updatedData: Partial<Case>) => {
        if (!editingCase) return;
        try {
            await DataService.updateCase(editingCase.id, updatedData);
            setCases(prevCases => prevCases.map(c => c.id === editingCase.id ? { ...c, ...updatedData } : c));
            setEditModalOpen(false);
            setEditingCase(null);
        } catch (error) {
            console.error("Failed to update case:", error);
        }
    };

    const processedCases = useMemo(() => {
        const enhancedCases = cases.map(caseData => {
            const commentsForCase = allComments.filter(c => c.caseId === caseData.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const lastComment = commentsForCase[0];
            const assignedSpecialistUser = users.find(u => u.id === caseData.specialistId);
            const lastSpecialistComment = commentsForCase.find(c => c.userRole === Role.Specialist);

            return {
                ...caseData,
                lastCommentDate: lastComment?.timestamp,
                assignedSpecialist: assignedSpecialistUser?.name || lastSpecialistComment?.userName,
                commentCount: commentsForCase.length,
            };
        });

        return enhancedCases
            .filter(caseData => {
                if (filterStatus !== 'All' && caseData.status !== filterStatus) return false;
                const query = searchQuery.toLowerCase().trim();
                if (!query) return true;
                return caseData.title.toLowerCase().includes(query) || caseData.complaint.toLowerCase().includes(query) || caseData.tags.some(tag => tag.toLowerCase().includes(query));
            })
            .sort((a, b) => {
                switch (sortOption) {
                    case 'date-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    case 'title-asc': return a.title.localeCompare(b.title);
                    case 'specialist-asc':
                        if (a.assignedSpecialist && b.assignedSpecialist) return a.assignedSpecialist.localeCompare(b.assignedSpecialist);
                        if (a.assignedSpecialist) return -1;
                        if (b.assignedSpecialist) return 1;
                        return 0;
                    case 'date-desc': default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
            });
    }, [cases, filterStatus, searchQuery, sortOption, allComments, users]);

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen">
            <div className="container mx-auto p-4 sm:p-8 lg:p-12">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
                    <div>
                        <Breadcrumbs items={[{ label: t('pageTitle') }]} />
                        <h1 className="text-5xl font-heading font-black text-text-main tracking-tighter mt-4">
                            Clinical <span className="text-primary">Intelligence</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <button onClick={() => navigate('/patient-intake')} className="group flex items-center gap-3 bg-white dark:bg-slate-800 text-text-main font-black text-[10px] uppercase tracking-widest py-4 px-8 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 transform hover:-translate-y-1">
                            <span className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">{ICONS.userPlus}</span>
                            <span>{t('newPatientIntake')}</span>
                        </button>
                        <button onClick={() => setVoiceCreateModalOpen(true)} className="group flex items-center gap-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest py-4 px-8 rounded-2xl hover:shadow-2xl hover:shadow-primary/30 transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-primary/20">
                            <span className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/40 transition-colors uppercase">{ICONS.createCaseVoice}</span>
                            <span>{t('createCaseVoice')}</span>
                        </button>
                        <button onClick={() => setCreateCaseModalOpen(true)} className="group flex items-center gap-3 bg-accent text-white font-black text-[10px] uppercase tracking-widest py-4 px-8 rounded-2xl hover:shadow-2xl hover:shadow-accent/30 transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-accent/20">
                            <span className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/40 transition-colors">{ICONS.plus}</span>
                            <span>{t('createNewCase')}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <div className="lg:col-span-3 space-y-12">
                        <MyDayWidget stats={dashboardStats} />

                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40 dark:bg-slate-900/40 p-4 rounded-[32px] border border-white dark:border-slate-800 backdrop-blur-xl shadow-2xl sticky top-8 z-40 outline outline-4 outline-white/20">
                                <div className="relative flex-grow w-full md:w-auto">
                                    <input
                                        type="text"
                                        placeholder={t('searchPlaceholder')}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-14 pr-6 py-4 border-none bg-white/60 dark:bg-slate-800/60 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-bold transition-all shadow-inner placeholder:text-text-muted/40 tracking-tight"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-primary">
                                        <svg className="h-6 w-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                        </div>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="bg-white/60 dark:bg-slate-800/60 rounded-[20px] border-none shadow-sm focus:ring-4 focus:ring-primary/10 py-4 pl-11 pr-12 text-[10px] font-black uppercase tracking-widest text-text-main cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all appearance-none"
                                        >
                                            <option value="All">All Clusters</option>
                                            {caseStatuses.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                                        </div>
                                        <select
                                            id="sort-order"
                                            value={sortOption}
                                            onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                                            className="bg-white/60 dark:bg-slate-800/60 rounded-[20px] border-none shadow-sm focus:ring-4 focus:ring-primary/10 py-4 pl-11 pr-12 text-[10px] font-black uppercase tracking-widest text-text-main cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all appearance-none"
                                        >
                                            <option value="date-desc">Newest First</option>
                                            <option value="date-asc">Oldest First</option>
                                            <option value="title-asc">A-Z Title</option>
                                            <option value="specialist-asc">Specialist</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {isLoadingCases ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} className="glass-card rounded-[32px] h-[400px] animate-pulse bg-white/20 dark:bg-slate-800/20"></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
                                    {processedCases.map(caseData => (
                                        <CaseCard
                                            key={caseData.id}
                                            caseData={caseData}
                                            onView={handleViewCase}
                                            onEdit={handleOpenEditModal}
                                            onViewPatient={handleViewPatientProfile}
                                            onAssignSpecialist={handleOpenAssignSpecialistModal}
                                            onStatusChange={handleStatusChange}
                                        />
                                    ))}
                                    {processedCases.length === 0 && (
                                        <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white/20 dark:bg-slate-900/20 rounded-[40px] border-4 border-dashed border-white dark:border-slate-800 opacity-50">
                                            <div className="text-6xl mb-6 grayscale opacity-30">{ICONS.search}</div>
                                            <p className="text-xl font-heading font-black text-text-muted">No matching medical cases found</p>
                                            <button onClick={() => { setSearchQuery(''); setFilterStatus('All'); }} className="mt-6 text-primary font-black uppercase tracking-widest text-xs border-b-2 border-primary/20 hover:border-primary transition-all pb-1">Reset Filters</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <TeamActivityFeed activity={recentActivity} />
                    </div>

                    <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-8 self-start">
                        {user && <AIAgentCard user={user} />}
                        <SymptomCheckerWidget />
                        <TokenBalanceWidget />

                        <div className="glass-card rounded-[32px] p-8 border border-white/20 dark:border-slate-700/50 relative overflow-hidden group">
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-accent/5 blur-3xl rounded-full group-hover:bg-accent/10 transition-all"></div>
                            <h4 className="font-heading font-black text-lg text-text-main mb-4 flex items-center gap-3">
                                <span className="p-2 bg-accent/10 rounded-xl text-accent">{ICONS.clock}</span>
                                Upcoming Rounds
                            </h4>
                            <div className="space-y-4">
                                {[
                                    { time: '14:30', title: 'Cardiology Review', team: 'Blue' },
                                    { time: '16:00', title: 'Neurology Sync', team: 'Gold' }
                                ].map((round, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/20">
                                        <div className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg">{round.time}</div>
                                        <div>
                                            <p className="text-xs font-black text-text-main">{round.title}</p>
                                            <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Team {round.team}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isCreateCaseModalOpen} onClose={() => { setCreateCaseModalOpen(false); setPrefilledCaseData(null); }}>
                <div className="glass-card p-10 rounded-[40px] shadow-2xl w-full max-w-4xl border border-white/40 dark:border-slate-700 max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-8">
                        <div>
                            <h2 className="text-4xl font-heading font-black text-text-main tracking-tighter">Initialize Case</h2>
                            <p className="text-text-muted font-medium italic text-sm mt-1">Populate clinical records and metadata.</p>
                        </div>
                        <button onClick={() => { setCreateCaseModalOpen(false); setPrefilledCaseData(null); }} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <CreateCaseForm onSubmit={handleCaseSubmit} onCancel={() => { setCreateCaseModalOpen(false); setPrefilledCaseData(null); }} initialData={prefilledCaseData || undefined} />
                </div>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => { setEditModalOpen(false); setEditingCase(null); }}>
                <div className="glass-card p-10 rounded-[40px] shadow-2xl w-full max-w-4xl border border-white/40 dark:border-slate-700 max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-8">
                        <div>
                            <h2 className="text-4xl font-heading font-black text-text-main tracking-tighter">Refine Clinical Data</h2>
                            <p className="text-text-muted font-medium italic text-sm mt-1">Update case #{(editingCase?.id || '').slice(-4).toUpperCase()}</p>
                        </div>
                        <button onClick={() => { setEditModalOpen(false); setEditingCase(null); }} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {editingCase && (
                        <EditCaseForm
                            initialData={editingCase}
                            onSubmit={handleUpdateCase}
                            onCancel={() => { setEditModalOpen(false); setEditingCase(null); }}
                        />
                    )}
                </div>
            </Modal>

            <Modal isOpen={isAssignSpecialistModalOpen} onClose={() => { setAssignSpecialistModalOpen(false); setSelectedCaseIdForAssignment(null); }}>
                <div className="glass-card p-10 rounded-[40px] shadow-2xl w-full max-w-lg border border-white/40 dark:border-slate-700">
                    <h2 className="text-3xl font-heading font-black text-text-main mb-4 tracking-tighter">Clinical Assignment</h2>
                    <p className="text-text-muted mb-10 text-sm font-medium italic border-b border-white/10 pb-6">Delegate case management to a specialist.</p>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {users.filter(u => u.role === Role.Specialist).map(specialist => (
                            <button
                                key={specialist.id}
                                onClick={() => handleAssignSpecialist(specialist.id)}
                                className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/20 hover:border-primary hover:bg-white dark:hover:bg-slate-800 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-heading font-black text-primary text-xl group-hover:bg-primary group-hover:text-white transition-all">
                                        {specialist.name.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-text-main text-base">{specialist.name}</p>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{specialist.role}</p>
                                    </div>
                                </div>
                                <div className="p-2 text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>

            <VoiceCaseCreationModal
                isOpen={isVoiceCreateModalOpen}
                onClose={() => setVoiceCreateModalOpen(false)}
                onProceed={handleProceedToForm}
            />
        </div>
    );
};

export default Dashboard;

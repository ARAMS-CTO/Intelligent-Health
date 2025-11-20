
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
        <div className="bg-surface rounded-lg shadow-md p-5 border border-slate-200 dark:border-slate-700 antigravity-target">
            <h3 className="font-bold text-lg text-text-main mb-3 flex items-center gap-2">
                <span className="text-primary">{ICONS.symptomCheck}</span> {t('symptomChecker.title')}
            </h3>
            <textarea
                className="w-full border dark:border-slate-600 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none transition-colors"
                rows={3}
                placeholder={t('symptomChecker.placeholder')}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
            />
            <button
                onClick={handleAnalyze}
                disabled={isLoading || !symptoms.trim()}
                className="mt-3 w-full bg-accent text-white text-sm font-bold py-2 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 flex justify-center items-center gap-2 shadow-sm"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        {t('symptomChecker.analyzing')}
                    </>
                ) : t('symptomChecker.analyzeButton')}
            </button>
            
            {results && (
                <div className="mt-4 space-y-3 animate-fade-in max-h-[300px] overflow-y-auto pr-1">
                    {results.map((r, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="font-bold text-sm text-text-main">{r.condition}</span>
                                <span className="text-xs font-bold text-primary bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{(r.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mb-2">
                                <div 
                                    className={`h-1.5 rounded-full transition-all duration-1000 ${r.confidence > 0.7 ? 'bg-success' : r.confidence > 0.4 ? 'bg-warning' : 'bg-danger'}`} 
                                    style={{ width: `${r.confidence * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">{r.explanation}</p>
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
            <div className="bg-surface rounded-lg shadow-md p-5 flex items-center justify-center min-h-[200px] antigravity-target">
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
        if (val >= 0.9) return { label: 'Excellent', color: 'text-success-text dark:text-green-400', bar: 'bg-success' };
        if (val >= 0.75) return { label: 'Good', color: 'text-warning-text dark:text-amber-400', bar: 'bg-warning' };
        return { label: 'Needs Work', color: 'text-danger-text dark:text-red-400', bar: 'bg-danger' };
    };

    const getPersonalizationLevel = (val: number) => {
        if (val >= 0.8) return { label: 'High', color: 'text-indigo-700 dark:text-indigo-300', bar: 'bg-indigo-600' };
        if (val >= 0.5) return { label: 'Medium', color: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500' };
        return { label: 'Low', color: 'text-indigo-500 dark:text-indigo-500', bar: 'bg-indigo-400' };
    };

    const accuracy = getAccuracyLevel(stats.accuracy);
    const personalization = getPersonalizationLevel(stats.personalizationLevel);

    return (
        <>
            <div className="rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-slate-800 dark:to-indigo-900/50 border-t-4 border-primary overflow-hidden antigravity-target">
                <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-text-main">{t('aiAgentCard.title')}</h3>
                            <p className="text-xs text-text-muted mt-1 max-w-[200px]">{t('aiAgentCard.description')}</p>
                        </div>
                        <span className="text-primary p-2 bg-white/50 dark:bg-slate-700/50 rounded-full shadow-sm">{ICONS.ai}</span>
                    </div>
                    
                    {/* Stats Progress Bars */}
                    <div className="space-y-6 mb-6">
                        {/* Accuracy */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-semibold text-text-muted">{t('aiAgentCard.accuracy')}</span>
                                <div className="text-right">
                                    <span className={`text-sm font-bold ${accuracy.color} flex items-center justify-end`}>
                                        {(stats.accuracy * 100).toFixed(1)}%
                                        <TrendIcon value={stats.accuracy} threshold={averageAccuracy} />
                                    </span>
                                    <p className={`text-[10px] font-medium uppercase tracking-wide ${accuracy.color}`}>{accuracy.label}</p>
                                </div>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 shadow-inner overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${accuracy.bar} transition-all duration-1000 ease-out`} 
                                    style={{ width: `${stats.accuracy * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        
                        {/* Personalization */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-semibold text-text-muted">{t('aiAgentCard.personalization')}</span>
                                <div className="text-right">
                                    <span className={`text-sm font-bold ${personalization.color} flex items-center justify-end`}>
                                        {(stats.personalizationLevel * 100).toFixed(0)}%
                                        <TrendIcon value={stats.personalizationLevel} threshold={averagePersonalization} />
                                    </span>
                                    <p className={`text-[10px] font-medium uppercase tracking-wide ${personalization.color}`}>{personalization.label}</p>
                                </div>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 shadow-inner overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${personalization.bar} transition-all duration-1000 ease-out`} 
                                    style={{ width: `${stats.personalizationLevel * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-200/60 dark:border-slate-700">
                         <div className="text-center">
                            <p className="font-bold text-2xl text-text-main">{stats.casesAnalyzed}</p>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{t('aiAgentCard.casesAnalyzed')}</p>
                        </div>
                         <div className="text-center border-l border-slate-200/60 dark:border-slate-700">
                            <p className="font-bold text-2xl text-text-main">{stats.feedbackProvided}</p>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">{t('aiAgentCard.feedbackProvided')}</p>
                        </div>
                    </div>
                </div>
                
                {/* Review Section */}
                <div className="bg-white/60 dark:bg-slate-900/60 p-5 border-t border-slate-100 dark:border-slate-700 backdrop-blur-sm">
                    <h4 className="font-bold text-sm text-text-main mb-3 uppercase tracking-wide flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                        {t('aiAgentCard.reviewSuggestion')}
                    </h4>
                    {unratedSuggestion ? (
                        <div className="animate-fade-in">
                            <p className="text-xs text-text-muted mb-2 truncate">
                                {t('aiAgentCard.fromCase')}: <Link to={`/case/${unratedSuggestion.caseId}`} className="text-primary font-semibold hover:underline">{unratedSuggestion.caseTitle}</Link>
                            </p>
                            <div className="bg-surface p-3 rounded-lg border dark:border-slate-600 shadow-sm mb-3">
                                <p className="text-xs text-text-muted uppercase font-semibold mb-1">{t('aiAgentCard.aiSuggestedDiagnosis')}</p>
                                <p className="font-bold text-text-main text-sm">{unratedSuggestion.suggestion.name}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-text-muted mb-2">{t('aiAgentCard.wasHelpful')}</p>
                                <div className="flex justify-center gap-3">
                                    <button onClick={() => handleOpenFeedbackModal('good')} disabled={isSubmittingFeedback} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase rounded-full bg-success-light text-success-text border border-success/20 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/50 transition disabled:opacity-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.758a1 1 0 00.97-1.22l-1.396-4.887A3.5 3.5 0 0010.5 6H7a1 1 0 00-1 1v3.333zM6 9V7a1 1 0 011-1h3.5a4.5 4.5 0 014.475 4.007l1.396 4.886A2 2 0 0113.758 18H7a2 2 0 01-2-2v-6.667z" /></svg>
                                        {t('aiAgentCard.good')}
                                    </button>
                                    <button onClick={() => handleOpenFeedbackModal('bad')} disabled={isSubmittingFeedback} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase rounded-full bg-danger-light text-danger-text border border-danger/20 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/50 transition disabled:opacity-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1H6.242a1 1 0 00-.97 1.22l1.396 4.887A3.5 3.5 0 009.5 14H13a1 1 0 001-1V9.667zM14 11v2a1 1 0 01-1 1H9.5a4.5 4.5 0 01-4.475-4.007l-1.396-4.886A2 2 0 016.242 2H13a2 2 0 012 2v6.667z" /></svg>
                                        {t('aiAgentCard.bad')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : <p className="text-sm text-text-muted text-center italic py-2">{t('aiAgentCard.allReviewed')}</p>}
                </div>
            </div>
            
            <Modal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)}>
                <div className="bg-surface p-8 rounded-lg shadow-xl w-full max-w-md">
                    <h2 className="text-2xl font-bold text-text-main mb-2">Provide Detailed Feedback</h2>
                    <p className="text-text-muted mb-6 border-b pb-4 dark:border-slate-700">Rating suggestion for <span className="font-semibold">{unratedSuggestion?.suggestion.name}</span> as <span className={`font-bold ${feedbackRating === 'good' ? 'text-success-text dark:text-green-300' : 'text-danger-text dark:text-red-300'}`}>{feedbackRating}</span>.</p>
                    <div className="mb-4">
                        <label htmlFor="feedbackComment" className="block text-sm font-medium text-text-muted">Additional Comments (Optional)</label>
                        <textarea
                            id="feedbackComment"
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            rows={4}
                            className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 dark:bg-slate-800 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            placeholder="e.g., This was helpful because..."
                        />
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                         <button onClick={() => setIsFeedbackModalOpen(false)} className="bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 font-bold py-2 px-4 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition duration-300">Cancel</button>
                        <button onClick={handleSubmitFeedback} disabled={isSubmittingFeedback} className="bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-accent-hover transition duration-300">
                            {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
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
        { label: t('myDayWidget.overdue'), value: stats?.overdue || 0, icon: ICONS.clock, color: 'text-danger' },
        { label: t('myDayWidget.updates'), value: stats?.updates || 0, icon: ICONS.chat, color: 'text-info' },
        { label: t('myDayWidget.assignments'), value: stats?.assignments || 0, icon: ICONS.userPlus, color: 'text-accent' }
    ];

    return (
        <div className="bg-surface rounded-lg shadow-md p-5 antigravity-target">
            <h3 className="font-bold text-lg text-text-main mb-4">{t('myDayWidget.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                {statItems.map(item => (
                    <div key={item.label} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4">
                        <div className={`${item.color}`}>
                            {React.cloneElement(item.icon, { className: 'h-8 w-8' })}
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-text-main">{item.value}</p>
                            <p className="text-sm text-text-muted">{item.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const TeamActivityFeed: React.FC<{ activity: Comment[] }> = ({ activity }) => {
    const { t } = useTranslation('dashboard');
    
    return (
        <div className="bg-surface rounded-lg shadow-md p-5 antigravity-target">
            <h3 className="font-bold text-lg text-text-main mb-3">{t('teamActivityWidget.title')}</h3>
            <ul className="space-y-4">
                {activity.map(comment => (
                    <li key={comment.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-text-main flex-shrink-0">
                            {comment.userName.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-text-main">
                                <strong className="font-semibold">{comment.userName}</strong> commented on <Link to={`/case/${comment.caseId}`} className="text-primary font-semibold hover:underline">Case</Link>
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">{formatRelativeDate(comment.timestamp)}</p>
                        </div>
                    </li>
                ))}
                {activity.length === 0 && <p className="text-text-muted text-sm">No recent activity.</p>}
            </ul>
        </div>
    );
};

const CaseCard: React.FC<{ caseData: Case & { lastCommentDate?: string; assignedSpecialist?: string; commentCount: number }; onView: (id: string) => void; onEdit: (id: string) => void; onViewPatient: (patientId: string) => void; onAssignSpecialist: (caseId: string) => void; onStatusChange: (caseId: string, newStatus: Case['status']) => void; }> = ({ caseData, onView, onEdit, onViewPatient, onAssignSpecialist, onStatusChange }) => {
  const [isStatusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('dashboard');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-success-light text-success-text dark:bg-green-900/50 dark:text-green-300';
      case 'Under Review': return 'bg-warning-light text-warning-text dark:bg-amber-900/50 dark:text-amber-300';
      case 'Closed': return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
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
    <div className="bg-surface rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col border border-slate-200 dark:border-slate-700 antigravity-target">
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-text-main mb-2">{caseData.title}</h3>
          <div className="relative" ref={statusRef}>
            <button
                onClick={() => setStatusMenuOpen(!isStatusMenuOpen)}
                className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 transition-transform transform hover:scale-105 ${getStatusColor(caseData.status)}`}
            >
                <span>{caseData.status}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isStatusMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-surface rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 animate-fade-in">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {(['Open', 'Under Review', 'Closed'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                disabled={caseData.status === status}
                                className="block w-full text-left px-4 py-2 text-sm text-text-main hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                                role="menuitem"
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>
        <p className="text-sm text-text-muted mb-4 line-clamp-2">{caseData.complaint}</p>
        <div className="text-xs text-text-muted mb-4">
          <p><strong>{t('caseCard.patient')}:</strong> {caseData.patientProfile.age}y/o {caseData.patientProfile.sex}</p>
          <p><strong>{t('caseCard.comorbidities')}:</strong> {caseData.patientProfile.comorbidities.join(', ')}</p>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {caseData.tags.slice(0, 4).map(tag => (
            <span key={tag} className="bg-slate-200 dark:bg-slate-700 px-2 py-1 text-xs rounded-md text-text-muted">{tag}</span>
          ))}
        </div>
      </div>
      <div className="px-5 py-3 border-t dark:border-slate-700 grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-text-muted">
         <div className="flex items-center gap-1.5" title="Assigned Specialist">
            {caseData.assignedSpecialist ? (
                <>
                    {ICONS.specialist}
                    <span className="font-medium text-text-main truncate">{caseData.assignedSpecialist}</span>
                </>
            ) : (
              <button onClick={() => onAssignSpecialist(caseData.id)} className="flex items-center gap-1 text-primary hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                <span>{t('caseCard.assign')}</span>
              </button>
            )}
        </div>
         <div className="flex items-center gap-1.5" title={t('caseCard.lastActivity')}>
             {caseData.lastCommentDate ? (
                <>
                    {ICONS.clock}
                    <span>{formatCardDate(caseData.lastCommentDate)}</span>
                </>
             ) : <span>No Activity</span>}
        </div>
        <div className="flex items-center gap-1.5" title={t('caseCard.totalComments')}>
            {ICONS.chat}
            <span>{caseData.commentCount}</span>
        </div>
      </div>
      <div className="bg-slate-100 dark:bg-slate-800/50 px-5 py-3 flex items-center gap-2">
        <button onClick={() => onView(caseData.id)} className="flex-grow text-center bg-primary text-white font-semibold py-2 rounded-md hover:bg-primary-hover transition duration-300">
          {t('caseCard.viewCase')}
        </button>
        <button onClick={() => onViewPatient(caseData.patientId)} className="p-2 text-center bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition duration-300" title={t('caseCard.viewPatientProfile')}>
            {ICONS.user}
        </button>
        <button onClick={() => onEdit(caseData.id)} className="p-2 text-center bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition duration-300" title={t('caseCard.editCase')}>
            {ICONS.edit}
        </button>
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
      setCases(prev => prev.map(c => c.id === selectedCaseIdForAssignment ? {...c, specialistId, status: 'Under Review'} : c));
      setAssignSpecialistModalOpen(false);
      setSelectedCaseIdForAssignment(null);
  };

  const handleStatusChange = async (caseId: string, newStatus: Case['status']) => {
    await updateCaseStatus(caseId, newStatus);
    setCases(prev => prev.map(c => c.id === caseId ? {...c, status: newStatus} : c));
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
    <div className="bg-background min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <Breadcrumbs items={[{ label: t('pageTitle') }]} />
            <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => navigate('/patient-intake')} className="flex items-center gap-2 bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 transition duration-300">
                    {ICONS.userPlus} <span>{t('newPatientIntake')}</span>
                </button>
                <button onClick={() => setVoiceCreateModalOpen(true)} className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary-hover transition duration-300">
                    {ICONS.createCaseVoice} <span>{t('createCaseVoice')}</span>
                </button>
                <button onClick={() => setCreateCaseModalOpen(true)} className="flex items-center gap-2 bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-accent-hover transition duration-300">
                    {ICONS.plus} {t('createNewCase')}
                </button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
                 <MyDayWidget stats={dashboardStats} />
                 <TeamActivityFeed activity={recentActivity} />
                <div className="bg-surface p-4 rounded-lg shadow-md sticky top-[65px] z-40 flex flex-wrap items-center gap-x-6 gap-y-4">
                    <div className="relative flex-grow">
                        <input type="text" placeholder={t('searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-inherit" />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-text-muted text-sm shrink-0">{t('statusFilter')}</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-surface rounded-full border-gray-300 dark:bg-slate-800 dark:border-slate-600 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 py-2 pl-4 pr-8 text-sm"
                        >
                            <option value="All">{t('filterAll', 'All Statuses')}</option>
                            {caseStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <select id="sort-order" value={sortOption} onChange={(e) => setSortOption(e.target.value as typeof sortOption)} className="bg-surface rounded-full border-gray-300 dark:bg-slate-800 dark:border-slate-600 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50">
                        <option value="date-desc">{t('sort.newest')}</option>
                        <option value="date-asc">{t('sort.oldest')}</option>
                        <option value="title-asc">{t('sort.title')}</option>
                        <option value="specialist-asc">{t('sort.specialist')}</option>
                    </select>
                </div>
                
                {isLoadingCases ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                         {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="bg-surface rounded-lg shadow-md p-5 border border-slate-200 dark:border-slate-700 h-64 animate-pulse">
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 mb-4"></div>
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                            </div>
                         ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {processedCases.map(caseData => (
                            <CaseCard key={caseData.id} caseData={caseData} onView={handleViewCase} onEdit={handleOpenEditModal} onViewPatient={handleViewPatientProfile} onAssignSpecialist={handleOpenAssignSpecialistModal} onStatusChange={handleStatusChange} />
                        ))}
                        {processedCases.length === 0 && (
                             <div className="col-span-full text-center py-10 text-text-muted">
                                No cases found matching your filters.
                             </div>
                        )}
                    </div>
                )}
            </div>
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                {user && <AIAgentCard user={user} />}
                <SymptomCheckerWidget />
            </div>
        </div>
      </div>

       <Modal isOpen={isCreateCaseModalOpen} onClose={() => { setCreateCaseModalOpen(false); setPrefilledCaseData(null); }}>
        <CreateCaseForm 
            onSubmit={handleCaseSubmit} 
            onCancel={() => { setCreateCaseModalOpen(false); setPrefilledCaseData(null); }}
            initialData={prefilledCaseData}
        />
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
        {editingCase && (<EditCaseForm initialData={editingCase} onSubmit={handleUpdateCase} onCancel={() => setEditModalOpen(false)} />)}
      </Modal>
      
      <VoiceCaseCreationModal
        isOpen={isVoiceCreateModalOpen}
        onClose={() => setVoiceCreateModalOpen(false)}
        onProceed={handleProceedToForm}
      />

      <Modal isOpen={isAssignSpecialistModalOpen} onClose={() => setAssignSpecialistModalOpen(false)}>
        <div className="bg-surface p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-text-main mb-6">Assign Specialist</h2>
            <div className="space-y-3">
              {users.filter(u => u.role === Role.Specialist).map(specialist => (
                <button key={specialist.id} onClick={() => handleAssignSpecialist(specialist.id)} className="w-full text-left p-4 border dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-primary transition">
                  <p className="font-bold">{specialist.name}</p>
                  <p className="text-sm text-text-muted">{specialist.email}</p>
                </button>
              ))}
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;

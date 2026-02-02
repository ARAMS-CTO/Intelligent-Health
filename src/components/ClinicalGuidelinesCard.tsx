import React, { useState } from 'react';
import { GeminiService } from '../services/api';
import { ICONS } from '../constants/index';

interface ClinicalGuidelinesCardProps {
  diagnosis: string;
  isOffline: boolean;
}

const ClinicalGuidelinesCard: React.FC<ClinicalGuidelinesCardProps> = ({ diagnosis, isOffline }) => {
  const [guidelines, setGuidelines] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchGuidelines = async () => {
    setIsLoading(true);
    setError(null);
    setGuidelines(null);
    try {
      const result = await GeminiService.getClinicalGuidelines(diagnosis);
      setGuidelines(result);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-slate-700 antigravity-target">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-text-main flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-xl text-white shadow-lg shadow-teal-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            AI Clinical Guidelines
          </h2>
          <p className="text-sm text-text-muted mt-2 max-w-lg font-medium">Get an AI-generated summary of guidelines for <span className="font-bold text-text-main bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 rounded border border-white/20 dark:border-slate-700/50">{diagnosis}</span>.</p>
        </div>
        <button
          onClick={handleFetchGuidelines}
          disabled={isLoading || isOffline}
          className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-xl hover:shadow-teal-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2 transform active:scale-95"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              <span>Get Summary</span>
            </>
          )}
        </button>
      </div>

      {(guidelines || error || isLoading) && (
        <div className="mt-8 border-t border-white/10 dark:border-slate-700/50 pt-6 animate-fade-in-up">
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-text-muted py-12">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
              </div>
              <span className="mt-4 font-medium animate-pulse">Consulting medical database...</span>
            </div>
          )}
          {error && (
            <div className="text-danger-text bg-danger-light/20 p-4 rounded-xl border border-danger-border/20 flex items-start gap-3">
              <svg className="h-6 w-6 text-danger flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>{error}</span>
            </div>
          )}
          {guidelines && (
            <div className="prose prose-sm max-w-none text-text-main whitespace-pre-wrap bg-white/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-inner">
              {guidelines}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicalGuidelinesCard;
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
    <div className="bg-surface rounded-lg shadow-md">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              AI Clinical Guidelines
            </h2>
            <p className="text-sm text-text-muted mt-1">Get an AI-generated summary of guidelines for <span className="font-semibold text-text-main">{diagnosis}</span>.</p>
          </div>
          <button
            onClick={handleFetchGuidelines}
            disabled={isLoading || isOffline}
            className="bg-accent text-white font-semibold py-2 px-4 rounded-md hover:bg-accent-hover transition disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? 'Fetching...' : 'Get Summary'}
          </button>
        </div>
        
        {(guidelines || error || isLoading) && (
            <div className="mt-4 border-t pt-4">
                {isLoading && (
                    <div className="flex items-center justify-center text-text-muted">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Fetching latest guidelines from AI...</span>
                    </div>
                )}
                {error && <div className="text-danger-text bg-danger-light p-3 rounded-md">{error}</div>}
                {guidelines && (
                    <div className="prose prose-sm max-w-none text-text-main whitespace-pre-wrap animate-fade-in">
                        {guidelines}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalGuidelinesCard;
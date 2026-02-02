import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { useTranslation } from 'react-i18next';
import { PatientProfile } from '../types/index';

interface PatientSearchProps {
    onSelect: (patient: PatientProfile) => void;
    placeholder?: string;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({ onSelect, placeholder }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PatientProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation('common');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            setIsLoading(true);
            try {
                const data = await DataService.searchPatients(query);
                setResults(data);
                setIsOpen(true);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(search, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query]);

    return (
        <div className="relative w-full max-w-md" ref={wrapperRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    {ICONS.search}
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all shadow-sm"
                    placeholder={placeholder || "Search patient by name or ID..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                />
                {isLoading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 shadow-xl rounded-xl border border-slate-200 dark:border-slate-700 max-h-60 overflow-auto py-1 animate-fade-in-up">
                    {results.map((patient) => (
                        <li
                            key={patient.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-none transition-colors"
                            onClick={() => {
                                onSelect(patient);
                                setIsOpen(false);
                                setQuery(''); // Optional: clear or keep name
                            }}
                        >
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {patient.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{patient.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{patient.identifier} {patient.personalDetails?.dob ? `• ${patient.personalDetails.dob}` : ''}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                    <p className="text-sm text-slate-500">No patients found.</p>
                </div>
            )}
        </div>
    );
};

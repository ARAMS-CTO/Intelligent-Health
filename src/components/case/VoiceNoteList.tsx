import React, { useState } from 'react';
import { ICONS } from '../../constants/index';
import VoiceRecorder from '../VoiceRecorder';
import { DataService } from '../../services/api';

import { Comment } from '../../types/index';

interface VoiceNoteListProps {
    caseId: string;
    notes: Comment[];
    onAddNote: (note: string) => void;
}

export const VoiceNoteList: React.FC<VoiceNoteListProps> = ({ caseId, notes, onAddNote }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleTranscript = (text: string) => {
        if (text) {
            onAddNote(text);
        }
    };

    // Filter for voice notes if they are stored in comments with a specific tag or structure
    // For now, checks if content starts with [Voice Note] or we assume the parent passes filtered notes

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
            <div
                className="p-4 flex justify-between items-center cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400">
                        {ICONS.microphone}
                    </div>
                    <h3 className="font-bold text-text-main">Voice Notes</h3>
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300">
                        {notes.length}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div onClick={(e) => e.stopPropagation()}>
                        <VoiceRecorder onTranscript={handleTranscript} />
                    </div>
                    {isExpanded ? ICONS.chevronUp : ICONS.chevronDown}
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 space-y-3 bg-white dark:bg-slate-800 animate-fade-in">
                    {notes.length === 0 ? (
                        <div className="text-center py-6 text-text-muted text-sm italic">
                            No voice notes yet. Record one to add clinical observations quickly.
                        </div>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        {note.userName || "Doctor"}
                                    </span>
                                    <span className="text-[10px] text-text-muted">
                                        {note.timestamp ? new Date(note.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Just now'}
                                    </span>
                                </div>
                                <p className="text-sm text-text-main leading-relaxed">
                                    {note.text.replace('[Voice Note] ', '')}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/api';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';

interface CaseNote {
    id: string;
    type: 'soap' | 'progress' | 'consult' | 'procedure' | 'discharge';
    timestamp: string;
    author: string;
    content: {
        subjective?: string;
        objective?: string;
        assessment?: string;
        plan?: string;
        freeText?: string;
    };
    isSigned: boolean;
    aiAssisted: boolean;
}

interface CaseNotesManagerProps {
    caseId: string;
    patientName: string;
    onSave?: (note: CaseNote) => void;
}

export const CaseNotesManager: React.FC<CaseNotesManagerProps> = ({ caseId, patientName, onSave }) => {
    const [notes, setNotes] = useState<CaseNote[]>([]);
    const [isComposing, setIsComposing] = useState(false);
    const [noteType, setNoteType] = useState<CaseNote['type']>('soap');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [draftNote, setDraftNote] = useState({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        freeText: ''
    });

    // Mock existing notes
    const mockNotes: CaseNote[] = [
        {
            id: '1',
            type: 'soap',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            author: 'Dr. Sarah Smith',
            content: {
                subjective: 'Patient reports persistent headache for 3 days. Rates pain 6/10. No visual changes or nausea.',
                objective: 'BP 128/82, HR 72, Temp 98.6°F. HEENT: PERRLA, no papilledema. Neck supple.',
                assessment: 'Tension-type headache. Rule out secondary causes if persistent.',
                plan: '1. Ibuprofen 400mg PRN\n2. Stress management\n3. Return if symptoms worsen or persist >1 week'
            },
            isSigned: true,
            aiAssisted: false
        },
        {
            id: '2',
            type: 'progress',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            author: 'Dr. Sarah Smith',
            content: {
                freeText: 'Follow-up appointment. Patient reports improvement in symptoms after starting medication. Blood pressure well controlled. Continue current regimen. Schedule labs in 3 months.'
            },
            isSigned: true,
            aiAssisted: true
        }
    ];

    useEffect(() => {
        setNotes(mockNotes);
    }, [caseId]);

    const getNoteTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            soap: 'SOAP Note',
            progress: 'Progress Note',
            consult: 'Consultation',
            procedure: 'Procedure Note',
            discharge: 'Discharge Summary'
        };
        return labels[type] || type;
    };

    const getNoteTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            soap: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            progress: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            consult: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            procedure: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            discharge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        };
        return colors[type] || 'bg-slate-100 text-slate-600';
    };

    const handleAIAssist = async (section: keyof typeof draftNote) => {
        setIsGeneratingAI(true);
        try {
            // In production, call AI service with context
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock AI suggestions
            const suggestions: Record<string, string> = {
                subjective: 'Patient presents with [chief complaint]. Reports [symptoms] for [duration]. Denies [negative symptoms]. PMH significant for [conditions].',
                objective: 'Vitals: BP ___/__, HR __, RR __, Temp __°F, SpO2 __%\nGeneral: Alert and oriented x3, no acute distress\nHEENT: Normocephalic, PERRLA\nCardiac: RRR, no murmurs\nLungs: CTAB bilaterally\nAbdomen: Soft, non-tender, non-distended',
                assessment: 'Based on presentation and examination:\n1. [Primary diagnosis]\n2. [Secondary consideration]\n\nDifferential includes: [DDx list]',
                plan: '1. [Medication/intervention]\n2. [Labs/imaging]\n3. [Follow-up timeframe]\n4. [Patient education]\n5. Return precautions discussed'
            };

            if (section in suggestions) {
                setDraftNote(prev => ({
                    ...prev,
                    [section]: suggestions[section]
                }));
            }
            showToast.success('AI suggestion added');
        } catch (e) {
            showToast.error('Failed to generate suggestion');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleSaveNote = () => {
        const newNote: CaseNote = {
            id: Date.now().toString(),
            type: noteType,
            timestamp: new Date().toISOString(),
            author: 'You',
            content: noteType === 'soap' ? {
                subjective: draftNote.subjective,
                objective: draftNote.objective,
                assessment: draftNote.assessment,
                plan: draftNote.plan
            } : {
                freeText: draftNote.freeText
            },
            isSigned: false,
            aiAssisted: false
        };

        setNotes(prev => [newNote, ...prev]);
        setDraftNote({ subjective: '', objective: '', assessment: '', plan: '', freeText: '' });
        setIsComposing(false);
        showToast.success('Note saved');
        onSave?.(newNote);
    };

    const handleSignNote = (noteId: string) => {
        setNotes(prev => prev.map(n =>
            n.id === noteId ? { ...n, isSigned: true } : n
        ));
        showToast.success('Note signed');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Clinical Notes</h2>
                    <p className="text-sm text-slate-500">{patientName}</p>
                </div>
                {!isComposing && (
                    <button
                        onClick={() => setIsComposing(true)}
                        className="px-4 py-2 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2"
                    >
                        {ICONS.plus} New Note
                    </button>
                )}
            </div>

            {/* Compose Note */}
            {isComposing && (
                <div className="glass-card p-6 rounded-2xl border-2 border-primary">
                    {/* Note Type Selector */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {(['soap', 'progress', 'consult', 'procedure', 'discharge'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setNoteType(type)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${noteType === type
                                        ? 'bg-primary text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}
                            >
                                {getNoteTypeLabel(type)}
                            </button>
                        ))}
                    </div>

                    {/* SOAP Note Form */}
                    {noteType === 'soap' ? (
                        <div className="space-y-4">
                            {(['subjective', 'objective', 'assessment', 'plan'] as const).map(section => (
                                <div key={section}>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase">
                                            {section.charAt(0).toUpperCase()}{section.slice(1)}
                                        </label>
                                        <button
                                            onClick={() => handleAIAssist(section)}
                                            disabled={isGeneratingAI}
                                            className="text-xs text-primary font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {isGeneratingAI ? '⏳' : '✨'} AI Assist
                                        </button>
                                    </div>
                                    <textarea
                                        value={draftNote[section]}
                                        onChange={(e) => setDraftNote(prev => ({ ...prev, [section]: e.target.value }))}
                                        className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none focus:ring-2 focus:ring-primary outline-none text-sm"
                                        placeholder={`Enter ${section}...`}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <label className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2 block">
                                {getNoteTypeLabel(noteType)}
                            </label>
                            <textarea
                                value={draftNote.freeText}
                                onChange={(e) => setDraftNote(prev => ({ ...prev, freeText: e.target.value }))}
                                className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none focus:ring-2 focus:ring-primary outline-none text-sm"
                                placeholder="Enter note content..."
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={() => { setIsComposing(false); setDraftNote({ subjective: '', objective: '', assessment: '', plan: '', freeText: '' }); }}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveNote}
                            className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors"
                        >
                            Save Note
                        </button>
                    </div>
                </div>
            )}

            {/* Existing Notes */}
            <div className="space-y-4">
                {notes.map(note => (
                    <div
                        key={note.id}
                        className={`glass-card p-5 rounded-2xl ${!note.isSigned ? 'border-2 border-amber-300 dark:border-amber-700' : 'border border-white/20 dark:border-slate-700/50'}`}
                    >
                        {/* Note Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getNoteTypeColor(note.type)}`}>
                                        {getNoteTypeLabel(note.type)}
                                    </span>
                                    {note.aiAssisted && (
                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded dark:bg-purple-900/30 dark:text-purple-300">
                                            ✨ AI Assisted
                                        </span>
                                    )}
                                    {!note.isSigned && (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded dark:bg-amber-900/30 dark:text-amber-300">
                                            ⚠️ Unsigned
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500">
                                    {note.author} • {new Date(note.timestamp).toLocaleString()}
                                </p>
                            </div>
                            {!note.isSigned && (
                                <button
                                    onClick={() => handleSignNote(note.id)}
                                    className="px-3 py-1.5 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    ✓ Sign
                                </button>
                            )}
                        </div>

                        {/* Note Content */}
                        {note.type === 'soap' ? (
                            <div className="space-y-3">
                                {note.content.subjective && (
                                    <div>
                                        <h5 className="font-bold text-xs text-slate-500 uppercase mb-1">Subjective</h5>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{note.content.subjective}</p>
                                    </div>
                                )}
                                {note.content.objective && (
                                    <div>
                                        <h5 className="font-bold text-xs text-slate-500 uppercase mb-1">Objective</h5>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{note.content.objective}</p>
                                    </div>
                                )}
                                {note.content.assessment && (
                                    <div>
                                        <h5 className="font-bold text-xs text-slate-500 uppercase mb-1">Assessment</h5>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{note.content.assessment}</p>
                                    </div>
                                )}
                                {note.content.plan && (
                                    <div>
                                        <h5 className="font-bold text-xs text-slate-500 uppercase mb-1">Plan</h5>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{note.content.plan}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                                {note.content.freeText}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CaseNotesManager;

import React from 'react';
import { ICONS } from '../../constants/index';
import { DentalProcedure } from '../../types/index';

interface DentalTimelineProps {
    procedures: DentalProcedure[];
}

export const DentalTimeline: React.FC<DentalTimelineProps> = ({ procedures }) => {
    // Sort by date descending
    const sorted = [...procedures].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6 relative ml-4 border-l-2 border-slate-200 dark:border-slate-800 pl-8 py-2">
            {sorted.map((proc, idx) => (
                <div key={proc.id} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-700 group-hover:border-primary transition-colors"></div>

                    <div className="glass-card p-5 rounded-2xl hover:shadow-lg transition-all dark:bg-slate-800/50">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-lg">
                                {new Date(proc.date).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400">{proc.procedure_code}</span>
                        </div>

                        <h4 className="font-heading font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">{proc.description}</h4>

                        {proc.dentist_name && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                <div className="p-1 rounded bg-slate-100 dark:bg-slate-700">{ICONS.user}</div>
                                <span>{proc.dentist_name}</span>
                            </div>
                        )}

                        {proc.notes && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                "{proc.notes}"
                            </p>
                        )}
                    </div>
                </div>
            ))}

            {procedures.length === 0 && (
                <div className="text-center py-12 text-slate-400 italic">
                    No dental history recorded.
                </div>
            )}

            {/* Youth/Start Marker */}
            <div className="relative">
                <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-slate-300 dark:border-slate-700"></div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1.5">Record Start</div>
            </div>
        </div>
    );
};

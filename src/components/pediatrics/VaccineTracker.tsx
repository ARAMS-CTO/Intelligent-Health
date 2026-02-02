import React from 'react';

interface Vaccine {
    id: string;
    name: string;
    description: string;
    ageDueMonths: number;
    status: 'completed' | 'due' | 'upcoming' | 'overdue';
    dateGiven?: string;
}

interface VaccineTrackerProps {
    childId: string;
    childName: string;
    ageMonths: number;
}

export const VaccineTracker: React.FC<VaccineTrackerProps> = ({ childName, ageMonths }) => {

    // Mock Schedule (Standard CDC/WHO hybrid)
    const schedule: Vaccine[] = [
        { id: 'hepb-1', name: 'Hep B (1st)', description: 'Hepatitis B', ageDueMonths: 0, status: 'completed', dateGiven: '2023-01-01' },
        { id: 'rv-1', name: 'RV (1st)', description: 'Rotavirus', ageDueMonths: 2, status: 'completed', dateGiven: '2023-03-01' },
        { id: 'dtap-1', name: 'DTaP (1st)', description: 'Diphtheria, Tetanus, Pertussis', ageDueMonths: 2, status: 'completed', dateGiven: '2023-03-01' },
        { id: 'hib-1', name: 'Hib (1st)', description: 'Haemophilus influenzae type b', ageDueMonths: 2, status: 'completed', dateGiven: '2023-03-01' },
        { id: 'pcv-1', name: 'PCV13 (1st)', description: 'Pneumococcal conjugate', ageDueMonths: 2, status: 'completed', dateGiven: '2023-03-01' },
        { id: 'ipv-1', name: 'IPV (1st)', description: 'Inactivated Polio', ageDueMonths: 2, status: 'completed', dateGiven: '2023-03-01' },

        { id: 'rv-2', name: 'RV (2nd)', description: 'Rotavirus', ageDueMonths: 4, status: 'due' },
        { id: 'dtap-2', name: 'DTaP (2nd)', description: 'Diphtheria, Tetanus, Pertussis', ageDueMonths: 4, status: 'due' },

        { id: 'hepb-3', name: 'Hep B (3rd)', description: 'Hepatitis B', ageDueMonths: 6, status: 'upcoming' },
        { id: 'flu', name: 'Influenza', description: 'Annual Flu Shot', ageDueMonths: 6, status: 'upcoming' },

        { id: 'mmr', name: 'MMR', description: 'Measles, Mumps, Rubella', ageDueMonths: 12, status: 'upcoming' },
        { id: 'var', name: 'VAR', description: 'Varicella (Chickenpox)', ageDueMonths: 12, status: 'upcoming' },
    ];

    // dynamically adjust status based on age if not hardcoded (demo logic)
    const dynamicSchedule = schedule.map(v => {
        if (v.status !== 'completed') {
            if (ageMonths > v.ageDueMonths + 1) return { ...v, status: 'overdue' };
            if (ageMonths >= v.ageDueMonths - 1 && ageMonths <= v.ageDueMonths + 1) return { ...v, status: 'due' };
            return { ...v, status: 'upcoming' };
        }
        return v;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'due': return 'bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse';
            case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    return (
        <div className="glass-card p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    💉 Vaccination Schedule
                    <span className="text-xs font-normal text-slate-500 px-2 py-1 bg-slate-100 rounded-full">{childName}</span>
                </h3>
                <span className="text-sm text-slate-400">Age: {ageMonths} months</span>
            </div>

            <div className="relative">
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-700"></div>
                <div className="space-y-4">
                    {dynamicSchedule.map((v, i) => (
                        <div key={v.id} className="relative pl-14 group">
                            {/* Timeline Dot */}
                            <div className={`absolute left-[21px] top-4 w-3.5 h-3.5 rounded-full border-2 bg-white z-10 transition-colors ${v.status === 'completed' ? 'border-green-500' :
                                    v.status === 'due' ? 'border-yellow-500' :
                                        v.status === 'overdue' ? 'border-red-500' : 'border-slate-300'
                                }`}></div>

                            <div className={`p-4 rounded-xl border flex justify-between items-center transition-all ${getStatusColor(v.status as any)}`}>
                                <div>
                                    <div className="font-bold">{v.name}</div>
                                    <div className="text-xs opacity-80">{v.description}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold uppercase tracking-wider">{v.status}</div>
                                    <div className="text-xs opacity-70">
                                        {v.status === 'completed' ? `Given: ${v.dateGiven}` : `Due: ${v.ageDueMonths}m`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <button className="text-sm font-bold text-primary hover:text-primary-hover">Download Official Record (PDF)</button>
            </div>
        </div>
    );
};

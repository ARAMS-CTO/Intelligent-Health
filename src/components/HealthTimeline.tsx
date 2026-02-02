import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';

interface TimelineEvent {
    id: string;
    type: 'appointment' | 'lab' | 'prescription' | 'procedure' | 'diagnosis' | 'vaccination' | 'hospital' | 'note';
    title: string;
    description: string;
    date: string;
    provider?: string;
    location?: string;
    attachments?: number;
    important?: boolean;
}

export const HealthTimeline: React.FC = () => {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [filter, setFilter] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Mock timeline data
    const mockEvents: TimelineEvent[] = [
        {
            id: '1',
            type: 'appointment',
            title: 'Annual Physical Exam',
            description: 'Comprehensive health evaluation with Dr. Smith. All vitals normal. Blood work ordered.',
            date: '2026-01-15',
            provider: 'Dr. Sarah Smith',
            location: 'City Medical Center'
        },
        {
            id: '2',
            type: 'lab',
            title: 'Complete Blood Panel',
            description: 'CBC, CMP, Lipid Panel, HbA1c. Results: All within normal limits except slightly elevated LDL.',
            date: '2026-01-16',
            provider: 'LabCorp',
            attachments: 1
        },
        {
            id: '3',
            type: 'prescription',
            title: 'Lisinopril 10mg Started',
            description: 'New prescription for blood pressure management. Take once daily in the morning.',
            date: '2026-01-15',
            provider: 'Dr. Sarah Smith'
        },
        {
            id: '4',
            type: 'vaccination',
            title: 'Flu Vaccine',
            description: 'Seasonal influenza vaccine administered. Next due: January 2027.',
            date: '2025-12-01',
            provider: 'CVS Pharmacy',
            location: 'CVS #1234'
        },
        {
            id: '5',
            type: 'diagnosis',
            title: 'Stage 1 Hypertension',
            description: 'Blood pressure consistently above 130/80. Lifestyle modifications and medication recommended.',
            date: '2025-11-20',
            provider: 'Dr. Sarah Smith',
            important: true
        },
        {
            id: '6',
            type: 'procedure',
            title: 'Echocardiogram',
            description: 'Cardiac ultrasound showing normal heart structure and function. EF 60%.',
            date: '2025-11-10',
            provider: 'Dr. Michael Chen',
            location: 'Heart Center',
            attachments: 2
        },
        {
            id: '7',
            type: 'appointment',
            title: 'Cardiology Consultation',
            description: 'Initial evaluation for hypertension. Echo ordered. Beta-blocker considered.',
            date: '2025-11-05',
            provider: 'Dr. Michael Chen',
            location: 'Heart Center'
        },
        {
            id: '8',
            type: 'hospital',
            title: 'Emergency Room Visit',
            description: 'Chest pain evaluation. Ruled out cardiac event. Likely musculoskeletal.',
            date: '2025-10-15',
            provider: 'City Hospital ER',
            location: 'City Hospital',
            important: true,
            attachments: 3
        },
        {
            id: '9',
            type: 'lab',
            title: 'HbA1c Test',
            description: 'Diabetes screening. Result: 6.1% (Prediabetic range). Lifestyle modifications recommended.',
            date: '2025-09-20',
            provider: 'LabCorp',
            attachments: 1
        },
        {
            id: '10',
            type: 'diagnosis',
            title: 'Type 2 Diabetes (Prediabetes)',
            description: 'A1c of 6.1% indicates prediabetes. Diet and exercise program initiated.',
            date: '2025-09-25',
            provider: 'Dr. Sarah Smith',
            important: true
        }
    ];

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                setIsLoading(true);
                const data = await DataService.getTimeline({ months: 24 });

                if (data && data.length > 0) {
                    setEvents(data.map(e => ({
                        id: e.id,
                        type: e.type,
                        title: e.title,
                        description: e.description || '',
                        date: e.event_date,
                        provider: e.provider,
                        location: e.location,
                        attachments: e.attachment_count,
                        important: e.is_important
                    })));
                } else {
                    setEvents(mockEvents);
                }
            } catch (e) {
                console.log('Using mock timeline data');
                setEvents(mockEvents);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTimeline();
    }, []);

    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            appointment: '👨‍⚕️',
            lab: '🧪',
            prescription: '💊',
            procedure: '🏥',
            diagnosis: '📋',
            vaccination: '💉',
            hospital: '🚑',
            note: '📝'
        };
        return icons[type] || '📌';
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            appointment: 'from-blue-500 to-indigo-600',
            lab: 'from-purple-500 to-violet-600',
            prescription: 'from-green-500 to-emerald-600',
            procedure: 'from-cyan-500 to-blue-600',
            diagnosis: 'from-amber-500 to-orange-600',
            vaccination: 'from-pink-500 to-rose-600',
            hospital: 'from-red-500 to-red-600',
            note: 'from-slate-500 to-slate-600'
        };
        return colors[type] || 'from-slate-500 to-slate-600';
    };

    const eventTypes = ['appointment', 'lab', 'prescription', 'procedure', 'diagnosis', 'vaccination', 'hospital'];

    const filteredEvents = filter
        ? events.filter(e => e.type === filter)
        : events;

    // Group events by month
    const groupedEvents = filteredEvents.reduce((acc, event) => {
        const monthYear = new Date(event.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(event);
        return acc;
    }, {} as Record<string, TimelineEvent[]>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    📅 Health Timeline
                </h2>
                <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                    🔍 Search
                </button>
            </div>

            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setFilter(null)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${!filter
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                >
                    All
                </button>
                {eventTypes.map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 capitalize ${filter === type
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                    >
                        {getTypeIcon(type)}
                        <span className="hidden sm:inline">{type}</span>
                    </button>
                ))}
            </div>

            {/* Timeline */}
            {isLoading ? (
                <div className="text-center py-12 text-slate-400">Loading timeline...</div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
                        <div key={monthYear}>
                            {/* Month Header */}
                            <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur py-2 mb-4">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{monthYear}</h3>
                            </div>

                            {/* Events */}
                            <div className="relative pl-8 space-y-4">
                                {/* Timeline Line */}
                                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

                                {monthEvents.map((event, idx) => (
                                    <div key={event.id} className="relative">
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-5 w-6 h-6 rounded-full bg-gradient-to-br ${getTypeColor(event.type)} flex items-center justify-center text-xs text-white shadow-lg ${event.important ? 'ring-2 ring-red-400 ring-offset-2 dark:ring-offset-slate-900' : ''}`}>
                                            {getTypeIcon(event.type)}
                                        </div>

                                        {/* Event Card */}
                                        <div className={`glass-card p-5 rounded-2xl ml-4 ${event.important ? 'border-2 border-red-200 dark:border-red-800' : 'border border-white/20 dark:border-slate-700/50'}`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </span>
                                                        {event.important && (
                                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded dark:bg-red-900/30 dark:text-red-300">
                                                                IMPORTANT
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 dark:text-white">{event.title}</h4>
                                                </div>
                                                <span className={`text-xl bg-gradient-to-br ${getTypeColor(event.type)} bg-clip-text text-transparent`}>
                                                    {getTypeIcon(event.type)}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                                {event.description}
                                            </p>

                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <div className="flex items-center gap-3">
                                                    {event.provider && (
                                                        <span>👨‍⚕️ {event.provider}</span>
                                                    )}
                                                    {event.location && (
                                                        <span>📍 {event.location}</span>
                                                    )}
                                                </div>
                                                {event.attachments && (
                                                    <button className="flex items-center gap-1 text-primary font-bold hover:underline">
                                                        📎 {event.attachments} file{event.attachments > 1 ? 's' : ''}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Export Options */}
            <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Export Health History</h4>
                    <p className="text-sm text-slate-500">Download your complete medical timeline</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">
                        📄 PDF
                    </button>
                    <button className="px-4 py-2 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-hover transition-colors">
                        🔗 Share
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HealthTimeline;

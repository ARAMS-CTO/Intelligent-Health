import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { useTranslation } from 'react-i18next';

interface RehabSession {
    id: string;
    patientName: string;
    patientId: string;
    type: string; // 'Post-Op', 'Sports Injury', 'Chronic Pain', 'Neurological'
    scheduledAt: string;
    status: string;
    progress: number; // 0-100
    exercises: string[];
}

interface Exercise {
    id: string;
    name: string;
    category: string;
    duration: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description: string;
}

const EXERCISE_LIBRARY: Exercise[] = [
    { id: 'ex1', name: 'Knee Flexion Stretch', category: 'Lower Body', duration: '10 min', difficulty: 'Easy', description: 'Gentle stretching for knee mobility' },
    { id: 'ex2', name: 'Shoulder Rotation', category: 'Upper Body', duration: '8 min', difficulty: 'Easy', description: 'Improve shoulder range of motion' },
    { id: 'ex3', name: 'Core Stabilization', category: 'Core', duration: '15 min', difficulty: 'Medium', description: 'Strengthen abdominal and back muscles' },
    { id: 'ex4', name: 'Balance Board Training', category: 'Balance', duration: '12 min', difficulty: 'Medium', description: 'Improve proprioception and balance' },
    { id: 'ex5', name: 'Resistance Band Rows', category: 'Upper Body', duration: '10 min', difficulty: 'Medium', description: 'Build back strength with resistance' },
    { id: 'ex6', name: 'Gait Training', category: 'Mobility', duration: '20 min', difficulty: 'Hard', description: 'Walking pattern correction and endurance' },
    { id: 'ex7', name: 'Aquatic Therapy', category: 'Specialized', duration: '30 min', difficulty: 'Medium', description: 'Low-impact water-based exercises' },
    { id: 'ex8', name: 'TENS Therapy', category: 'Electrotherapy', duration: '15 min', difficulty: 'Easy', description: 'Electrical stimulation for pain relief' },
];

const PhysioDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation('dashboard');
    const [sessions, setSessions] = useState<RehabSession[]>([]);
    const [selectedTab, setSelectedTab] = useState<'sessions' | 'exercises' | 'progress'>('sessions');
    const [isLoading, setIsLoading] = useState(true);
    const [searchExercise, setSearchExercise] = useState('');

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Simulate loading sessions from appointments
            const appointments = await DataService.getAppointments();
            const physioSessions: RehabSession[] = appointments
                .filter(apt => apt.type === 'In-Person' || apt.reason?.toLowerCase().includes('physio'))
                .slice(0, 5)
                .map(apt => ({
                    id: apt.id,
                    patientName: apt.patientName || 'Patient',
                    patientId: apt.patientId,
                    type: 'Post-Op',
                    scheduledAt: apt.scheduledAt,
                    status: apt.status,
                    progress: Math.floor(Math.random() * 100),
                    exercises: ['ex1', 'ex3', 'ex4']
                }));
            setSessions(physioSessions);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredExercises = EXERCISE_LIBRARY.filter(ex =>
        ex.name.toLowerCase().includes(searchExercise.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchExercise.toLowerCase())
    );

    if (!user) return null;

    return (
        <div className="bg-background min-h-screen p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-heading font-black text-text-main">
                    Physiotherapy <span className="text-primary">Department</span>
                </h1>
                <p className="text-text-muted mt-2">Rehabilitation & Physical Wellness Tracking</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600">{ICONS.calendar}</div>
                        <span className="text-sm font-medium text-text-muted">Today's Sessions</span>
                    </div>
                    <p className="text-3xl font-black text-text-main">{sessions.filter(s => s.status === 'Scheduled').length}</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600">{ICONS.users}</div>
                        <span className="text-sm font-medium text-text-muted">Active Patients</span>
                    </div>
                    <p className="text-3xl font-black text-text-main">{sessions.length}</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-purple-200/50 dark:border-purple-800/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600">{ICONS.check}</div>
                        <span className="text-sm font-medium text-text-muted">Completed Today</span>
                    </div>
                    <p className="text-3xl font-black text-text-main">{sessions.filter(s => s.status === 'Completed').length}</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-amber-200/50 dark:border-amber-800/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600">{ICONS.chart}</div>
                        <span className="text-sm font-medium text-text-muted">Avg Progress</span>
                    </div>
                    <p className="text-3xl font-black text-text-main">
                        {sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.progress, 0) / sessions.length) : 0}%
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {(['sessions', 'exercises', 'progress'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`px-5 py-2 rounded-xl font-bold transition-all ${selectedTab === tab
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white/50 dark:bg-slate-800/50 text-text-muted hover:bg-primary/10'
                            }`}
                    >
                        {tab === 'sessions' ? '📅 Sessions' : tab === 'exercises' ? '🏋️ Exercise Library' : '📈 Progress'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {selectedTab === 'sessions' && (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 text-center text-text-muted">Loading sessions...</div>
                    ) : sessions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-5xl mb-4">🧘</div>
                            <h3 className="text-xl font-bold text-text-main mb-2">No Scheduled Sessions</h3>
                            <p className="text-text-muted">Wait for doctor referrals or schedule a new session.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sessions.map(session => (
                                <div key={session.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                                {session.patientName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-main">{session.patientName}</h4>
                                                <p className="text-sm text-text-muted">{session.type} Rehabilitation</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${session.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : session.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {session.status}
                                            </span>
                                            <p className="text-xs text-text-muted mt-1">
                                                {new Date(session.scheduledAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-text-muted">Progress</span>
                                                <span className="font-bold text-primary">{session.progress}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${session.progress}%` }}></div>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                            View Details →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedTab === 'exercises' && (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
                    <div className="mb-6">
                        <input
                            type="text"
                            value={searchExercise}
                            onChange={(e) => setSearchExercise(e.target.value)}
                            placeholder="Search exercises..."
                            className="w-full md:w-80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredExercises.map(ex => (
                            <div key={ex.id} className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-lg transition-all bg-white/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-text-muted">{ex.category}</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${ex.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : ex.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {ex.difficulty}
                                    </span>
                                </div>
                                <h4 className="font-bold text-text-main mb-2">{ex.name}</h4>
                                <p className="text-sm text-text-muted mb-3">{ex.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-text-muted">⏱️ {ex.duration}</span>
                                    <button className="text-sm font-bold text-primary hover:underline">Add to Plan</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedTab === 'progress' && (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-8">
                    <h3 className="text-xl font-bold text-text-main mb-6">Patient Progress Tracking</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sessions.map(session => (
                            <div key={session.id} className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {session.patientName.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-text-main">{session.patientName}</h4>
                                        <p className="text-xs text-text-muted">{session.type}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Pain Reduction</span><span className="font-bold">{Math.min(100, session.progress + 20)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full"><div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, session.progress + 20)}%` }}></div></div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Mobility</span><span className="font-bold">{session.progress}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full"><div className="h-full bg-blue-400 rounded-full" style={{ width: `${session.progress}%` }}></div></div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Strength</span><span className="font-bold">{Math.max(0, session.progress - 10)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full"><div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.max(0, session.progress - 10)}%` }}></div></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhysioDashboard;

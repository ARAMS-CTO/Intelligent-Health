import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';

interface CarePlanGoal {
    id: string;
    title: string;
    category: 'medication' | 'lifestyle' | 'monitoring' | 'followup' | 'therapy';
    description: string;
    targetDate: string;
    progress: number;
    status: 'on-track' | 'at-risk' | 'completed' | 'overdue';
    tasks: CarePlanTask[];
}

interface CarePlanTask {
    id: string;
    title: string;
    frequency: string;
    completed: boolean;
    lastCompleted?: string;
}

interface CareTeamMember {
    id: string;
    name: string;
    role: string;
    specialty?: string;
    phone?: string;
    isPrimary: boolean;
}

export const CarePlanManager: React.FC = () => {
    const [goals, setGoals] = useState<CarePlanGoal[]>([]);
    const [careTeam, setCareTeam] = useState<CareTeamMember[]>([]);
    const [activeTab, setActiveTab] = useState<'goals' | 'team' | 'progress'>('goals');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState<CarePlanGoal | null>(null);

    // Mock data
    const mockGoals: CarePlanGoal[] = [
        {
            id: '1',
            title: 'Blood Sugar Control',
            category: 'monitoring',
            description: 'Maintain HbA1c below 7% through diet, exercise, and medication compliance',
            targetDate: '2026-06-01',
            progress: 65,
            status: 'on-track',
            tasks: [
                { id: 't1', title: 'Check blood sugar daily', frequency: 'Daily', completed: true, lastCompleted: '2026-01-24' },
                { id: 't2', title: 'Take Metformin', frequency: 'Twice daily', completed: true },
                { id: 't3', title: 'Log carbohydrate intake', frequency: 'Daily', completed: false },
            ]
        },
        {
            id: '2',
            title: 'Blood Pressure Management',
            category: 'medication',
            description: 'Keep BP below 130/80 mmHg through medication and lifestyle changes',
            targetDate: '2026-03-15',
            progress: 80,
            status: 'on-track',
            tasks: [
                { id: 't4', title: 'Take Lisinopril', frequency: 'Daily', completed: true },
                { id: 't5', title: 'Reduce sodium intake', frequency: 'Ongoing', completed: false },
                { id: 't6', title: 'Check BP weekly', frequency: 'Weekly', completed: true },
            ]
        },
        {
            id: '3',
            title: 'Weight Loss Goal',
            category: 'lifestyle',
            description: 'Lose 10 lbs through diet modification and regular exercise',
            targetDate: '2026-04-30',
            progress: 40,
            status: 'at-risk',
            tasks: [
                { id: 't7', title: '30 min walk', frequency: 'Daily', completed: false },
                { id: 't8', title: 'Track calories', frequency: 'Daily', completed: false },
                { id: 't9', title: 'Weigh in', frequency: 'Weekly', completed: true },
            ]
        },
        {
            id: '4',
            title: 'Cardiac Follow-up',
            category: 'followup',
            description: 'Complete echocardiogram and cardiology consultation',
            targetDate: '2026-02-15',
            progress: 50,
            status: 'on-track',
            tasks: [
                { id: 't10', title: 'Schedule echo', frequency: 'One-time', completed: true },
                { id: 't11', title: 'Complete echo', frequency: 'One-time', completed: false },
                { id: 't12', title: 'Cardiology visit', frequency: 'One-time', completed: false },
            ]
        }
    ];

    const mockCareTeam: CareTeamMember[] = [
        { id: '1', name: 'Dr. Sarah Smith', role: 'Primary Care Physician', specialty: 'Internal Medicine', phone: '+1 555-0101', isPrimary: true },
        { id: '2', name: 'Dr. Michael Chen', role: 'Specialist', specialty: 'Cardiology', phone: '+1 555-0102', isPrimary: false },
        { id: '3', name: 'Dr. Lisa Johnson', role: 'Specialist', specialty: 'Endocrinology', phone: '+1 555-0103', isPrimary: false },
        { id: '4', name: 'Mary Wilson, RN', role: 'Care Coordinator', phone: '+1 555-0104', isPrimary: false },
        { id: '5', name: 'James Brown', role: 'Nutritionist', phone: '+1 555-0105', isPrimary: false },
    ];

    useEffect(() => {
        const fetchCarePlan = async () => {
            try {
                setIsLoading(true);
                const plans = await DataService.getCarePlans('Active');

                if (plans && plans.length > 0) {
                    // Get the first active plan's details
                    const plan = await DataService.getCarePlan(plans[0].id);
                    if (plan && plan.goals) {
                        setGoals(plan.goals.map((g: any) => ({
                            id: g.id,
                            title: g.title,
                            category: g.category || 'monitoring',
                            description: g.description || '',
                            targetDate: g.target_date || new Date().toISOString(),
                            progress: g.progress || 0,
                            status: g.status || 'on-track',
                            tasks: (g.tasks || []).map((t: any) => ({
                                id: t.id,
                                title: t.title,
                                frequency: t.frequency || 'Daily',
                                completed: t.is_completed || false,
                                lastCompleted: t.last_completed_at
                            }))
                        })));
                    } else {
                        setGoals(mockGoals);
                    }
                } else {
                    setGoals(mockGoals);
                }
                setCareTeam(mockCareTeam);
            } catch (e) {
                console.log('Using mock care plan data');
                setGoals(mockGoals);
                setCareTeam(mockCareTeam);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCarePlan();
    }, []);

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            medication: '💊',
            lifestyle: '🏃',
            monitoring: '📊',
            followup: '📅',
            therapy: '🧠'
        };
        return icons[category] || '📋';
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            medication: 'from-purple-500 to-violet-600',
            lifestyle: 'from-green-500 to-emerald-600',
            monitoring: 'from-blue-500 to-indigo-600',
            followup: 'from-amber-500 to-orange-600',
            therapy: 'from-pink-500 to-rose-600'
        };
        return colors[category] || 'from-slate-500 to-slate-600';
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'on-track': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'at-risk': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            case 'overdue': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const toggleTask = async (goalId: string, taskId: string) => {
        // Find the task
        const goal = goals.find(g => g.id === goalId);
        const task = goal?.tasks.find(t => t.id === taskId);

        if (!task) return;

        try {
            // Try to update via API
            if (task.completed) {
                await DataService.uncompleteTask(taskId);
            } else {
                await DataService.completeTask(taskId);
            }
        } catch (e) {
            console.log('API unavailable, updating locally');
        }

        // Update local state
        setGoals(prev => prev.map(goal => {
            if (goal.id === goalId) {
                return {
                    ...goal,
                    tasks: goal.tasks.map(task =>
                        task.id === taskId
                            ? { ...task, completed: !task.completed, lastCompleted: new Date().toISOString().split('T')[0] }
                            : task
                    )
                };
            }
            return goal;
        }));
        showToast.success('Task updated');
    };

    const overallProgress = goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    📋 My Care Plan
                </h2>
                <button className="px-4 py-2 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2">
                    {ICONS.plus} Add Goal
                </button>
            </div>

            {/* Overall Progress */}
            <div className="glass-card p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Care Plan Progress</h3>
                        <p className="text-sm text-slate-500">{goals.length} active goals</p>
                    </div>
                    <div className="text-4xl font-black text-primary">
                        {overallProgress}%
                    </div>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${overallProgress}%` }}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                {[
                    { key: 'goals', label: 'Goals', count: goals.length },
                    { key: 'team', label: 'Care Team', count: careTeam.length },
                    { key: 'progress', label: 'Progress' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`py-3 px-4 font-bold text-sm transition-all flex items-center gap-2 ${activeTab === tab.key
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Goals Tab */}
            {activeTab === 'goals' && (
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400">Loading care plan...</div>
                    ) : goals.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <div className="text-5xl mb-4">📋</div>
                            <p>No care plan goals yet</p>
                        </div>
                    ) : (
                        goals.map(goal => (
                            <div
                                key={goal.id}
                                className="glass-card p-5 rounded-2xl border border-white/20 dark:border-slate-700/50"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryColor(goal.category)} flex items-center justify-center text-xl text-white shadow-lg flex-shrink-0`}>
                                        {getCategoryIcon(goal.category)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusStyle(goal.status)}`}>
                                                {goal.status.replace('-', ' ')}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                Due: {new Date(goal.targetDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-lg text-slate-800 dark:text-white">{goal.title}</h4>
                                        <p className="text-sm text-slate-500">{goal.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-primary">{goal.progress}%</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                                    <div
                                        className={`h-full rounded-full transition-all ${goal.status === 'at-risk' ? 'bg-amber-500' :
                                            goal.status === 'completed' ? 'bg-green-500' : 'bg-primary'
                                            }`}
                                        style={{ width: `${goal.progress}%` }}
                                    />
                                </div>

                                {/* Tasks */}
                                <div className="space-y-2">
                                    {goal.tasks.map(task => (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            onClick={() => toggleTask(goal.id, task.id)}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.completed
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-slate-300 dark:border-slate-600'
                                                }`}>
                                                {task.completed && '✓'}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-bold text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                                                    {task.title}
                                                </p>
                                                <p className="text-xs text-slate-400">{task.frequency}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Care Team Tab */}
            {activeTab === 'team' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {careTeam.map(member => (
                        <div
                            key={member.id}
                            className={`glass-card p-5 rounded-2xl ${member.isPrimary ? 'border-2 border-primary' : 'border border-white/20 dark:border-slate-700/50'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl text-white font-bold">
                                    {member.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-800 dark:text-white">{member.name}</h4>
                                        {member.isPrimary && (
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">PRIMARY</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">{member.role}</p>
                                    {member.specialty && (
                                        <p className="text-xs text-primary">{member.specialty}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <a
                                    href={`tel:${member.phone}`}
                                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-center text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    📞 Call
                                </a>
                                <button className="flex-1 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-hover transition-colors">
                                    💬 Message
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
                <div className="glass-card p-6 rounded-2xl">
                    <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Goal Progress Overview</h4>
                    <div className="space-y-4">
                        {goals.map(goal => (
                            <div key={goal.id} className="flex items-center gap-4">
                                <div className="w-24 text-sm font-bold text-slate-600 dark:text-slate-400 truncate">
                                    {goal.title}
                                </div>
                                <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${goal.status === 'at-risk' ? 'bg-amber-500' :
                                            goal.status === 'completed' ? 'bg-green-500' : 'bg-primary'
                                            }`}
                                        style={{ width: `${goal.progress}%` }}
                                    />
                                </div>
                                <div className="w-12 text-right font-bold text-sm text-slate-800 dark:text-white">
                                    {goal.progress}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarePlanManager;

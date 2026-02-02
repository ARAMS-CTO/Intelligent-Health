import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService, GeminiService } from '../services/api';
import { ICONS } from '../constants/index';
import Breadcrumbs from '../components/Breadcrumbs';
import { SpecialistAgentChat } from '../components/specialized/SpecialistAgentChat';

interface NurseTask {
    id: string;
    title: string;
    description: string;
    patient_name: string;
    patient_id: string;
    due_date?: string;
    priority: number;
}

const NurseDashboard: React.FC = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<NurseTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [executingTask, setExecutingTask] = useState<NurseTask | null>(null);

    // Execution State
    const [notes, setNotes] = useState('');
    const [sys, setSys] = useState('');
    const [dia, setDia] = useState('');
    const [hr, setHr] = useState('');
    const [fileUrl, setFileUrl] = useState('');

    const loadData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await DataService.getNurseTasks();
            setTasks(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleExecute = async () => {
        if (!executingTask) return;

        try {
            const vitals: any = {};
            if (sys && dia) {
                vitals.systolic = parseFloat(sys);
                vitals.diastolic = parseFloat(dia);
            }
            if (hr) vitals.heart_rate = parseFloat(hr);

            await DataService.executeNurseTask(executingTask.id, {
                notes,
                vitals: Object.keys(vitals).length ? vitals : undefined,
                file_url: fileUrl || undefined
            });

            // Close and refresh
            setExecutingTask(null);
            setNotes(''); setSys(''); setDia(''); setFileUrl('');
            loadData();

        } catch (e) {
            alert("Failed to execute task");
        }
    };

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen p-8">
            <div className="container mx-auto">
                <Breadcrumbs items={[{ label: 'Nurse Station' }]} />

                <div className="flex justify-between items-center mb-8 mt-4">
                    <div>
                        <h1 className="text-4xl font-heading font-black text-text-main">
                            Nurse <span className="text-indigo-500">Execution Station</span>
                        </h1>
                        <p className="text-gray-500 mt-2">Dr. Assigned Orders & Procedures</p>
                    </div>
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 px-4 py-2 rounded-xl font-bold border border-indigo-200">
                        {tasks.length} Pending Tasks
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Task List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">{ICONS.document}</span>
                                Pending Orders
                            </h2>

                            {isLoading ? (
                                <div className="animate-pulse space-y-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>)}
                                </div>
                            ) : tasks.length === 0 ? (
                                <p className="text-gray-400 italic text-center py-10">All caught up! No pending orders.</p>
                            ) : (
                                <div className="space-y-4">
                                    {tasks.map(task => (
                                        <div key={task.id} className="p-4 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-xl font-bold text-lg ${task.priority > 1 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                                    {task.priority > 1 ? '!' : '#'}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                        {task.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mb-1">{task.description}</p>
                                                    <div className="flex gap-2 text-xs font-mono text-gray-400">
                                                        <span className="bg-gray-100 px-2 py-1 rounded">Patient: {task.patient_name}</span>
                                                        {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setExecutingTask(task)}
                                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-200/50 transition-all transform active:scale-95"
                                            >
                                                Execute
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* AI Helper Sidebar */}
                    <div className="space-y-6">
                        <SpecialistAgentChat zone="nurse" contextId={executingTask ? executingTask.id : null} />

                        {/* Quick Metrics */}
                        <div className="glass-card p-6 rounded-2xl">
                            <h3 className="font-bold mb-4">Shift Stats</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-green-50 rounded-xl text-center">
                                    <div className="text-2xl font-black text-green-600">12</div>
                                    <div className="text-xs text-green-800">Completed</div>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-xl text-center">
                                    <div className="text-2xl font-black text-orange-600">45m</div>
                                    <div className="text-xs text-orange-800">Avg Time</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Execution Modal */}
            {executingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                            <h3 className="font-bold text-xl">Execute Order</h3>
                            <button onClick={() => setExecutingTask(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Task</label>
                                <p className="font-medium text-lg">{executingTask.title}</p>
                                <p className="text-sm text-gray-500">{executingTask.description}</p>
                            </div>

                            {/* Dynamic Form based on Task Type logic (simplified) */}
                            {executingTask.title.toLowerCase().includes('bp') || executingTask.title.toLowerCase().includes('pressure') ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Systolic</label>
                                        <input
                                            type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                                            value={sys} onChange={e => setSys(e.target.value)} placeholder="120"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Diastolic</label>
                                        <input
                                            type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                                            value={dia} onChange={e => setDia(e.target.value)} placeholder="80"
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {executingTask.title.toLowerCase().includes('ecg') || executingTask.title.toLowerCase().includes('upload') ? (
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Upload File (Simulated URL)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-sm"
                                            value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..."
                                        />
                                        <button className="px-3 py-2 bg-gray-200 rounded-lg text-xs font-bold hover:bg-gray-300">Browse</button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">* In production this would be a real file picker</p>
                                </div>
                            ) : null}

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Clinical Notes</label>
                                <textarea
                                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 resize-none"
                                    placeholder="Observations during procedure..."
                                    value={notes} onChange={e => setNotes(e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setExecutingTask(null)} className="px-5 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleExecute} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg">
                                Complete Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Replaced by SpecialistAgentChat usage above

export default NurseDashboard;

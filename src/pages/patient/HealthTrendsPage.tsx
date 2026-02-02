
import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/api';
import { useAuth } from '../../components/Auth';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const HealthTrendsPage: React.FC = () => {
    const { user } = useAuth();
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({ steps: [], heart_rate: [], calories: [], sleep: [] });

    useEffect(() => {
        fetchHistory();
    }, [timeRange]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Calculate start date based on range
            const end = new Date();
            const start = new Date();
            if (timeRange === '7d') start.setDate(end.getDate() - 7);
            if (timeRange === '30d') start.setDate(end.getDate() - 30);
            if (timeRange === '90d') start.setDate(end.getDate() - 90);

            // In real integration we call the new metrics endpoint
            // For now, assume DataService has this method or we mock fetch it
            const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
            // Using direct fetch if service not updated yet or adding to service momentarily
            // Simulation of DB response for visual structure until server deploys

            // TODO: specific API call 
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/metrics/history?start_date=${start.toISOString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                // Component handles empty state naturally
                setData({ steps: [], heart_rate: [] });
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- Chart Configs ---

    // 1. Prepare Heart Rate Data
    const hrData = {
        labels: data.heart_rate?.map((d: any) => new Date(d.timestamp).toLocaleDateString()) || [],
        datasets: [
            {
                label: 'Heart Rate (bpm)',
                data: data.heart_rate?.map((d: any) => d.value) || [],
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                tension: 0.4
            }
        ]
    };

    // 2. Prepare Steps Data
    const stepsData = {
        labels: data.steps?.map((d: any) => new Date(d.date).toLocaleDateString()) || [],
        datasets: [
            {
                label: 'Daily Steps',
                data: data.steps?.map((d: any) => d.value) || [],
                backgroundColor: 'rgb(59, 130, 246)',
            }
        ]
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health Trends</h1>
                    <p className="text-gray-500 mt-2">Visualizing your standardized medical records from all devices.</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {['7d', '30d', '90d'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setTimeRange(r as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === r
                                    ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {r.toUpperCase()}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Heart Rate Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <span className="p-1.5 bg-red-100 text-red-600 rounded-lg">❤️</span>
                            Cardio Health
                        </h3>
                        {/* Real "Mock" Stats for density if history exists */}
                        {data.heart_rate?.length > 0 && (
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                Avg: {Math.round(data.heart_rate.reduce((a: any, b: any) => a + b.value, 0) / data.heart_rate.length)} bpm
                            </span>
                        )}
                    </div>
                    <div className="h-64">
                        {data.heart_rate?.length > 0 ? (
                            <Line options={{ responsive: true, maintainAspectRatio: false }} data={hrData} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <p>No Heart Rate data found for this period.</p>
                                <p className="text-xs mt-2">Sync your device in Integrations.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Steps Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">👣</span>
                            Activity Levels
                        </h3>
                        {data.steps?.length > 0 && (
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                Total: {data.steps.reduce((a: any, b: any) => a + b.value, 0).toLocaleString()}
                            </span>
                        )}
                    </div>
                    <div className="h-64">
                        {data.steps?.length > 0 ? (
                            <Bar options={{ responsive: true, maintainAspectRatio: false }} data={stepsData} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <p>No Step data found for this period.</p>
                                <p className="text-xs mt-2">Connect Google/Samsung or Apple Health.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modular Sleep/Advanced Widget Area */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 border border-white/20">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-2xl">😴</div>
                    <div>
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white">Sleep Analysis</h3>
                        <p className="text-sm text-gray-500">Correlation between Rest and Cleanup (Glymphatic System).</p>
                    </div>
                </div>

                {data.sleep?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                        {/* Simple Heatmap Visualization of Sleep Quality */}
                        {data.sleep.map((s: any, i: number) => (
                            <div key={i} className="flex flex-col items-center gap-2 p-4 bg-white/60 dark:bg-black/20 rounded-xl">
                                <span className="text-xs font-bold text-gray-400">{new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                <div className="h-24 w-4 bg-gray-200 rounded-full relative overflow-hidden">
                                    <div
                                        className="absolute bottom-0 w-full bg-indigo-500 transition-all duration-1000"
                                        style={{ height: `${Math.min(100, (s.value / 600) * 100)}%` }} // 10h max
                                    />
                                </div>
                                <span className="text-sm font-bold">{(s.value / 60).toFixed(1)}h</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        Connect Oura Ring or Apple Watch to see Sleep Stages.
                    </div>
                )}
            </div>

            <div className="flex justify-center pt-8">
                <a href="/dashboard" className="text-gray-500 hover:text-primary transition-colors text-sm font-medium flex items-center gap-2">
                    ← Back to Dashboard
                </a>
            </div>
        </div>
    );
};

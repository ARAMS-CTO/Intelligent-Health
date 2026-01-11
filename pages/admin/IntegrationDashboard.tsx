import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/api';
import { useAuth } from '../../components/Auth';

interface ProviderStats {
    totalUsers: number;
    activeConnections: number;
    totalDataPoints: number;
}

export const AdminIntegrationsDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<ProviderStats | null>(null);
    const [logs, setLogs] = useState<any[]>([]);

    // Mock Admin Stats (Real backend would aggregate this)
    const mockStats: ProviderStats = {
        totalUsers: 142,
        activeConnections: 89,
        totalDataPoints: 45201
    };

    // Mock Connection Distribution
    const distribution = [
        { name: 'Samsung Health', value: 35, color: 'bg-blue-500' },
        { name: 'Apple Health', value: 25, color: 'bg-gray-800' },
        { name: 'ChatGPT Health', value: 20, color: 'bg-emerald-500' },
        { name: 'Google Fit', value: 10, color: 'bg-yellow-500' },
        { name: 'Withings', value: 5, color: 'bg-gray-400' },
        { name: 'Other', value: 5, color: 'bg-indigo-500' },
    ];

    useEffect(() => {
        // In real implementation, this would fetch from /api/dashboard/admin/integrations
        setStats(mockStats);

        // Mock Logs
        setLogs([
            { id: 1, user: 'John Doe', action: 'Connected Samsung Health', time: '10 mins ago', status: 'success' },
            { id: 2, user: 'Jane Smith', action: 'Sync Failed (Apple Health)', time: '1 hour ago', status: 'error' },
            { id: 3, user: 'Bob Wilson', action: 'Uploaded 500 records', time: '2 hours ago', status: 'success' },
        ]);
    }, []);

    if (user?.role !== 'Admin') return <div className="p-8">Access Denied</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integration Ecosystem</h1>
                <p className="text-gray-500 mt-2">Monitor third-party health data connections and system health.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-400 uppercase">Active Connections</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{stats?.activeConnections}</p>
                    <div className="mt-4 flex items-center text-green-500 text-sm">
                        <span>↑ 12% from last week</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-400 uppercase">Data Points Ingested</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{stats?.totalDataPoints.toLocaleString()}</p>
                    <div className="mt-4 flex items-center text-blue-500 text-sm">
                        <span>Real-time Sync Active</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-400 uppercase">System Status</p>
                    <p className="text-4xl font-bold text-green-500 mt-2">Healthy</p>
                    <div className="mt-4 flex items-center text-gray-400 text-sm">
                        <span>All Agents Operational</span>
                    </div>
                </div>
            </div>

            {/* Distribution & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Distribution Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-6 text-gray-900 dark:text-white">Provider Distribution</h3>
                    <div className="space-y-4">
                        {distribution.map(d => (
                            <div key={d.name}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 dark:text-gray-300">{d.name}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{d.value}%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                    <div className={`${d.color} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${d.value}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Logs */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-6 text-gray-900 dark:text-white">Recent Activity</h3>
                    <div className="space-y-4">
                        {logs.map(log => (
                            <div key={log.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{log.action}</p>
                                        <p className="text-xs text-gray-500">{log.user}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400">{log.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

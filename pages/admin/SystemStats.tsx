import React from 'react';

const SystemStats: React.FC = () => {
    const [stats, setStats] = React.useState<any>(null);
    const [logs, setLogs] = React.useState<any[]>([]);

    React.useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            // Lazy import to avoid circular dependency issues if any
            const { DataService } = await import('../../services/api');
            const data = await DataService.getAdminStats();
            setStats(data);

            const logsData = await DataService.getSystemLogs();
            setLogs(logsData);
        } catch (error) {
            console.error(error);
        }
    };

    const calculatePercentage = (val: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((val / total) * 100);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-heading font-bold text-text-main">System Statistics & AI Usage</h2>

            {/* Real Stats Overview */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 rounded-2xl border-l-4 border-purple-500">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Users</p>
                        <p className="text-3xl font-black text-text-main mt-2">{stats.totalUsers}</p>
                        <p className="text-xs text-purple-600 font-bold mt-1">Registered Users</p>
                    </div>
                    <div className="glass-card p-6 rounded-2xl border-l-4 border-blue-500">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Cases</p>
                        <p className="text-3xl font-black text-text-main mt-2">{stats.activeCases}</p>
                        <p className="text-xs text-blue-600 font-bold mt-1">Currently Open</p>
                    </div>
                    <div className="glass-card p-6 rounded-2xl border-l-4 border-green-500">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">AI Queries (24h)</p>
                        <p className="text-3xl font-black text-text-main mt-2">{stats.aiQueriesToday}</p>
                        <p className="text-xs text-green-600 font-bold mt-1">Interactions</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Token Usage */}
                {stats && stats.token_usage_history && (
                    <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-text-main mb-6">Gemini Token Usage (Last 7 Days)</h3>
                        <div className="h-64 flex items-end justify-between gap-2 px-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                            {stats.token_usage_history.map((day: any, idx: number) => {
                                const maxTokens = Math.max(...stats.token_usage_history.map((d: any) => d.tokens), 10000); // Dynamic max or default 10k
                                const heightPercent = (day.tokens / maxTokens) * 100;
                                return (
                                    <div key={idx} className="w-full bg-primary/20 rounded-t-xl relative group">
                                        <div
                                            className="absolute bottom-0 w-full bg-primary rounded-t-xl transition-all duration-1000 group-hover:bg-primary-hover"
                                            style={{ height: `${Math.max(heightPercent, 2)}%` }} // Min height 2%
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded shadow-lg pointer-events-none transition-opacity whitespace-nowrap">
                                                {day.tokens} Tokens
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-text-muted font-bold uppercase">
                            {stats.token_usage_history.map((day: any, idx: number) => (
                                <span key={idx}>{day.date}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Storage Usage */}
                {stats && stats.storage_stats && (
                    <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-text-main mb-6">Storage Distribution</h3>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6">
                            <div className="space-y-4">
                                {(() => {
                                    const { images_size_gb, documents_size_gb, logs_size_gb } = stats.storage_stats;
                                    const total = images_size_gb + documents_size_gb + logs_size_gb;
                                    // Avoid division by zero
                                    const t = total > 0 ? total : 1;

                                    return (
                                        <>
                                            <div>
                                                <div className="flex justify-between text-sm font-bold text-text-main mb-1">
                                                    <span>Medical Images (DICOM/JPG)</span>
                                                    <span>{calculatePercentage(images_size_gb, t)}% ({images_size_gb} GB)</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${calculatePercentage(images_size_gb, t)}%` }}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm font-bold text-text-main mb-1">
                                                    <span>Patient Documents (PDF)</span>
                                                    <span>{calculatePercentage(documents_size_gb, t)}% ({documents_size_gb} GB)</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${calculatePercentage(documents_size_gb, t)}%` }}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm font-bold text-text-main mb-1">
                                                    <span>System Logs</span>
                                                    <span>{calculatePercentage(logs_size_gb, t)}% ({logs_size_gb} GB)</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${calculatePercentage(logs_size_gb, t)}%` }}></div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Logs Preview */}
            <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700">
                <h3 className="text-lg font-bold text-text-main mb-4">Recent System Logs</h3>
                <div className="bg-black/80 rounded-xl p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto">
                    {logs.length === 0 ? (
                        <p className="text-slate-500">No logs available.</p>
                    ) : (
                        logs.map((log) => (
                            <p key={log.id} className="mb-1">
                                <span className="text-slate-400">[{new Date(log.timestamp).toLocaleString()}]</span>
                                <span className="ml-2 text-yellow-400">[{log.eventType}]</span>
                                <span className="ml-2">{JSON.stringify(log.details)}</span>
                            </p>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemStats;

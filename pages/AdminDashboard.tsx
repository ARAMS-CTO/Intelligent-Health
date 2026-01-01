import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants/index';
import { showToast } from '../components/Toast';
import { DataService } from '../services/api';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeCases: 0,
        aiQueriesToday: 0,
        systemHealth: 'Loading...',
        geminiStatus: 'Checking...',
        dbStatus: 'Checking...'
    });

    const [features, setFeatures] = useState({
        medLM: false,
        voiceAssistant: false,
        ragKnowledge: false,
        autoTriage: false
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsData, configData] = await Promise.all([
                    DataService.getAdminStats(),
                    DataService.getAdminConfig()
                ]);

                // Map camelCase if needed, but the backend returns snake_case in schema
                // Actually the BaseSchema handles to_camel for Pydantic. 
                // Let's assume the API layer returns objects as Pydantic defined them (camelCase if aliased).

                setStats({
                    totalUsers: statsData.totalUsers,
                    activeCases: statsData.activeCases,
                    aiQueriesToday: statsData.aiQueriesToday,
                    systemHealth: statsData.systemHealth,
                    geminiStatus: statsData.geminiStatus,
                    dbStatus: statsData.dbStatus
                });

                setFeatures(configData.features);
            } catch (error) {
                console.error("Failed to load admin data:", error);
                showToast.error("Failed to synchronize with server.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const toggleFeature = async (key: keyof typeof features) => {
        const newFeatures = { ...features, [key]: !features[key] };
        setFeatures(newFeatures);

        try {
            await DataService.updateAdminConfig(newFeatures);
            showToast.success(`Module '${key}' ${newFeatures[key] ? 'Enabled' : 'Disabled'} globally.`);
        } catch (error) {
            // Revert on failure
            setFeatures(features);
            showToast.error("Failed to update feature configuration.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-text-main">System Administration</h1>
                    <p className="text-text-muted">Configuration and Monitoring Console</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${stats.systemHealth === 'Optimal' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${stats.systemHealth === 'Optimal' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    System {stats.systemHealth}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-2xl border-l-4 border-primary">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Total Users</p>
                            <p className="text-3xl font-heading font-bold text-text-main mt-1">{stats.totalUsers}</p>
                        </div>
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-primary">{ICONS.users}</div>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl border-l-4 border-accent">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Active Cases</p>
                            <p className="text-3xl font-heading font-bold text-text-main mt-1">{stats.activeCases}</p>
                        </div>
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-accent">{ICONS.cases}</div>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl border-l-4 border-indigo-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">AI Queries (24h)</p>
                            <p className="text-3xl font-heading font-bold text-text-main mt-1">{stats.aiQueriesToday}</p>
                        </div>
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-indigo-500">{ICONS.ai}</div>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Service Status</p>
                            <p className="text-3xl font-heading font-bold text-text-main mt-1">Active</p>
                        </div>
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-green-500">{ICONS.check}</div>
                    </div>
                </div>
            </div>

            {/* Feature Flags */}
            <div className="glass-card rounded-3xl p-8">
                <h2 className="text-xl font-heading font-bold text-text-main mb-6">Feature Management</h2>
                <div className="space-y-6">
                    {Object.entries(features).map(([key, enabled]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <p className="font-bold text-text-main capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="text-xs text-text-muted">Enable or disable this module globally.</p>
                            </div>
                            <button
                                onClick={() => toggleFeature(key as any)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* API Integration Status */}
            <div className="glass-card rounded-3xl p-8">
                <h2 className="text-xl font-heading font-bold text-text-main mb-6">Integration Status</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] ${stats.geminiStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div className="flex-1">
                            <p className="font-bold text-text-main">Google Gemini API</p>
                            <p className="text-xs text-text-muted">Status: {stats.geminiStatus}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] ${stats.dbStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div className="flex-1">
                            <p className="font-bold text-text-main">Cloud SQL (PostgreSQL)</p>
                            <p className="text-xs text-text-muted">Status: {stats.dbStatus}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/api';
import { useAuth } from '../../components/Auth';
import { HealthIntegrationStatus } from '../../types';

interface IntegrationCardProps {
    id: string;
    name: string;
    description: string;
    icon: string;
    connected: boolean;
    lastSync?: string;
    onConnect: (id: string) => void;
    onDisconnect: (id: string) => void;
    onSync: () => void;
    comingSoon?: boolean;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ id, name, description, icon, connected, lastSync, onConnect, onDisconnect, onSync, comingSoon }) => {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center transition-shadow relative overflow-hidden ${comingSoon ? 'opacity-80' : 'hover:shadow-md'}`}>
            {comingSoon && (
                <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Soon
                </div>
            )}
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                {icon}
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{name}</h3>
            <p className="text-sm text-gray-500 mb-6">{description}</p>

            {connected ? (
                <div className="w-full space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium bg-green-50 dark:bg-green-900/20 py-1.5 rounded-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Active
                    </div>
                    {lastSync && <p className="text-xs text-gray-400">Synced: {new Date(lastSync).toLocaleTimeString()}</p>}

                    <div className="flex gap-2">
                        <button
                            onClick={onSync}
                            className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-200"
                        >
                            Sync Now
                        </button>
                        <button
                            onClick={() => onDisconnect(id)}
                            className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50"
                        >
                            Disconnect
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => !comingSoon && onConnect(id)}
                    disabled={comingSoon}
                    className={`w-full py-2.5 rounded-xl font-medium transition-all ${comingSoon
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/30 hover:-translate-y-0.5'
                        }`}
                >
                    {comingSoon ? "Coming Soon" : "Connect"}
                </button>
            )}
        </div>
    );
};

export const IntegrationsPage: React.FC = () => {
    const { user } = useAuth();
    const [integrations, setIntegrations] = useState<HealthIntegrationStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'samsung' | 'apple' | 'oura'>('samsung');

    const availableProviders = [
        { id: 'google_health', name: 'Samsung Health / Google', description: 'Syncs via Health Connect (Android).', icon: '📲', comingSoon: false },
        { id: 'apple_health', name: 'Apple Health', description: 'Connect your iPhone and Apple Watch.', icon: '🍎', comingSoon: true },
        { id: 'oura', name: 'Oura Ring', description: 'Sleep readiness & recovery metrics.', icon: '💍', comingSoon: false },
        { id: 'fitbit', name: 'Fitbit', description: 'Track activity, heart rate, and sleep.', icon: '⌚', comingSoon: false },
    ];

    const fetchStatus = async () => {
        try {
            const data = await DataService.getIntegrationStatus();
            const local = JSON.parse(localStorage.getItem('poc_integrations') || '[]');
            const merged = [...data.integrations];
            local.forEach((l: any) => {
                if (!merged.find(m => m.provider === l.provider)) {
                    merged.push(l);
                }
            });
            setIntegrations(merged);
        } catch (e) {
            console.error("Failed to load integrations", e);
            // Fallback for demo
            setIntegrations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleConnect = async (providerId: string) => {
        setLoading(true);
        try {
            if (providerId === 'oura') {
                await new Promise(r => setTimeout(r, 1500));
                const newIntegration = {
                    provider: providerId,
                    status: 'active',
                    last_sync: new Date().toISOString()
                };
                setIntegrations(prev => {
                    const filtered = prev.filter(p => p.provider !== providerId);
                    return [...filtered, newIntegration as any];
                });
                const currentLocal = JSON.parse(localStorage.getItem('poc_integrations') || '[]');
                localStorage.setItem('poc_integrations', JSON.stringify([...currentLocal.filter((p: any) => p.provider !== providerId), newIntegration]));
                alert(`Successfully connected to Oura Ring (POC Check Only)`);
                setLoading(false);
                return;
            }

            const url = await DataService.getIntegrationAuthUrl(providerId, window.location.origin);
            window.location.href = url;
        } catch (e: any) {
            alert("Connection failed: " + e.message);
            setLoading(false);
        }
    };

    const handleDisconnect = async (providerId: string) => {
        if (!confirm("Disconnect this provider?")) return;
        setLoading(true);
        try {
            if (providerId === 'oura') {
                const currentLocal = JSON.parse(localStorage.getItem('poc_integrations') || '[]');
                const newLocal = currentLocal.filter((p: any) => p.provider !== providerId);
                localStorage.setItem('poc_integrations', JSON.stringify(newLocal));
                setIntegrations(prev => prev.filter(p => p.provider !== providerId));
                setLoading(false);
                return;
            }

            await DataService.disconnectProvider(providerId);
            await fetchStatus();
        } catch (e) {
            alert("Disconnect failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async (providerId?: string) => {
        setLoading(true);
        try {
            if (providerId) {
                await DataService.syncProvider(providerId);
                alert("Sync started for " + providerId);
            } else {
                const res = await DataService.syncIntegrations();
                alert(`Synced ${res.synced_records || 0} new records!`);
            }
            await fetchStatus();
        } catch (e) {
            alert("Sync failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health Integrations</h1>
                    <p className="text-gray-500 mt-2">
                        Synchronizing your data allows your personal <strong>Health Agent</strong> to monitor trends 24/7.
                        <br />It uses this data to predict risks (like cardiac events) before they happen.
                    </p>
                </div>
                <button
                    onClick={fetchStatus}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    🔄 Refresh Status
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableProviders.map(provider => {
                    const status = integrations.find(i => i.provider === provider.id);
                    const isConnected = status?.status === 'active';

                    // Offline check: if not synced in 24 hours
                    const lastSyncDate = status?.last_sync ? new Date(status.last_sync) : null;
                    const hoursSinceSync = lastSyncDate ? (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60) : 999;
                    const isOnline = isConnected && hoursSinceSync < 24;

                    return (
                        <div key={provider.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center transition-shadow relative overflow-hidden ${provider.comingSoon ? 'opacity-90' : 'hover:shadow-md'}`}>
                            {/* Badge */}
                            {isConnected && (
                                <div className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${isOnline ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                    {isOnline ? 'Online' : 'Offline'}
                                </div>
                            )}

                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                                {provider.icon}
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{provider.name}</h3>
                            <p className="text-sm text-gray-500 mb-6">{provider.description}</p>

                            {/* Data Captured Info */}
                            <div className="text-xs text-gray-400 mb-4 bg-gray-50 dark:bg-gray-900/50 p-2 rounded w-full">
                                <strong>Captures:</strong> Steps, Heart Rate, Activity
                            </div>

                            {isConnected ? (
                                <div className="w-full space-y-3">
                                    <div className="text-xs text-gray-400">Last Synced: {new Date(status?.last_sync || Date.now()).toLocaleTimeString()}</div>
                                    <div className="flex gap-2">
                                        <a
                                            href="/health-trends"
                                            className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary-hover flex items-center justify-center"
                                        >
                                            View Trends ↗
                                        </a>
                                        <button
                                            onClick={() => handleDisconnect(provider.id)}
                                            className="px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                    <button onClick={() => handleSync(provider.id)} className="text-xs text-gray-400 underline hover:text-gray-600">
                                        Force Sync Now
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => !provider.comingSoon && handleConnect(provider.id)}
                                    disabled={provider.comingSoon}
                                    className={`w-full py-2.5 rounded-xl font-medium transition-all ${provider.comingSoon
                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-[1.02]'
                                        }`}
                                >
                                    {provider.comingSoon ? "Coming Soon" : "Connect"}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* SECURITY BADGE */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800 flex items-start gap-4">
                <div className="text-2xl">🛡️</div>
                <div>
                    <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">Blockchain Verified Security</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Your health data is encrypted via ZKP. Grant access only to specific doctors via your Concordium Wallet.
                    </p>
                    <a href="/data-sharing" className="text-xs font-bold text-blue-600 underline mt-1 block">Manage Access Control</a>
                </div>
            </div>

            {/* CONNECTIVITY GUIDE */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Setup Guide</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('samsung')} className={`px-3 py-1 text-sm rounded-lg ${activeTab === 'samsung' ? 'bg-primary text-white' : 'text-gray-500'}`}>Samsung/Android</button>
                        <button onClick={() => setActiveTab('apple')} className={`px-3 py-1 text-sm rounded-lg ${activeTab === 'apple' ? 'bg-primary text-white' : 'text-gray-500'}`}>Apple Health</button>
                    </div>
                </div>

                {activeTab === 'samsung' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                        <div className="flex flex-col gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 mb-2">1</div>
                            <h4 className="font-bold text-sm">Prepare Your Phone</h4>
                            <p className="text-xs text-slate-500">
                                Ensure you have both <strong>Samsung Health</strong> and the <strong>Google Fit</strong> app installed.
                                Go to Samsung Health &gt; Settings &gt; Health Connect and allow all permissions.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 mb-2">2</div>
                            <h4 className="font-bold text-sm">Connect Dashboard</h4>
                            <p className="text-xs text-slate-500">
                                Click the <strong>Connect</strong> button on the "Samsung Health / Google" card above. Log in with the same Google Account used on your phone.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-600 mb-2">3</div>
                            <h4 className="font-bold text-sm">Automatic Sync</h4>
                            <p className="text-xs text-slate-500">
                                Your phone syncs Samsung data to the Google Cloud seamlessly. Our agent reads this to update your risk profile.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'apple' && (
                    <div className="p-4 text-center text-gray-500 animate-fade-in">
                        <p>To connect Apple Health, please install our iOS Companion App (Coming to AppStore).</p>
                        <p className="text-xs mt-2">Currently, you can export your Health XML and upload it manually in 'Files'.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

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
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ id, name, description, icon, connected, lastSync, onConnect, onDisconnect, onSync }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center hover:shadow-md transition-shadow">
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
                    onClick={() => onConnect(id)}
                    className="w-full py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5"
                >
                    Connect
                </button>
            )}
        </div>
    );
};

export const IntegrationsPage: React.FC = () => {
    const { user } = useAuth();
    const [integrations, setIntegrations] = useState<HealthIntegrationStatus[]>([]);
    const [loading, setLoading] = useState(true);

    const availableProviders = [
        { id: 'fitbit', name: 'Fitbit', description: 'Track activity, heart rate, and sleep.', icon: '⌚' },
        { id: 'google_health', name: 'Google Health Connect', description: 'Sync Android fitness data.', icon: '💪' },
        { id: 'apple_health', name: 'Apple Health', description: 'Connect your iPhone and Apple Watch.', icon: '🍎' },
    ];

    const fetchStatus = async () => {
        try {
            const data = await DataService.getIntegrationStatus();
            setIntegrations(data.integrations);
        } catch (e) {
            console.error("Failed to load integrations", e);
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
            // New OAuth Flow
            const url = await DataService.getIntegrationAuthUrl(providerId);
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
                // Sync specific
                await DataService.syncProvider(providerId);
                alert("Sync started for " + providerId);
            } else {
                // Sync all (legacy)
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
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health Integrations</h1>
                    <p className="text-gray-500 mt-2">Connect your devices and apps to share data with your care team.</p>
                </div>
                <button
                    onClick={fetchStatus}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    🔄
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableProviders.map(provider => {
                    const status = integrations.find(i => i.provider === provider.id);
                    const isConnected = status?.status === 'active';

                    return (
                        <IntegrationCard
                            key={provider.id}
                            id={provider.id}
                            name={provider.name}
                            description={provider.description}
                            icon={provider.icon}
                            connected={isConnected}
                            lastSync={status?.last_sync}
                            onConnect={handleConnect}
                            onDisconnect={handleDisconnect}
                            onSync={() => handleSync(provider.id)}
                        />
                    );
                })}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800 flex items-start gap-4">
                <div className="text-2xl">🛡️</div>
                <div>
                    <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">Privacy & Security</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Your health data is encrypted and only shared with your assigned medical team.
                        You can revoke access to any provider at any time.
                    </p>
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';

export const ConnectDevice: React.FC = () => {
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadStatus = async () => {
        try {
            // This relies on the getIntegrationStatus API returning a list
            // For now we might Mock it if the backend just returns basic status
            // But let's assume we want to show buttons for known providers
            const status = await DataService.getIntegrationStatus();
            // The backend returns { integrations: [] } usually
            // We can also just show the list of supported providers manually for now
            // since getIntegrationStatus might be empty initially
            setIntegrations(status.integrations || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const handleConnect = async (provider: string) => {
        setLoading(true);
        setError("");
        try {
            // 1. Get Auth URL
            const url = await DataService.getIntegrationAuthUrl(provider);
            // 2. Redirect
            window.location.href = url;
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    };

    const handleSync = async (provider: string) => {
        setLoading(true);
        try {
            await DataService.syncProvider(provider);
            alert("Sync started!");
        } catch (e) {
            alert("Sync failed");
        } finally {
            setLoading(false);
        }
    };

    const providers = [
        { id: 'fitbit', name: 'Fitbit', icon: '⌚' },
        { id: 'google_health', name: 'Google Health Connect', icon: '📱' },
        { id: 'apple_health', name: 'Apple Health', icon: '🍎' }
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Linked Devices</h3>

            {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}

            <div className="space-y-4">
                {providers.map(p => {
                    const linked = integrations.find((i: any) => i.provider === p.id && i.status === 'active');

                    return (
                        <div key={p.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl" role="img" aria-label={p.name}>{p.icon}</span>
                                <div>
                                    <p className="font-medium text-gray-900">{p.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {linked ? `Last synced: ${new Date(linked.last_sync || Date.now()).toLocaleDateString()}` : "Not connected"}
                                    </p>
                                </div>
                            </div>

                            <div>
                                {linked ? (
                                    <div className="space-x-2">
                                        <button
                                            onClick={() => handleSync(p.id)}
                                            disabled={loading}
                                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                            Sync
                                        </button>
                                        <button className="px-3 py-1 text-sm text-gray-500 hover:text-red-500">
                                            Manage
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleConnect(p.id)}
                                        disabled={loading}
                                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        Connect
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


import React, { useState, useEffect } from 'react';

export default function AdminFinanceSettings() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/billing/config', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (gateway: string) => {
        if (!config) return;
        const newGateways = { ...config.payment_gateways, [gateway]: !config.payment_gateways[gateway] };
        setConfig({ ...config, payment_gateways: newGateways });
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            await fetch('/api/billing/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(config)
            });
            alert("Settings Saved");
        } catch (e) {
            alert("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!config) return <div>Error loading config</div>;

    return (
        <div className="glass-card rounded-3xl p-8 mt-8">
            <h2 className="text-xl font-heading font-bold text-text-main mb-6">Finance Settings</h2>

            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                        <h3 className="font-bold text-text-main">PayPal Integration</h3>
                        <p className="text-xs text-text-muted">Enable PayPal for patient top-ups.</p>
                    </div>
                    <button
                        onClick={() => handleToggle('paypal')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${config.payment_gateways?.paypal ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.payment_gateways?.paypal ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                        <h3 className="font-bold text-text-main">Stripe Integration</h3>
                        <p className="text-xs text-text-muted">Enable Stripe for credit cards (Beta).</p>
                    </div>
                    <button
                        onClick={() => handleToggle('stripe')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${config.payment_gateways?.stripe ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.payment_gateways?.stripe ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={saveConfig} disabled={saving} className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl transition-colors font-bold shadow-lg shadow-primary/30">
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

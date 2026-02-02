import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/api';
import { Transaction } from '../../types/index';
import { showToast } from '../../components/Toast';

const Finance: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        setIsLoading(true);
        try {
            const data = await DataService.getTransactions();
            setTransactions(data);
        } catch (error) {
            console.error(error);
            showToast.error("Failed to load financial data");
        } finally {
            setIsLoading(false);
        }
    };

    const totalRevenue = transactions.reduce((acc, curr) => acc + (curr.status === 'Paid' ? curr.amount : 0), 0);
    const activeSubs = transactions.filter(t => t.type === 'Subscription' && t.status === 'Paid').length;
    const pendingAmount = transactions.reduce((acc, curr) => acc + (curr.status === 'Pending' ? curr.amount : 0), 0);

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-heading font-bold text-text-main">Financial Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl border-l-4 border-green-500">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Revenue</p>
                    <p className="text-3xl font-black text-text-main mt-2">${totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-green-600 font-bold mt-1">Gross Volume</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border-l-4 border-blue-500">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Subscriptions</p>
                    <p className="text-3xl font-black text-text-main mt-2">{activeSubs}</p>
                    <p className="text-xs text-blue-600 font-bold mt-1">Paid Users</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border-l-4 border-orange-500">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Pending Invoices</p>
                    <p className="text-3xl font-black text-text-main mt-2">${pendingAmount.toFixed(2)}</p>
                    <p className="text-xs text-orange-600 font-bold mt-1">{transactions.filter(t => t.status === 'Pending').length} invoices overdue</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Transaction History */}
                <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-text-main mb-4">Recent Transactions</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Transaction ID</th>
                                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="text-center py-8">Loading transactions...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8">No transactions found.</td></tr>
                                ) : transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30">
                                        <td className="px-6 py-4 text-sm font-mono text-text-muted">{tx.id}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-text-main">{tx.userName}</td>
                                        <td className="px-6 py-4 text-sm text-text-muted">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-text-main">${tx.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${tx.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Configuration */}
                <PaymentConfigSection />
            </div>
        </div>
    );
};

const PaymentConfigSection: React.FC = () => {
    const [config, setConfig] = useState<any>({ accepted_currencies: [], payment_gateways: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        DataService.getBillingConfig().then(setConfig).finally(() => setLoading(false));
    }, []);

    const toggleGateway = async (gateway: string) => {
        const updated = {
            ...config,
            payment_gateways: { ...config.payment_gateways, [gateway]: !config.payment_gateways[gateway] }
        };
        setConfig(updated);
        await DataService.updateBillingConfig(updated);
        showToast.success("Updated Gateway Settings");
    };

    const toggleCurrency = async (curr: string) => {
        let newCurrencies = [...config.accepted_currencies];
        if (newCurrencies.includes(curr)) {
            newCurrencies = newCurrencies.filter(c => c !== curr);
        } else {
            newCurrencies.push(curr);
        }
        const updated = { ...config, accepted_currencies: newCurrencies };
        setConfig(updated);
        await DataService.updateBillingConfig(updated);
    };

    if (loading) return <div className="p-4">Loading Config...</div>;

    return (
        <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700 h-fit">
            <h3 className="text-lg font-bold text-text-main mb-6">Payment Configuration</h3>

            <div className="space-y-6">
                <div>
                    <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Gateways</h4>
                    <div className="space-y-3">
                        {['paypal', 'stripe', 'wechat'].map(gw => (
                            <label key={gw} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                                <span className="capitalize font-bold text-text-main">{gw === 'wechat' ? 'WeChat Pay' : gw}</span>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${config.payment_gateways[gw] ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} onClick={(e) => { e.preventDefault(); toggleGateway(gw); }}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${config.payment_gateways[gw] ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Accepted Currencies</h4>
                    <div className="flex flex-wrap gap-2">
                        {['USD', 'EUR', 'GBP', 'AED', 'CNY', 'RUB', 'JPY'].map(curr => (
                            <button
                                key={curr}
                                onClick={() => toggleCurrency(curr)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${config.accepted_currencies.includes(curr) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-transparent text-text-muted border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                            >
                                {curr}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Connect Integration for Payouts */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Provider Onboarding</h4>
                <p className="text-xs text-text-muted mb-4">Onboard Pharmacies & Insurance Providers to Stripe Connect for automated payouts.</p>

                <button
                    onClick={async () => {
                        try {
                            showToast.loading("Generating onboarding link...");
                            const res = await DataService.createStripeConnectAccount(); // Uses current user email mock
                            window.location.href = res.onboarding_url;
                        } catch (e) { showToast.error("Failed to start onboarding"); }
                    }}
                    className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                    <span>🔗</span> Connect Stripe Account
                </button>
            </div>
        </div>
    );
};

export default Finance;

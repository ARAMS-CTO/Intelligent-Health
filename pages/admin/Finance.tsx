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
        </div>
    );
};

export default Finance;

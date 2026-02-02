import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';

export default function AdminUserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionUser, setActionUser] = useState<any | null>(null);
    const [actionType, setActionType] = useState<'credits' | null>(null);
    const [amount, setAmount] = useState(10);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await DataService.getAdminUsers(search);
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(loadUsers, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleAction = async (userId: string, action: 'deactivate' | 'reset-password') => {
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            await DataService.adminUserAction(userId, action);
            showToast.success(`Action ${action} successful`);
        } catch (e) {
            showToast.error("Action failed");
        }
    };

    const handleGrantCredits = async () => {
        if (!actionUser) return;
        try {
            await DataService.adminUserAction(actionUser.id, 'credits', { amount });
            showToast.success(`Granted ${amount} credits to ${actionUser.name}`);
            setActionUser(null);
            setActionType(null);
            loadUsers(); // refresh
        } catch (e) {
            showToast.error("Grant failed");
        }
    };

    return (
        <div className="glass-card rounded-3xl p-8 mt-8">
            <h2 className="text-xl font-heading font-bold text-text-main mb-6">User Management</h2>

            <div className="mb-6">
                <input
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl transition-all focus:ring-2 focus:ring-primary"
                    placeholder="Search users by name or email..."
                    value={search} onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-text-muted">
                            <th className="p-3">User</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Credits</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-3">
                                    <div className="font-bold">{u.name}</div>
                                    <div className="text-xs text-text-muted">{u.email}</div>
                                </td>
                                <td className="p-3">
                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold uppercase">{u.role}</span>
                                </td>
                                <td className="p-3 font-mono">{u.credits?.toFixed(2) || '0.00'}</td>
                                <td className="p-3 text-right space-x-2">
                                    <button
                                        onClick={() => { setActionUser(u); setActionType('credits'); }}
                                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold hover:bg-green-200"
                                    >
                                        + Credits
                                    </button>
                                    <button
                                        onClick={() => handleAction(u.id, 'reset-password')}
                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200"
                                    >
                                        Reset PW
                                    </button>
                                    <button
                                        onClick={() => handleAction(u.id, 'deactivate')}
                                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold hover:bg-red-200"
                                    >
                                        Ban
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!loading && users.length === 0 && (
                            <tr><td colSpan={4} className="text-center p-8 text-text-muted">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {actionType === 'credits' && actionUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
                        <h3 className="font-bold mb-4">Grant Credits to {actionUser.name}</h3>
                        <input
                            type="number" className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg mb-4"
                            value={amount} onChange={e => setAmount(parseFloat(e.target.value))}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setActionType(null)} className="px-4 py-2 text-gray-500">Cancel</button>
                            <button onClick={handleGrantCredits} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold">Grant</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

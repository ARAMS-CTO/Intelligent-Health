import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataService } from '../../services/api';
import { User, Role } from '../../types/index';
import { ICONS } from '../../constants/index';
import { showToast } from '../../components/Toast';

const UserManagement: React.FC = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await DataService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
            showToast.error(t('common.errorLoad', 'Failed to load users'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm(t('userManagement.confirmDelete', 'Are you sure you want to delete this user? This cannot be undone.'))) return;
        try {
            await DataService.deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
            showToast.success(t('userManagement.deleteSuccess', 'User deleted successfully'));
        } catch (error) {
            showToast.error(t('userManagement.deleteError', 'Failed to delete user'));
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-heading font-bold text-text-main">{t('userManagement.title', 'User Management')}</h2>
                    <p className="text-text-muted">{t('userManagement.subtitle', 'Manage doctors, patients, and administrators.')}</p>
                </div>
                <button onClick={loadUsers} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/20 dark:border-slate-700">
                <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-white/10 dark:border-slate-700 mb-6">
                    <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder={t('userManagement.searchPlaceholder', 'Search users by name or email...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm w-full"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-bold text-xs text-text-muted uppercase tracking-wider">{t('userManagement.tableUser', 'User')}</th>
                                <th className="px-6 py-4 font-bold text-xs text-text-muted uppercase tracking-wider">{t('userManagement.tableRole', 'Role')}</th>
                                <th className="px-6 py-4 font-bold text-xs text-text-muted uppercase tracking-wider">{t('userManagement.tableStatus', 'Status')}</th>
                                <th className="px-6 py-4 font-bold text-xs text-text-muted uppercase tracking-wider">{t('userManagement.tableActions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {isLoading ? (
                                <tr><td colSpan={4} className="text-center py-8 text-text-muted">{t('common.loading', 'Loading users...')}</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-8 text-text-muted">{t('userManagement.noUsers', 'No users found.')}</td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-text-muted">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-main">{user.name}</p>
                                                <p className="text-xs text-text-muted">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${user.role === Role.Admin ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                            user.role === Role.Doctor ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                'bg-green-100 text-green-700 border-green-200'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-2 text-xs font-bold text-green-600">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span> {t('status.active', 'Active')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleDelete(user.id)} className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors" title={t('common.delete', 'Delete')}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
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

export default UserManagement;

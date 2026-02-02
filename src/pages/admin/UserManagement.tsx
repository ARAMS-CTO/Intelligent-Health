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

    // Modal States
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [resettingUser, setResettingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ name: '', role: '' });
    const [password, setPassword] = useState('');

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

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setEditForm({ name: user.name, role: user.role });
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            const updated = await DataService.updateUser(editingUser.id, editForm);
            setUsers(users.map(u => u.id === editingUser.id ? updated : u));
            setEditingUser(null);
            showToast.success("User updated successfully");
        } catch (error) {
            showToast.error("Failed to update user");
        }
    };

    const handleResetClick = (user: User) => {
        setResettingUser(user);
        setPassword('');
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resettingUser) return;
        if (password.length < 6) {
            showToast.error("Password must be at least 6 characters");
            return;
        }
        try {
            await DataService.resetUserPassword(resettingUser.id, password);
            setResettingUser(null);
            showToast.success("Password reset successfully");
        } catch (error) {
            showToast.error("Failed to reset password");
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
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleEditClick(user)} className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors" title="Edit">
                                                {ICONS.edit || <span className="text-sm">Edit</span>}
                                            </button>
                                            <button onClick={() => handleResetClick(user)} className="text-orange-500 hover:bg-orange-500/10 p-2 rounded-lg transition-colors" title="Reset Password">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors" title={t('common.delete', 'Delete')}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
                        <h3 className="text-xl font-bold mb-4 text-text-main">Edit User</h3>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Role</label>
                                <select
                                    value={editForm.role}
                                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                >
                                    {Object.values(Role).map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resettingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
                        <h3 className="text-xl font-bold mb-4 text-text-main">Reset Password</h3>
                        <p className="text-sm text-text-muted mb-4">Reset password for <strong>{resettingUser.name}</strong></p>
                        <form onSubmit={handleResetSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    placeholder="Enter new password (min 6 chars)"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setResettingUser(null)} className="px-4 py-2 text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Reset Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService, GeminiService } from '../services/api';
import { ICONS } from '../constants/index';
import { showToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const ManagerDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation('dashboard');
    const [stats, setStats] = useState<any>(null);
    const [finances, setFinances] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            // Mock data fetch for demo if real endpoints missing
            try {
                // In real app, fetch from specialized endpoints
                const sysStats = await DataService.getDashboardStats(user?.id || 'me');
                // Mock financial data
                const financeData = {
                    revenue: 125000,
                    expenses: 45000,
                    pendingClaims: 12
                };
                setStats(sysStats);
                setFinances(financeData);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user]);

    if (!user) return null;

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen p-8">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-slate-800 dark:text-white">
                    Executive <span className="text-primary">Dashboard</span>
                </h1>
                <p className="text-slate-500 mt-2">Hospital Management & Financial Overview</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {/* Financial Card */}
                <div className="glass-card p-8 rounded-[32px] border border-white/20 dark:border-slate-700/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-100 text-green-600 rounded-xl">{ICONS.money}</div>
                            <h3 className="font-bold text-xl text-slate-700 dark:text-slate-200">Revenue (MTD)</h3>
                        </div>
                        <p className="text-4xl font-black text-slate-900 dark:text-white mb-2">
                            ${finances?.revenue?.toLocaleString() || '0'}
                        </p>
                        <div className="flex items-center gap-2 text-sm font-bold text-green-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            <span>+12% vs last month</span>
                        </div>
                    </div>
                </div>

                {/* Expenses Card */}
                <div className="glass-card p-8 rounded-[32px] border border-white/20 dark:border-slate-700/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-100 text-red-600 rounded-xl">{ICONS.chart}</div>
                            <h3 className="font-bold text-xl text-slate-700 dark:text-slate-200">Expenses</h3>
                        </div>
                        <p className="text-4xl font-black text-slate-900 dark:text-white mb-2">
                            ${finances?.expenses?.toLocaleString() || '0'}
                        </p>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                            <span>Stable</span>
                        </div>
                    </div>
                </div>

                {/* Claims Card */}
                <div className="glass-card p-8 rounded-[32px] border border-white/20 dark:border-slate-700/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">{ICONS.document}</div>
                            <h3 className="font-bold text-xl text-slate-700 dark:text-slate-200">Pending Claims</h3>
                        </div>
                        <p className="text-4xl font-black text-slate-900 dark:text-white mb-2">
                            {finances?.pendingClaims || 0}
                        </p>
                        <Link to="/billing" className="text-sm font-bold text-primary hover:underline">View All Claims &rarr;</Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Insights Panel */}
                <div className="glass-card p-8 rounded-[32px] border border-white/20 dark:border-slate-700/50">
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        {ICONS.ai} AI Operational Insights
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800">
                            <h4 className="font-bold text-purple-700 dark:text-purple-300 text-sm uppercase tracking-wider mb-2">Staffing Efficiency</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Nurse utilization is high on weekends. Consider adjusting shifts to reduce overtime costs by projected 15%.
                            </p>
                        </div>
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800">
                            <h4 className="font-bold text-amber-700 dark:text-amber-300 text-sm uppercase tracking-wider mb-2">Resource Alert</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                MRI utilization is below capacity (65%). Marketing outreach recommended for orthopedic referrals.
                            </p>
                        </div>
                    </div>
                </div>

                {/* System Activity */}
                <div className="glass-card p-8 rounded-[32px] border border-white/20 dark:border-slate-700/50">
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-6">System Activity</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <span className="font-medium text-slate-600 dark:text-slate-300">New User Registrations</span>
                            <span className="font-bold text-slate-900 dark:text-white">today</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Backup Completed</span>
                            <span className="font-bold text-green-500">Success</span>
                        </div>
                        <div className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Database Load</span>
                            <span className="font-bold text-slate-900 dark:text-white">12%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;


import React from 'react';
import { useAuth } from '../components/Auth';
import { ICONS } from '../constants/index';

const ComplianceDashboard: React.FC = () => {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen p-8">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-slate-800 dark:text-white">
                    Compliance <span className="text-primary">Audit Log</span>
                </h1>
                <p className="text-slate-500 mt-2">HIPAA/GDPR Monitoring & Access Control</p>
            </header>

            <div className="glass-card p-8 rounded-[32px] border border-white/20 dark:border-slate-700/50">
                <div className="flex items-center gap-4 mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <div className="text-amber-600">{ICONS.riskHigh}</div>
                    <div>
                        <h3 className="font-bold text-amber-800 dark:text-amber-200">System Status: Compliant</h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300">All data encryption and access logging modules are active.</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Event</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            <tr>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">2024-03-20 10:42:01</td>
                                <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">Medical Record Access</td>
                                <td className="px-6 py-4 text-sm">Dr. Smith</td>
                                <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">INFO</span></td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">2024-03-20 09:15:22</td>
                                <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">Login Attempt (Failed)</td>
                                <td className="px-6 py-4 text-sm">Unknown IP</td>
                                <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-bold">WARN</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ComplianceDashboard;

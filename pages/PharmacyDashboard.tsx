import React, { useState } from 'react';
import { ICONS } from '../constants/index';
// @ts-ignore
import { User } from '../types/index';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../components/Toast';

const PharmacyDashboard: React.FC = () => {
    const navigate = useNavigate();

    // Mock Data for Demo
    const [prescriptions, setPrescriptions] = useState([
        { id: 'RX-001', patient: 'Aram Ghannad', medication: 'Amoxicillin 500mg', doctor: 'Dr. Mario Sonati', status: 'Pending', date: '2025-10-24 10:30 AM' },
        { id: 'RX-002', patient: 'Sarah Jones', medication: 'Lisinopril 10mg', doctor: 'Dr. Mario Sonati', status: 'Ready', date: '2025-10-24 09:15 AM' },
        { id: 'RX-003', patient: 'Michael Brown', medication: 'Metformin 850mg', doctor: 'Dr. Emily Chen', status: 'Pending', date: '2025-10-24 11:00 AM' },
    ]);

    const handleDispense = (id: string) => {
        setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: 'Dispensed' } : p));
        showToast.success(`Prescription ${id} Marked as Dispensed`);
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen p-6">
            <div className="container mx-auto max-w-6xl">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main flex items-center gap-3">
                            {ICONS.pill} Pharmacy Control
                        </h1>
                        <p className="text-text-muted mt-2">Prescription Fulfillment & Inventory</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-bold uppercase text-text-muted block">Shift Status</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-2">● Active</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                        <div className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">Pending Orders</div>
                        <div className="text-4xl font-bold">{prescriptions.filter(p => p.status === 'Pending').length}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="text-text-muted text-xs font-bold uppercase tracking-wider mb-2">Ready for Pickup</div>
                        <div className="text-4xl font-bold text-text-main">{prescriptions.filter(p => p.status === 'Ready').length}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="text-text-muted text-xs font-bold uppercase tracking-wider mb-2">Dispensed Today</div>
                        <div className="text-4xl font-bold text-blue-500">142</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="text-text-muted text-xs font-bold uppercase tracking-wider mb-2">Low Stock Alerts</div>
                        <div className="text-4xl font-bold text-red-500">3</div>
                    </div>
                </div>

                {/* Main Queue */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <h2 className="text-xl font-bold text-text-main">Live Prescription Queue</h2>
                        <input
                            placeholder="Search Patient or RX ID..."
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-bold uppercase text-text-muted">
                            <tr>
                                <th className="px-6 py-4">Receipt Info</th>
                                <th className="px-6 py-4">Medication</th>
                                <th className="px-6 py-4">Prescribing Doctor</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {prescriptions.map((rx) => (
                                <tr key={rx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-text-main">{rx.id}</div>
                                        <div className="text-xs text-text-muted">{rx.date}</div>
                                        <div className="text-sm font-medium text-primary mt-1">{rx.patient}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-medium text-text-main">
                                        {rx.medication}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-muted">
                                        {rx.doctor}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${rx.status === 'Pending' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                                rx.status === 'Ready' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            }`}>
                                            {rx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {rx.status !== 'Dispensed' && (
                                            <button
                                                onClick={() => handleDispense(rx.id)}
                                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-sm transition-all"
                                            >
                                                Dispense
                                            </button>
                                        )}
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

export default PharmacyDashboard;

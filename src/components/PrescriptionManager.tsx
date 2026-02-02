import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';

interface Prescription {
    id: string;
    medication: string;
    dosage: string;
    frequency: string;
    prescribedBy: string;
    prescribedDate: string;
    refillsRemaining: number;
    lastFilled: string;
    nextRefillDate: string;
    status: 'Active' | 'Expired' | 'Pending Refill' | 'Discontinued';
    instructions?: string;
}

export const PrescriptionManager: React.FC = () => {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
    const [showRefillModal, setShowRefillModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    // Mock data
    const mockPrescriptions: Prescription[] = [
        {
            id: '1',
            medication: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            prescribedBy: 'Dr. Smith',
            prescribedDate: '2026-01-01',
            refillsRemaining: 3,
            lastFilled: '2026-01-10',
            nextRefillDate: '2026-02-10',
            status: 'Active',
            instructions: 'Take in the morning with food'
        },
        {
            id: '2',
            medication: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            prescribedBy: 'Dr. Johnson',
            prescribedDate: '2025-12-15',
            refillsRemaining: 2,
            lastFilled: '2026-01-05',
            nextRefillDate: '2026-02-05',
            status: 'Active',
            instructions: 'Take with meals'
        },
        {
            id: '3',
            medication: 'Atorvastatin',
            dosage: '20mg',
            frequency: 'Once daily at bedtime',
            prescribedBy: 'Dr. Smith',
            prescribedDate: '2025-11-20',
            refillsRemaining: 0,
            lastFilled: '2025-12-20',
            nextRefillDate: '2026-01-20',
            status: 'Pending Refill',
            instructions: 'Take at bedtime'
        },
    ];

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            setPrescriptions(mockPrescriptions);
            setIsLoading(false);
        }, 500);
    }, []);

    const handleRequestRefill = async (rxId: string) => {
        try {
            // API call would go here
            showToast.success('Refill request sent to your pharmacy');
            setPrescriptions(prev => prev.map(rx =>
                rx.id === rxId ? { ...rx, status: 'Pending Refill' as const } : rx
            ));
            setShowRefillModal(false);
        } catch (e) {
            showToast.error('Failed to request refill');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'Pending Refill': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            case 'Expired': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const needsRefillSoon = (rx: Prescription) => {
        const daysUntilRefill = Math.ceil(
            (new Date(rx.nextRefillDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilRefill <= 7 && rx.status === 'Active';
    };

    const activePrescriptions = prescriptions.filter(rx => rx.status !== 'Discontinued');
    const needingRefill = activePrescriptions.filter(rx => needsRefillSoon(rx) || rx.status === 'Pending Refill');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    💊 My Prescriptions
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'active'
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                    >
                        Active ({activePrescriptions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'history'
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                    >
                        History
                    </button>
                </div>
            </div>

            {/* Refill Alert */}
            {needingRefill.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div className="flex-1">
                            <p className="font-bold text-amber-700 dark:text-amber-300">
                                {needingRefill.length} medication{needingRefill.length > 1 ? 's' : ''} need{needingRefill.length === 1 ? 's' : ''} attention
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                {needingRefill.map(rx => rx.medication).join(', ')}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowRefillModal(true)}
                            className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
                        >
                            Request Refills
                        </button>
                    </div>
                </div>
            )}

            {/* Prescriptions List */}
            {isLoading ? (
                <div className="text-center py-12 text-slate-400">Loading prescriptions...</div>
            ) : (
                <div className="space-y-4">
                    {activePrescriptions.map(rx => (
                        <div
                            key={rx.id}
                            className="glass-card p-5 rounded-2xl border border-white/20 dark:border-slate-700/50 hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => setSelectedRx(rx)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusStyle(rx.status)}`}>
                                            {rx.status}
                                        </span>
                                        {needsRefillSoon(rx) && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 animate-pulse">
                                                Refill Soon
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                                        {rx.medication} {rx.dosage}
                                    </h3>
                                    <p className="text-sm text-slate-500">{rx.frequency}</p>
                                </div>
                                <div className="text-4xl opacity-50">💊</div>
                            </div>

                            <div className="flex items-center gap-6 text-xs text-slate-500 mb-3">
                                <span>👨‍⚕️ {rx.prescribedBy}</span>
                                <span>📅 Next refill: {new Date(rx.nextRefillDate).toLocaleDateString()}</span>
                                <span>🔄 {rx.refillsRemaining} refills left</span>
                            </div>

                            {rx.instructions && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm">
                                    <span className="font-bold text-blue-700 dark:text-blue-300">Instructions: </span>
                                    <span className="text-blue-600 dark:text-blue-400">{rx.instructions}</span>
                                </div>
                            )}

                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRequestRefill(rx.id); }}
                                    disabled={rx.refillsRemaining === 0 || rx.status === 'Pending Refill'}
                                    className="flex-1 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {rx.status === 'Pending Refill' ? 'Refill Requested' : 'Request Refill'}
                                </button>
                                <button className="py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm">
                                    Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bulk Refill Modal */}
            {showRefillModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-md">
                        <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-4">
                            Request Refills
                        </h3>
                        <div className="space-y-3 mb-6">
                            {needingRefill.map(rx => (
                                <div key={rx.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary" />
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{rx.medication} {rx.dosage}</p>
                                        <p className="text-xs text-slate-500">{rx.refillsRemaining} refills remaining</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowRefillModal(false)}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    needingRefill.forEach(rx => handleRequestRefill(rx.id));
                                }}
                                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl"
                            >
                                Send Requests
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Prescription Detail Modal */}
            {selectedRx && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-2xl text-slate-800 dark:text-white">
                                    {selectedRx.medication}
                                </h3>
                                <p className="text-slate-500">{selectedRx.dosage} • {selectedRx.frequency}</p>
                            </div>
                            <button onClick={() => setSelectedRx(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Instructions</p>
                                <p className="text-slate-600 dark:text-slate-400">{selectedRx.instructions || 'No special instructions'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Prescribed By</p>
                                    <p className="font-bold text-slate-800 dark:text-white">{selectedRx.prescribedBy}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Date Prescribed</p>
                                    <p className="font-bold text-slate-800 dark:text-white">
                                        {new Date(selectedRx.prescribedDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Last Filled</p>
                                    <p className="font-bold text-slate-800 dark:text-white">
                                        {new Date(selectedRx.lastFilled).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Refills Remaining</p>
                                    <p className="font-bold text-slate-800 dark:text-white">{selectedRx.refillsRemaining}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setSelectedRx(null)}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => { handleRequestRefill(selectedRx.id); setSelectedRx(null); }}
                                disabled={selectedRx.refillsRemaining === 0}
                                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
                            >
                                Request Refill
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrescriptionManager;

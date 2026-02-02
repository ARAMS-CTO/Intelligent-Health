import React, { useState } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
// @ts-ignore
import { User } from '../types/index';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SpecialistAgentChat } from '../components/specialized/SpecialistAgentChat';

const PharmacyDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    // Real Data State
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadQueue = async () => {
        setIsLoading(true);
        try {
            const data = await DataService.getPharmacyQueue(); // Fetch all
            setPrescriptions(data.map(rx => ({
                id: rx.id,
                patient: rx.patient?.name || "Unknown",
                medication: rx.medication_name + " " + rx.dosage,
                doctor: rx.doctor?.name || "Unknown",
                status: rx.status,
                date: new Date(rx.created_at).toLocaleString()
            })));
        } catch (e) {
            console.error("Pharmacy Load Error", e);
            showToast.error("Failed to load queue");
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        loadQueue();
    }, []);

    const [selectedRx, setSelectedRx] = useState<any | null>(null);
    const [insuranceCheck, setInsuranceCheck] = useState<{ status: string, coPay: number } | null>(null);
    const [processing, setProcessing] = useState(false);

    const openDispenseModal = (rx: any) => {
        setSelectedRx(rx);
        setInsuranceCheck(null); // Reset
    };

    const checkInsurance = async () => {
        setProcessing(true);
        // Mock API Call
        setTimeout(() => {
            setInsuranceCheck({ status: 'Approved', coPay: 15.00 });
            setProcessing(false);
        }, 1000);
    };

    const confirmDispense = async () => {
        if (!selectedRx) return;
        setProcessing(true);
        try {
            await DataService.dispensePrescription(selectedRx.id);
            setPrescriptions(prev => prev.map(p => p.id === selectedRx.id ? { ...p, status: 'Dispensed' } : p));
            showToast.success(`Prescription Dispensed. Co-pay: $${insuranceCheck?.coPay || 0}`);
            setSelectedRx(null);
        } catch (e) {
            showToast.error("Failed to dispense");
        } finally {
            setProcessing(false);
        }
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
                    <div className="flex gap-4">
                        <button onClick={() => setIsAiModalOpen(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform flex items-center gap-2">
                            {ICONS.ai} Ask AI Pharmacist
                        </button>
                        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <span className="text-xs font-bold uppercase text-text-muted block">Shift Status</span>
                            <span className="text-emerald-500 font-bold flex items-center gap-2">● Active</span>
                        </div>
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
                                                onClick={() => openDispenseModal(rx)}
                                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-sm transition-all"
                                            >
                                                Process
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dispense Modal */}
            {selectedRx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-xl font-bold mb-4">Dispense Config</h3>

                        <div className="bg-slate-50 p-4 rounded-xl mb-6 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Medication</span>
                                <span className="font-bold">{selectedRx.medication}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Market Price</span>
                                <span className="font-bold">$125.00</span>
                            </div>
                        </div>

                        {!insuranceCheck ? (
                            <div className="text-center py-4">
                                <button
                                    onClick={checkInsurance} disabled={processing}
                                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                                >
                                    {processing ? 'Checking...' : 'Check Insurance Coverage'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-green-800">✅ Coverage Active</span>
                                        <span className="text-xs text-green-600">BlueCross PPO</span>
                                    </div>
                                    <div className="flex justify-between text-lg">
                                        <span>Patient Co-pay:</span>
                                        <span className="font-black">${insuranceCheck.coPay.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={confirmDispense} disabled={processing}
                                    className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                                >
                                    {processing ? 'Dispensing...' : `Confirm & Charge $${insuranceCheck.coPay.toFixed(2)}`}
                                </button>
                            </div>
                        )}

                        <button onClick={() => setSelectedRx(null)} className="w-full mt-4 py-2 text-gray-400 font-bold hover:text-gray-600">Close</button>
                    </div>
                </div>
            )}
            {/* AI Assistant Modal */}
            <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)}>
                <div className="w-[800px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
                    <SpecialistAgentChat zone="pharmacy" contextId="drug-interaction-check" />
                </div>
            </Modal>
        </div>
    );
};

export default PharmacyDashboard;

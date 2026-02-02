import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';

interface InsurancePlan {
    id: string;
    provider: string;
    planName: string;
    memberId: string;
    groupNumber: string;
    type: 'PPO' | 'HMO' | 'EPO' | 'POS';
    status: 'Active' | 'Inactive' | 'Pending';
    effectiveDate: string;
    expirationDate: string;
    deductible: { total: number; met: number };
    outOfPocketMax: { total: number; met: number };
    copays: { primaryCare: number; specialist: number; emergency: number; prescription: number };
}

interface Claim {
    id: string;
    date: string;
    provider: string;
    service: string;
    amount: number;
    insurancePaid: number;
    patientOwes: number;
    status: 'Pending' | 'Processed' | 'Denied' | 'Appealed';
}

export const InsuranceCard: React.FC = () => {
    const [plan, setPlan] = useState<InsurancePlan | null>(null);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'claims' | 'benefits'>('overview');
    const [showCardModal, setShowCardModal] = useState(false);

    // Mock data
    const mockPlan: InsurancePlan = {
        id: '1',
        provider: 'Blue Cross Blue Shield',
        planName: 'Premium PPO 500',
        memberId: 'XYZ123456789',
        groupNumber: 'GRP001234',
        type: 'PPO',
        status: 'Active',
        effectiveDate: '2026-01-01',
        expirationDate: '2026-12-31',
        deductible: { total: 500, met: 350 },
        outOfPocketMax: { total: 3000, met: 850 },
        copays: { primaryCare: 25, specialist: 50, emergency: 150, prescription: 15 }
    };

    const mockClaims: Claim[] = [
        { id: '1', date: '2026-01-15', provider: 'City Medical Center', service: 'Annual Physical', amount: 250, insurancePaid: 225, patientOwes: 25, status: 'Processed' },
        { id: '2', date: '2026-01-10', provider: 'Lab Corp', service: 'Blood Panel', amount: 180, insurancePaid: 162, patientOwes: 18, status: 'Processed' },
        { id: '3', date: '2026-01-20', provider: 'Dr. Smith Cardiology', service: 'Specialist Visit', amount: 300, insurancePaid: 0, patientOwes: 300, status: 'Pending' },
    ];

    useEffect(() => {
        setPlan(mockPlan);
        setClaims(mockClaims);
    }, []);

    const getProgressPercent = (met: number, total: number) => Math.min((met / total) * 100, 100);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Processed': return 'bg-green-100 text-green-700';
            case 'Pending': return 'bg-amber-100 text-amber-700';
            case 'Denied': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    if (!plan) return <div className="text-center py-8 text-slate-400">Loading insurance info...</div>;

    return (
        <>
            <div className="space-y-6">
                {/* Insurance Card Preview */}
                <div
                    onClick={() => setShowCardModal(true)}
                    className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 rounded-3xl text-white shadow-2xl shadow-blue-500/30 cursor-pointer hover:shadow-blue-500/40 transition-all hover:-translate-y-1"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-xs opacity-70 font-bold uppercase tracking-wider">{plan.provider}</p>
                            <p className="font-bold text-xl">{plan.planName}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${plan.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                            {plan.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-xs opacity-70">Member ID</p>
                            <p className="font-mono font-bold">{plan.memberId}</p>
                        </div>
                        <div>
                            <p className="text-xs opacity-70">Group Number</p>
                            <p className="font-mono font-bold">{plan.groupNumber}</p>
                        </div>
                    </div>

                    <div className="text-xs opacity-70 flex justify-between">
                        <span>Effective: {new Date(plan.effectiveDate).toLocaleDateString()}</span>
                        <span>Tap to view full card</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                    {['overview', 'claims', 'benefits'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`py-3 px-4 font-bold text-sm capitalize transition-all ${activeTab === tab
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        {/* Deductible Progress */}
                        <div className="glass-card p-5 rounded-2xl">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-slate-800 dark:text-white">Deductible</h4>
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                    ${plan.deductible.met} / ${plan.deductible.total}
                                </span>
                            </div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                                    style={{ width: `${getProgressPercent(plan.deductible.met, plan.deductible.total)}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                ${plan.deductible.total - plan.deductible.met} remaining to meet deductible
                            </p>
                        </div>

                        {/* Out-of-Pocket Max */}
                        <div className="glass-card p-5 rounded-2xl">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-slate-800 dark:text-white">Out-of-Pocket Maximum</h4>
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                    ${plan.outOfPocketMax.met} / ${plan.outOfPocketMax.total}
                                </span>
                            </div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                                    style={{ width: `${getProgressPercent(plan.outOfPocketMax.met, plan.outOfPocketMax.total)}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                ${plan.outOfPocketMax.total - plan.outOfPocketMax.met} remaining until 100% coverage
                            </p>
                        </div>

                        {/* Copays Grid */}
                        <div className="glass-card p-5 rounded-2xl">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Copays</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(plan.copays).map(([key, value]) => (
                                    <div key={key} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                        <p className="font-bold text-lg text-slate-800 dark:text-white">${value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Claims Tab */}
                {activeTab === 'claims' && (
                    <div className="space-y-4">
                        {claims.map(claim => (
                            <div key={claim.id} className="glass-card p-5 rounded-2xl">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">{claim.service}</p>
                                        <p className="text-sm text-slate-500">{claim.provider}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusStyle(claim.status)}`}>
                                        {claim.status}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-500">Date</span>
                                    <span className="font-bold">{new Date(claim.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-500">Total Billed</span>
                                    <span className="font-bold">${claim.amount}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-500">Insurance Paid</span>
                                    <span className="font-bold text-green-600">${claim.insurancePaid}</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">You Owe</span>
                                    <span className="font-bold text-primary">${claim.patientOwes}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Benefits Tab */}
                {activeTab === 'benefits' && (
                    <div className="glass-card p-5 rounded-2xl">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-4">Plan Benefits Summary</h4>
                        <div className="space-y-3">
                            {[
                                { benefit: 'Preventive Care', coverage: '100% covered', icon: '🩺' },
                                { benefit: 'Primary Care Visits', coverage: '$25 copay', icon: '👨‍⚕️' },
                                { benefit: 'Specialist Visits', coverage: '$50 copay', icon: '🔬' },
                                { benefit: 'Emergency Room', coverage: '$150 copay', icon: '🚑' },
                                { benefit: 'Prescription Drugs', coverage: '$15-$50 copay', icon: '💊' },
                                { benefit: 'Mental Health', coverage: '$25 copay', icon: '🧠' },
                                { benefit: 'Lab Work', coverage: '90% after deductible', icon: '🧪' },
                                { benefit: 'Imaging (X-ray, MRI)', coverage: '80% after deductible', icon: '📷' },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{item.icon}</span>
                                        <span className="font-bold text-sm text-slate-800 dark:text-white">{item.benefit}</span>
                                    </div>
                                    <span className="text-sm text-green-600 font-bold">{item.coverage}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Full Insurance Card Modal */}
            {showCardModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="font-bold text-xl text-center mb-4">Insurance Card</h3>

                        {/* Front of Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-5 rounded-2xl text-white mb-4">
                            <div className="flex justify-between items-center mb-4">
                                <p className="font-bold">{plan.provider}</p>
                                <span className="text-[10px] uppercase tracking-wider opacity-70">PPO</span>
                            </div>
                            <p className="text-sm opacity-80 mb-4">{plan.planName}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-[10px] opacity-70 uppercase">Member ID</p>
                                    <p className="font-mono font-bold">{plan.memberId}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] opacity-70 uppercase">Group #</p>
                                    <p className="font-mono font-bold">{plan.groupNumber}</p>
                                </div>
                            </div>
                        </div>

                        {/* Back of Card */}
                        <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl text-xs space-y-2">
                            <p className="font-bold text-slate-700 dark:text-slate-300">For claims: PO Box 12345, City, ST 12345</p>
                            <p className="text-slate-600 dark:text-slate-400">Provider Services: 1-800-555-0123</p>
                            <p className="text-slate-600 dark:text-slate-400">Member Services: 1-800-555-0124</p>
                            <p className="text-slate-600 dark:text-slate-400">24/7 Nurse Line: 1-800-555-0125</p>
                        </div>

                        <button
                            onClick={() => setShowCardModal(false)}
                            className="w-full mt-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default InsuranceCard;

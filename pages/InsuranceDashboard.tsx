import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
// @ts-ignore
import { Case, User } from '../types/index';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../components/Toast';

const InsuranceDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [pendingEstimates, setPendingEstimates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // In a real app, this would be a specific query. For now, we mock filtering on frontend if needed or use a generic endpoint
            // But we actually have DataService.getPendingEstimates if implemented, or we fetch all cases.
            // Let's assume we fetch pending estimates for 'Insurance' role.
            const data = await DataService.getPendingEstimates('Insurance');
            setPendingEstimates(data || []);
        } catch (e) {
            console.error("Failed to load estimates", e);
            showToast.error("Failed to load claims");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (caseId: string) => {
        try {
            await DataService.approveCostEstimate(caseId);
            showToast.success("Claim Approved");
            loadData();
        } catch (e) {
            showToast.error("Approval failed");
        }
    };

    const handleProcessClaim = (caseId: string) => {
        navigate(`/case/${caseId}`);
        // In the CaseView, logic should open the Financials tab based on status, 
        // or we could pass state to force open it.
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen p-6">
            <div className="container mx-auto max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-main flex items-center gap-3">
                        {ICONS.money} Claims Processing Center
                    </h1>
                    <p className="text-text-muted mt-2">Internal Dashboard for Insurance & Billing Officers</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Pending Review</div>
                        <div className="text-4xl font-bold text-orange-500">{pendingEstimates.length}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Processed Today</div>
                        <div className="text-4xl font-bold text-emerald-500">12</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Avg. Approval Time</div>
                        <div className="text-4xl font-bold text-blue-500">4h</div>
                    </div>
                </div>

                {/* Claims List */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-text-main">Incoming Claims</h2>
                        <button onClick={loadData} className="text-primary text-sm hover:underline">Refresh</button>
                    </div>

                    {isLoading ? (
                        <div className="p-12 text-center text-text-muted">Loading claims...</div>
                    ) : pendingEstimates.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h3 className="text-xl font-bold text-text-main">All Caught Up</h3>
                            <p className="text-text-muted">No pending claims found.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-bold uppercase text-text-muted">
                                <tr>
                                    <th className="px-6 py-4">Claim ID / Case</th>
                                    <th className="px-6 py-4">Total Amount</th>
                                    <th className="px-6 py-4">Coverage</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {pendingEstimates.map((est) => (
                                    <tr key={est.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-text-main">#{est.id.slice(-6)}</div>
                                            <div className="text-xs text-text-muted">Case: {est.case_id.slice(0, 8)}...</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-text-main">${est.total_cost.toFixed(2)}</td>
                                        <td className="px-6 py-4 font-mono text-emerald-600">${est.insurance_coverage.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded text-xs font-bold uppercase">
                                                {est.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleApprove(est.case_id)}
                                                className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-emerald-600 shadow-sm"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleProcessClaim(est.case_id)}
                                                className="border border-slate-300 dark:border-slate-600 text-text-muted px-3 py-1 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InsuranceDashboard;

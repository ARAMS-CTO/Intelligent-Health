import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/api';
import { ICONS } from '../../constants/index';
import { Case } from '../../types/index';
import { showToast } from '../Toast';

interface FinancialsTabProps {
    caseData: Case;
}

export const FinancialsTab: React.FC<FinancialsTabProps> = ({ caseData }) => {
    const [estimate, setEstimate] = useState<any>(null);

    useEffect(() => {
        DataService.getCostEstimate(caseData.id).then(setEstimate);
    }, [caseData.id]);

    const handleGenerateEstimate = async () => {
        try {
            const est = await DataService.generateCostEstimate(caseData.id);
            setEstimate(est);
        } catch (e) {
            showToast.error("Failed to generate estimate");
        }
    };

    const handleApprove = async () => {
        try {
            const updated = await DataService.approveCostEstimate(caseData.id);
            setEstimate(updated);
        } catch (e) {
            showToast.error("Action Failed (Ensure you have correct role)");
        }
    };

    const handleReject = async () => {
        try {
            const updated = await DataService.rejectCostEstimate(caseData.id);
            setEstimate(updated);
        } catch (e) {
            showToast.error("Action Failed");
        }
    };

    return (
        <div className="space-y-6">
            {!estimate ? (
                <div className="glass-card p-8 rounded-2xl text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-primary">
                        {ICONS.document}
                    </div>
                    <h3 className="text-xl font-bold text-text-main">No Cost Estimate Generated</h3>
                    <p className="text-text-muted">Generate a detailed cost breakdown and approval workflow using AI.</p>
                    <button
                        onClick={handleGenerateEstimate}
                        className="bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-primary-hover transition-all"
                    >
                        Generate AI Estimate
                    </button>
                </div>
            ) : (
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-text-main">Cost Estimate Details</h3>
                            <p className="text-sm text-text-muted">ID: {estimate.id}</p>
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-white dark:bg-slate-700 font-bold border border-gray-200 dark:border-gray-600">
                            Status: <span className="text-primary uppercase tracking-wider">{estimate.status}</span>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Progress Bar */}
                        <div className="relative pt-4">
                            <div className="flex justify-between mb-2">
                                {['Draft', 'Nurse', 'Admin', 'Insurance', 'Patient', 'Approved'].map((step, i) => {
                                    const steps = ['Draft', 'Pending Nurse Review', 'Pending Admin Review', 'Pending Insurance Approval', 'Pending Patient Approval', 'Approved'];
                                    const currentIndex = steps.indexOf(estimate.status);
                                    const isCompleted = i <= currentIndex;
                                    return (
                                        <div key={step} className={`text-xs font-bold ${isCompleted ? 'text-primary' : 'text-gray-400'}`}>{step}</div>
                                    );
                                })}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${(['Draft', 'Pending Nurse Review', 'Pending Admin Review', 'Pending Insurance Approval', 'Pending Patient Approval', 'Approved'].indexOf(estimate.status) + 1) * 16.6}%` }}></div>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="border rounded-xl overflow-hidden border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {estimate.breakdown.map((item: any, i: number) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">${item.cost.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 dark:bg-gray-800 font-bold">
                                        <td colSpan={2} className="px-6 py-4 text-right">Total Estimated Cost</td>
                                        <td className="px-6 py-4 text-right">${estimate.total_cost.toFixed(2)}</td>
                                    </tr>
                                    <tr className="bg-gray-50 dark:bg-gray-800 font-bold text-green-600">
                                        <td colSpan={2} className="px-6 py-4 text-right">Estimated Insurance Coverage</td>
                                        <td className="px-6 py-4 text-right">-${estimate.insurance_coverage.toFixed(2)}</td>
                                    </tr>
                                    <tr className="bg-gray-100 dark:bg-gray-900 font-bold text-lg">
                                        <td colSpan={2} className="px-6 py-4 text-right">Patient Responsibility</td>
                                        <td className="px-6 py-4 text-right">${estimate.patient_responsibility.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={handleReject}
                                className="px-6 py-3 border border-red-500 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors"
                            >
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg transition-all"
                            >
                                Approve & Advance
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

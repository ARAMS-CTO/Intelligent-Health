import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { useAuth } from '../components/Auth';

interface PendingApproval {
    case_id: string;
    estimate_id: string;
    case_title: string;
    status: string;
    total_cost: number;
}

export const PendingApprovalsWidget: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [pending, setPending] = useState<PendingApproval[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPending = async () => {
            if (!user || (user.role !== 'Nurse' && user.role !== 'Admin')) {
                setIsLoading(false);
                return;
            }

            try {
                // Use the new efficient endpoint
                const data = await DataService.getPendingEstimates(user.role);
                // Map API response to Component State (if needed, but structure matches closely)
                const pendingItems: PendingApproval[] = data.map((item: any) => ({
                    case_id: item.case_id,
                    estimate_id: item.estimate_id,
                    case_title: item.case_title,
                    status: item.status,
                    total_cost: item.total_cost
                }));

                setPending(pendingItems);
            } catch (error) {
                console.error("Failed to fetch pending approvals", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPending();
    }, [user]);

    if (!user || (user.role !== 'Nurse' && user.role !== 'Admin')) {
        return null;
    }

    return (
        <div className="glass-card rounded-[32px] p-8 antigravity-target transition-all duration-300 shadow-xl border border-white/20 dark:border-slate-700/50 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition-colors"></div>

            <h3 className="font-heading font-bold text-xl text-text-main mb-6 flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 shadow-inner">
                    {ICONS.document}
                </div>
                Pending Approvals
            </h3>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : pending.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                    <p className="text-sm">No pending approvals at this time.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {pending.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white/40 dark:bg-slate-900/40 rounded-xl p-4 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-colors cursor-pointer border border-white/20 dark:border-slate-700"
                            onClick={() => navigate(`/cases/${item.case_id}`)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-sm text-text-main truncate flex-1">{item.case_title}</h4>
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg ml-2 whitespace-nowrap">
                                    {user.role === 'Nurse' ? 'Nurse Review' : 'Admin Review'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-text-muted">
                                <span>Est. Cost: ${item.total_cost.toFixed(2)}</span>
                                <span className="text-primary font-bold hover:underline">Review →</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';

interface Referral {
    id: string;
    case_id: string;
    case_title: string;
    from_doctor_id: string;
    from_doctor_name: string;
    to_doctor_id: string;
    to_doctor_name: string;
    collaboration_type: string;
    reason: string;
    priority: string;
    status: string;
    created_at: string;
}

interface ReferralWidgetProps {
    compact?: boolean;
}

export const ReferralWidget: React.FC<ReferralWidgetProps> = ({ compact = false }) => {
    const [incoming, setIncoming] = useState<Referral[]>([]);
    const [outgoing, setOutgoing] = useState<Referral[]>([]);
    const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadReferrals();
    }, []);

    const loadReferrals = async () => {
        setIsLoading(true);
        try {
            const [inc, out] = await Promise.all([
                DataService.getIncomingReferrals('pending'),
                DataService.getOutgoingReferrals()
            ]);
            setIncoming(inc);
            setOutgoing(out);
        } catch (e) {
            console.error('Failed to load referrals', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (referralId: string) => {
        try {
            await DataService.acceptReferral(referralId);
            showToast.success('Referral accepted');
            loadReferrals();
        } catch (e) {
            showToast.error('Failed to accept referral');
        }
    };

    const handleDecline = async (referralId: string) => {
        const reason = prompt('Reason for declining (optional):');
        try {
            await DataService.declineReferral(referralId, reason || 'Not available');
            showToast.success('Referral declined');
            loadReferrals();
        } catch (e) {
            showToast.error('Failed to decline referral');
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'stat': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            case 'urgent': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'accepted': return 'bg-green-100 text-green-700';
            case 'declined': return 'bg-red-100 text-red-700';
            case 'completed': return 'bg-purple-100 text-purple-700';
            default: return 'bg-amber-100 text-amber-700';
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            referral: '🔀 Referral',
            consultation: '💬 Consultation',
            comanagement: '🤝 Co-Management',
            second_opinion: '🔍 Second Opinion'
        };
        return labels[type] || type;
    };

    if (compact) {
        return (
            <div className="glass-card p-5 rounded-2xl border border-white/20 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        🔄 Pending Referrals
                    </h3>
                    {incoming.length > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                            {incoming.length}
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-4 text-slate-400 text-sm">Loading...</div>
                ) : incoming.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-sm">No pending referrals</div>
                ) : (
                    <div className="space-y-3">
                        {incoming.slice(0, 3).map(ref => (
                            <div key={ref.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getPriorityStyle(ref.priority)}`}>
                                        {ref.priority}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(ref.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{ref.case_title}</p>
                                <p className="text-xs text-slate-500 mt-1">From: {ref.from_doctor_name}</p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleAccept(ref.id)}
                                        className="flex-1 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleDecline(ref.id)}
                                        className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    🔄 Referrals & Consultations
                </h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('incoming')}
                    className={`flex-1 py-3 font-bold text-sm transition-colors ${activeTab === 'incoming'
                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Incoming ({incoming.length})
                </button>
                <button
                    onClick={() => setActiveTab('outgoing')}
                    className={`flex-1 py-3 font-bold text-sm transition-colors ${activeTab === 'outgoing'
                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Outgoing ({outgoing.length})
                </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
                {isLoading ? (
                    <div className="text-center py-8 text-slate-400">Loading referrals...</div>
                ) : (
                    <div className="space-y-4">
                        {(activeTab === 'incoming' ? incoming : outgoing).length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                No {activeTab} referrals
                            </div>
                        ) : (
                            (activeTab === 'incoming' ? incoming : outgoing).map(ref => (
                                <div key={ref.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getPriorityStyle(ref.priority)}`}>
                                                    {ref.priority}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getStatusStyle(ref.status)}`}>
                                                    {ref.status}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-white">{ref.case_title}</h4>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {new Date(ref.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{ref.reason}</p>

                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                                        <span>{getTypeLabel(ref.collaboration_type)}</span>
                                        <span>•</span>
                                        <span>{activeTab === 'incoming' ? `From: ${ref.from_doctor_name}` : `To: ${ref.to_doctor_name}`}</span>
                                    </div>

                                    {activeTab === 'incoming' && ref.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAccept(ref.id)}
                                                className="flex-1 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors text-sm"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleDecline(ref.id)}
                                                className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Create Referral Modal
interface CreateReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseId: string;
    caseTitle: string;
    onSuccess?: () => void;
}

export const CreateReferralModal: React.FC<CreateReferralModalProps> = ({ isOpen, onClose, caseId, caseTitle, onSuccess }) => {
    const [specialists, setSpecialists] = useState<any[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [type, setType] = useState('consultation');
    const [priority, setPriority] = useState('normal');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchSpecialty, setSearchSpecialty] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadSpecialists();
        }
    }, [isOpen, searchSpecialty]);

    const loadSpecialists = async () => {
        try {
            const docs = await DataService.getAvailableSpecialists(searchSpecialty || undefined);
            setSpecialists(docs);
        } catch (e) {
            console.error('Failed to load specialists', e);
        }
    };

    const handleSubmit = async () => {
        if (!selectedDoctor || !reason.trim()) {
            showToast.error('Please select a doctor and provide a reason');
            return;
        }

        setIsSubmitting(true);
        try {
            await DataService.createReferral(caseId, selectedDoctor, reason, {
                type,
                priority,
                notes: notes || undefined
            });
            showToast.success('Referral sent successfully');
            onSuccess?.();
            onClose();
        } catch (e) {
            showToast.error('Failed to create referral');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        Refer Case
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">{caseTitle}</p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Type Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Referral Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'consultation', label: '💬 Consultation' },
                                { value: 'referral', label: '🔀 Full Referral' },
                                { value: 'comanagement', label: '🤝 Co-Management' },
                                { value: 'second_opinion', label: '🔍 Second Opinion' }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setType(opt.value)}
                                    className={`p-3 rounded-xl text-sm font-bold transition-all ${type === opt.value
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Priority
                        </label>
                        <div className="flex gap-2">
                            {['normal', 'urgent', 'stat'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${priority === p
                                            ? p === 'stat' ? 'bg-red-500 text-white' : p === 'urgent' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Specialist Search */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Select Specialist
                        </label>
                        <input
                            type="text"
                            placeholder="Filter by specialty..."
                            value={searchSpecialty}
                            onChange={(e) => setSearchSpecialty(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mb-2"
                        />
                        <div className="max-h-40 overflow-y-auto space-y-2">
                            {specialists.map(doc => (
                                <button
                                    key={doc.id}
                                    onClick={() => setSelectedDoctor(doc.id)}
                                    className={`w-full p-3 rounded-lg text-left transition-all ${selectedDoctor === doc.id
                                            ? 'bg-primary/10 border-2 border-primary'
                                            : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                        }`}
                                >
                                    <p className="font-bold text-sm text-slate-800 dark:text-white">{doc.name}</p>
                                    <p className="text-xs text-slate-500">{doc.specialty || doc.role}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Reason for Referral *
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Describe the reason for this referral..."
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-24 resize-none"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Additional Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional information..."
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-20 resize-none"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedDoctor || !reason.trim()}
                        className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Sending...' : 'Send Referral'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferralWidget;

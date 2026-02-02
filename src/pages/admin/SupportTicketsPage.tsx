import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/api';
import { FeedbackTicket } from '../../types/index';
import { showToast } from '../../components/Toast';
import { ICONS } from '../../constants/index';

const SupportTicketsPage: React.FC = () => {
    const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null);
    const [responseText, setResponseText] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        setIsLoading(true);
        try {
            const data = await DataService.getFeedbackTickets();
            // Sort by createdAt desc
            const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setTickets(sorted);
        } catch (e) {
            console.error(e);
            showToast.error("Failed to load tickets");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRespond = async () => {
        if (!selectedTicket || !responseText.trim()) return;
        setIsSending(true);
        try {
            await DataService.respondToFeedback(selectedTicket.id, responseText);
            showToast.success("Response sent!");
            setResponseText('');
            setSelectedTicket(null);
            loadTickets(); // Refresh
        } catch (e) {
            showToast.error("Failed to send response");
        } finally {
            setIsSending(false);
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'High': return 'text-red-500 bg-red-100 dark:bg-red-900/30';
            case 'Medium': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
            case 'Low': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
            default: return 'text-slate-500';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Bug': return '🐞';
            case 'Feature': return '✨';
            case 'Support': return '🆘';
            default: return '📝';
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-heading font-bold text-text-main">
                Support & Feedback Center
            </h1>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4 font-bold text-sm text-text-muted uppercase">Type</th>
                                <th className="p-4 font-bold text-sm text-text-muted uppercase">Title</th>
                                <th className="p-4 font-bold text-sm text-text-muted uppercase">User</th>
                                <th className="p-4 font-bold text-sm text-text-muted uppercase">Priority</th>
                                <th className="p-4 font-bold text-sm text-text-muted uppercase">Status</th>
                                <th className="p-4 font-bold text-sm text-text-muted uppercase">Date</th>
                                <th className="p-4 font-bold text-sm text-text-muted uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-text-muted">Loading tickets...</td></tr>
                            ) : tickets.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-text-muted">No tickets found.</td></tr>
                            ) : (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <span className="flex items-center gap-2 font-medium">
                                                {getTypeIcon(ticket.type)} {ticket.type}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-text-main">{ticket.title}</td>
                                        <td className="p-4 text-sm text-text-muted">{ticket.userName}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${ticket.status === 'Resolved' ? 'border-green-500 text-green-600' : 'border-slate-300 text-slate-500'}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-text-muted">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => setSelectedTicket(ticket)}
                                                className="text-primary hover:text-primary-hover font-bold text-sm"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-in">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-heading font-bold text-text-main flex items-center gap-2">
                                    {getTypeIcon(selectedTicket.type)} {selectedTicket.title}
                                </h3>
                                <p className="text-sm text-text-muted mt-1">Submitted by {selectedTicket.userName} on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="text-text-muted hover:text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <label className="block text-xs font-bold uppercase text-text-muted mb-2">Description</label>
                                <p className="text-text-main whitespace-pre-wrap">{selectedTicket.description}</p>
                            </div>

                            {selectedTicket.adminResponse && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <label className="block text-xs font-bold uppercase text-blue-600 dark:text-blue-400 mb-2">Admin Response</label>
                                    <p className="text-text-main">{selectedTicket.adminResponse}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase text-text-muted mb-2">Reply / Action</label>
                                <textarea
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="Type your response to the user..."
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="px-4 py-2 text-sm font-bold text-text-muted hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleRespond}
                                disabled={isSending || !responseText.trim()}
                                className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSending ? 'Sending...' : 'Send Response'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportTicketsPage;

import React, { useState } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';
import { useAuth } from './Auth';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [type, setType] = useState<'Bug' | 'Feature' | 'Support'>('Support');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            showToast.error("You must be logged in to submit feedback.");
            return;
        }

        setIsSubmitting(true);
        try {
            await DataService.createFeedbackHelp({
                userId: user.id,
                userName: user.name,
                type,
                title,
                description,
                priority,
                status: 'Open',
                createdAt: new Date().toISOString()
            });
            showToast.success("Feedback submitted successfully!");
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setPriority('Medium');
        } catch (error) {
            console.error("Feedback submit error", error);
            showToast.error("Failed to submit feedback.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-in">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-xl font-heading font-bold text-text-main flex items-center gap-2">
                        {ICONS.support}
                        Submit Feedback
                    </h3>
                    <button onClick={onClose} className="text-text-muted hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-muted mb-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                            >
                                <option value="Bug">🐞 Bug Report</option>
                                <option value="Feature">✨ Feature Request</option>
                                <option value="Support">🆘 Support Help</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-text-muted mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-text-muted mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="Brief summary of the issue..."
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 outline-none font-sans"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-text-muted mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={4}
                            placeholder="Detailed explanation, steps to reproduce, or feature details..."
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 outline-none font-sans resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    {ICONS.send}
                                    Submit
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

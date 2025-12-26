
import React, { useState, useEffect, useRef } from 'react';
import { Comment, Role, User } from '../types/index';
import { useAuth } from './Auth';
import { DataService, getActiveUsersForCase } from '../services/api';
import VoiceInput from './VoiceInput';
import { ICONS } from '../constants/index';
import { appEvents } from '../services/events';

// Helper function to format date
const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

// Helper function to parse and render comment text with mentions and tags
const renderCommentText = (text: string) => {
    const regex = /([@#][a-zA-Z0-9_-]+)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
        if (part.startsWith('@')) {
            return (
                <span key={index} className="font-semibold text-primary">
                    {part}
                </span>
            );
        }
        if (part.startsWith('#')) {
            return (
                <span key={index} className="font-semibold text-accent">
                    {part}
                </span>
            );
        }
        return part;
    });
};

const UserAvatar: React.FC<{ name: string }> = ({ name }) => {
    const initials = name.split(' ').map(n => n[0]).join('');
    // Simple hashing for a consistent color
    const colorIndex = name.charCodeAt(0) % 5;
    const colors = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500'];
    return (
        <div title={name} className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-surface ${colors[colorIndex]}`}>
            {initials}
        </div>
    );
};


const CaseDiscussion: React.FC<{ caseId: string, onPostComment: (comment: Comment) => Promise<void>; isOffline: boolean; }> = ({ caseId, onPostComment, isOffline }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [showNewMessageButton, setShowNewMessageButton] = useState(false);
    const [activeUsers, setActiveUsers] = useState<User[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Fetch comments periodically to simulate real-time updates
    useEffect(() => {
        if (isOffline) return;

        const fetchAndSetComments = async () => {
            try {
                const currentComments = await DataService.getCaseComments(caseId);

                const container = chatContainerRef.current;
                if (container) {
                    const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 50;

                    if (currentComments.length > comments.length && !isScrolledToBottom && comments.length > 0) {
                        setShowNewMessageButton(true);
                    }
                }
                setComments(currentComments);
            } catch (error) {
                console.error("Error fetching comments:", error);
            }
        };

        fetchAndSetComments(); // Initial fetch
        const intervalId = setInterval(fetchAndSetComments, 4000); // Poll every 4 seconds

        return () => clearInterval(intervalId);
    }, [caseId, comments.length, isOffline]);


    // Effect for auto-scrolling on initial load
    useEffect(() => {
        const container = chatContainerRef.current;
        if (container && comments.length > 0 && !showNewMessageButton) {
            // Only scroll to bottom if we aren't showing the "new message" button
            // This prevents jumping if the user scrolled up while a new message arrived
            // But ensures we start at the bottom.
            if (container.scrollTop === 0 && container.scrollHeight > container.clientHeight) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [comments]);

    // Effect for fetching active users and listening for presence changes
    useEffect(() => {
        if (isOffline || !user) return;

        const fetchActiveUsers = () => {
            const users = getActiveUsersForCase(caseId);
            setActiveUsers(users.filter(u => u.id !== user.id)); // Exclude self
        };

        fetchActiveUsers(); // Initial fetch

        const eventName = `presence-change:${caseId}`;
        const unsubscribe = appEvents.on(eventName, fetchActiveUsers);

        return () => {
            unsubscribe();
        };
    }, [caseId, user, isOffline]);


    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;

        const commentToAdd: Comment = {
            id: `comment-${Date.now()}`,
            caseId: caseId,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            timestamp: new Date().toISOString(),
            text: newComment,
        };

        // Optimistic update
        setComments(prev => [...prev, commentToAdd]);
        setNewComment('');
        setShowNewMessageButton(false);

        // Scroll to bottom immediately
        setTimeout(handleScrollToBottom, 50);

        try {
            await onPostComment(commentToAdd);
        } catch (error) {
            console.error("Failed to post comment:", error);
            alert("Failed to post comment. Please check your connection.");
            // Revert optimistic update on failure
            setComments(prev => prev.filter(c => c.id !== commentToAdd.id));
        }
    };

    const handleScrollToBottom = () => {
        setShowNewMessageButton(false);
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    };

    const handleScroll = () => {
        const container = chatContainerRef.current;
        if (container) {
            const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 50;
            if (isScrolledToBottom && showNewMessageButton) {
                setShowNewMessageButton(false);
            }
        }
    };

    return (
        <div className="glass-card rounded-3xl p-6 shadow-2xl flex flex-col h-[650px] max-h-[85vh] relative antigravity-target border-white/20 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="border-b border-white/10 dark:border-slate-700/50 pb-4 mb-4 relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-text-main flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-primary to-blue-600 rounded-xl text-white shadow-lg shadow-primary/30">
                                {ICONS.chat}
                            </div>
                            Case Discussion
                        </h2>
                        <div className="flex items-center gap-4 mt-3 pl-1">
                            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/20 dark:border-slate-700 shadow-sm">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </span>
                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Live</span>
                            </div>
                            <div className="flex -space-x-2 items-center hover:space-x-1 transition-all">
                                {activeUsers.map(u => <div key={u.id} className="transition-all transform hover:scale-110 hover:z-10"><UserAvatar name={u.name} /></div>)}
                                {activeUsers.length === 0 && <p className="text-[10px] text-text-muted pl-2 italic">Just you</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pr-2 space-y-6 mb-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 relative z-10 p-2">
                {comments.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-text-muted italic flex-col gap-4 opacity-50">
                        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <span className="text-sm font-medium">No comments yet. Start the discussion!</span>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-4 animate-fade-in group">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-slate-800 transform transition-transform group-hover:scale-110">
                                {comment.userName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-bold text-text-main text-sm">{comment.userName}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-text-muted uppercase font-bold tracking-wider border border-slate-200 dark:border-slate-600">{comment.userRole}</span>
                                    <span className="text-xs text-slate-400 ml-auto">{formatTimestamp(comment.timestamp)}</span>
                                </div>
                                <div className="text-text-main whitespace-pre-wrap bg-white/80 dark:bg-slate-800/80 p-4 rounded-2xl rounded-tl-none border border-white/40 dark:border-slate-700 shadow-sm text-sm leading-relaxed backdrop-blur-sm group-hover:shadow-md transition-shadow">
                                    {renderCommentText(comment.text)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showNewMessageButton && (
                <button
                    onClick={handleScrollToBottom}
                    className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-accent text-white font-bold py-2 px-6 rounded-full shadow-lg shadow-accent/30 hover:bg-accent-hover transition-all transform hover:scale-105 animate-bounce z-20 text-xs uppercase tracking-widest flex items-center gap-2 border-2 border-white/20 backdrop-blur-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    New Message(s)
                </button>
            )}

            <div className="border-t border-white/10 dark:border-slate-700/50 pt-4 mt-2 relative z-10">
                {user ? (
                    <form onSubmit={handlePostComment} className="bg-white/60 dark:bg-slate-800/60 p-2 rounded-2xl border border-white/40 dark:border-slate-700/50 shadow-lg backdrop-blur-md transition-all focus-within:ring-2 focus-within:ring-primary/30">
                        <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold mt-1 shadow-sm">
                                {user.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={isOffline ? "Commenting disabled while offline." : "Add your comment... Use @ to mention users and # to tag topics."}
                                    className="w-full border-0 bg-transparent rounded-lg p-2 focus:ring-0 text-sm min-h-[50px] resize-none placeholder:text-slate-400 font-medium"
                                    rows={2}
                                    disabled={isOffline}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handlePostComment(e);
                                        }
                                    }}
                                />
                                <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-200/50 dark:border-slate-700/30">
                                    <div className="scale-90 origin-left">
                                        <VoiceInput onTranscript={(transcript) => setNewComment(prev => prev + transcript)} disabled={isOffline} />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || isOffline}
                                        className="bg-primary text-white font-bold py-2 px-5 rounded-xl hover:bg-primary-hover transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none text-xs uppercase tracking-wide flex items-center gap-2 transform active:scale-95"
                                    >
                                        <span>Post</span>
                                        {ICONS.send}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <p className="text-center text-text-muted text-sm italic opacity-70 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">You must be logged in to post a comment.</p>
                )}
            </div>
        </div>
    );
};

export default CaseDiscussion;

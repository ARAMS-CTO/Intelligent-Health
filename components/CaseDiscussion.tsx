
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
        <div className="bg-surface p-6 rounded-lg shadow-md flex flex-col h-[600px] max-h-[80vh] relative">
            <div className="border-b dark:border-slate-700 pb-4 mb-4">
                 <h2 className="text-2xl font-bold text-text-main">Case Discussion</h2>
                 <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm font-semibold text-accent">Active Now:</span>
                    <div className="flex -space-x-2 items-center">
                        {activeUsers.map(u => <UserAvatar key={u.id} name={u.name} />)}
                        {activeUsers.length === 0 && <p className="text-xs text-text-muted pl-2 italic">Just you</p>}
                    </div>
                </div>
            </div>

            <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pr-2 space-y-6 mb-4">
                {comments.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-text-muted italic">No comments yet. Start the discussion!</div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-4 animate-fade-in">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-hover flex items-center justify-center text-white font-bold">
                                {comment.userName.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <span className="font-bold text-text-main">{comment.userName}</span>
                                    <span className="text-xs text-slate-400">&bull;</span>
                                    <span className="text-sm text-text-muted">{comment.userRole}</span>
                                </div>
                                <p className="text-sm text-text-muted mb-2">{formatTimestamp(comment.timestamp)}</p>
                                <div className="text-text-main whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">{renderCommentText(comment.text)}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

             {showNewMessageButton && (
                <button
                    onClick={handleScrollToBottom}
                    className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-primary text-white font-bold py-2 px-4 rounded-full shadow-lg hover:bg-primary-hover transition-transform transform hover:scale-105 animate-fade-in z-10"
                >
                    &darr; New Message(s)
                </button>
            )}

            <div className="border-t dark:border-slate-700 pt-4">
                 { user ? (
                    <form onSubmit={handlePostComment} className="flex items-start space-x-2">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={isOffline ? "Commenting disabled while offline." : "Add your comment... Use @ to mention users and # to tag topics."}
                                className="w-full border dark:border-slate-600 bg-inherit rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                rows={3}
                                disabled={isOffline}
                            />
                            <div className="flex justify-between items-center mt-2">
                                <VoiceInput onTranscript={(transcript) => setNewComment(prev => prev + transcript)} disabled={isOffline} />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isOffline}
                                    className="bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-accent-hover transition disabled:bg-gray-400"
                                >
                                    Post Comment
                                </button>
                            </div>
                        </div>
                    </form>
                 ) : (
                    <p className="text-center text-text-muted">You must be logged in to post a comment.</p>
                 )}
            </div>
        </div>
    );
};

export default CaseDiscussion;

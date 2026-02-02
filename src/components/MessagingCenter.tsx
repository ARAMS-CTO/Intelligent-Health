import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/api';
import { useAuth } from './Auth';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';

interface Message {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_role: string;
    recipient_id: string;
    recipient_name: string;
    subject?: string;
    content: string;
    priority: string;
    is_read: boolean;
    created_at: string;
}

interface Conversation {
    participant_id: string;
    participant_name: string;
    participant_role: string;
    last_message: string;
    last_message_time: string;
    unread_count: number;
}

interface MessagingCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MessagingCenter: React.FC<MessagingCenterProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [searchUsers, setSearchUsers] = useState('');
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            loadConversations();
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        setIsLoading(true);
        try {
            const convos = await DataService.getConversations();
            setConversations(convos);
        } catch (e) {
            console.error('Failed to load conversations', e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMessages = async (userId: string) => {
        setIsLoading(true);
        setSelectedConversation(userId);
        try {
            const msgs = await DataService.getConversation(userId);
            setMessages(msgs);
        } catch (e) {
            console.error('Failed to load messages', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            await DataService.sendMessage(selectedConversation, newMessage.trim());
            setNewMessage('');
            await loadMessages(selectedConversation);
            await loadConversations();
        } catch (e) {
            showToast.error('Failed to send message');
        }
    };

    const handleNewConversation = async (userId: string, userName: string) => {
        setSelectedConversation(userId);
        setShowNewMessage(false);
        setMessages([]);
    };

    const searchForUsers = async () => {
        if (!searchUsers.trim()) return;
        try {
            const users = await DataService.getUsers();
            setAvailableUsers(users.filter(u =>
                u.id !== user?.id &&
                (u.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchUsers.toLowerCase()))
            ));
        } catch (e) {
            console.error('Failed to search users', e);
        }
    };

    useEffect(() => {
        const timer = setTimeout(searchForUsers, 300);
        return () => clearTimeout(timer);
    }, [searchUsers]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden">
                {/* Sidebar - Conversations */}
                <div className="w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                {ICONS.chat} Messages
                            </h2>
                            <button
                                onClick={() => setShowNewMessage(true)}
                                className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                            >
                                {ICONS.plus}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading && conversations.length === 0 ? (
                            <div className="p-4 text-center text-slate-400">Loading...</div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <div className="text-4xl mb-2">💬</div>
                                <p className="text-sm">No conversations yet</p>
                                <button
                                    onClick={() => setShowNewMessage(true)}
                                    className="mt-4 text-primary font-bold text-sm hover:underline"
                                >
                                    Start a new conversation
                                </button>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={conv.participant_id}
                                    onClick={() => loadMessages(conv.participant_id)}
                                    className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 ${selectedConversation === conv.participant_id ? 'bg-primary/10' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {conv.participant_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                                                    {conv.participant_name}
                                                </p>
                                                {conv.unread_count > 0 && (
                                                    <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                        {conv.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main - Messages */}
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div>
                            {selectedConversation ? (
                                <h3 className="font-bold text-slate-800 dark:text-white">
                                    {conversations.find(c => c.participant_id === selectedConversation)?.participant_name || 'New Conversation'}
                                </h3>
                            ) : (
                                <h3 className="font-bold text-slate-400">Select a conversation</h3>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            {ICONS.close}
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50">
                        {showNewMessage ? (
                            <div className="max-w-md mx-auto">
                                <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-4">New Message</h4>
                                <input
                                    type="text"
                                    placeholder="Search for a user..."
                                    value={searchUsers}
                                    onChange={(e) => setSearchUsers(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
                                />
                                <div className="mt-4 space-y-2">
                                    {availableUsers.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => handleNewConversation(u.id, u.name)}
                                            className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-sm text-slate-800 dark:text-white">{u.name}</p>
                                                <p className="text-xs text-slate-500">{u.role}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : selectedConversation ? (
                            <>
                                {messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[70%] p-4 rounded-2xl ${msg.sender_id === user?.id
                                                ? 'bg-primary text-white rounded-br-none'
                                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-bl-none shadow-sm'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={`text-[10px] mt-2 ${msg.sender_id === user?.id ? 'text-white/70' : 'text-slate-400'
                                                }`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">💬</div>
                                    <p>Select a conversation or start a new one</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    {selectedConversation && !showNewMessage && (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary outline-none"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!newMessage.trim()}
                                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Quick Message Button for Patient Dashboard
export const QuickMessageButton: React.FC<{ doctorId: string; doctorName: string }> = ({ doctorId, doctorName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) return;
        setIsSending(true);
        try {
            await DataService.sendMessage(doctorId, message.trim());
            showToast.success(`Message sent to ${doctorName}`);
            setMessage('');
            setIsOpen(false);
        } catch (e) {
            showToast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors"
            >
                {ICONS.chat} Message {doctorName}
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-md">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">
                            Message {doctorName}
                        </h3>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none focus:ring-2 focus:ring-primary outline-none"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={!message.trim() || isSending}
                                className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50"
                            >
                                {isSending ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MessagingCenter;

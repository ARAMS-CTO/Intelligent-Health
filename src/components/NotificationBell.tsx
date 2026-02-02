import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants/index';
import { DataService } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

const NotificationBell: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadNotificationCount();

        // Poll every 30 seconds
        const interval = setInterval(loadNotificationCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Close dropdown on outside click
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotificationCount = async () => {
        try {
            const count = await DataService.getNotificationCount();
            setUnreadCount(count);
        } catch (e) {
            console.error("Failed to load notification count", e);
        }
    };

    const loadNotifications = async () => {
        setIsLoading(true);
        try {
            const notifs = await DataService.getNotifications(false);
            setNotifications(notifs);
        } catch (e) {
            console.error("Failed to load notifications", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = () => {
        if (!isOpen) {
            loadNotifications();
        }
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = async (notif: Notification) => {
        // Mark as read
        if (!notif.isRead) {
            await DataService.markNotificationRead(notif.id);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        }

        // Navigate if link exists
        if (notif.link) {
            navigate(notif.link);
            setIsOpen(false);
        }
    };

    const handleMarkAllRead = async () => {
        await DataService.markAllNotificationsRead();
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'appointment': return ICONS.calendar;
            case 'case_update': return ICONS.case;
            case 'lab': return ICONS.lab;
            case 'prescription': return ICONS.medication;
            case 'ai': return ICONS.ai;
            default: return ICONS.bell;
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary transition-all relative"
                title="Notifications"
            >
                <span className="text-text-muted hover:text-primary transition-colors">{ICONS.bell}</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-heading font-bold text-text-main">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-6 text-center text-text-muted">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-text-muted">
                                <div className="text-4xl mb-2">🔔</div>
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <button
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`w-full p-4 text-left flex gap-3 items-start hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 ${!notif.isRead ? 'bg-primary/5' : ''
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg flex-shrink-0 ${!notif.isRead ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-text-muted'}`}>
                                        {getTypeIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium text-sm ${!notif.isRead ? 'text-text-main' : 'text-text-muted'}`}>
                                                {notif.title}
                                            </span>
                                            {!notif.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                                            )}
                                        </div>
                                        <p className="text-xs text-text-muted mt-1 line-clamp-2">{notif.message}</p>
                                        <p className="text-xs text-text-muted/60 mt-1">{formatTime(notif.createdAt)}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
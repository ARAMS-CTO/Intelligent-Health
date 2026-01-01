import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';
import { DataService } from '../services/api';

const NotificationBell: React.FC = () => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }

        // Initial check
        checkNotifications();

        // Poll every 60 seconds
        const interval = setInterval(checkNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const checkNotifications = async () => {
        try {
            // We use 'anonymous' or assumption that token is handled by DataService
            // However, getDashboardStats requires userId.
            // We need to decode token or get user from context.
            // Since this component doesn't wrap Auth, let's try to get ID from local storage if possible or skip.
            // Ideally we should use useAuth().
            // But to avoid big refactor, let's just try to fetch if we have a token.
            const token = localStorage.getItem('token');
            if (token) {
                // We need userId. DataService.getDashboardStats(userId).
                // Let's assume decoding or just fetch 'me'? 
                // Ah, the endpoint is /dashboard/stats? But it takes userId in backend?
                // Backend: @router.get("/stats") takes current_user.
                // Wait, api.ts says: getDashboardStats(userId: string). 
                // Backend: `async def get_dashboard_stats(current_user: User = Depends(get_current_user))`
                // So the backend DOES NOT need userId in path or query if it uses Depends(get_current_user).
                // Let's check api.ts line 163.
                // `fetch(${API_BASE_URL}/dashboard/stats`, { headers: getAuthHeader() })`
                // It does NOT use userId in URL. The argument in TS is unused in the fetch string!
                // So we can just call it with any string or fix api.ts.

                const stats = await DataService.getDashboardStats("me"); // "me" is ignored by backend
                // Logic: if assignments > 0 (assuming these are 'new' or 'active'). 
                // Actually 'active' is not 'unread'. 
                // But for 'updates' (comments in last 24h), we can treat it as notification worthy.

                if (stats.updates > 0 || stats.assignments > 0) {
                    setHasUnread(true);
                    // Optional: Trigger desktop notification if just transitioned? 
                    // Keeping to simple badge for now to avoid spam.
                } else {
                    setHasUnread(false);
                }
            }
        } catch (e) {
            console.error("Notification poll failed", e);
        }
    };

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            showToast.error('This browser does not support desktop notification');
            return;
        }

        const status = await Notification.requestPermission();
        setPermission(status);
        if (status === 'granted') {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification('Notifications Enabled!', {
                    body: 'You will now receive updates for your cases.',
                    icon: '/vite.svg'
                });
            });
        }
    };

    const getTooltipText = () => {
        switch (permission) {
            case 'granted':
                return 'Notifications are enabled';
            case 'denied':
                return 'Notifications are blocked. Please enable them in your browser settings.';
            default:
                return 'Click to enable notifications';
        }
    };

    const getIconColor = () => {
        if (hasUnread) return 'text-primary';
        switch (permission) {
            case 'granted':
                return 'text-accent';
            case 'denied':
                return 'text-danger';
            default:
                return 'text-text-muted';
        }
    };

    return (
        <button
            onClick={requestPermission}
            disabled={permission !== 'default'}
            className={`p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:cursor-not-allowed group relative`}
            title={getTooltipText()}
        >
            <span className={getIconColor()}>{ICONS.bell}</span>
            {hasUnread && (
                <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}
            {permission === 'denied' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 absolute top-1 right-1 text-danger" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            )}
        </button>
    );
};

export default NotificationBell;
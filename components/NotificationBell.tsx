import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants/index';

const NotificationBell: React.FC = () => {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notification');
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
        switch (permission) {
            case 'granted':
                return 'text-accent';
            case 'denied':
                return 'text-danger';
            default:
                return 'text-text-muted';
        }
    }

    return (
        <button
            onClick={requestPermission}
            disabled={permission !== 'default'}
            className={`p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:cursor-not-allowed group relative`}
            title={getTooltipText()}
        >
            <span className={getIconColor()}>{ICONS.bell}</span>
            {permission === 'denied' && (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 absolute top-1 right-1 text-danger" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            )}
        </button>
    );
};

export default NotificationBell;
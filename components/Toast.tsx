

import React, { useState, useEffect } from 'react';
import { appEvents } from '../services/events';
import { AppNotification } from '../types/index';
import { ICONS } from '../constants/index';

const Toast: React.FC<{ notification: AppNotification; onDismiss: () => void }> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <div className="p-2 bg-green-500 rounded-full">{ICONS.status}</div>;
      case 'info':
        return <div className="p-2 bg-blue-500 rounded-full">{ICONS.chat}</div>;
      case 'warning':
        return <div className="p-2 bg-yellow-500 rounded-full">{ICONS.riskModerate}</div>;
      case 'error':
        return <div className="p-2 bg-red-500 rounded-full">{ICONS.riskHigh}</div>;
      default:
        return <div className="p-2 bg-gray-500 rounded-full">{ICONS.bell}</div>;
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-2xl p-3 flex items-start gap-4 w-full max-w-xs sm:max-w-sm animate-slide-up-fade-in">
      <div className="flex-shrink-0 text-white">{getIcon()}</div>
      <div className="flex-1">
        <p className="font-bold text-text-main">{notification.title}</p>
        <p className="text-sm text-text-muted">{notification.message}</p>
        {notification.link && (
          <a href={notification.link} className="text-sm text-primary font-semibold mt-2 block hover:underline">
            View Details &rarr;
          </a>
        )}
      </div>
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 p-1 -mt-2 -mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const showToast = {
  success: (message: string, title = 'Success') => appEvents.emit('notification', { type: 'success', message, title }),
  info: (message: string, title = 'Info') => appEvents.emit('notification', { type: 'info', message, title }),
  warning: (message: string, title = 'Warning') => appEvents.emit('notification', { type: 'warning', message, title }),
  error: (message: string, title = 'Error') => appEvents.emit('notification', { type: 'error', message, title }),
};

export const ToastContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const handleNewNotification = (notification: AppNotification) => {
      setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
    };

    const unsubscribe = appEvents.on('notification', handleNewNotification);
    return () => unsubscribe();
  }, []);

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-3">
      {notifications.map(notification => (
        <Toast key={notification.id} notification={notification} onDismiss={() => dismissNotification(notification.id!)} />
      ))}
    </div>
  );
};
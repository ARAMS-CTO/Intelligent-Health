
import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth';
import { ICONS } from '../constants/index';
import { Role } from '../types/index';
import NotificationBell from './NotificationBell';
import { useTheme } from './Theme';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { appEvents } from '../services/events';

const Header: React.FC<{ onLoginClick: () => void; onProfileClick: () => void; }> = ({ onLoginClick, onProfileClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAntigravityActive, setIsAntigravityActive] = useState(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleAntigravity = () => {
    setIsAntigravityActive(!isAntigravityActive);
    appEvents.emit('toggle-antigravity');
  };

  const getRoleColor = (role: Role) => {
    switch(role) {
      case Role.Doctor:
      case Role.Specialist:
        return 'bg-info-light text-info-text dark:bg-blue-900/50 dark:text-blue-300';
      case Role.Nurse:
        return 'bg-success-light text-success-text dark:bg-green-900/50 dark:text-green-300';
      case Role.Patient:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300';
      case Role.Admin:
        return 'bg-danger-light text-danger-text dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <header className="bg-surface shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="/#" className="flex items-center space-x-2 text-primary">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
              <span className="font-bold text-xl text-text-main">{t('appName')}</span>
            </a>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {!isOnline && (
                <div className="flex items-center gap-2 text-sm font-semibold bg-warning-light text-warning-text dark:bg-amber-900/50 dark:text-amber-300 px-3 py-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Offline</span>
                </div>
            )}
            {user ? (
              <>
                <div className="hidden md:flex items-center text-accent font-semibold">
                    <span>{ICONS.money}</span>
                    <span className="ml-1">{t('credits', { count: user.credits })}</span>
                </div>
                <LanguageSwitcher />
                
                {/* Antigravity Toggle */}
                <button
                  onClick={toggleAntigravity}
                  className={`p-2 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${isAntigravityActive ? 'text-white bg-indigo-500 animate-pulse' : 'text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  title="Toggle Antigravity Mode"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>

                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-text-main focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 ease-in-out"
                  title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  <div className={`transform transition-transform duration-500 ${theme === 'dark' ? 'rotate-180' : ''}`}>
                    {theme === 'light' ? ICONS.moon : ICONS.sun}
                  </div>
                </button>
                <NotificationBell />
                 <button onClick={onProfileClick} className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" title="My Profile" aria-label="My Profile">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                        {user.name.charAt(0)}
                    </div>
                    <div className="hidden sm:flex flex-col items-start">
                        <span className="font-semibold text-sm text-text-main">{user.name}</span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${getRoleColor(user.role)}`}>{user.role}</span>
                    </div>
                </button>
                <button 
                    onClick={logout} 
                    className="p-2 rounded-full text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-text-main focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    title="Log out"
                    aria-label="Log out"
                >
                  {ICONS.logout}
                </button>
              </>
            ) : (
              <>
                <LanguageSwitcher />
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-text-main focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 ease-in-out"
                  title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  <div className={`transform transition-transform duration-500 ${theme === 'dark' ? 'rotate-180' : ''}`}>
                    {theme === 'light' ? ICONS.moon : ICONS.sun}
                  </div>
                </button>
                <button
                  onClick={onLoginClick}
                  className="bg-primary text-white font-semibold px-4 py-2 rounded-md hover:bg-primary-hover transition duration-300"
                >
                  {t('loginSignUp')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

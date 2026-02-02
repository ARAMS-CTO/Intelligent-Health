
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './Auth';
import { ICONS } from '../constants/index';
import { Role } from '../types/index';
import NotificationBell from './NotificationBell';
import { useTheme } from './Theme';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Header: React.FC<{ onLoginClick: () => void; onProfileClick: () => void; onFeedbackClick: () => void; }> = ({ onLoginClick, onProfileClick, onFeedbackClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.Doctor:
      case Role.Specialist:
        return 'bg-info-light text-info-text border border-info-border/30 dark:bg-blue-900/40 dark:text-blue-200';
      case Role.Nurse:
        return 'bg-success-light text-success-text border border-success-border/30 dark:bg-green-900/40 dark:text-green-200';
      case Role.Patient:
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200/30 dark:bg-indigo-900/40 dark:text-indigo-200';
      case Role.Admin:
        return 'bg-danger-light text-danger-text border border-danger-border/30 dark:bg-red-900/40 dark:text-red-200';
      case Role.Dentist:
        return 'bg-purple-50 text-purple-700 border border-purple-200/30 dark:bg-purple-900/40 dark:text-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <header className="glass sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-4 group">
              <div className="bg-primary/10 p-2.5 rounded-2xl group-hover:bg-primary/20 transition-all duration-500 group-hover:rotate-6 shadow-inner border border-white/20">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-primary transition-all duration-300 group-hover:scale-110"
                  style={{ width: '40px', height: '40px' }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-heading font-black text-xl sm:text-2xl lg:text-3xl text-text-main tracking-tighter">{t('appName')}</span>
            </a>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {!isOnline && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold bg-warning-light text-warning-text px-3 py-1.5 rounded-full border border-warning-border/50 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>Offline</span>
              </div>
            )}
            {user ? (
              <>
                <Link to="/credits" className="hidden lg:flex items-center bg-surface/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/50 mr-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <span className="text-accent">{ICONS.money}</span>
                  <span className="ml-2 font-bold text-sm text-text-main">{t('credits', { count: user.credits })}</span>
                </Link>

                <div className="hidden md:block">
                  <LanguageSwitcher />
                </div>

                {/* Antigravity Toggle */}


                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text-main focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 ease-in-out hover:scale-110"
                  title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  <div className={`transform transition-transform duration-500 ${theme === 'dark' ? 'rotate-180' : ''}`}>
                    {theme === 'light' ? ICONS.moon : ICONS.sun}
                  </div>
                </button>

                <button
                  onClick={onFeedbackClick}
                  className="p-2 rounded-full text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-all duration-300 transform hover:scale-110"
                  title="Feedback & Support"
                >
                  {ICONS.support}
                </button>

                <NotificationBell />

                <button onClick={onProfileClick} className="flex items-center gap-2 pl-1 pr-1 sm:pr-3 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="My Profile" aria-label="My Profile">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md ring-2 ring-white dark:ring-slate-800">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="font-bold text-xs sm:text-sm text-text-main leading-tight">{user.name}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${getRoleColor(user.role)}`}>{user.role}</span>
                  </div>
                </button>
                <button
                  onClick={logout}
                  className="p-2 rounded-full text-text-muted hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 text-opacity-80 transition-all duration-300"
                  title="Log out"
                  aria-label="Log out"
                >
                  {ICONS.logout}
                </button>
              </>
            ) : (
              <>
                <div className="hidden sm:block">
                  <LanguageSwitcher />
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text-main focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 ease-in-out"
                  title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  <div className={`transform transition-transform duration-500 ${theme === 'dark' ? 'rotate-180' : ''}`}>
                    {theme === 'light' ? ICONS.moon : ICONS.sun}
                  </div>
                </button>
                <button
                  onClick={onLoginClick}
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2 rounded-full shadow-lg shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5"
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

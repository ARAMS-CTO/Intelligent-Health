import React from 'react';
import { APP_VERSION } from '../constants';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full py-4 px-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-sans">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <span className="font-bold">Intelligent Health</span>
                <span>&copy; {currentYear}</span>
            </div>
            <div className="flex items-center gap-4">
                <span>v{APP_VERSION}</span>
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
        </footer>
    );
};

export default Footer;

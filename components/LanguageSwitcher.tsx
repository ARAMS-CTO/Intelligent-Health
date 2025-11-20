import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
    { code: 'en', name: 'English' },
    { code: 'fa', name: 'فارسی' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'zh', name: '中文' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'tl', name: 'Tagalog' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'ru', name: 'Русский' },
];

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    
    // Find current language, defaulting to English if the code is not found
    const currentLanguageCode = i18n.language.split('-')[0]; // handle cases like en-US
    const currentLanguage = languages.find(lang => lang.code === currentLanguageCode) || languages[0];

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-text-muted hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-text-main focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center gap-1.5"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 017 2zM5.106 4.106a.75.75 0 010 1.06l-.707.707a.75.75 0 01-1.06-1.06l.707-.707a.75.75 0 011.06 0zM10 5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 5zM14.894 4.106a.75.75 0 011.06 0l.707.707a.75.75 0 11-1.06 1.06l-.707-.707a.75.75 0 010-1.06zM3 9.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 9.25zM14.5 9.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM5.106 14.894a.75.75 0 010-1.06l.707-.707a.75.75 0 011.06 1.06l-.707.707a.75.75 0 01-1.06 0zM10 15a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5H10.75a.75.75 0 01-.75-.75zM12.894 14.894a.75.75 0 011.06 0l.707.707a.75.75 0 01-1.06 1.06l-.707-.707a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
                <span className="text-sm font-semibold uppercase">{currentLanguage.code}</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-surface rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 animate-fade-in max-h-60 overflow-y-auto">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {languages.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className="block w-full text-left px-4 py-2 text-sm text-text-main hover:bg-slate-100 dark:hover:bg-slate-700"
                                role="menuitem"
                            >
                                {lang.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;

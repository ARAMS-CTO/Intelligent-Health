import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ICONS } from '../constants/index';
import { useAuth } from './Auth';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { label: 'Dashboard', path: '/admin', icon: ICONS.dashboard },
        { label: 'User Management', path: '/admin/users', icon: ICONS.users },
        { label: 'System Stats', path: '/admin/stats', icon: ICONS.chart },
        { label: 'AI Configuration', path: '/admin/ai-config', icon: ICONS.ai },
        { label: 'Finance', path: '/admin/finance', icon: ICONS.money },
    ];

    const isActive = (path: string) => location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-200 dark:border-slate-700">
                    <div className="p-2 bg-primary rounded-lg text-white">
                        {React.cloneElement(ICONS.specialist as any, { className: "w-6 h-6" })}
                    </div>
                    <div>
                        <h1 className="font-heading font-black text-lg text-text-main tracking-tight">Admin<span className="text-primary">Console</span></h1>
                    </div>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive(item.path)
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text-main'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-danger hover:bg-danger/10 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 relative">
                {/* Mobile Header */}
                <header className="lg:hidden h-20 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40">
                    <h1 className="font-heading font-bold text-text-main">Admin Console</h1>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-text-main">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </header>

                <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fade-in">
                    {children}
                </div>
            </main>

            {/* Overlay */}
            {isMobileMenuOpen && <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"></div>}
        </div>
    );
};

export default AdminLayout;

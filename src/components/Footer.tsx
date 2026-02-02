import React from 'react';
import { APP_VERSION } from '../constants/index';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pt-10 pb-6 px-6 font-sans mt-auto">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                        <span className="w-6 h-6 bg-gradient-to-br from-primary to-indigo-600 rounded-lg"></span>
                        Intelligent Health
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed max-w-xs">
                        The unified clinical operating system powered by Autonomous AI Agents.
                        Securing life at the speed of light.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold text-sm text-text-main mb-3 uppercase tracking-wider">Platform</h4>
                    <ul className="space-y-2 text-xs text-text-muted">
                        <li><Link to="/master-doctor" className="hover:text-primary transition-colors font-bold text-indigo-600">🧠 Master AI Doctor</Link></li>
                        <li><Link to="/vip-longevity" className="hover:text-primary transition-colors font-bold text-violet-500">🧬 VIP Longevity & Genetics</Link></li>
                        <li><Link to="/roadmap" className="hover:text-primary transition-colors font-bold text-indigo-500">🚀 Roadmap 2026</Link></li>
                        <li><Link to="/help" className="hover:text-primary transition-colors">Help & User Manual</Link></li>
                        <li><Link to="/ecosystem" className="hover:text-primary transition-colors">Ecosystem Connectivity</Link></li>
                        <li><Link to="/security" className="hover:text-primary transition-colors">Security & Trust</Link></li>
                        <li><Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
                        <li><Link to="/developer-portal" className="hover:text-primary transition-colors">Developers</Link></li>
                    </ul>
                </div>


                <div>
                    <h4 className="font-bold text-sm text-text-main mb-3 uppercase tracking-wider">Specialists</h4>
                    <ul className="space-y-2 text-xs text-text-muted">
                        <li><Link to="/rheumatology" className="hover:text-primary transition-colors font-bold text-amber-500">🦶 Gout & Rheumatology</Link></li>
                        <li><Link to="/metabolic" className="hover:text-primary transition-colors">Metabolic Medicine</Link></li>
                        <li><Link to="/hematology" className="hover:text-primary transition-colors">Hematology</Link></li>
                        <li><Link to="/oncology" className="hover:text-primary transition-colors">Oncology</Link></li>
                        <li><Link to="/cardiology" className="hover:text-primary transition-colors">Cardiology</Link></li>
                        <li><Link to="/body-map" className="hover:text-primary transition-colors font-bold text-indigo-500">✨ Interactive Body Map</Link></li>
                    </ul>
                </div>


                <div>
                    <h4 className="font-bold text-sm text-text-main mb-3 uppercase tracking-wider">Legal</h4>
                    <ul className="space-y-2 text-xs text-text-muted">
                        <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                        <li><span className="font-mono text-xs opacity-50">v{APP_VERSION}</span></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-text-muted">
                <span>&copy; {currentYear} Intelligent Health. All rights reserved.</span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    System Operational • Enforced by Smart Contracts
                </span>
            </div>
        </footer>
    );
};

export default Footer;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { useTranslation } from 'react-i18next';
import { Case } from '../types';

const PhysioDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation('dashboard');
    const [patients, setPatients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // In real app, fetch physio-assigned patients
        const loadData = async () => {
            try {
                // Mock or real fetch
                await new Promise(r => setTimeout(r, 800));
                setPatients([]); // Empty for now
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user]);

    if (!user) return null;

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen p-8">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-slate-800 dark:text-white">
                    Physiotherapy <span className="text-primary">Department</span>
                </h1>
                <p className="text-slate-500 mt-2">Rehabilitation & Physical Wellness Tracking</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 rounded-2xl border border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-900/10">
                    <h4 className="font-bold text-emerald-700 dark:text-emerald-300 mb-2">Active Sessions</h4>
                    <p className="text-3xl font-black text-slate-800 dark:text-white">0</p>
                </div>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                <div className="text-4xl mb-4">🧘</div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Scheduled Sessions</h3>
                <p className="text-slate-500">Wait for doctor referrals or schedule a new session.</p>
            </div>
        </div>
    );
};

export default PhysioDashboard;

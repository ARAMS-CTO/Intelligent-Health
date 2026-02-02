import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataService } from '../services/api';

export const CreditBalance: React.FC = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState<number | null>(null);
    const [tier, setTier] = useState("FREE");
    const [loading, setLoading] = useState(true);

    const refreshBalance = async () => {
        try {
            const data = await DataService.getCreditBalance();
            setBalance(data.balance);
            setTier(data.tier);
        } catch (e) {
            console.error("Failed to load credits", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshBalance();
        // Optional: Listen to an event bus for 'credits_updated' if we had one
        const interval = setInterval(refreshBalance, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>;

    return (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-4 text-white shadow-lg flex items-center justify-between">
            <div>
                <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Available Credits</p>
                <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-bold">{balance?.toFixed(1)}</span>
                    <span className="text-sm opacity-80">tokens</span>
                </div>
            </div>

            <div className="text-right">
                <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium backdrop-blur-sm">
                    {tier} PLAN
                </span>
                <button
                    className="block mt-2 text-xs hover:underline text-indigo-100"
                    onClick={() => navigate('/credits')}
                >
                    + Add Credits
                </button>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';

export const ReferralCard: React.FC = () => {
    const [inviteCode, setInviteCode] = useState<string>("LOADING...");
    const [referralCount, setReferralCount] = useState(0);
    const [earnedCredits, setEarnedCredits] = useState(0);

    const fetchStats = async () => {
        try {
            const data = await DataService.getReferralStats();
            setInviteCode(data.invite_code || "IH-USER-" + Math.floor(Math.random() * 1000)); // Fallback if no code yet
            setReferralCount(data.referral_count);
            setEarnedCredits(data.credits_earned);
        } catch (e) {
            console.error("Referral stats error", e);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const copyCode = () => {
        navigator.clipboard.writeText(inviteCode);
        alert("Invite code copied!");
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-indigo-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Invite Friends, Earn Credits</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Give your friends <span className="font-bold text-indigo-600 dark:text-indigo-400">3 months of Pro</span> for free.
                You get <span className="font-bold text-indigo-600 dark:text-indigo-400">50 credits</span> for each verified signup.
            </p>

            <div className="flex items-center space-x-2 mb-6">
                <div className="flex-1 bg-gray-100 dark:bg-slate-900 p-3 rounded text-center font-mono font-medium tracking-wide text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700">
                    {inviteCode}
                </div>
                <button
                    onClick={copyCode}
                    className="p-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium transition-colors"
                >
                    Copy
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{referralCount}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Friends Joined</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{earnedCredits}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Credits Earned</p>
                </div>
            </div>

            <a href="/leaderboard" className="block w-full mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline text-center">
                View Leaderboard &rarr;
            </a>
        </div>
    );
};

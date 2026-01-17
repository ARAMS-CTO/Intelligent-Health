import React, { useState } from 'react';

export const ReferralCard: React.FC = () => {
    // Mock data for now
    const inviteCode = "IH-JDOE-2025";
    const [referralCount, setReferralCount] = useState(3);
    const [earnedCredits, setEarnedCredits] = useState(150);

    const copyCode = () => {
        navigator.clipboard.writeText(inviteCode);
        alert("Invite code copied!");
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Invite Friends, Earn Credits</h3>
            <p className="text-sm text-gray-600 mb-4">
                Give your friends <span className="font-bold text-indigo-600">3 months of Pro</span> for free.
                You get <span className="font-bold text-indigo-600">50 credits</span> for each verified signup.
            </p>

            <div className="flex items-center space-x-2 mb-6">
                <div className="flex-1 bg-gray-100 p-3 rounded text-center font-mono font-medium tracking-wide text-gray-700 border border-gray-200">
                    {inviteCode}
                </div>
                <button
                    onClick={copyCode}
                    className="p-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
                >
                    Copy
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-indigo-50 p-3 rounded">
                    <p className="text-2xl font-bold text-indigo-700">{referralCount}</p>
                    <p className="text-xs text-indigo-600 uppercase tracking-wide">Friends Joined</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded">
                    <p className="text-2xl font-bold text-indigo-700">{earnedCredits}</p>
                    <p className="text-xs text-indigo-600 uppercase tracking-wide">Credits Earned</p>
                </div>
            </div>

            <button className="w-full mt-4 text-indigo-600 text-sm font-medium hover:underline">
                View Leaderboard &rarr;
            </button>
        </div>
    );
};

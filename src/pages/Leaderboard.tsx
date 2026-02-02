import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { useAuth } from '../components/Auth';

const Leaderboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<{
        referral_count: number;
        credits_earned: number;
        rank: number;
        top_referrers: { name: string; count: number; credits: number }[];
        invite_code: string;
    } | null>(null);
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const myStats = await DataService.getReferralStats(); // Existing mock or real
                const leaderboard = await DataService.getLeaderboard(); // NEW REAL

                setStats({
                    referral_count: myStats.referral_count,
                    credits_earned: myStats.credits_earned,
                    rank: 0,
                    top_referrers: leaderboard.map(l => ({
                        name: l.name,
                        count: l.referrals,
                        credits: l.credits
                    })),
                    invite_code: myStats.invite_code || "Unknown"
                });
            } catch (e) {
                console.error(e);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-heading font-black text-gray-900 dark:text-white mb-2">
                    <span className="text-primary">Referral</span> Leaderboard
                </h1>
                <p className="text-gray-500">Invite friends, earn credits, and climb the ranks.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* My Stats */}
                {/* My Stats */}
                <div className="md:col-span-1 space-y-6">
                    <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl relative overflow-hidden">
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>

                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold backdrop-blur-sm border border-white/30 shadow-inner">
                                {user?.name?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">{user?.name}</h3>
                                <div className="text-white/80 text-sm font-mono">{user?.role}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                                <div className="text-2xl font-black">{stats?.referral_count || 0}</div>
                                <div className="text-[10px] uppercase tracking-wider opacity-70">Friends Invited</div>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                                <div className="text-2xl font-black text-green-300">${stats?.credits_earned || 0}</div>
                                <div className="text-[10px] uppercase tracking-wider opacity-70">Credits Earned</div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/10 text-center relative z-10">
                            <h4 className="text-sm font-bold opacity-80 mb-3">YOUR INVITE CODE</h4>
                            <div
                                onClick={() => {
                                    navigator.clipboard.writeText(stats?.invite_code || "REF-ERROR");
                                    // Assuming simple alert or toast availability 
                                    alert("Copied to clipboard!");
                                }}
                                className="bg-white/90 text-indigo-900 font-mono text-2xl font-black py-4 rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2 group"
                            >
                                {stats?.invite_code || "LOADING..."}
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm">📋</span>
                            </div>
                            <p className="text-xs text-white/60 mt-2">Tap to copy & share</p>
                        </div>
                    </div>

                    {/* Share Actions */}
                    <div className="glass-card p-6 rounded-2xl flex flex-col gap-3">
                        <button
                            onClick={() => {
                                const url = `https://intelligenthealth.world/join?ref=${stats?.invite_code}`;
                                navigator.clipboard.writeText(url);
                                alert("Link copied to clipboard!");
                            }}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                        >
                            <span>📲</span> Share Link
                        </button>
                        <button
                            onClick={() => setShowQR(true)}
                            className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                        >
                            <span>📷</span> Show QR Code
                        </button>
                        <div className="text-center text-xs text-slate-400 px-4 mt-2">
                            Earn $100 credits for every friend who joins and books their first appointment.
                        </div>
                    </div>
                </div>

                {/* QR Modal */}
                {showQR && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
                        <div className="bg-white p-8 rounded-2xl shadow-2xl animate-scale-in text-center max-w-sm" onClick={e => e.stopPropagation()}>
                            <h3 className="text-2xl font-black mb-2">Scan to Join</h3>
                            <p className="text-slate-500 mb-6">Share this QR code with your friends.</p>

                            <div className="bg-white p-2 rounded-xl border border-slate-200 inline-block mb-6 shadow-inner">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://intelligenthealth.world/join?ref=${stats?.invite_code || 'error'}`}
                                    alt="Referral QR"
                                    className="w-64 h-64"
                                />
                            </div>

                            <div className="bg-slate-100 p-3 rounded-lg font-mono font-bold text-lg text-slate-700 tracking-wider mb-6">
                                {stats?.invite_code}
                            </div>

                            <button onClick={() => setShowQR(false)} className="w-full py-3 bg-primary text-white font-bold rounded-xl">
                                Done
                            </button>
                        </div>
                    </div>
                )}

                {/* Leaderboard Table */}
                <div className="md:col-span-2">
                    <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                                <span>🏆</span> Top Referrers
                            </h3>
                            <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full">Weekly</span>
                        </div>

                        {!stats?.top_referrers.length ? (
                            <div className="p-12 text-center">
                                <div className="text-6xl mb-4 opacity-20">🚀</div>
                                <h3 className="text-xl font-bold text-text-main mb-2">Be the first to lead!</h3>
                                <p className="text-text-muted">No referrals yet. Invite a friend to claim the #1 spot.</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-text-muted font-bold">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Rank</th>
                                        <th className="px-6 py-4 text-left">User</th>
                                        <th className="px-6 py-4 text-center">Invites</th>
                                        <th className="px-6 py-4 text-right">Credits</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {stats.top_referrers.map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    i === 1 ? 'bg-gray-100 text-gray-700' :
                                                        i === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'text-text-muted'
                                                    }`}>
                                                    {i + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-text-main">{r.name}</td>
                                            <td className="px-6 py-4 text-center text-text-muted">{r.count}</td>
                                            <td className="px-6 py-4 text-right font-mono text-primary font-bold">{r.credits}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;

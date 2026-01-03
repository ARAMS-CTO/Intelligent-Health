import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants';
import { showToast } from '../components/Toast';

export const ResearchCommunity: React.FC = () => {
    const [balance, setBalance] = useState({ balance: 0, total_earned: 0 });
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groups, setGroups] = useState<any[]>([]);
    const [groupForm, setGroupForm] = useState({ name: '', topic: '', members: '' });

    useEffect(() => {
        loadBalance();
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const data = await DataService.getResearchGroups();
            setGroups(data);
        } catch (e) {
            console.error("Failed to load groups", e);
        }
    };

    const loadBalance = async () => {
        try {
            const data = await DataService.getTokenBalance();
            setBalance(data);
        } catch (e) {
            console.error("Failed to load token balance", e);
        }
    };

    const handleCreateGroup = async () => {
        try {
            const memberList = groupForm.members.split(',').map(s => s.trim()).filter(s => s);
            await DataService.createResearchGroup(groupForm.name, groupForm.topic, memberList);
            showToast.success("Research Group Created!");
            setShowCreateGroup(false);
        } catch (e) {
            showToast.error("Failed to create group. Ensure you have 1 Doctor, 1 Nurse, 1 Patient.");
        }
    };

    return (
        <div className="container mx-auto px-6 py-8 animate-fade-in">
            {/* Header / Hero */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden mb-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 max-w-3xl">
                    <h1 className="text-5xl font-heading font-black mb-6 tracking-tight">
                        ARAMS Research Ecosystem
                    </h1>
                    <p className="text-xl text-indigo-100 leading-relaxed mb-8">
                        Join a decentralized movement to reclaim medical data for humanity.
                        Collaborate in diverse teams (Doctors, Nurses, Patients) to ensure high-quality, verified research
                        outside of big corporate silos.
                    </p>

                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <span className="block text-xs uppercase tracking-widest opacity-70">Your Wallet</span>
                            <span className="text-3xl font-bold flex items-center gap-2">
                                {ICONS.money} {balance.balance.toFixed(2)} <span className="text-sm opacity-50">ARAMS</span>
                            </span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <span className="block text-xs uppercase tracking-widest opacity-70">Lifetime Earned</span>
                            <span className="text-3xl font-bold flex items-center gap-2">
                                {balance.total_earned.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Philosophy Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-text-main">
                        Why ARAMS?
                    </h2>
                    <p className="text-text-muted leading-relaxed">
                        Data is the new oil, but in healthcare, it belongs to the people.
                        The ARAMS tokenized ecosystem ensures that **90%** of value generated from research insights
                        is redistributed directly to the contributors—the patients providing data and the clinicians verifying it.
                    </p>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">✅</div>
                            <div>
                                <strong className="block text-text-main">Verified Integrity</strong>
                                <span className="text-sm text-text-muted">No fake data. Every dataset is peer-reviewed by a Nurse & Doctor.</span>
                            </div>
                        </li>
                        <li className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">🤝</div>
                            <div>
                                <strong className="block text-text-main">Fair Distribution</strong>
                                <span className="text-sm text-text-muted">Smart contracts ensure automatic payouts upon research usage.</span>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary text-4xl mb-6">
                        🧪
                    </div>
                    <h3 className="text-2xl font-bold text-text-main mb-2">Start a Research Group</h3>
                    <p className="text-text-muted max-w-sm mb-6">
                        Form a team to tackle a specific condition.
                        <br /><span className="text-xs font-bold text-warning-text uppercase mt-2 block">Requirement: 1 Doctor + 1 Nurse + 1 Patient</span>
                    </p>

                    {!showCreateGroup ? (
                        <button
                            onClick={() => setShowCreateGroup(true)}
                            className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-primary/30"
                        >
                            Create New Group
                        </button>
                    ) : (
                        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl text-left">
                            <h4 className="font-bold text-lg mb-4">New Research Project</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1">Project Name</label>
                                    <input
                                        value={groupForm.name}
                                        onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-none"
                                        placeholder="e.g. Type 2 Diabetes Lifestyle Study"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1">Research Topic</label>
                                    <input
                                        value={groupForm.topic}
                                        onChange={e => setGroupForm({ ...groupForm, topic: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-none"
                                        placeholder="Specific medical condition or therapy"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1">Members (User IDs, comma separated)</label>
                                    <input
                                        value={groupForm.members}
                                        onChange={e => setGroupForm({ ...groupForm, members: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-none"
                                        placeholder="doctor_id, nurse_id, patient_id"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button onClick={() => setShowCreateGroup(false)} className="px-4 py-2 text-text-muted hover:bg-slate-100 rounded-lg">Cancel</button>
                                    <button onClick={handleCreateGroup} className="px-4 py-2 bg-primary text-white font-bold rounded-lg">Launch Project</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Existing Groups List */}
            <div className="mb-16">
                <h3 className="text-2xl font-bold text-text-main mb-6 flex items-center gap-3">
                    <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">{ICONS.users}</span>
                    Active Research Projects
                </h3>

                {groups.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-text-muted font-bold">No public research groups founded yet.</p>
                        <button onClick={() => setShowCreateGroup(true)} className="mt-4 text-primary text-sm font-bold hover:underline">Be the first to start one!</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map((group: any) => (
                            <div key={group.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all group-card">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl font-bold text-lg">
                                        {group.name.charAt(0)}
                                    </div>
                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full">Active</span>
                                </div>
                                <h4 className="font-bold text-lg text-text-main mb-1 truncate">{group.name}</h4>
                                <p className="text-sm text-text-muted mb-4">{group.topic}</p>

                                <div className="flex items-center justify-between text-xs text-text-muted border-t border-slate-100 dark:border-slate-700 pt-4">
                                    <span>Generated: <strong className="text-text-main">{group.total_tokens_generated?.toFixed(0) || 0} Tokens</strong></span>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await DataService.joinResearchGroup(group.id);
                                                showToast.success(`Joined ${group.name}!`);
                                            } catch (e) { showToast.error("Failed to join group"); }
                                        }}
                                        className="text-primary font-bold hover:text-primary-hover"
                                    >
                                        Join &rarr;
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-700/30">
                <span className="font-bold text-amber-600 uppercase tracking-widest text-xs mb-2 block">Coming Soon</span>
                <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">Internal Blockchain Integration</h3>
                <div className="text-amber-800 dark:text-amber-200/70 text-sm">
                    We are currently developing the Smart Contract layer to move ARAMS from a centralized ledger to a full decentralized chain. This will allow:
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                        <li>Immutable Proof of contribution</li>
                        <li>Cross-border Payouts via Crypto Rails</li>
                        <li>DAO Governance for Research Funding</li>
                    </ul>
                </div>
            </div>
        </div >
    );
};

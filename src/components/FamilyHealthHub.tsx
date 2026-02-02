import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';

interface FamilyMember {
    id: string;
    name: string;
    relationship: string;
    age: number;
    avatarColor: string;
    hasAccess: boolean;
    upcomingAppointments: number;
    pendingRefills: number;
    lastCheckup: string;
}

export const FamilyHealthHub: React.FC = () => {
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Mock family data
    const mockMembers: FamilyMember[] = [
        { id: '1', name: 'You', relationship: 'Self', age: 38, avatarColor: 'from-blue-500 to-indigo-600', hasAccess: true, upcomingAppointments: 1, pendingRefills: 0, lastCheckup: '2026-01-15' },
        { id: '2', name: 'Jane', relationship: 'Spouse', age: 36, avatarColor: 'from-pink-500 to-rose-600', hasAccess: true, upcomingAppointments: 2, pendingRefills: 1, lastCheckup: '2025-12-20' },
        { id: '3', name: 'Tommy', relationship: 'Son', age: 8, avatarColor: 'from-green-500 to-emerald-600', hasAccess: true, upcomingAppointments: 0, pendingRefills: 0, lastCheckup: '2025-11-10' },
        { id: '4', name: 'Sarah', relationship: 'Daughter', age: 5, avatarColor: 'from-purple-500 to-violet-600', hasAccess: true, upcomingAppointments: 1, pendingRefills: 0, lastCheckup: '2025-10-05' },
    ];

    useEffect(() => {
        setTimeout(() => {
            setMembers(mockMembers);
            setIsLoading(false);
        }, 500);
    }, []);

    const needsCheckup = (lastCheckup: string) => {
        const monthsSince = Math.floor((Date.now() - new Date(lastCheckup).getTime()) / (1000 * 60 * 60 * 24 * 30));
        return monthsSince > 6;
    };

    const handleAddMember = () => {
        showToast.success('Family member invitation sent');
        setShowAddModal(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    👨‍👩‍👧‍👦 Family Health Hub
                </h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2"
                >
                    {ICONS.plus} Add Member
                </button>
            </div>

            {/* Family Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-2xl text-center">
                    <div className="text-3xl font-black text-primary">{members.length}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Family Members</div>
                </div>
                <div className="glass-card p-4 rounded-2xl text-center">
                    <div className="text-3xl font-black text-green-500">
                        {members.reduce((sum, m) => sum + m.upcomingAppointments, 0)}
                    </div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Appointments</div>
                </div>
                <div className="glass-card p-4 rounded-2xl text-center">
                    <div className="text-3xl font-black text-amber-500">
                        {members.reduce((sum, m) => sum + m.pendingRefills, 0)}
                    </div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Pending Refills</div>
                </div>
                <div className="glass-card p-4 rounded-2xl text-center">
                    <div className="text-3xl font-black text-red-500">
                        {members.filter(m => needsCheckup(m.lastCheckup)).length}
                    </div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Need Checkup</div>
                </div>
            </div>

            {/* Family Members Grid */}
            {isLoading ? (
                <div className="text-center py-12 text-slate-400">Loading family members...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {members.map(member => (
                        <div
                            key={member.id}
                            onClick={() => setSelectedMember(member)}
                            className="glass-card p-5 rounded-2xl cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border border-white/20 dark:border-slate-700/50"
                        >
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${member.avatarColor} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                                    {member.name.charAt(0)}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">{member.name}</h3>
                                        {member.relationship === 'Self' && (
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">YOU</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mb-2">
                                        {member.relationship} • {member.age} years old
                                    </p>

                                    {/* Status Badges */}
                                    <div className="flex flex-wrap gap-2">
                                        {member.upcomingAppointments > 0 && (
                                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg">
                                                📅 {member.upcomingAppointments} appt
                                            </span>
                                        )}
                                        {member.pendingRefills > 0 && (
                                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-lg">
                                                💊 {member.pendingRefills} refill
                                            </span>
                                        )}
                                        {needsCheckup(member.lastCheckup) && (
                                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded-lg animate-pulse">
                                                ⚠️ Checkup due
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="text-slate-400">→</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Actions */}
            <div className="glass-card p-5 rounded-2xl">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-center">
                        <div className="text-2xl mb-1">📅</div>
                        <p className="font-bold text-xs">Schedule Checkup</p>
                    </button>
                    <button className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-center">
                        <div className="text-2xl mb-1">💉</div>
                        <p className="font-bold text-xs">Immunizations</p>
                    </button>
                    <button className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-center">
                        <div className="text-2xl mb-1">📊</div>
                        <p className="font-bold text-xs">View Reports</p>
                    </button>
                    <button className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-center">
                        <div className="text-2xl mb-1">💊</div>
                        <p className="font-bold text-xs">All Medications</p>
                    </button>
                </div>
            </div>

            {/* Member Detail Modal */}
            {selectedMember && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <div className={`p-6 bg-gradient-to-br ${selectedMember.avatarColor} text-white`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-bold">{selectedMember.name}</h3>
                                    <p className="opacity-80">{selectedMember.relationship} • {selectedMember.age} yrs</p>
                                </div>
                                <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-white/20 rounded-lg">
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                    <p className="text-2xl font-black text-primary">{selectedMember.upcomingAppointments}</p>
                                    <p className="text-xs text-slate-500">Appointments</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                    <p className="text-2xl font-black text-amber-500">{selectedMember.pendingRefills}</p>
                                    <p className="text-xs text-slate-500">Refills</p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Last Checkup</p>
                                <p className="font-bold text-slate-800 dark:text-white">
                                    {new Date(selectedMember.lastCheckup).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                                {needsCheckup(selectedMember.lastCheckup) && (
                                    <p className="text-red-500 text-sm mt-1">⚠️ Due for annual checkup</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button className="py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors text-sm">
                                    View Records
                                </button>
                                <button className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm">
                                    Schedule Visit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-4">
                            Add Family Member
                        </h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
                                <input type="email" placeholder="family@example.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Relationship</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <option>Spouse</option>
                                    <option>Child</option>
                                    <option>Parent</option>
                                    <option>Sibling</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">
                                Cancel
                            </button>
                            <button onClick={handleAddMember} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl">
                                Send Invite
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyHealthHub;

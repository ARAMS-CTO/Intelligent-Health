import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/api';
import { ICONS } from '../../constants/index';
import { showToast } from '../Toast';
import { useAuth } from '../Auth';
import { VaccineTracker } from './VaccineTracker';
import { SpecialistAgentChat } from '../specialized/SpecialistAgentChat';

interface FamilyMember {
    id: string;
    role: string;
    name: string;
    access_level: string;
}

export const PediatricsDashboard: React.FC = () => {
    const { user } = useAuth();
    const [family, setFamily] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Feature States
    const [viewMode, setViewMode] = useState<'overview' | 'vaccines' | 'symptoms'>('overview');
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

    // Add Child Form
    const [newChildName, setNewChildName] = useState('');
    const [newChildDob, setNewChildDob] = useState('');
    const [newChildGender, setNewChildGender] = useState('Male');

    useEffect(() => {
        loadFamily();
    }, []);

    // Ensure we have a default selected child if available
    useEffect(() => {
        if (family.length > 0 && !selectedChildId) {
            const child = family.find(m => m.role?.toUpperCase() === 'CHILD');
            if (child) setSelectedChildId(child.id);
        }
    }, [family, selectedChildId]);

    const loadFamily = async () => {
        setLoading(true);
        try {
            const data = await DataService.getFamilyMembers();
            setFamily(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChild = async () => {
        if (!newChildName || !newChildDob) {
            showToast.error("Please fill in all fields");
            return;
        }
        try {
            await DataService.addChildAccount({
                name: newChildName,
                dob: newChildDob,
                gender: newChildGender
            });
            showToast.success(`Added ${newChildName} to Family`);
            setShowAddModal(false);
            setNewChildName('');
            setNewChildDob('');
            loadFamily();
        } catch (e) {
            showToast.error("Failed to add child");
        }
    };

    // Filter to show only children
    const children = family.filter(m => m.role?.toUpperCase() === 'CHILD');

    // Helper to get selected child details
    const selectedChild = family.find(f => f.id === selectedChildId);
    // Mock age calc (real app would differ)
    const childAge = selectedChild ? 4 : 0;

    return (
        <div className="space-y-8 animate-fade-in text-slate-800 dark:text-white">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black flex items-center gap-2">
                        <span>🧸</span> Pediatrics & Family
                    </h2>
                    <p className="text-slate-500 font-medium">Manage your children's health records and growth.</p>
                </div>
                <div className="flex gap-2">
                    {viewMode !== 'overview' && (
                        <button
                            onClick={() => setViewMode('overview')}
                            className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800"
                        >
                            Back to Dashboard
                        </button>
                    )}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg hover:shadow-primary/30"
                    >
                        <span>+</span> Add Child
                    </button>
                </div>
            </div>

            {/* Child Selector (if multiple) */}
            {children.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {children.map(child => (
                        <button
                            key={child.id}
                            onClick={() => setSelectedChildId(child.id)}
                            className={`px-4 py-2 rounded-full border text-sm font-bold transition-all whitespace-nowrap ${selectedChildId === child.id
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary'
                                }`}
                        >
                            {child.name}
                        </button>
                    ))}
                </div>
            )}

            {viewMode === 'overview' && (
                <>
                    {/* Children Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full py-12 text-center text-slate-400">Loading family data...</div>
                        ) : children.length === 0 ? (
                            <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-700">
                                <div className="text-4xl mb-4 opacity-50">👶</div>
                                <h3 className="font-bold text-lg mb-2">No Children Added Yet</h3>
                                <p className="text-slate-500 mb-6">Create a profile for your child to track their health.</p>
                                <button onClick={() => setShowAddModal(true)} className="text-primary font-bold hover:underline">Add First Child</button>
                            </div>
                        ) : (
                            children.map(child => (
                                <div key={child.id} onClick={() => setSelectedChildId(child.id)} className={`glass-card p-6 rounded-2xl hover:scale-[1.02] transition-transform cursor-pointer group ${selectedChildId === child.id ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900' : ''}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                                            {child.name.charAt(0)}
                                        </div>
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold uppercase">
                                            Verified
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{child.name}</h3>
                                    <p className="text-sm text-slate-400 mb-4">Role: {child.role}</p>

                                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Last Checkup</span>
                                            <span className="font-bold">--</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Vaccinations</span>
                                            <span className="font-bold text-green-500">Up to Date</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Growth Chart */}
                    <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="text-9xl">📏</span>
                        </div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="font-bold text-xl">📈 WHO Growth Standards</h3>
                            <div className="text-sm text-slate-500">
                                Tracking: <span className="font-bold text-slate-800 dark:text-white">{selectedChild?.name || 'All'}</span>
                                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-bold">50th Percentile</span>
                            </div>
                        </div>

                        <div className="h-64 flex items-end justify-between gap-1 px-4 border-b border-l border-slate-200 dark:border-slate-700 pb-2 relative bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
                            {/* Percentile Curves Background Mock */}
                            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" preserveAspectRatio="none">
                                <path d="M0,250 C100,200 300,100 800,50" stroke="gray" strokeWidth="1" fill="none" strokeDasharray="5,5" />
                                <path d="M0,240 C100,180 300,80 800,20" stroke="gray" strokeWidth="1" fill="none" strokeDasharray="5,5" />
                            </svg>

                            {/* Data Bars */}
                            {[40, 45, 52, 60, 68, 75, 82, 90, 95, 102, 110, 115].map((h, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 group flex-1 relative z-10">
                                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-1 rounded">{h}cm</div>
                                    <div
                                        style={{ height: `${(h / 140) * 100}%` }}
                                        className="w-full max-w-[20px] bg-gradient-to-t from-blue-400 to-cyan-300 rounded-t-lg group-hover:from-primary group-hover:to-purple-400 transition-all shadow-lg"
                                    ></div>
                                    <span className="text-[10px] text-slate-400">{i * 6}m</span>
                                </div>
                            ))}

                            {/* Y-Axis Label */}
                            <div className="absolute top-0 -left-8 h-full flex flex-col justify-between text-xs text-slate-400">
                                <span>140cm</span>
                                <span>70cm</span>
                                <span>0cm</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button onClick={() => setViewMode('vaccines')} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-lg transition-all text-center">
                            <div className="text-2xl mb-2">💉</div>
                            <div className="font-bold text-sm">Vaccinations</div>
                        </button>
                        <button onClick={() => setViewMode('symptoms')} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-lg transition-all text-center">
                            <div className="text-2xl mb-2">🤒</div>
                            <div className="font-bold text-sm">Report Symptoms</div>
                        </button>
                        {/* Other placeholders */}
                        <button className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-lg transition-all text-center opacity-50 cursor-not-allowed">
                            <div className="text-2xl mb-2">📝</div>
                            <div className="font-bold text-sm">School Forms</div>
                        </button>
                        <button className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-lg transition-all text-center opacity-50 cursor-not-allowed">
                            <div className="text-2xl mb-2">🩺</div>
                            <div className="font-bold text-sm">Book Visit</div>
                        </button>
                    </div>
                </>
            )}

            {viewMode === 'vaccines' && selectedChild && (
                <VaccineTracker
                    childId={selectedChild.id}
                    childName={selectedChild.name}
                    ageMonths={childAge}
                />
            )}

            {viewMode === 'symptoms' && selectedChild && (
                <div className="space-y-6">
                    <div className="glass-card p-6 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500">
                        <h3 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                            🚨 Pediatric Triage for {selectedChild.name}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300">
                            Describe the symptoms your child is experiencing. The AI Pediatrician will assess urgency and provide guidance.
                        </p>
                    </div>

                    {/* Integrated AI Chat specialized for Pediatrics */}
                    <div className="h-[600px] border rounded-2xl overflow-hidden shadow-xl">
                        <SpecialistAgentChat
                            zone="pediatrics"
                            contextId={selectedChild.id}
                        />
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in">
                        <h3 className="text-xl font-bold mb-4">Add Child Profile</h3>
                        <p className="text-sm text-slate-500 mb-6">Create a health record for your child. You will be the primary guardian.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    value={newChildName} onChange={e => setNewChildName(e.target.value)}
                                    placeholder="e.g. Alice Smith"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    value={newChildDob} onChange={e => setNewChildDob(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                                <select
                                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    value={newChildGender} onChange={e => setNewChildGender(e.target.value)}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                            <button onClick={handleAddChild} className="flex-1 py-3 font-bold bg-primary text-white rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/30">Create Profile</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PediatricsDashboard;

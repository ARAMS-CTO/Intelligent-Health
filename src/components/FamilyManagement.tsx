import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { useAuth } from './Auth';
import { showToast } from './Toast';
import { ICONS } from '../constants/index';

interface FamilyGroup {
    id: string;
    name: string;
    ownerId: string;
    isOwner: boolean;
    memberCount: number;
    createdAt: string;
}

interface FamilyMember {
    id: string;
    name: string;
    relationship: string;
    userId?: string;
    patientId?: string;
    canViewRecords: boolean;
    canBookAppointments: boolean;
    canReceiveNotifications: boolean;
    addedAt: string;
}

interface FamilyManagementProps {
    onClose?: () => void;
}

const FamilyManagement: React.FC<FamilyManagementProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [groups, setGroups] = useState<FamilyGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [groupMembers, setGroupMembers] = useState<FamilyMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newMember, setNewMember] = useState({
        name: '',
        relationship: 'Spouse',
        canViewRecords: true,
        canBookAppointments: true
    });

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadGroupDetails(selectedGroup);
        }
    }, [selectedGroup]);

    const loadGroups = async () => {
        setIsLoading(true);
        try {
            const data = await DataService.getFamilyGroups();
            setGroups(data.groups || []);
            if (data.groups?.length > 0 && !selectedGroup) {
                setSelectedGroup(data.groups[0].id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadGroupDetails = async (groupId: string) => {
        try {
            const data = await DataService.getFamilyGroup(groupId);
            setGroupMembers(data.members || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        try {
            await DataService.createFamilyGroup(newGroupName);
            showToast.success('Family group created!');
            setNewGroupName('');
            setShowCreateModal(false);
            loadGroups();
        } catch (e: any) {
            showToast.error(e.message || 'Failed to create group');
        }
    };

    const handleAddMember = async () => {
        if (!selectedGroup || !newMember.name.trim()) return;
        try {
            await DataService.addFamilyMember(selectedGroup, newMember);
            showToast.success('Member added!');
            setNewMember({ name: '', relationship: 'Spouse', canViewRecords: true, canBookAppointments: true });
            setShowAddMemberModal(false);
            loadGroupDetails(selectedGroup);
        } catch (e: any) {
            showToast.error(e.message || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!selectedGroup) return;
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await DataService.removeFamilyMember(selectedGroup, memberId);
            showToast.success('Member removed');
            loadGroupDetails(selectedGroup);
        } catch (e: any) {
            showToast.error(e.message || 'Failed to remove member');
        }
    };

    const getRelationshipEmoji = (rel: string) => {
        switch (rel) {
            case 'Self': return '👤';
            case 'Spouse': return '💑';
            case 'Child': return '👶';
            case 'Parent': return '👨‍👩‍👧';
            case 'Dependent': return '🧑‍🤝‍🧑';
            default: return '👥';
        }
    };

    const currentGroup = groups.find(g => g.id === selectedGroup);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl mx-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-heading font-bold text-text-main flex items-center gap-3">
                        👨‍👩‍👧‍👦 Family Management
                    </h2>
                    <p className="text-sm text-text-muted mt-1">Manage family members and permissions</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        ✕
                    </button>
                )}
            </div>

            <div className="flex">
                {/* Groups Sidebar */}
                <div className="w-64 border-r border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-text-main">Groups</h3>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="text-primary hover:text-primary-hover font-bold text-sm"
                        >
                            + New
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="text-center text-text-muted py-4">Loading...</div>
                    ) : groups.length === 0 ? (
                        <div className="text-center text-text-muted py-4">
                            <p className="text-sm">No family groups yet</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-2 text-primary text-sm font-bold"
                            >
                                Create one
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {groups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => setSelectedGroup(group.id)}
                                    className={`w-full p-3 rounded-xl text-left transition-all ${selectedGroup === group.id
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                        } border border-transparent`}
                                >
                                    <div className="font-medium">{group.name}</div>
                                    <div className="text-xs text-text-muted">
                                        {group.memberCount} members {group.isOwner && '• Owner'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Members List */}
                <div className="flex-1 p-6">
                    {selectedGroup && currentGroup ? (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-text-main">{currentGroup.name}</h3>
                                {currentGroup.isOwner && (
                                    <button
                                        onClick={() => setShowAddMemberModal(true)}
                                        className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-hover"
                                    >
                                        + Add Member
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {groupMembers.map(member => (
                                    <div
                                        key={member.id}
                                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                                                {getRelationshipEmoji(member.relationship)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-text-main">{member.name}</div>
                                                <div className="text-sm text-text-muted">{member.relationship}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-2 text-xs">
                                                {member.canViewRecords && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">View</span>
                                                )}
                                                {member.canBookAppointments && (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Book</span>
                                                )}
                                            </div>
                                            {currentGroup.isOwner && member.relationship !== 'Self' && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-text-muted py-12">
                            Select a group to view members
                        </div>
                    )}
                </div>
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-96">
                        <h3 className="font-bold text-lg mb-4">Create Family Group</h3>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="e.g., Smith Family"
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-4"
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-text-muted">
                                Cancel
                            </button>
                            <button onClick={handleCreateGroup} className="px-4 py-2 bg-primary text-white rounded-lg">
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-96">
                        <h3 className="font-bold text-lg mb-4">Add Family Member</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newMember.name}
                                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                placeholder="Name"
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                            />
                            <select
                                value={newMember.relationship}
                                onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                            >
                                <option value="Spouse">Spouse</option>
                                <option value="Child">Child</option>
                                <option value="Parent">Parent</option>
                                <option value="Dependent">Dependent</option>
                            </select>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={newMember.canViewRecords}
                                        onChange={(e) => setNewMember({ ...newMember, canViewRecords: e.target.checked })}
                                    />
                                    <span className="text-sm">Can view records</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={newMember.canBookAppointments}
                                        onChange={(e) => setNewMember({ ...newMember, canBookAppointments: e.target.checked })}
                                    />
                                    <span className="text-sm">Can book</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowAddMemberModal(false)} className="px-4 py-2 text-text-muted">
                                Cancel
                            </button>
                            <button onClick={handleAddMember} className="px-4 py-2 bg-primary text-white rounded-lg">
                                Add Member
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyManagement;


import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DataService } from '../services/api';
import { PatientProfile, PatientFile } from '../types/index';
import { ICONS } from '../constants/index';
import Tooltip from '../components/Tooltip';
import Breadcrumbs from '../components/Breadcrumbs';
import { showToast } from '../components/Toast';

const getMedicationIcon = (frequency: string): { icon: React.ReactNode; tooltip: string; color: string } => {
    const freqLower = frequency.toLowerCase();
    if (freqLower.includes('daily') || freqLower.includes('nightly')) {
        return { icon: ICONS.clock, tooltip: 'Routine: Taken daily', color: 'text-info' };
    }
    if (freqLower.includes('as needed') || freqLower.includes('prn')) {
        return { icon: ICONS.plus, tooltip: 'As Needed', color: 'text-accent' };
    }
    if (freqLower.includes('weekly') || freqLower.includes('monthly')) {
        return { icon: ICONS.calendar, tooltip: 'Scheduled: Taken periodically', color: 'text-warning-text' };
    }
    return { icon: ICONS.pill, tooltip: 'Prescribed Medication', color: 'text-text-muted' };
};

const PatientProfileView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [error, setError] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (id) {
            DataService.getPatientProfile(id).then(patientProfile => {
                if (patientProfile) {
                    setProfile(patientProfile);
                } else {
                    setError(true);
                }
            }).catch(() => setError(true));
        }
    }, [id]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0] && profile) {
            const file = event.target.files[0];
            const newFile: PatientFile = {
                id: `file-${Date.now()}`,
                name: file.name,
                type: 'Lab Test',
                uploadDate: new Date().toISOString().split('T')[0],
                url: URL.createObjectURL(file)
            };

            DataService.addPatientFile(profile.id, newFile);

            setProfile(prev => prev ? ({
                ...prev,
                files: [...prev.files, newFile]
            }) : null);

            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleEditClick = () => {
        if (profile) {
            setEditForm({
                contact: { ...profile.contact },
                emergencyContact: { ...profile.emergencyContact },
                allergies: profile.allergies.join(', '),
                baselineIllnesses: profile.baselineIllnesses.join(', ')
            });
            setIsEditing(true);
        }
    };

    const handleSaveEdit = async () => {
        if (!profile || !id) return;

        try {
            const updates = {
                contact: editForm.contact,
                emergencyContact: editForm.emergencyContact,
                allergies: editForm.allergies.split(',').map((s: string) => s.trim()).filter((s: string) => s),
                baselineIllnesses: editForm.baselineIllnesses.split(',').map((s: string) => s.trim()).filter((s: string) => s)
            };

            const updatedProfile = await DataService.updatePatientProfile(id, updates);
            setProfile(updatedProfile);
            setIsEditing(false);
            showToast.success("Profile updated successfully");
        } catch (error) {
            console.error(error);
            showToast.error("Failed to update profile");
        }
    };

    if (error) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 p-8 glass-card rounded-2xl border border-danger/20">
                    <div className="text-4xl">⚠️</div>
                    <h2 className="text-xl font-bold text-text-main">Profile Not Found</h2>
                    <p className="text-text-muted">Could not retrieve patient data.</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-text-muted font-medium italic">{id ? 'Retrieving patient clinical history...' : 'Patient ID not provided.'}</p>
                </div>
            </div>
        );
    }

    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const diff = Date.now() - birthDate.getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    return (
        <div className="bg-background min-h-screen pb-20 pt-4 relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 animate-fade-in">
                    <Breadcrumbs items={[
                        { label: 'Dashboard', path: '/dashboard' },
                        { label: `Patient: ${profile.name}` }
                    ]} />

                    <div className="flex gap-4">
                        <button onClick={handleEditClick} className="flex items-center gap-2 bg-white dark:bg-slate-800 text-text-main font-bold py-3.5 px-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 transition-all">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Edit Profile
                        </button>
                        <button onClick={triggerFileUpload} className="group relative flex items-center gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 transform active:scale-95">
                            <span className="group-hover:rotate-12 transition-transform">{ICONS.upload}</span>
                            <span>Clinical Upload</span>
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                </div>

                {/* ... (Rest of view logic same as before, essentially) ... */}
                {/* Copied relevant parts for structure, assuming previous structure was good */}
                <div className="grid grid-cols-1 gap-10">
                    <div className="space-y-10">
                        {/* Enhanced Health Summary Card */}
                        <div className="glass-card rounded-[40px] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700 antigravity-target animate-fade-in-up">
                            <div className="relative p-10 bg-gradient-to-br from-white/40 to-white/10 dark:from-slate-800/40 dark:to-slate-900/40 backdrop-blur-md">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-20 -mt-20"></div>

                                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-br from-primary to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-5xl font-heading font-bold shadow-2xl flex-shrink-0 ring-4 ring-white dark:ring-slate-800 transform transition-transform group-hover:scale-105">
                                            {profile.name.charAt(0)}
                                        </div>
                                    </div>

                                    <div className="flex-grow text-center lg:text-left">
                                        <h2 className="text-4xl font-heading font-bold text-text-main tracking-tight mb-2">{profile.name}</h2>
                                        <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-text-muted">
                                            {profile.contact?.phone && <span className="flex items-center gap-2">📞 {profile.contact.phone}</span>}
                                            {profile.contact?.email && <span className="flex items-center gap-2">📧 {profile.contact.email}</span>}
                                        </div>
                                        <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-text-muted mt-2">
                                            {profile.contact?.address && <span className="flex items-center gap-2">📍 {profile.contact.address}</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1 p-2 bg-white/30 dark:bg-black/20 rounded-[32px] border border-white/20 backdrop-blur-xl shadow-inner">
                                        <div className="px-6 py-4 text-center">
                                            <p className="text-[10px] uppercase font-black opacity-60">Age</p>
                                            <p className="font-heading font-bold text-xl">{calculateAge(profile.personalDetails.dob)}</p>
                                        </div>
                                        <div className="px-6 py-4 text-center">
                                            <p className="text-[10px] uppercase font-black opacity-60">Blood</p>
                                            <p className="font-heading font-bold text-xl text-danger">{profile.personalDetails.bloodType || '?'}</p>
                                        </div>
                                        <div className="px-6 py-4 text-center">
                                            <p className="text-[10px] uppercase font-black opacity-60">Sex</p>
                                            <p className="font-heading font-bold text-xl">{profile.personalDetails.sex === 'Male' ? 'M' : 'F'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="p-6 rounded-3xl bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-slate-700/50">
                                        <h3 className="flex items-center gap-3 text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-4">Allergies</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.allergies.length > 0 ? profile.allergies.map((a, i) => (
                                                <span key={i} className="px-3 py-1 bg-danger/10 text-danger rounded-lg text-sm font-bold">{a}</span>
                                            )) : <span className="italic opacity-50">None recorded</span>}
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-slate-700/50">
                                        <h3 className="flex items-center gap-3 text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-4">Conditions</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.baselineIllnesses.length > 0 ? profile.baselineIllnesses.map((a, i) => (
                                                <span key={i} className="px-3 py-1 bg-info/10 text-info rounded-lg text-sm font-bold">{a}</span>
                                            )) : <span className="italic opacity-50">None recorded</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-10">
                            <h3 className="text-xl font-heading font-bold">Edit Profile</h3>
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <h4 className="font-bold text-primary text-sm uppercase tracking-wider">Contact Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted mb-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={editForm.contact?.phone || ''}
                                            onChange={e => setEditForm({ ...editForm, contact: { ...editForm.contact, phone: e.target.value } })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={editForm.contact?.email || ''}
                                            onChange={e => setEditForm({ ...editForm, contact: { ...editForm.contact, email: e.target.value } })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-text-muted mb-1">Home Address</label>
                                        <input
                                            type="text"
                                            value={editForm.contact?.address || ''}
                                            onChange={e => setEditForm({ ...editForm, contact: { ...editForm.contact, address: e.target.value } })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-primary text-sm uppercase tracking-wider">Emergency Contact</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted mb-1">Contact Name</label>
                                        <input
                                            type="text"
                                            value={editForm.emergencyContact?.name || ''}
                                            onChange={e => setEditForm({ ...editForm, emergencyContact: { ...editForm.emergencyContact, name: e.target.value } })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted mb-1">Relationship</label>
                                        <input
                                            type="text"
                                            value={editForm.emergencyContact?.relationship || ''}
                                            onChange={e => setEditForm({ ...editForm, emergencyContact: { ...editForm.emergencyContact, relationship: e.target.value } })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-text-muted mb-1">Emergency Phone</label>
                                        <input
                                            type="text"
                                            value={editForm.emergencyContact?.phone || ''}
                                            onChange={e => setEditForm({ ...editForm, emergencyContact: { ...editForm.emergencyContact, phone: e.target.value } })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-primary text-sm uppercase tracking-wider">Medical History</h4>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1">Allergies (comma separated)</label>
                                    <textarea
                                        value={editForm.allergies || ''}
                                        onChange={e => setEditForm({ ...editForm, allergies: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary h-20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1">Chronic Conditions (comma separated)</label>
                                    <textarea
                                        value={editForm.baselineIllnesses || ''}
                                        onChange={e => setEditForm({ ...editForm, baselineIllnesses: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary h-20"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-3xl">
                            <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl font-bold text-text-muted hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveEdit} className="px-8 py-3 rounded-xl font-bold text-white bg-primary shadow-lg shadow-primary/30 hover:scale-[1.02] transition-transform">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientProfileView;

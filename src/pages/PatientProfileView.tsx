
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { DataService, GeminiService } from '../services/api';
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
    const [report, setReport] = useState<string | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
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

    const handleGenerateReport = async () => {
        if (!id) return;
        setIsGeneratingReport(true);
        try {
            const result = await GeminiService.generateComprehensiveReport(id);
            setReport(result.report);
        } catch (e) {
            console.error(e);
            showToast.error("Failed to generate report");
        } finally {
            setIsGeneratingReport(false);
        }
    };

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
                baselineIllnesses: profile.baselineIllnesses.join(', '),
                height: profile.height,
                weight: profile.weight
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
                baselineIllnesses: editForm.baselineIllnesses.split(',').map((s: string) => s.trim()).filter((s: string) => s),
                height: editForm.height ? parseFloat(editForm.height) : undefined,
                weight: editForm.weight ? parseFloat(editForm.weight) : undefined,
            };

            // Update Profile
            const updatedProfile = await DataService.updatePatientProfile(id, updates);
            setProfile(updatedProfile);

            // Update Consents
            await DataService.updateUserConsents(editForm.gdpr_consent, editForm.data_sharing_consent, editForm.marketing_consent);

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
                        <button
                            onClick={handleGenerateReport}
                            disabled={isGeneratingReport}
                            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 transform active:scale-95 disabled:opacity-50"
                        >
                            {isGeneratingReport ? <span className="animate-spin">⌛</span> : ICONS.ai}
                            <span>{isGeneratingReport ? 'Analyzing...' : 'Generate Clinical Report'}</span>
                        </button>
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
                                        <div className="flex items-center justify-center lg:justify-start gap-4 mb-2">
                                            <h2 className="text-4xl font-heading font-bold text-text-main tracking-tight">{profile.name}</h2>
                                            {profile.concordiumAddress && (
                                                <Tooltip text={`Verified ID: ${profile.concordiumAddress}`}>
                                                    <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                                                        <span>🛡️</span> Verified
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-text-muted">
                                            {profile.contact?.phone && <span className="flex items-center gap-2">📞 {profile.contact.phone}</span>}
                                            {profile.contact?.email && <span className="flex items-center gap-2">📧 {profile.contact.email}</span>}
                                        </div>
                                        <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-text-muted mt-2">
                                            {profile.contact?.address && <span className="flex items-center gap-2">📍 {profile.contact.address}</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-1 p-2 bg-white/30 dark:bg-black/20 rounded-[32px] border border-white/20 backdrop-blur-xl shadow-inner min-w-[320px]">
                                        <div className="px-3 py-4 text-center">
                                            <p className="text-[10px] uppercase font-black opacity-60">Age</p>
                                            <p className="font-heading font-bold text-xl">{calculateAge(profile.personalDetails.dob)}</p>
                                        </div>
                                        <div className="px-3 py-4 text-center border-l border-white/10">
                                            <p className="text-[10px] uppercase font-black opacity-60">Blood</p>
                                            <p className="font-heading font-bold text-xl text-danger">{profile.personalDetails.bloodType || '?'}</p>
                                        </div>
                                        <div className="px-3 py-4 text-center border-l border-white/10">
                                            <p className="text-[10px] uppercase font-black opacity-60">Sex</p>
                                            <p className="font-heading font-bold text-xl">{profile.personalDetails.sex === 'Male' ? 'M' : 'F'}</p>
                                        </div>
                                        <div className="px-3 py-4 text-center border-l border-white/10">
                                            <p className="text-[10px] uppercase font-black opacity-60">Hgt</p>
                                            <p className="font-heading font-bold text-xl">{profile.height ? `${profile.height}m` : '-'}</p>
                                        </div>
                                        <div className="px-3 py-4 text-center border-l border-white/10">
                                            <p className="text-[10px] uppercase font-black opacity-60">Wgt</p>
                                            <p className="font-heading font-bold text-xl">{profile.weight ? `${profile.weight}kg` : '-'}</p>
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

                    {/* Medications & Labs Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up delay-100">
                        {/* Medications */}
                        <div className="glass-card p-8 rounded-3xl border border-white/20 dark:border-slate-700">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">{ICONS.medication}</span> Current Medications
                            </h3>
                            <div className="space-y-4">
                                {profile.medications && profile.medications.length > 0 ? profile.medications.map((med, i) => {
                                    const meta = getMedicationIcon(med.frequency);
                                    return (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm ${meta.color}`}>{meta.icon}</div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-gray-100">{med.name}</p>
                                                    <p className="text-xs text-text-muted">{med.dosage} • <span className="italic">{med.frequency}</span></p>
                                                </div>
                                            </div>
                                            <Tooltip text={meta.tooltip}>
                                                <span className="text-gray-400 hover:text-primary cursor-help">ℹ️</span>
                                            </Tooltip>
                                        </div>
                                    )
                                }) : (
                                    <div className="text-center py-8 text-gray-400 italic bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        No active medications recorded.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Clinical Files */}
                        <div className="glass-card p-8 rounded-3xl border border-white/20 dark:border-slate-700">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="p-2 bg-purple-100 text-purple-600 rounded-lg">{ICONS.document}</span> Recent Clinical Files
                            </h3>
                            <div className="space-y-4">
                                {profile.files && profile.files.length > 0 ? profile.files.slice(-5).reverse().map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm text-purple-500">{ICONS.document}</div>
                                            <div className="truncate max-w-[180px]">
                                                <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                                                <p className="text-xs text-text-muted">{file.uploadDate} • {file.type}</p>
                                            </div>
                                        </div>
                                        <a href={file.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            View
                                        </a>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-gray-400 italic bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        No clinical records uploaded.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {
                report && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-10">
                                <h3 className="text-xl font-heading font-bold flex items-center gap-2">
                                    <span className="text-emerald-500">{ICONS.ai}</span> Comprehensive Clinical Report
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={() => window.print()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-sm font-bold text-primary">Print</button>
                                    <button onClick={() => setReport(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="p-8 prose dark:prose-invert max-w-none">
                                <ReactMarkdown>{report}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            {
                isEditing && (
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted mb-1">Height (m)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editForm.height || ''}
                                                onChange={e => setEditForm({ ...editForm, height: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted mb-1">Weight (kg)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={editForm.weight || ''}
                                                onChange={e => setEditForm({ ...editForm, weight: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
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

                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="font-bold text-primary text-sm uppercase tracking-wider">Privacy & Consents (GDPR)</h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editForm.gdpr_consent}
                                                onChange={e => setEditForm({ ...editForm, gdpr_consent: e.target.checked })}
                                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <div>
                                                <span className="font-bold text-text-main text-sm">GDPR Data Processing</span>
                                                <p className="text-xs text-text-muted">I agree to the processing of my personal data for medical purposes.</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editForm.data_sharing_consent}
                                                onChange={e => setEditForm({ ...editForm, data_sharing_consent: e.target.checked })}
                                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <div>
                                                <span className="font-bold text-text-main text-sm">3rd Party Data Sharing</span>
                                                <p className="text-xs text-text-muted">Allow sharing non-sensitive data with external partners (e.g. Insurance).</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editForm.marketing_consent}
                                                onChange={e => setEditForm({ ...editForm, marketing_consent: e.target.checked })}
                                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <div>
                                                <span className="font-bold text-text-main text-sm">Marketing & Updates</span>
                                                <p className="text-xs text-text-muted">Receive news and updates about platform features.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-3xl">
                                <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl font-bold text-text-muted hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button onClick={handleSaveEdit} className="px-8 py-3 rounded-xl font-bold text-white bg-primary shadow-lg shadow-primary/30 hover:scale-[1.02] transition-transform">Save Changes</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PatientProfileView;

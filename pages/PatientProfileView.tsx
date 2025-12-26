
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getPatientProfileById, addPatientFile } from '../services/api';
import { PatientProfile, PatientFile } from '../types/index';
import { ICONS } from '../constants/index';
import Tooltip from '../components/Tooltip';
import Breadcrumbs from '../components/Breadcrumbs';

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (id) {
            getPatientProfileById(id).then(patientProfile => {
                setProfile(patientProfile || null);
            });
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

            addPatientFile(profile.id, newFile);

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
        <div className="bg-background min-h-screen pb-20 pt-4">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 animate-fade-in">
                    <Breadcrumbs items={[
                        { label: 'Dashboard', path: '/dashboard' },
                        { label: `Patient: ${profile.name}` }
                    ]} />
                    <button onClick={triggerFileUpload} className="group relative flex items-center gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 transform active:scale-95">
                        <span className="group-hover:rotate-12 transition-transform">{ICONS.upload}</span>
                        <span>Clinical Upload</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                </div>

                <div className="grid grid-cols-1 gap-10">
                    <div className="space-y-10">
                        {/* Enhanced Health Summary Card */}
                        <div className="glass-card rounded-[40px] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700 antigravity-target animate-fade-in-up">
                            <div className="relative p-10 bg-gradient-to-br from-white/40 to-white/10 dark:from-slate-800/40 dark:to-slate-900/40 backdrop-blur-md">
                                {/* Background Decorations */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-20 -mt-20"></div>

                                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-br from-primary to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-5xl font-heading font-bold shadow-2xl flex-shrink-0 ring-4 ring-white dark:ring-slate-800 transform transition-transform group-hover:scale-105">
                                            {profile.name.charAt(0)}
                                        </div>
                                        <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full"></div>
                                    </div>

                                    <div className="flex-grow text-center lg:text-left">
                                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-3 sm:justify-center lg:justify-start">
                                            <h2 className="text-4xl font-heading font-bold text-text-main tracking-tight">{profile.name}</h2>
                                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20 uppercase tracking-widest">Active File</span>
                                        </div>
                                        <div className="flex items-center gap-3 justify-center lg:justify-start">
                                            {profile.identifier && (
                                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/50 shadow-sm backdrop-blur-md">
                                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Medical ID</span>
                                                    <span className="text-sm font-mono font-bold text-primary">{profile.identifier}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/50 shadow-sm backdrop-blur-md">
                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Status</span>
                                                <span className="text-sm font-bold text-success-text">Stable</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1 p-2 bg-white/30 dark:bg-black/20 rounded-[32px] border border-white/20 backdrop-blur-xl shadow-inner group">
                                        <div className="px-8 py-5 text-center hover:bg-white/40 dark:hover:bg-white/5 rounded-2xl transition-all cursor-default">
                                            <p className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 opacity-60">Birth Date</p>
                                            <p className="font-heading font-bold text-lg text-text-main whitespace-nowrap">{profile.personalDetails.dob}</p>
                                        </div>
                                        <div className="px-8 py-5 text-center hover:bg-white/40 dark:hover:bg-white/5 rounded-2xl transition-all cursor-default">
                                            <p className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 opacity-60">Age</p>
                                            <p className="font-heading font-bold text-2xl text-text-main">{calculateAge(profile.personalDetails.dob)}</p>
                                        </div>
                                        <div className="px-8 py-5 text-center hover:bg-white/40 dark:hover:bg-white/5 rounded-2xl transition-all cursor-default">
                                            <p className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-1 opacity-60">Group</p>
                                            <div className="flex items-center gap-1.5 justify-center">
                                                <span className="text-danger">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 drop-shadow-sm"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                                                </span>
                                                <p className="font-heading font-black text-2xl text-text-main">{profile.personalDetails.bloodType}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="p-6 rounded-3xl bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="flex items-center gap-3 text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-6">
                                            <div className="p-2 bg-danger/10 text-danger rounded-xl">{ICONS.riskHigh}</div>
                                            Medication Allergies
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {profile.allergies.length > 0 ? (
                                                profile.allergies.map((allergy, index) => (
                                                    <span key={index} className="px-4 py-2 rounded-2xl bg-danger/5 text-danger-text dark:text-red-400 text-sm font-black border border-danger/20 shadow-sm backdrop-blur-sm transform hover:scale-105 transition-transform cursor-default">
                                                        {allergy}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-text-muted italic text-sm opacity-60 font-medium">No recorded allergies</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-3xl bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                                        <h3 className="flex items-center gap-3 text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-6">
                                            <div className="p-2 bg-info/10 text-info rounded-xl">{ICONS.symptomCheck}</div>
                                            Chronic Conditions
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {profile.baselineIllnesses.length > 0 ? (
                                                profile.baselineIllnesses.map((illness, index) => (
                                                    <span key={index} className="px-4 py-2 rounded-2xl bg-info/5 text-info-text dark:text-blue-400 text-sm font-black border border-info/20 shadow-sm backdrop-blur-sm transform hover:scale-105 transition-transform cursor-default">
                                                        {illness}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-text-muted italic text-sm opacity-60 font-medium">No recorded conditions</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visit History Section */}
                        <div className="glass-card rounded-[40px] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700 animate-fade-in-up delay-100">
                            <div className="p-8 border-b border-white/10 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/60 backdrop-blur-md flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <h2 className="text-2xl font-heading font-bold text-text-main">Visit History</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10 dark:divide-slate-700/50">
                                    <thead className="bg-white/60 dark:bg-slate-900/40">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Clinical Date</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Practitioner</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Primary Complaint</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Outcome Summary</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/20 dark:bg-transparent divide-y divide-white/10 dark:divide-slate-700/30">
                                        {profile.visitHistory.map((visit) => (
                                            <tr key={visit.id} className="hover:bg-primary/5 dark:hover:bg-white/5 transition-all duration-300">
                                                <td className="px-8 py-6 whitespace-nowrap text-sm font-black text-text-main font-mono">{new Date(visit.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                                <td className="px-8 py-6 whitespace-nowrap text-sm text-text-muted font-bold">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-500">{visit.doctor.charAt(0)}</div>
                                                        {visit.doctor}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-text-main">
                                                    <span className="px-3 py-1 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-white/20 shadow-sm">{visit.reason}</span>
                                                </td>
                                                <td className="px-8 py-6 text-sm text-text-muted font-medium italic opacity-80 leading-relaxed max-w-md">{visit.summary}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Medications and Documents Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-fade-in-up delay-200">
                            {/* Medications */}
                            <div className="glass-card rounded-[40px] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700 h-fit">
                                <div className="p-8 border-b border-white/10 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/60 backdrop-blur-md flex items-center gap-4">
                                    <div className="p-3 bg-accent/10 rounded-2xl text-accent shadow-inner">{ICONS.pill}</div>
                                    <h2 className="text-2xl font-heading font-bold text-text-main">Prescriptions</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-white/10 dark:divide-slate-700/50">
                                        <thead className="bg-white/60 dark:bg-slate-900/40">
                                            <tr>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Medication</th>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Dosage</th>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Frequency</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white/20 dark:bg-transparent divide-y divide-white/10 dark:divide-slate-700/30">
                                            {profile.medications.map((med) => {
                                                const { icon, tooltip, color } = getMedicationIcon(med.frequency);
                                                return (
                                                    <tr key={med.id} className="hover:bg-accent/5 dark:hover:bg-white/5 transition-all duration-300">
                                                        <td className="px-8 py-6 whitespace-nowrap text-sm font-black text-text-main">
                                                            <div className="flex items-center gap-4">
                                                                <Tooltip text={tooltip}>
                                                                    <span className={`${color} p-2.5 bg-white/80 dark:bg-slate-800 shadow-sm border border-white/20 rounded-xl transform group-hover:rotate-12 transition-transform`}>{icon}</span>
                                                                </Tooltip>
                                                                <span className="text-base">{med.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 whitespace-nowrap text-sm text-text-muted font-bold font-mono">{med.dosage}</td>
                                                        <td className="px-8 py-6 whitespace-nowrap text-sm">
                                                            <span className="px-4 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-800 text-text-muted text-[10px] font-black uppercase tracking-widest border border-white/40 dark:border-slate-700 shadow-sm">
                                                                {med.frequency}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="glass-card rounded-[40px] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700 flex flex-col">
                                <div className="p-8 border-b border-white/10 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/60 backdrop-blur-md flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 shadow-inner">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        </div>
                                        <h2 className="text-2xl font-heading font-bold text-text-main">Case Files</h2>
                                    </div>
                                    <button onClick={triggerFileUpload} className="p-3 bg-white/80 dark:bg-slate-800 rounded-2xl shadow-md border border-white/20 hover:bg-primary hover:text-white transition-all transform active:scale-90 text-primary">
                                        {ICONS.plus}
                                    </button>
                                </div>
                                <div className="p-8 bg-white/10 dark:bg-transparent flex-grow">
                                    <div className="grid grid-cols-1 gap-4">
                                        {profile.files.length > 0 ? (
                                            profile.files.map(file => (
                                                <div key={file.id} className="flex justify-between items-center p-5 bg-white/60 dark:bg-slate-800/60 rounded-[32px] border border-white/40 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                                                    <div className="flex items-center gap-5">
                                                        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl text-text-muted group-hover:text-primary transition-all shadow-inner group-hover:shadow-primary/10 group-hover:shadow-lg">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="font-black text-text-main text-base group-hover:text-primary transition-colors cursor-pointer leading-tight">{file.name}</p>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">{file.type}</span>
                                                                <span className="text-[10px] font-bold text-text-muted/40 uppercase tracking-tighter">{file.uploadDate}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-4 font-black text-primary bg-primary/10 rounded-2xl hover:bg-primary hover:text-white transition-all transform active:scale-95 shadow-sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    </a>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-16 border-4 border-dashed border-white/20 dark:border-slate-800 rounded-[40px] opacity-40">
                                                <div className="mb-4 text-4xl flex justify-center">{ICONS.upload}</div>
                                                <p className="text-text-muted font-bold italic tracking-wide">Ready for clinical data</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientProfileView;

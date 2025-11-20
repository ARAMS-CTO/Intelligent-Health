
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
                type: 'Lab Test', // Default type, could be improved with a selector
                uploadDate: new Date().toISOString().split('T')[0],
                url: URL.createObjectURL(file)
            };
            
            addPatientFile(profile.id, newFile);
            
            // Update local state to show the new file immediately
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
                <p className="text-text-muted">{id ? 'Loading patient profile...' : 'Patient ID not provided.'}</p>
            </div>
        );
    }

    // Calculate age from DOB if not available in a future real implementation
    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const diff = Date.now() - birthDate.getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    return (
        <div className="bg-background min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                    <Breadcrumbs items={[
                        { label: 'Dashboard', path: '/dashboard' },
                        { label: `Patient: ${profile.name}` }
                    ]} />
                    <button onClick={triggerFileUpload} className="flex items-center gap-2 bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-accent-hover transition duration-300 shadow-sm">
                        {ICONS.upload} <span>Quick Upload</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-6">
                        {/* Enhanced Health Summary Card */}
                        <div className="bg-surface rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
                                    {profile.name.charAt(0)}
                                </div>
                                <div className="flex-grow">
                                    <h2 className="text-2xl font-bold text-text-main">{profile.name}</h2>
                                    {profile.identifier && (
                                        <p className="text-sm font-mono text-text-muted mt-1 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded inline-block">
                                            ID: {profile.identifier}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-6 text-center">
                                    <div>
                                        <p className="text-xs text-text-muted uppercase tracking-wider">DOB</p>
                                        <p className="font-semibold text-text-main">{profile.personalDetails.dob}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted uppercase tracking-wider">Age</p>
                                        <p className="font-semibold text-text-main">{calculateAge(profile.personalDetails.dob)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted uppercase tracking-wider">Blood</p>
                                        <div className="flex items-center gap-1 justify-center">
                                            <span className="text-danger">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                            <p className="font-semibold text-text-main">{profile.personalDetails.bloodType}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase tracking-wider mb-3">
                                        <span className="text-danger">{ICONS.riskHigh}</span> Allergies
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.allergies.length > 0 ? (
                                            profile.allergies.map((allergy, index) => (
                                                <span key={index} className="px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-sm font-medium border border-red-200 dark:border-red-800/50">
                                                    {allergy}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-text-muted italic text-sm">No known allergies</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase tracking-wider mb-3">
                                        <span className="text-info">{ICONS.symptomCheck}</span> Baseline Illnesses
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.baselineIllnesses.length > 0 ? (
                                            profile.baselineIllnesses.map((illness, index) => (
                                                <span key={index} className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm font-medium border border-blue-200 dark:border-blue-800/50">
                                                    {illness}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-text-muted italic text-sm">No significant medical history</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-surface p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-text-main mb-4">Visit History</h2>
                             <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Doctor</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Reason for Visit</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Summary</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-surface divide-y divide-gray-200 dark:divide-slate-700">
                                        {profile.visitHistory.map((visit) => (
                                            <tr key={visit.id}>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-text-main">{new Date(visit.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-text-muted">{visit.doctor}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-text-main">{visit.reason}</td>
                                                <td className="px-4 py-2 text-sm text-text-muted">{visit.summary}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-surface p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-text-main mb-4">Medications</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Medication</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Dosage</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Frequency</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-surface divide-y divide-gray-200 dark:divide-slate-700">
                                        {profile.medications.map((med) => {
                                            const { icon, tooltip, color } = getMedicationIcon(med.frequency);
                                            return (
                                                <tr key={med.id}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-text-main">
                                                        <div className="flex items-center gap-3">
                                                            <Tooltip text={tooltip}>
                                                                <span className={color}>{icon}</span>
                                                            </Tooltip>
                                                            <span>{med.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-text-muted">{med.dosage}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-text-muted">{med.frequency}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-surface p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-text-main">Documents</h2>
                                <button onClick={triggerFileUpload} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary-hover transition">
                                    {ICONS.upload} Upload File
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            </div>
                            <div className="space-y-3">
                                {profile.files.length > 0 ? (
                                    profile.files.map(file => (
                                        <div key={file.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                                            <div>
                                                <p className="font-semibold">{file.name}</p>
                                                <p className="text-sm text-text-muted">{file.type} - {file.uploadDate}</p>
                                            </div>
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">View</a>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-text-muted italic">No documents uploaded yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientProfileView;

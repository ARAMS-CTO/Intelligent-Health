
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Fix: Import from '../types/index' for consistency.
import { PatientIntakeData } from '../types/index';
import { addPatientIntakeData } from '../services/api';
import { ICONS } from '../constants/index';
import Breadcrumbs from '../components/Breadcrumbs';
import VoiceFormAssistant from '../components/VoiceFormAssistant';

const initialFormData: Omit<PatientIntakeData, 'id'> = {
    fullName: { firstName: '', lastName: '' },
    dob: '',
    sex: 'Male',
    bloodType: '',
    allergies: [],
    baselineIllnesses: [],
    contact: { phone: '', email: '', address: '' },
    emergencyContact: { name: '', relationship: '', phone: '' },
    primaryCarePhysician: { name: '', phone: '' },
};

// Schema for the AI to understand the form structure
const formSchema = {
    fullName: { firstName: "string", lastName: "string" },
    dob: "date (YYYY-MM-DD)",
    sex: "string (Male, Female, Other)",
    bloodType: "string (A+, A-, B+, B-, AB+, AB-, O+, O-)",
    allergies: "array of strings",
    baselineIllnesses: "array of strings",
    contact: { phone: "string", email: "string", address: "string" },
    emergencyContact: { name: "string", relationship: "string", phone: "string" },
    primaryCarePhysician: { name: "string", phone: "string" }
};

const PatientIntake: React.FC = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedPatientName, setSubmittedPatientName] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (section: keyof Omit<PatientIntakeData, 'id' | 'sex' | 'dob'>, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] as object),
                [field]: value,
            },
        }));
    };

    const handleDirectChange = (field: 'dob' | 'sex', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Deep merge for AI updates
    const handleAIUpdate = (updates: any) => {
        setFormData(prev => {
            const newData = { ...prev };

            // Helper to merge objects recursively
            const merge = (target: any, source: any) => {
                for (const key in source) {
                    if (Array.isArray(source[key])) {
                        // For arrays, we replace the target with the source if it's not empty
                        target[key] = source[key];
                    } else if (source[key] instanceof Object && key in target) {
                        Object.assign(source[key], merge(target[key], source[key]));
                    } else {
                        target[key] = source[key];
                    }
                }
                return target;
            };

            return merge(newData, updates);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const savedData = await addPatientIntakeData(formData);
        setSubmittedPatientName(`${savedData.fullName.firstName} ${savedData.fullName.lastName}`);
        setIsSubmitted(true);
    };

    const handleResetForm = () => {
        setFormData(initialFormData);
        setIsSubmitted(false);
        setSubmittedPatientName('');
    }

    if (isSubmitted) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="container mx-auto max-w-2xl p-8">
                    <div className="bg-surface p-8 rounded-lg shadow-xl text-center animate-fade-in">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-light mb-4">
                            <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-text-main mb-2">Submission Successful!</h2>
                        <p className="text-text-muted mb-6">Patient profile for <strong>{submittedPatientName}</strong> has been successfully created.</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-primary-hover transition duration-300"
                            >
                                Return to Dashboard
                            </button>
                            <button
                                onClick={handleResetForm}
                                className="bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 font-bold py-2 px-6 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition duration-300"
                            >
                                Submit Another Form
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const inputFieldClasses = "mt-1 block w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium text-text-main placeholder:text-slate-400";
    const labelClasses = "block text-sm font-bold text-text-muted mb-1 ml-1";
    const legendClasses = "text-xl font-heading font-bold text-text-main px-2 mb-2 flex items-center gap-2";

    return (
        <div className="bg-background min-h-screen py-12">
            <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
                <div className="glass-card p-8 rounded-3xl shadow-xl antigravity-target border-white/20 dark:border-slate-700">
                    <div className="mb-6 border-b dark:border-slate-700 pb-4">
                        <Breadcrumbs items={[
                            { label: 'Dashboard', path: '/dashboard' },
                            { label: 'New Patient Intake' }
                        ]} />
                    </div>

                    {/* Voice Assistant */}
                    <VoiceFormAssistant
                        formSchema={formSchema}
                        formData={formData}
                        onUpdate={handleAIUpdate}
                    />

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Patient Demographics */}
                        {/* Patient Demographics */}
                        <fieldset className="border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
                            <legend className={legendClasses}>
                                <span className="p-1.5 bg-primary/10 rounded-lg text-primary">{ICONS.user}</span> Patient Demographics
                            </legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label className={labelClasses}>First Name</label>
                                    <input type="text" value={formData.fullName.firstName} onChange={e => handleInputChange('fullName', 'firstName', e.target.value)} required className={inputFieldClasses} placeholder="Jane" />
                                </div>
                                <div>
                                    <label className={labelClasses}>Last Name</label>
                                    <input type="text" value={formData.fullName.lastName} onChange={e => handleInputChange('fullName', 'lastName', e.target.value)} required className={inputFieldClasses} placeholder="Doe" />
                                </div>
                                <div>
                                    <label className={labelClasses}>Date of Birth</label>
                                    <input type="date" value={formData.dob} onChange={e => handleDirectChange('dob', e.target.value)} required className={inputFieldClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Sex</label>
                                    <div className="relative">
                                        <select value={formData.sex} onChange={e => handleDirectChange('sex', e.target.value)} className={`${inputFieldClasses} appearance-none`}>
                                            <option>Male</option>
                                            <option>Female</option>
                                            <option>Other</option>
                                            <option>Prefer not to say</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        {/* Medical History */}
                        {/* Medical History */}
                        <fieldset className="border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
                            <legend className={legendClasses}>
                                <span className="p-1.5 bg-danger/10 rounded-lg text-danger">{ICONS.case}</span> Medical History
                            </legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label className={labelClasses}>Blood Type</label>
                                    <div className="relative">
                                        <select value={formData.bloodType || ''} onChange={e => setFormData(prev => ({ ...prev, bloodType: e.target.value }))} className={`${inputFieldClasses} appearance-none`}>
                                            <option value="">Unknown</option>
                                            <option>A+</option>
                                            <option>A-</option>
                                            <option>B+</option>
                                            <option>B-</option>
                                            <option>AB+</option>
                                            <option>AB-</option>
                                            <option>O+</option>
                                            <option>O-</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Allergies (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={formData.allergies.join(', ')}
                                        onChange={e => setFormData(prev => ({ ...prev, allergies: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                                        className={inputFieldClasses}
                                        placeholder="e.g. Penicillin, Peanuts"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClasses}>Baseline Illnesses (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={formData.baselineIllnesses.join(', ')}
                                        onChange={e => setFormData(prev => ({ ...prev, baselineIllnesses: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                                        className={inputFieldClasses}
                                        placeholder="e.g. Hypertension, Diabetes Type 2"
                                    />
                                </div>
                            </div>
                        </fieldset>

                        {/* Contact Information */}
                        {/* Contact Information */}
                        <fieldset className="border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
                            <legend className={legendClasses}>
                                <span className="p-1.5 bg-info/10 rounded-lg text-info">{ICONS.chat}</span> Contact Information
                            </legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label className={labelClasses}>Phone Number</label>
                                    <input type="tel" value={formData.contact.phone} onChange={e => handleInputChange('contact', 'phone', e.target.value)} required className={inputFieldClasses} placeholder="+1 (555) 000-0000" />
                                </div>
                                <div>
                                    <label className={labelClasses}>Email Address</label>
                                    <input type="email" value={formData.contact.email} onChange={e => handleInputChange('contact', 'email', e.target.value)} required className={inputFieldClasses} placeholder="patient@example.com" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClasses}>Home Address</label>
                                    <input type="text" value={formData.contact.address} onChange={e => handleInputChange('contact', 'address', e.target.value)} required className={inputFieldClasses} placeholder="123 Health St, Medical City" />
                                </div>
                            </div>
                        </fieldset>

                        {/* Emergency Contact */}
                        {/* Emergency Contact */}
                        <fieldset className="border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
                            <legend className={legendClasses}>
                                <span className="p-1.5 bg-warning/10 rounded-lg text-warning-text">{ICONS.riskHigh}</span> Emergency Contact
                            </legend>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <div>
                                    <label className={labelClasses}>Full Name</label>
                                    <input type="text" value={formData.emergencyContact.name} onChange={e => handleInputChange('emergencyContact', 'name', e.target.value)} required className={inputFieldClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Relationship</label>
                                    <input type="text" value={formData.emergencyContact.relationship} onChange={e => handleInputChange('emergencyContact', 'relationship', e.target.value)} required className={inputFieldClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Phone Number</label>
                                    <input type="tel" value={formData.emergencyContact.phone} onChange={e => handleInputChange('emergencyContact', 'phone', e.target.value)} required className={inputFieldClasses} />
                                </div>
                            </div>
                        </fieldset>

                        {/* Physician Information */}
                        {/* Physician Information */}
                        <fieldset className="border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
                            <legend className={legendClasses}>
                                <span className="p-1.5 bg-primary/10 rounded-lg text-primary">{ICONS.specialist}</span> Physician Information
                            </legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label className={labelClasses}>Primary Care Physician Name</label>
                                    <input type="text" value={formData.primaryCarePhysician.name} onChange={e => handleInputChange('primaryCarePhysician', 'name', e.target.value)} className={inputFieldClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Physician Contact Number</label>
                                    <input type="tel" value={formData.primaryCarePhysician.phone} onChange={e => handleInputChange('primaryCarePhysician', 'phone', e.target.value)} className={inputFieldClasses} />
                                </div>
                            </div>
                        </fieldset>

                        <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-700 mt-2">
                            <button type="button" onClick={() => navigate('/dashboard')} className="glass-button text-slate-800 dark:text-slate-200 font-bold py-3 px-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                Cancel
                            </button>
                            <button type="submit" className="bg-gradient-to-r from-primary to-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5">
                                Save Patient
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PatientIntake;

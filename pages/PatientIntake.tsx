
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Fix: Import from '../types/index' for consistency.
import { PatientIntakeData } from '../types/index';
import { addPatientIntakeData } from '../services/api';
import { ICONS } from '../constants/index';
import Breadcrumbs from '../components/Breadcrumbs';

const initialFormData: Omit<PatientIntakeData, 'id'> = {
  fullName: { firstName: '', lastName: '' },
  dob: '',
  sex: 'Male',
  contact: { phone: '', email: '', address: '' },
  emergencyContact: { name: '', relationship: '', phone: '' },
  primaryCarePhysician: { name: '', phone: '' },
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

  const inputFieldClasses = "mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 dark:bg-slate-800 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary";

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="bg-surface p-8 rounded-lg shadow-xl">
            <div className="mb-6 border-b dark:border-slate-700 pb-4">
                <Breadcrumbs items={[
                    { label: 'Dashboard', path: '/dashboard' },
                    { label: 'New Patient Intake' }
                ]} />
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Patient Demographics */}
                <fieldset className="border dark:border-slate-700 p-4 rounded-md">
                    <legend className="text-xl font-semibold text-text-main px-2">Patient Demographics</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-text-muted">First Name</label>
                            <input type="text" value={formData.fullName.firstName} onChange={e => handleInputChange('fullName', 'firstName', e.target.value)} required className={inputFieldClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted">Last Name</label>
                            <input type="text" value={formData.fullName.lastName} onChange={e => handleInputChange('fullName', 'lastName', e.target.value)} required className={inputFieldClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted">Date of Birth</label>
                            <input type="date" value={formData.dob} onChange={e => handleDirectChange('dob', e.target.value)} required className={inputFieldClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted">Sex</label>
                            <select value={formData.sex} onChange={e => handleDirectChange('sex', e.target.value)} className={inputFieldClasses}>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                                <option>Prefer not to say</option>
                            </select>
                        </div>
                    </div>
                </fieldset>

                {/* Contact Information */}
                <fieldset className="border dark:border-slate-700 p-4 rounded-md">
                    <legend className="text-xl font-semibold text-text-main px-2">Contact Information</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                         <div>
                            <label className="block text-sm font-medium text-text-muted">Phone Number</label>
                            <input type="tel" value={formData.contact.phone} onChange={e => handleInputChange('contact', 'phone', e.target.value)} required className={inputFieldClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted">Email Address</label>
                            <input type="email" value={formData.contact.email} onChange={e => handleInputChange('contact', 'email', e.target.value)} required className={inputFieldClasses} />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-text-muted">Home Address</label>
                            <input type="text" value={formData.contact.address} onChange={e => handleInputChange('contact', 'address', e.target.value)} required className={inputFieldClasses} />
                        </div>
                    </div>
                </fieldset>

                {/* Emergency Contact */}
                <fieldset className="border dark:border-slate-700 p-4 rounded-md">
                    <legend className="text-xl font-semibold text-text-main px-2">Emergency Contact</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-text-muted">Full Name</label>
                            <input type="text" value={formData.emergencyContact.name} onChange={e => handleInputChange('emergencyContact', 'name', e.target.value)} required className={inputFieldClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted">Relationship</label>
                            <input type="text" value={formData.emergencyContact.relationship} onChange={e => handleInputChange('emergencyContact', 'relationship', e.target.value)} required className={inputFieldClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted">Phone Number</label>
                            <input type="tel" value={formData.emergencyContact.phone} onChange={e => handleInputChange('emergencyContact', 'phone', e.target.value)} required className={inputFieldClasses} />
                        </div>
                    </div>
                </fieldset>

                {/* Physician Information */}
                <fieldset className="border dark:border-slate-700 p-4 rounded-md">
                    <legend className="text-xl font-semibold text-text-main px-2">Physician Information</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-text-muted">Primary Care Physician Name</label>
                            <input type="text" value={formData.primaryCarePhysician.name} onChange={e => handleInputChange('primaryCarePhysician', 'name', e.target.value)} className={inputFieldClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted">Physician Contact Number</label>
                            <input type="tel" value={formData.primaryCarePhysician.phone} onChange={e => handleInputChange('primaryCarePhysician', 'phone', e.target.value)} className={inputFieldClasses} />
                        </div>
                    </div>
                </fieldset>

                <div className="flex justify-end gap-4 pt-4 border-t dark:border-slate-700">
                    <button type="button" onClick={() => navigate('/dashboard')} className="bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 font-bold py-2 px-6 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition duration-300">
                        Cancel
                    </button>
                    <button type="submit" className="bg-accent text-white font-bold py-2 px-6 rounded-md hover:bg-accent-hover transition duration-300">
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

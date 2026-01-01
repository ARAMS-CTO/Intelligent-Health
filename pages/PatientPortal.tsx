
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/Auth';
import { GeminiService, getPatientProfileById, addPatientMedication } from '../services/api';
import { PatientProfile, Medication, Role, PatientFile } from '../types/index';
import { ICONS } from '../constants/index';
import Tooltip from '../components/Tooltip';
import { useTranslation } from 'react-i18next';

import { DataService } from '../services/api';
import { showToast } from '../components/Toast';

interface Message {
  author: 'user' | 'ai';
  content: string;
}

interface CostEstimate {
  id: string;
  total_cost: number;
  currency: string;
  status: string;
  insurance_coverage: number;
  patient_responsibility: number;
}

// Helper function to parse AI responses and add tooltips
const parseAIResponseWithTooltips = (text: string): React.ReactNode => {
  const regex = /([\w\s-]+)\[([^\]]+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const term = match[1];
    const explanation = match[2];

    parts.push(
      <Tooltip text={explanation} key={match.index}>
        <span className="font-bold text-primary border-b-2 border-dotted border-primary cursor-help">
          {term}
        </span>
      </Tooltip>
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};

const PatientPortal: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([]);
  const { t } = useTranslation('patientPortal');

  const uploadToGCS = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data.url;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      if (user.patientProfileId) {
        const fetchProfile = async () => {
          try {
            const patientProfile = await getPatientProfileById(user.patientProfileId!);
            if (patientProfile) {
              setProfile(patientProfile);
              setMessages([
                { author: 'ai', content: t('aiDoctor.initialMessage', { name: patientProfile.name.split(' ')[0] }) }
              ]);
            } else {
              console.error("Profile not found");
              setFetchError(true);
            }
          } catch (e) {
            console.error("Failed to fetch profile", e);
            setFetchError(true);
          }
        };
        fetchProfile();
      } else {
        // No profile ID means new patient needs to create one
        setProfile(null);
      }
    }
  }, [user, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // State for the new medication form
  const [newMedicationName, setNewMedicationName] = useState('');
  const [newMedicationDosage, setNewMedicationDosage] = useState('');
  const [newMedicationFrequency, setNewMedicationFrequency] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !profile) return;

    const newMessages: Message[] = [...messages, { author: 'user', content: userInput }];
    setMessages(newMessages);
    const query = userInput;
    setUserInput('');
    setLoading(true);

    try {
      // Use general chat for patient interactions to support varied queries
      const response = await GeminiService.getGeneralChatResponse(
        messages.map(m => ({ role: m.author === 'ai' ? 'model' : 'user', parts: [m.content] })),
        query,
        user?.id || 'anonymous'
      );
      setMessages(prev => [...prev, { author: 'ai', content: response }]);
    } catch (error: any) {
      const errorMessage = `Error: ${error.message || 'An unexpected error occurred.'}`;
      setMessages(prev => [...prev, { author: 'ai', content: errorMessage }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleDailyCheckup = async () => {
    if (!profile) return;
    setLoading(true);
    // Construct summary
    const summary = `Diagnosed with: ${profile.baselineIllnesses.join(', ')}. Medication: ${profile.medications.map(m => m.name).join(', ')}`;
    try {
      const res = await GeminiService.generateDailyQuestions(summary);
      if (res.questions && res.questions.length > 0) {
        const formatted = "Here are your daily health check questions:\n" + res.questions.map((q: string) => "• " + q).join("\n");
        setMessages(prev => [...prev, { author: 'ai', content: formatted }]);
      } else {
        setMessages(prev => [...prev, { author: 'ai', content: "I don't have any specific questions for you today. How are you feeling?" }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !profile) return;
    if (!confirm(`Upload ${selectedFile.name} to your profile?`)) return;

    try {
      const uploaded = await DataService.uploadFile(selectedFile);
      if (uploaded.url) {
        const newFile: PatientFile = {
          id: `file-${Date.now()}`,
          name: selectedFile.name,
          type: 'Lab Test', // Default to valid type
          uploadDate: new Date().toISOString().split('T')[0],
          url: uploaded.url,
        };
        // Ensure addPatientFile is available, likely imported or we use DataService
        await DataService.addPatientFile(profile.id, newFile);

        setProfile(prev => prev ? ({ ...prev, files: [...prev.files, newFile] }) : null);
        setProfile(prev => prev ? ({ ...prev, files: [...prev.files, newFile] }) : null);
        showToast.success(t('documents.uploadSuccess'));
        setSelectedFile(null);
      }
    } catch (e: any) {
      console.error(e);
      showToast.error(t('errors.uploadFailed'));
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!newMedicationName.trim() || !newMedicationDosage.trim() || !newMedicationFrequency.trim()) {
      showToast.error('Please fill out all medication fields.');
      return;
    }

    const newMedication: Medication = {
      id: `med-${Date.now()}`,
      name: newMedicationName,
      dosage: newMedicationDosage,
      frequency: newMedicationFrequency,
    };

    try {
      // Simulate API call and update state
      await addPatientMedication(profile.id, newMedication);
      setProfile(prevProfile => {
        if (!prevProfile) return null;
        return {
          ...prevProfile,
          medications: [...prevProfile.medications, newMedication],
        };
      });

      // Reset form
      setNewMedicationName('');
      setNewMedicationDosage('');
      setNewMedicationFrequency('');
    } catch (error) {
      console.error("Failed to add medication", error);
      showToast.error("Failed to save medication. Please try again.");
    }
  };


  if (!user || user.role !== Role.Patient) {
    return (
      <div className="text-center p-10 text-danger font-bold">
        Access Denied. This portal is for patients only.
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 rounded-2xl shadow-xl text-center border border-white/20 dark:border-slate-700">
          <div className="text-danger text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-text-main mb-2">Error Loading Profile</h2>
          <p className="text-text-muted mb-6">We couldn't load your patient profile. It may not exist or the server is down.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="bg-primary text-white py-3 px-6 rounded-xl font-bold hover:bg-primary-hover transition-all">
              Retry
            </button>
            {user?.patientProfileId && (
              <div className="text-xs text-text-muted mt-2 bg-slate-100 dark:bg-slate-800 p-2 rounded text-center">
                DEBUG: ID {user.patientProfileId}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    if (user && !user.patientProfileId) {
      return (
        <div className="bg-background min-h-screen flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 rounded-2xl shadow-xl text-center border border-white/20 dark:border-slate-700">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              {ICONS.user}
            </div>
            <h2 className="text-2xl font-bold text-text-main mb-2">Welcome, {user.name.split(' ')[0]}!</h2>
            <p className="text-text-muted mb-8 leading-relaxed">To access your health dashboard and AI assistant, we need to set up your patient profile first.</p>
            <a href="/patient-intake" className="block w-full bg-gradient-to-r from-primary to-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5">
              Complete Patient Profile
            </a>
            <button onClick={() => window.location.reload()} className="mt-4 text-xs text-text-muted hover:text-primary transition-colors">
              Refresh if you've already done this
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-muted font-bold animate-pulse">Loading patient profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-text-main mb-6">
          {t('welcome', { name: profile.name })}
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Profile and Files */}
          {/* Left Column: Profile and Files */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-8 shadow-xl border border-white/20 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                <div className="p-3 bg-gradient-to-br from-primary to-indigo-600 rounded-xl text-white shadow-lg shadow-primary/30">
                  {ICONS.user}
                </div>
                <h2 className="text-2xl font-heading font-bold text-text-main">{t('healthSummary.title')}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                {profile.identifier && (
                  <div className="bg-white/40 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 md:col-span-2 flex items-center justify-between">
                    <span className="font-bold text-text-muted uppercase tracking-wider text-xs">{t('healthSummary.patientId')}</span>
                    <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{profile.identifier}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="font-bold text-text-muted uppercase tracking-wider text-xs">{t('healthSummary.dob')}</p>
                  <p className="font-semibold text-lg text-text-main">{profile.personalDetails.dob}</p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-text-muted uppercase tracking-wider text-xs">{t('healthSummary.bloodType')}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-danger animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                    </span>
                    <p className="font-semibold text-lg text-text-main">{profile.personalDetails.bloodType}</p>
                  </div>
                </div>

                <div className="bg-danger/5 dark:bg-red-900/10 p-4 rounded-xl border border-danger/10 dark:border-red-900/20">
                  <p className="font-bold text-danger mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                    {ICONS.riskHigh} {t('healthSummary.allergies')}
                  </p>
                  {profile.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.allergies.map(a => <span key={a} className="bg-white dark:bg-slate-800 border border-danger/20 text-danger text-xs font-bold px-2 py-1 rounded-lg shadow-sm">{a}</span>)}
                    </div>
                  ) : <span className="text-text-muted italic text-xs">No known allergies</span>}
                </div>

                <div className="bg-info/5 dark:bg-blue-900/10 p-4 rounded-xl border border-info/10 dark:border-blue-900/20">
                  <p className="font-bold text-info mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                    {ICONS.symptomCheck} {t('healthSummary.illnesses')}
                  </p>
                  {profile.baselineIllnesses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.baselineIllnesses.map(i => <span key={i} className="bg-white dark:bg-slate-800 border border-info/20 text-info text-xs font-bold px-2 py-1 rounded-lg shadow-sm">{i}</span>)}
                    </div>
                  ) : <span className="text-text-muted italic text-xs">No significant history</span>}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-8 shadow-xl border border-white/20 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                  {ICONS.pill}
                </div>
                <h2 className="text-2xl font-heading font-bold text-text-main">{t('medicationTracker.title')}</h2>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/50 mb-8">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700/50">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">{t('medicationTracker.headerMedication')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">{t('medicationTracker.headerDosage')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">{t('medicationTracker.headerFrequency')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/40 dark:bg-slate-800/40 divide-y divide-slate-100 dark:divide-slate-700/50">
                    {profile.medications.map((med) => (
                      <tr key={med.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-text-main">{med.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted font-medium">{med.dosage}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-text-muted text-xs font-bold uppercase tracking-wide border border-slate-200 dark:border-slate-600">
                            {med.frequency}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <h3 className="font-bold text-lg text-text-main mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-accent rounded-full"></span>
                  {t('medicationTracker.addTitle')}
                </h3>
                <form onSubmit={handleAddMedication} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label htmlFor="medName" className="block text-xs font-bold text-text-muted mb-1 ml-1 uppercase">{t('medicationTracker.addName')}</label>
                    <input type="text" id="medName" value={newMedicationName} onChange={e => setNewMedicationName(e.target.value)} className="block w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all text-sm" placeholder={t('medicationTracker.namePlaceholder')} />
                  </div>
                  <div>
                    <label htmlFor="medDosage" className="block text-xs font-bold text-text-muted mb-1 ml-1 uppercase">{t('medicationTracker.addDosage')}</label>
                    <input type="text" id="medDosage" value={newMedicationDosage} onChange={e => setNewMedicationDosage(e.target.value)} className="block w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all text-sm" placeholder={t('medicationTracker.dosagePlaceholder')} />
                  </div>
                  <div>
                    <label htmlFor="medFreq" className="block text-xs font-bold text-text-muted mb-1 ml-1 uppercase">{t('medicationTracker.addFrequency')}</label>
                    <input type="text" id="medFreq" value={newMedicationFrequency} onChange={e => setNewMedicationFrequency(e.target.value)} className="block w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all text-sm" placeholder={t('medicationTracker.frequencyPlaceholder')} />
                  </div>
                  <div className="md:col-span-3 text-right mt-2">
                    <button type="submit" className="bg-accent text-white font-bold py-2.5 px-6 rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 transform hover:-translate-y-0.5 text-sm uppercase tracking-wide">
                      {t('medicationTracker.addButton')}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-8 shadow-xl border border-white/20 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-purple-500/20">
                  {ICONS.upload}
                </div>
                <h2 className="text-2xl font-heading font-bold text-text-main">{t('documents.title')}</h2>
              </div>

              <div className="space-y-4 mb-8">
                {profile.files.length > 0 ? (
                  profile.files.map(file => (
                    <div key={file.id} className="flex justify-between items-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-text-muted group-hover:text-primary transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div>
                          <p className="font-bold text-text-main group-hover:text-primary transition-colors">{file.name}</p>
                          <p className="text-xs text-text-muted font-mono mt-0.5">{file.type} • {file.uploadDate}</p>
                        </div>
                      </div>
                      <a href={file.url} className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all uppercase tracking-wide">View</a>
                    </div>
                  ))) : (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl opacity-70">
                    <p className="text-text-muted italic">{t('documents.empty') || "No documents available"}</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <h3 className="font-bold text-lg text-text-main mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                  {t('documents.uploadTitle')}
                </h3>
                <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <input type="file" onChange={handleFileChange} className="block w-full text-sm text-text-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wide file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                  <button onClick={handleFileUpload} disabled={!selectedFile} className="bg-purple-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:shadow-none text-sm uppercase tracking-wide">
                    {t('documents.uploadButton')}
                  </button>
                </div>
              </div>
            </div>

            {/* Financials / Cost Estimates */}
            <div className="glass-card rounded-2xl p-8 shadow-xl border border-white/20 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-500/30">
                  {ICONS.money}
                </div>
                <h2 className="text-2xl font-heading font-bold text-text-main">My Financials</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-white/40 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-text-main">Estimated Cost: Recent Consultation</h4>
                      <p className="text-xs text-text-muted">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-bold rounded-lg uppercase">Estimated</span>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="text-sm">
                      <p className="text-text-muted">Total: <span className="line-through">$1,200</span></p>
                      <p className="text-success font-bold">Insurance: -$960 (80%)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted uppercase font-bold">Your Responsibility</p>
                      <p className="text-2xl font-black text-text-main">$240.00</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-text-muted mt-2">
                  * Estimations are based on standard procedure costs and your insurance plan. Final bill may vary.
                </p>
              </div>
            </div>
          </div>
          {/* Right Column: AI Assistant */}
          {/* Right Column: AI Assistant */}
          <div className="glass-card rounded-2xl p-6 shadow-xl flex flex-col h-[75vh] max-h-[850px] sticky top-6 border border-white/20 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <h2 className="text-xl font-heading font-bold text-text-main flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary to-indigo-600 rounded-lg text-white shadow-md">
                  {ICONS.ai}
                </div>
                {t('aiDoctor.title')}
              </h2>
              <button onClick={handleDailyCheckup} disabled={loading} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all disabled:opacity-50">
                Daily Check-in
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 pr-2">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-4 ${msg.author === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  {msg.author === 'ai' && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-md border-2 border-white dark:border-slate-800">AI</div>
                  )}
                  <div className={`p-5 rounded-2xl max-w-[85%] shadow-sm ${msg.author === 'user' ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-br-none shadow-primary/20' : 'bg-white/80 dark:bg-slate-700/80 text-text-main rounded-bl-none border border-slate-100 dark:border-slate-600'}`}>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.author === 'ai' ? parseAIResponseWithTooltips(msg.content) : msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-4 justify-start animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-md">AI</div>
                  <div className="p-5 rounded-2xl bg-white/50 dark:bg-slate-700/50 text-text-main rounded-bl-none border border-slate-100 dark:border-slate-700/50 min-w-[100px]">
                    <div className="flex items-center gap-2 justify-center h-full">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 border-t border-slate-100 dark:border-slate-700/50 pt-4 bg-white/50 dark:bg-slate-800/50 p-2 rounded-2xl mx-1 mb-1 shadow-sm">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={t('aiDoctor.inputPlaceholder')}
                  className="flex-1 border-0 bg-transparent py-3 px-4 focus:ring-0 text-sm placeholder:text-slate-400"
                  disabled={loading}
                  autoComplete="off"
                />
                <button type="submit" disabled={loading || !userInput.trim()} className="bg-primary text-white p-3 rounded-xl hover:bg-primary-hover transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100">
                  {ICONS.send}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPortal;

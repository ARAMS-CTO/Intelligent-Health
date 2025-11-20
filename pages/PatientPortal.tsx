
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/Auth';
import { GeminiService, getPatientProfileById, addPatientMedication } from '../services/api';
import { PatientProfile, Medication, Role } from '../types/index';
import { ICONS } from '../constants/index';
import Tooltip from '../components/Tooltip';
import { useTranslation } from 'react-i18next';

interface Message {
  author: 'user' | 'ai';
  content: string;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation('patientPortal');

  useEffect(() => {
    if (user?.patientProfileId) {
        const fetchProfile = async () => {
            const patientProfile = await getPatientProfileById(user.patientProfileId!);
            if(patientProfile) {
                setProfile(patientProfile);
                setMessages([
                  { author: 'ai', content: t('aiDoctor.initialMessage', { name: patientProfile.name.split(' ')[0] }) }
                ]);
            }
        };
        fetchProfile();
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
        const response = await GeminiService.explainToPatient(query, profile);
        setMessages(prev => [...prev, { author: 'ai', content: response }]);
    } catch (error: any) {
        const errorMessage = `Error: ${error.message || 'An unexpected error occurred.'}`;
        setMessages(prev => [...prev, { author: 'ai', content: errorMessage }]);
    } finally {
        setLoading(false);
        inputRef.current?.focus();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };
  
  const handleFileUpload = () => {
      if (selectedFile) {
          alert(`Uploading file: ${selectedFile.name}`);
          // Here you would typically handle the upload to a server
          setSelectedFile(null);
      }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!newMedicationName.trim() || !newMedicationDosage.trim() || !newMedicationFrequency.trim()) {
      alert('Please fill out all medication fields.');
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
        alert("Failed to save medication. Please try again.");
    }
  };


  if (!user || user.role !== Role.Patient) {
    return (
      <div className="text-center p-10 text-danger font-bold">
        Access Denied. This portal is for patients only.
      </div>
    );
  }

  if (!profile) {
    return (
        <div className="bg-background min-h-screen flex items-center justify-center">
            <p>Loading patient profile...</p>
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
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-text-main mb-4">{t('healthSummary.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-text-muted">
                {profile.identifier && <p className="md:col-span-2"><strong>{t('healthSummary.patientId')}</strong> {profile.identifier}</p>}
                <p><strong>{t('healthSummary.dob')}</strong> {profile.personalDetails.dob}</p>
                <p><strong>{t('healthSummary.bloodType')}</strong> {profile.personalDetails.bloodType}</p>
                <div>
                  <p><strong>{t('healthSummary.allergies')}</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    {profile.allergies.map(a => <li key={a}>{a}</li>)}
                  </ul>
                </div>
                <div>
                  <p><strong>{t('healthSummary.illnesses')}</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    {profile.baselineIllnesses.map(i => <li key={i}>{i}</li>)}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-surface p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-text-main mb-4">{t('medicationTracker.title')}</h2>
                <div className="overflow-x-auto mb-6">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">{t('medicationTracker.headerMedication')}</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">{t('medicationTracker.headerDosage')}</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">{t('medicationTracker.headerFrequency')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-gray-200 dark:divide-slate-700">
                            {profile.medications.map((med) => (
                                <tr key={med.id}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-text-main">{med.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-text-muted">{med.dosage}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-text-muted">{med.frequency}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border-t dark:border-slate-700 pt-4">
                    <h3 className="font-semibold text-lg text-text-main mb-2">{t('medicationTracker.addTitle')}</h3>
                    <form onSubmit={handleAddMedication} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label htmlFor="medName" className="block text-sm font-medium text-text-muted">{t('medicationTracker.addName')}</label>
                            <input type="text" id="medName" value={newMedicationName} onChange={e => setNewMedicationName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 dark:bg-slate-800 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder={t('medicationTracker.namePlaceholder')}/>
                        </div>
                        <div>
                            <label htmlFor="medDosage" className="block text-sm font-medium text-text-muted">{t('medicationTracker.addDosage')}</label>
                            <input type="text" id="medDosage" value={newMedicationDosage} onChange={e => setNewMedicationDosage(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 dark:bg-slate-800 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder={t('medicationTracker.dosagePlaceholder')}/>
                        </div>
                        <div>
                            <label htmlFor="medFreq" className="block text-sm font-medium text-text-muted">{t('medicationTracker.addFrequency')}</label>
                            <input type="text" id="medFreq" value={newMedicationFrequency} onChange={e => setNewMedicationFrequency(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 dark:bg-slate-800 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder={t('medicationTracker.frequencyPlaceholder')}/>
                        </div>
                        <div className="md:col-span-3 text-right">
                             <button type="submit" className="bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-accent-hover transition duration-300">
                                {t('medicationTracker.addButton')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-surface p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-text-main mb-4">{t('documents.title')}</h2>
              <div className="space-y-3">
                {profile.files.map(file => (
                  <div key={file.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                    <div>
                      <p className="font-semibold">{file.name}</p>
                      <p className="text-sm text-text-muted">{file.type} - {file.uploadDate}</p>
                    </div>
                    <a href={file.url} className="text-primary hover:underline font-semibold">View</a>
                  </div>
                ))}
              </div>
               <div className="mt-6 border-t dark:border-slate-700 pt-4">
                    <h3 className="font-semibold text-lg text-text-main mb-2">{t('documents.uploadTitle')}</h3>
                    <div className="flex items-center gap-4">
                        <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-info-light file:text-primary hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-800/50"/>
                        <button onClick={handleFileUpload} disabled={!selectedFile} className="bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-accent-hover transition disabled:bg-gray-400">
                            {t('documents.uploadButton')}
                        </button>
                    </div>
                </div>
            </div>
          </div>
          {/* Right Column: AI Assistant */}
          <div className="bg-surface p-6 rounded-lg shadow-md flex flex-col h-[70vh] max-h-[800px]">
            <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-4 border-b dark:border-slate-700 pb-4">{ICONS.ai} {t('aiDoctor.title')}</h2>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex gap-3 ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.author === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">AI</div>
                    )}
                    <div className={`p-3 rounded-2xl max-w-md ${msg.author === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-slate-200 text-text-main dark:bg-slate-700 rounded-bl-none'}`}>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.author === 'ai' ? parseAIResponseWithTooltips(msg.content) : msg.content}
                        </div>
                    </div>
                  </div>
                ))}
                {loading && (
                    <div className="flex gap-3 justify-start">
                       <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">AI</div>
                       <div className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-text-main rounded-bl-none">
                          <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                          </div>
                       </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 border-t dark:border-slate-700 pt-4">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={t('aiDoctor.inputPlaceholder')}
                    className="flex-1 border rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary bg-inherit dark:border-slate-600"
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading || !userInput.trim()} className="bg-primary text-white p-2.5 rounded-full hover:bg-primary-hover transition disabled:bg-gray-400 disabled:cursor-not-allowed">
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

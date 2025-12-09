
import React, { useState, useEffect } from 'react';
import { Case, AnonymisedPatientProfile } from '../types/index';
import { useAuth } from './Auth';
import VoiceInput from './VoiceInput';
import VoiceFormAssistant from './VoiceFormAssistant';

interface CreateCaseFormProps {
  onSubmit: (caseData: Omit<Case, 'id' | 'creatorId' | 'createdAt' | 'files' | 'status'>) => void;
  onCancel: () => void;
  initialData?: Partial<Case> & { patientId?: string } | null;
}

const CreateCaseForm: React.FC<CreateCaseFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [complaint, setComplaint] = useState('');
  const [history, setHistory] = useState('');
  const [findings, setFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [tags, setTags] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientProfile, setPatientProfile] = useState<AnonymisedPatientProfile>({
    age: 0,
    sex: 'Male',
    comorbidities: [],
  });

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setComplaint(initialData.complaint || '');
      setHistory(initialData.history || '');
      setFindings(initialData.findings || '');
      setDiagnosis(initialData.diagnosis || '');
      setTags(initialData.tags?.join(', ') || '');
      setPatientProfile(initialData.patientProfile || { age: 0, sex: 'Male', comorbidities: [] });
      setPatientId(initialData.patientId || `patient-${Date.now()}`);
    } else {
      // When creating a new case from scratch, generate a new patient ID
      setPatientId(`patient-${Date.now()}`);
    }
  }, [initialData]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatientProfile(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value,
    }));
  };

  const handleComorbiditiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientProfile(prev => ({
      ...prev,
      comorbidities: e.target.value.split(',').map(s => s.trim()).filter(s => s)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to create a case.");
      return;
    }

    const newCaseData = {
      title,
      patientId, // Use the stored patientId
      patientProfile,
      complaint,
      history,
      findings,
      diagnosis,
      tags: tags.split(',').map(s => s.trim()).filter(s => s),
    };

    onSubmit(newCaseData);
  };

  // AI Form Assistant Schema
  const formSchema = {
    title: "string",
    patientProfile: {
      age: "number",
      sex: "string (Male, Female, Other)",
      comorbidities: "array of strings"
    },
    complaint: "string",
    history: "string",
    findings: "string",
    diagnosis: "string",
    tags: "string (comma separated)"
  };

  const handleAIUpdate = (updates: any) => {
    if (updates.title) setTitle(updates.title);
    if (updates.complaint) setComplaint(updates.complaint);
    if (updates.history) setHistory(updates.history);
    if (updates.findings) setFindings(updates.findings);
    if (updates.diagnosis) setDiagnosis(updates.diagnosis);
    if (updates.tags) setTags(Array.isArray(updates.tags) ? updates.tags.join(', ') : updates.tags);

    if (updates.patientProfile) {
      setPatientProfile(prev => ({
        ...prev,
        ...updates.patientProfile,
        // Ensure age is a number if updated
        age: updates.patientProfile.age ? parseInt(updates.patientProfile.age) : prev.age
      }));
    }
  };

  return (
    <div className="relative">
      {/* Voice Assistant */}
      <VoiceFormAssistant
        formSchema={formSchema}
        formData={{
          title,
          patientProfile,
          complaint,
          history,
          findings,
          diagnosis,
          tags
        }}
        onUpdate={handleAIUpdate}
      />

      <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-lg shadow-xl w-full max-w-2xl space-y-4">
        <h2 className="text-2xl font-bold text-text-main mb-4">Create New Clinical Case</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-text-muted">Case Title</label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
        </div>

        <fieldset className="border p-4 rounded-md">
          <legend className="text-lg font-semibold text-text-main px-2">Anonymised Patient Profile</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-text-muted">Age</label>
              <input type="number" id="age" name="age" value={patientProfile.age === 0 ? '' : patientProfile.age} onChange={handleProfileChange} required className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-text-muted">Sex</label>
              <select id="sex" name="sex" value={patientProfile.sex} onChange={handleProfileChange} className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="comorbidities" className="block text-sm font-medium text-text-muted">Comorbidities (comma-separated)</label>
              <input type="text" id="comorbidities" name="comorbidities" value={patientProfile.comorbidities.join(', ')} onChange={handleComorbiditiesChange} className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
            </div>
          </div>
        </fieldset>

        <div>
          <label htmlFor="complaint" className="block text-sm font-medium text-text-muted">Presenting Complaint</label>
          <div className="relative">
            <textarea
              id="complaint"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={3}
              required
              className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary pr-10"
            ></textarea>
            <div className="absolute bottom-2 right-2">
              <VoiceInput onTranscript={(text) => setComplaint(prev => prev + text)} />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="history" className="block text-sm font-medium text-text-muted">History</label>
          <div className="relative">
            <textarea
              id="history"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              rows={3}
              required
              className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary pr-10"
            ></textarea>
            <div className="absolute bottom-2 right-2">
              <VoiceInput onTranscript={(text) => setHistory(prev => prev + text)} />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="findings" className="block text-sm font-medium text-text-muted">Examination Findings</label>
          <div className="relative">
            <textarea
              id="findings"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={3}
              required
              className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary pr-10"
            ></textarea>
            <div className="absolute bottom-2 right-2">
              <VoiceInput onTranscript={(text) => setFindings(prev => prev + text)} />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="diagnosis" className="block text-sm font-medium text-text-muted">Initial Diagnosis</label>
          <textarea id="diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} required className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-text-muted">Tags (comma-separated)</label>
          <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-md hover:bg-slate-300 transition duration-300">
            Cancel
          </button>
          <button type="submit" className="bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-accent-hover transition duration-300">
            Create Case
          </button>
        </div>
      </form>
      <button onClick={onCancel} className="absolute -top-2 -right-2 text-gray-600 bg-surface rounded-full p-1 shadow-lg hover:text-gray-900">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default CreateCaseForm;

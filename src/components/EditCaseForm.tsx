import React, { useState, useEffect } from 'react';
// Fix: Import from '../types/index' for consistency.
import { Case } from '../types/index';

interface EditCaseFormProps {
  initialData: Case;
  onSubmit: (updatedData: Partial<Case>) => void;
  onCancel: () => void;
}

const EditCaseForm: React.FC<EditCaseFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    complaint: '',
    history: '',
    findings: '',
    diagnosis: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        complaint: initialData.complaint,
        history: initialData.history,
        findings: initialData.findings,
        diagnosis: initialData.diagnosis,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-lg shadow-xl w-full max-w-2xl space-y-4">
        <h2 className="text-2xl font-bold text-text-main mb-4">Edit Clinical Case</h2>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-text-muted">Case Title</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
        
        <div>
          <label htmlFor="complaint" className="block text-sm font-medium text-text-muted">Presenting Complaint</label>
          <textarea id="complaint" name="complaint" value={formData.complaint} onChange={handleChange} rows={3} required className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
        </div>
        <div>
          <label htmlFor="history" className="block text-sm font-medium text-text-muted">History</label>
          <textarea id="history" name="history" value={formData.history} onChange={handleChange} rows={3} required className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
        </div>
        <div>
          <label htmlFor="findings" className="block text-sm font-medium text-text-muted">Examination Findings</label>
          <textarea id="findings" name="findings" value={formData.findings} onChange={handleChange} rows={3} required className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
        </div>
        <div>
          <label htmlFor="diagnosis" className="block text-sm font-medium text-text-muted">Diagnosis</label>
          <textarea id="diagnosis" name="diagnosis" value={formData.diagnosis} onChange={handleChange} rows={2} required className="mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-md hover:bg-slate-300 transition duration-300">
            Cancel
          </button>
          <button type="submit" className="bg-accent text-white font-bold py-2 px-4 rounded-md hover:bg-accent-hover transition duration-300">
            Save Changes
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

export default EditCaseForm;

import React, { useState } from 'react';
import { PatientProfile } from '../types/index';
import { showToast } from './Toast';

interface PrivacyViewProps {
    profile: PatientProfile;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ profile }) => {
    const [emergencyEnabled, setEmergencyEnabled] = useState(false); // Mock initial state - in real app, fetch from profile.privacy_settings
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [duration, setDuration] = useState(60);
    const [selectedItems, setSelectedItems] = useState({
        history: true,
        medications: true,
        records: false,
    });

    const handleGenerateLink = async () => {
        try {
            // In a real scenario, base url might be config driven
            const res = await fetch('/api/sharing/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    duration_minutes: duration,
                    permissions: selectedItems
                })
            });
            const data = await res.json();
            if (res.ok) {
                setGeneratedLink(data.link);
                showToast.success("Secure link generated!");
            } else {
                showToast.error("Failed to generate link.");
            }
        } catch (e) {
            console.error(e);
            showToast.error("Error generating link.");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Emergency Access Card */}
            <div className="glass-card rounded-2xl p-8 shadow-xl border border-white/20 dark:border-slate-700">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-main">Emergency Access</h2>
                        <p className="text-xs text-text-muted">Allow first responders to view simplified critical info.</p>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-text-main">Enable Emergency Profile</span>
                    <button
                        onClick={() => setEmergencyEnabled(!emergencyEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emergencyEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${emergencyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {emergencyEnabled && (
                    <div className="mt-6 text-center">
                        <div className="bg-white p-4 inline-block rounded-xl shadow-inner border border-slate-200">
                            {/* Static QR for Demo pointing to Emergency View */}
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + "/emergency/" + profile.id)}`}
                                alt="Emergency QR"
                                className="w-32 h-32 opacity-90"
                            />
                        </div>
                        <p className="mt-4 text-xs font-bold text-primary uppercase tracking-wide">Emergency QR Active</p>
                    </div>
                )}
            </div>

            {/* Controlled Data Sharing */}
            <div className="glass-card rounded-2xl p-8 shadow-xl border border-white/20 dark:border-slate-700">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-main">Share Data</h2>
                        <p className="text-xs text-text-muted">Create a temporary link for doctors to view specific records.</p>
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <input type="checkbox" checked={selectedItems.history} onChange={e => setSelectedItems({ ...selectedItems, history: e.target.checked })} className="rounded text-primary focus:ring-primary" />
                            <span className="text-sm font-medium">Medical History (Illnesses, Allergies)</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <input type="checkbox" checked={selectedItems.medications} onChange={e => setSelectedItems({ ...selectedItems, medications: e.target.checked })} className="rounded text-primary focus:ring-primary" />
                            <span className="text-sm font-medium">Current Medications</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <input type="checkbox" checked={selectedItems.records} onChange={e => setSelectedItems({ ...selectedItems, records: e.target.checked })} className="rounded text-primary focus:ring-primary" />
                            <span className="text-sm font-medium">Recent Records & Videos</span>
                        </label>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Duration</label>
                        <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
                            <option value={60}>1 Hour</option>
                            <option value={1440}>24 Hours</option>
                            <option value={10080}>7 Days</option>
                        </select>
                    </div>
                </div>

                <button onClick={handleGenerateLink} className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-hover transition-all">
                    Generate Secure Link
                </button>

                {generatedLink && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30 flex flex-col items-center gap-4 animate-scale-in">
                        <div className="bg-white p-2 rounded-lg">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generatedLink)}`}
                                alt="Share QR"
                                className="w-32 h-32"
                            />
                        </div>
                        <p className="text-sm text-center text-green-800 dark:text-green-300 font-medium break-all">{generatedLink}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

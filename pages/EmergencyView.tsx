import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ICONS } from '../constants/index';

interface EmergencyData {
    name: string;
    dob: string;
    blood_type: string;
    allergies: string[];
    baseline_illnesses: string[];
    emergency_contacts: { name: string; relationship: string; phone: string }[];
    primary_care_physician: { name: string; phone: string };
}

const EmergencyView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<EmergencyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/sharing/emergency/${id}`);
                if (!res.ok) {
                    if (res.status === 403) throw new Error("Emergency Profile is DISABLED for this patient.");
                    if (res.status === 404) throw new Error("Patient not found.");
                    throw new Error("Failed to load emergency profile.");
                }
                const json = await res.json();
                setData(json);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-red-50 dark:bg-slate-900 flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-red-600 font-bold animate-pulse">Loading Emergency Profile...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-8 text-center border-l-4 border-slate-400">
                <div className="text-slate-400 text-4xl mb-4">🔒</div>
                <h1 className="text-2xl font-bold text-text-main mb-2">Profile Unavailable</h1>
                <p className="text-text-muted">{error}</p>
            </div>
        </div>
    );

    if (!data) return null;

    return (
        <div className="min-h-screen bg-red-50/50 dark:bg-slate-900 p-4 sm:p-8">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Urgent Header */}
                <div className="bg-red-600 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between animate-pulse-slow">
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-wider">Emergency Medical ID</h1>
                        <p className="opacity-90">Critical Information for First Responders</p>
                    </div>
                    <div className="text-4xl">
                        {ICONS.riskHigh}
                    </div>
                </div>

                {/* Patient Identity */}
                <div className="glass-card p-6 rounded-2xl shadow-lg border border-red-100 dark:border-red-900/30">
                    <h2 className="text-xl font-bold text-text-main mb-4 border-b border-slate-100 pb-2">Patient Identity</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-text-muted uppercase font-bold">Name</p>
                            <p className="text-xl font-bold text-text-main">{data.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase font-bold">DOB</p>
                            <p className="text-lg text-text-main">{data.dob}</p>
                        </div>
                        <div className="col-span-2">
                            <div className="inline-block bg-red-100 text-red-800 p-2 rounded-lg border border-red-200">
                                <span className="text-xs font-bold uppercase block">Blood Type</span>
                                <span className="text-2xl font-black">{data.blood_type}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Critical Medical Info */}
                <div className="glass-card p-6 rounded-2xl shadow-lg border border-red-100 dark:border-red-900/30">
                    <h2 className="text-xl font-bold text-text-main mb-4 border-b border-slate-100 pb-2">Medical Conditions</h2>

                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-red-600 uppercase mb-2">Severe Allergies</h3>
                        {data.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {data.allergies.map(a => <span key={a} className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold border border-red-200 shadow-sm">{a}</span>)}
                            </div>
                        ) : <p className="text-text-muted">No known allergies.</p>}
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-blue-600 uppercase mb-2">Baseline Illnesses</h3>
                        {data.baseline_illnesses.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                                {data.baseline_illnesses.map(i => <li key={i} className="font-medium text-text-main">{i}</li>)}
                            </ul>
                        ) : <p className="text-text-muted">No major illnesses recorded.</p>}
                    </div>
                </div>

                {/* Contacts */}
                <div className="glass-card p-6 rounded-2xl shadow-lg border border-white/20 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-text-main mb-4 border-b border-slate-100 pb-2">Emergency Contacts</h2>

                    <div className="space-y-4">
                        {data.emergency_contacts && data.emergency_contacts.map((c, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                <div>
                                    <p className="font-bold text-text-main">{c.name} <span className="text-xs font-normal text-text-muted">({c.relationship})</span></p>
                                </div>
                                <a href={`tel:${c.phone}`} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 transition-colors flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg> Call
                                </a>
                            </div>
                        ))}

                        {data.primary_care_physician && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-xs font-bold text-text-muted uppercase mb-2">Primary Care Physician</p>
                                <div className="flex justify-between items-center">
                                    <p className="font-bold text-text-main">{data.primary_care_physician.name}</p>
                                    <a href={`tel:${data.primary_care_physician.phone}`} className="text-primary font-bold text-sm hover:underline">
                                        {data.primary_care_physician.phone}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EmergencyView;

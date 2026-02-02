import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
import { showToast } from '../../components/Toast';

export const CareFinderPage: React.FC = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState<'report_input' | 'finding_specialty' | 'results' | 'booking'>('report_input');
    const [reportText, setReportText] = useState("");
    const [identifiedSpecialty, setIdentifiedSpecialty] = useState<any>(null);

    // Mock Database
    const DOCTORS = [
        { id: 1, name: "Dr. Sarah Chen", specialty: "Cardiology", hospital: "City General", availability: "Today" },
        { id: 2, name: "Dr. Mike Ross", specialty: "Orthopedics", hospital: "OrthoCare Clinic", availability: "Tomorrow" },
        { id: 3, name: "Dr. Emily Blunt", specialty: "Dermatology", hospital: "Skin Health Center", availability: "Wed 24th" },
        { id: 4, name: "Dr. John Doe", specialty: "Cardiology", hospital: "Heart Institute", availability: "Next Week" },
        { id: 5, name: "Dr. Gregory House", specialty: "Diagnostics", hospital: "Princeton-Plainsboro", availability: "Unknown" },
    ];

    const analyzeReport = () => {
        if (!reportText) return;
        setStep('finding_specialty');

        // Simulate AI Analysis
        setTimeout(() => {
            const lowerText = reportText.toLowerCase();
            let result = { specialty: 'General Practice', confidence: 'Low' };

            if (lowerText.includes('heart') || lowerText.includes('ecg') || lowerText.includes('chest pain')) {
                result = { specialty: 'Cardiology', confidence: 'High (98%)' };
            } else if (lowerText.includes('bone') || lowerText.includes('fracture') || lowerText.includes('knee')) {
                result = { specialty: 'Orthopedics', confidence: 'High (95%)' };
            } else if (lowerText.includes('skin') || lowerText.includes('mole') || lowerText.includes('rash')) {
                result = { specialty: 'Dermatology', confidence: 'High (92%)' };
            }

            setIdentifiedSpecialty(result);
            setStep('results');
        }, 1500);
    };

    return (
        <div className="p-6 md:p-12 max-w-4xl mx-auto animate-fade-in min-h-screen">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 mb-2">
                Care Finder & Report Analysis
            </h1>
            <p className="text-text-secondary mb-8">
                Upload your medical report details to automatically find the right specialist and clinic for you.
            </p>

            {step === 'report_input' && (
                <div className="glass-card p-8 rounded-3xl space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">Paste Report Findings / Symptoms</label>
                        <textarea
                            className="w-full h-40 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary"
                            placeholder="e.g., Patient experiencing sharp chest pains, ECG shows irregularities..."
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                        ></textarea>
                    </div>
                    <button
                        onClick={analyzeReport}
                        disabled={!reportText}
                        className="btn-primary w-full py-4 text-lg shadow-lg shadow-primary/20"
                    >
                        {ICONS.search} Analyze & Find Specialist
                    </button>

                    <div className="text-center text-xs text-text-secondary mt-4">
                        Or <button className="text-primary underline">browse by specialty manually</button>
                    </div>
                </div>
            )}

            {step === 'finding_specialty' && (
                <div className="glass-card p-12 rounded-3xl flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">🧠</div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Analyzing Medical Context...</h3>
                        <p className="text-text-secondary">Matching symptoms to 50+ Specialties</p>
                    </div>
                </div>
            )}

            {step === 'results' && identifiedSpecialty && (
                <div className="space-y-6">
                    {/* Identification Result */}
                    <div className="bg-gradient-to-r from-indigo-500 to-primary text-white p-6 rounded-3xl flex items-center justify-between shadow-xl">
                        <div>
                            <div className="text-sm opacity-80 uppercase tracking-widest font-bold mb-1">Recommended Specialty</div>
                            <div className="text-3xl font-bold">{identifiedSpecialty.specialty}</div>
                            <div className="text-sm mt-1 bg-white/20 inline-block px-2 py-0.5 rounded backdrop-blur-sm">
                                AI Confidence: {identifiedSpecialty.confidence}
                            </div>
                        </div>
                        <div className="text-5xl opacity-50">
                            {identifiedSpecialty.specialty === 'Cardiology' ? '🫀' :
                                identifiedSpecialty.specialty === 'Orthopedics' ? '🦴' : '🩺'}
                        </div>
                    </div>

                    <h3 className="text-xl font-bold mt-8">Recommended Doctors & Clinics</h3>
                    <div className="grid gap-4">
                        {DOCTORS.filter(d => d.specialty === identifiedSpecialty.specialty || identifiedSpecialty.specialty === 'General Practice').map(doc => (
                            <div key={doc.id} className="glass-card p-4 rounded-2xl flex items-center justify-between hover:scale-[1.01] transition-transform cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-xl">👨‍⚕️</div>
                                    <div>
                                        <div className="font-bold text-lg group-hover:text-primary transition-colors">{doc.name}</div>
                                        <div className="text-sm text-text-secondary">{doc.hospital} • {doc.specialty}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-bold ${doc.availability === 'Today' ? 'text-green-500' : 'text-amber-500'}`}>
                                        {doc.availability}
                                    </div>
                                    <button
                                        onClick={() => showToast.success(`Appointment Request sent to ${doc.name}`)}
                                        className="mt-1 px-4 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setStep('report_input')}
                        className="text-text-secondary hover:text-primary text-sm font-bold flex items-center gap-2 mt-4"
                    >
                        ← Analyze Another Report
                    </button>
                </div>
            )}
        </div>
    );
};

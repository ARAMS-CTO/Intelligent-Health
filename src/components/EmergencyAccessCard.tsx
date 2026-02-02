import React, { useState } from 'react';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';

interface EmergencyContact {
    id: string;
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
}

export const EmergencyAccessCard: React.FC = () => {
    const [showQRModal, setShowQRModal] = useState(false);
    const [emergencyContacts] = useState<EmergencyContact[]>([
        { id: '1', name: 'Jane Doe', relationship: 'Spouse', phone: '+1 555-123-4567', isPrimary: true },
        { id: '2', name: 'John Doe Sr.', relationship: 'Father', phone: '+1 555-987-6543', isPrimary: false },
    ]);

    const handleGenerateEmergencyQR = () => {
        setShowQRModal(true);
    };

    const handleShareWithER = () => {
        showToast.success('Emergency medical info shared with local ER');
    };

    return (
        <>
            <div className="glass-card p-6 rounded-2xl border border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
                        🚨 Emergency Access
                    </h3>
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 text-xs font-bold rounded-lg">
                        Quick Access
                    </span>
                </div>

                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    Share your critical medical information instantly with emergency responders.
                </p>

                {/* Critical Info Preview */}
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Blood Type</span>
                        <span className="font-bold text-red-600">O+</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Allergies</span>
                        <span className="font-bold text-amber-600">Penicillin, Sulfa</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Conditions</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Type 2 Diabetes</span>
                    </div>
                </div>

                {/* Emergency Contacts */}
                <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Emergency Contacts</h4>
                    <div className="space-y-2">
                        {emergencyContacts.map(contact => (
                            <div key={contact.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    {contact.isPrimary && <span className="text-yellow-500">⭐</span>}
                                    <div>
                                        <p className="font-bold text-sm text-slate-800 dark:text-white">{contact.name}</p>
                                        <p className="text-xs text-slate-500">{contact.relationship}</p>
                                    </div>
                                </div>
                                <a href={`tel:${contact.phone}`} className="text-primary font-bold text-sm">
                                    📞 Call
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleGenerateEmergencyQR}
                        className="py-3 bg-white dark:bg-slate-800 text-red-600 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm border border-red-200 dark:border-red-800"
                    >
                        📱 Show QR
                    </button>
                    <button
                        onClick={handleShareWithER}
                        className="py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        🏥 Share with ER
                    </button>
                </div>

                {/* 911 Button */}
                <a
                    href="tel:911"
                    className="mt-4 w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-red-500/30"
                >
                    📞 Call 911
                </a>
            </div>

            {/* QR Code Modal */}
            {showQRModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
                        <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2">
                            Emergency Medical ID
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Scan this QR code to access critical medical information
                        </p>

                        {/* QR Code Placeholder */}
                        <div className="bg-white p-6 rounded-2xl mx-auto mb-6 inline-block">
                            <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-6xl mb-2">📱</div>
                                    <p className="text-xs text-slate-500">QR Code</p>
                                    <p className="text-[10px] text-slate-400">(Demo placeholder)</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl mb-6">
                            <p className="text-xs text-red-600 dark:text-red-400">
                                ⚠️ This QR provides access to critical health info only. Full records require authentication.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowQRModal(false)}
                            className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

// Medical ID Wallet Card
export const MedicalIDCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
    const patientInfo = {
        name: 'John Patient',
        dob: '1985-03-15',
        bloodType: 'O+',
        allergies: ['Penicillin', 'Sulfa'],
        conditions: ['Type 2 Diabetes', 'Hypertension'],
        medications: ['Metformin 500mg', 'Lisinopril 10mg'],
        emergencyContact: { name: 'Jane Doe', phone: '+1 555-123-4567' }
    };

    if (compact) {
        return (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-4 rounded-2xl text-white">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="text-xs opacity-70 font-bold uppercase">Medical ID</p>
                        <p className="font-bold text-lg">{patientInfo.name}</p>
                    </div>
                    <span className="text-2xl">🏥</span>
                </div>
                <div className="flex gap-4 text-xs">
                    <div>
                        <span className="opacity-70">Blood</span>
                        <span className="font-bold ml-1">{patientInfo.bloodType}</span>
                    </div>
                    <div>
                        <span className="opacity-70">Allergies</span>
                        <span className="font-bold ml-1">{patientInfo.allergies.length}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-3xl text-white shadow-2xl shadow-purple-500/30">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-xs opacity-70 font-bold uppercase tracking-wider">Medical ID Card</p>
                    <p className="font-bold text-2xl">{patientInfo.name}</p>
                    <p className="text-sm opacity-80">DOB: {new Date(patientInfo.dob).toLocaleDateString()}</p>
                </div>
                <div className="text-4xl bg-white/20 p-3 rounded-xl">🏥</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/10 p-3 rounded-xl">
                    <p className="text-xs opacity-70 font-bold uppercase">Blood Type</p>
                    <p className="text-xl font-black">{patientInfo.bloodType}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                    <p className="text-xs opacity-70 font-bold uppercase">Allergies</p>
                    <p className="font-bold text-sm">{patientInfo.allergies.join(', ')}</p>
                </div>
            </div>

            <div className="bg-white/10 p-3 rounded-xl mb-4">
                <p className="text-xs opacity-70 font-bold uppercase">Conditions</p>
                <p className="font-bold">{patientInfo.conditions.join(' • ')}</p>
            </div>

            <div className="bg-white/10 p-3 rounded-xl">
                <p className="text-xs opacity-70 font-bold uppercase">Emergency Contact</p>
                <div className="flex justify-between items-center">
                    <p className="font-bold">{patientInfo.emergencyContact.name}</p>
                    <a href={`tel:${patientInfo.emergencyContact.phone}`} className="bg-white/20 px-3 py-1 rounded-lg text-sm font-bold hover:bg-white/30 transition-colors">
                        📞 Call
                    </a>
                </div>
            </div>
        </div>
    );
};

export default EmergencyAccessCard;

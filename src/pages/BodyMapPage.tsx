import React, { useState } from 'react';
import { InteractiveBodyMap } from '../components/InteractiveBodyMap';
import { useAuth } from '../components/Auth';
import { getPatientProfileById, DataService } from '../services/api';
import { PatientProfile } from '../types/index';
import { ICONS } from '../constants';

const BodyMapPage: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch Profile & Records
    React.useEffect(() => {
        if (user?.patientProfileId) {
            getPatientProfileById(user.patientProfileId).then(async (p) => {
                if (p) {
                    // Fetch full records if not present
                    try {
                        const records = await DataService.getMedicalRecords(p.id);
                        p.medicalRecords = records;
                    } catch (e) {
                        console.error("Failed records load", e);
                    }
                    setProfile(p);
                }
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div></div>;

    // Mock records for demo if empty
    const displayRecords = profile?.medicalRecords && profile.medicalRecords.length > 0 ? profile.medicalRecords : [
        { title: "Occasional Migraines", aiSummary: "Patient reports frequent headaches (Migraine) triggered by stress.", type: "Consultation" },
        { title: "Mild Arrhythmia", aiSummary: "ECG shows slight irregularities in heart rhythm. Monitoring recommended.", type: "Cardiology" },
        { title: "Sore Knee", aiSummary: "Left leg knee pain after running.", type: "Physio" }
    ];

    return (
        <div className="min-h-screen bg-background pt-20 pb-10">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between mb-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold uppercase tracking-widest mb-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            Patient Education
                        </div>
                        <h1 className="text-3xl md:text-5xl font-heading font-black text-text-main">Your Body Map</h1>
                    </div>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <div className="text-right">
                            <p className="text-sm font-bold text-text-main">Health Score</p>
                            <p className="text-2xl font-black text-green-500">92/100</p>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold border-4 border-white shadow-lg">
                            A+
                        </div>
                    </div>
                </div>

                <div className="glass-card rounded-[40px] p-6 md:p-10 border border-white/20 dark:border-slate-700 shadow-xl">
                    <InteractiveBodyMap medicalRecords={displayRecords} />
                </div>
            </div>
        </div>
    );
};

export default BodyMapPage;

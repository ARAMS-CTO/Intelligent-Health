import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { DataService, mockUsers } from '../services/api';
import { User, Role } from '../types/index';

const SpecialistsPage: React.FC = () => {
    const [specialists, setSpecialists] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app we'd fetch from API filtering by role
        // Simulating fetch
        setTimeout(() => {
            const doctors = mockUsers.filter(u => u.role === Role.Doctor || u.role === Role.Specialist);
            // If mockUsers is empty (it is in api.ts initial state), add some dummies
            if (doctors.length === 0) {
                setSpecialists([
                    { id: 'd1', name: 'Dr. Sarah Connor', role: Role.Specialist, email: 'sarah@clinic.com', level: 5, credits: 0, doctorProfileId: 'dp1' },
                    { id: 'd2', name: 'Dr. James Wilson', role: Role.Doctor, email: 'james@clinic.com', level: 3, credits: 0, doctorProfileId: 'dp2' },
                    { id: 'd3', name: 'Dr. Gregory House', role: Role.Specialist, email: 'house@clinic.com', level: 10, credits: 0, doctorProfileId: 'dp3' },
                    { id: 'd4', name: 'Dr. Meredith Grey', role: Role.Doctor, email: 'grey@clinic.com', level: 4, credits: 0, doctorProfileId: 'dp4' },
                ]);
            } else {
                setSpecialists(doctors);
            }
            setLoading(false);
        }, 800);
    }, []);

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4">
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-heading font-black text-text-main mb-4">
                        World-Class Specialists
                    </h1>
                    <p className="text-xl text-text-muted">
                        Connect with top-tier medical professionals from our global network.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {specialists.map(doc => (
                            <div key={doc.id} className="glass-card p-6 rounded-3xl border border-white/20 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300 group">
                                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mb-6 p-1">
                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl">
                                        👨‍⚕️
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-bold text-text-main">{doc.name}</h3>
                                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                        {doc.role}
                                    </div>
                                    <p className="text-sm text-text-muted">Cardiology • 12 Yrs Exp</p>

                                    <div className="pt-6">
                                        <button className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-main font-bold hover:bg-primary hover:text-white transition-colors">
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpecialistsPage;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { ICONS } from '../constants/index';
import Breadcrumbs from '../components/Breadcrumbs';
import { VitalsTracker, VitalsSummary } from '../components/VitalsTracker';
import { PrescriptionManager } from '../components/PrescriptionManager';
import { EmergencyAccessCard, MedicalIDCard } from '../components/EmergencyAccessCard';
import { InsuranceCard } from '../components/InsuranceCard';
import { FamilyHealthHub } from '../components/FamilyHealthHub';
import { AIHealthInsights } from '../components/AIHealthInsights';
import { CarePlanManager } from '../components/CarePlanManager';
import { HealthTimeline } from '../components/HealthTimeline';
import { MessagingCenter } from '../components/MessagingCenter';
import { TelemedicineQuickActions, StartConsultationButton } from '../components/VideoConsultation';
import { Odontogram } from '../components/dentistry/Odontogram';
import { DentalTimeline } from '../components/dentistry/DentalTimeline';
import { DataService } from '../services/api';
import { DentalChart, DentalProcedure } from '../types/index';
import { SpecializedHealthHub } from '../components/specialized/SpecializedHealthHub';
import { PrivacyShield } from '../components/patient/PrivacyShield';

type HealthHubSection = 'overview' | 'vitals' | 'medications' | 'insurance' | 'family' | 'insights' | 'careplan' | 'timeline' | 'messages' | 'emergency' | 'specialized' | 'privacy';

export const PatientHealthHub: React.FC = () => {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState<HealthHubSection>('overview');
    const [showMessaging, setShowMessaging] = useState(false);

    // Dental Data State
    const [dentalChart, setDentalChart] = useState<DentalChart | undefined>(undefined);
    const [dentalHistory, setDentalHistory] = useState<DentalProcedure[]>([]);
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

    const sections = [
        { key: 'overview', label: 'Overview', icon: '🏠' },
        { key: 'specialized', label: 'Body Map & Zones', icon: '🧘' },
        { key: 'vitals', label: 'My Vitals', icon: '📊' },
        { key: 'medications', label: 'Medications', icon: '💊' },
        { key: 'careplan', label: 'Care Plan', icon: '📋' },
        { key: 'insights', label: 'AI Insights', icon: '🤖' },
        { key: 'timeline', label: 'Timeline', icon: '📅' },
        { key: 'family', label: 'Family Hub', icon: '👨‍👩‍👧‍👦' },
        { key: 'insurance', label: 'Insurance', icon: '🏥' },
        { key: 'privacy', label: 'Privacy Shield', icon: '🛡️' },
        { key: 'messages', label: 'Messages', icon: '💬' },
        { key: 'emergency', label: 'Emergency', icon: '🚨' },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Breadcrumbs items={[
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'Health Hub' }
            ]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white">
                        Welcome back, {user?.name?.split(' ')[0] || 'Patient'}
                    </h1>
                    <p className="text-slate-500">Your complete health management hub</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2">
                        📞 Contact Support
                    </button>
                    <button className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2">
                        📅 Book Appointment
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide border-b border-slate-200 dark:border-slate-700">
                {sections.map(section => (
                    <button
                        key={section.key}
                        onClick={() => setActiveSection(section.key as HealthHubSection)}
                        className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeSection === section.key
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        <span>{section.icon}</span>
                        <span className="hidden sm:inline">{section.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[600px]">
                {/* Overview */}
                {activeSection === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Medical ID Card */}
                            <MedicalIDCard />

                            {/* Vitals Summary */}
                            <div className="glass-card p-6 rounded-2xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Today's Vitals</h3>
                                    <button
                                        onClick={() => setActiveSection('vitals')}
                                        className="text-primary text-sm font-bold hover:underline"
                                    >
                                        View All →
                                    </button>
                                </div>
                                <VitalsSummary />
                            </div>

                            {/* Upcoming Appointments */}
                            <div className="glass-card p-6 rounded-2xl">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Upcoming Appointments</h3>
                                <div className="space-y-3">
                                    {[
                                        { date: 'Jan 28', time: '10:00 AM', doctor: 'Dr. Sarah Smith', type: 'Follow-up', location: 'City Medical Center' },
                                        { date: 'Feb 5', time: '2:30 PM', doctor: 'Dr. Michael Chen', type: 'Cardiology', location: 'Heart Center' },
                                    ].map((appt, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            <div className="bg-primary/10 text-primary font-bold text-center rounded-xl px-3 py-2">
                                                <div className="text-xs">{appt.date.split(' ')[0]}</div>
                                                <div className="text-lg">{appt.date.split(' ')[1]}</div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800 dark:text-white">{appt.doctor}</p>
                                                <p className="text-sm text-slate-500">{appt.type} • {appt.time}</p>
                                                <p className="text-xs text-slate-400">📍 {appt.location}</p>
                                            </div>
                                            <StartConsultationButton
                                                doctorId="dr-smith"
                                                doctorName={appt.doctor}
                                                appointmentId={`appt-${idx}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <TelemedicineQuickActions />
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Medication Reminders */}
                            <div className="glass-card p-6 rounded-2xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Today's Medications</h3>
                                    <button
                                        onClick={() => setActiveSection('medications')}
                                        className="text-primary text-sm font-bold hover:underline"
                                    >
                                        View All →
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { name: 'Lisinopril 10mg', time: '8:00 AM', taken: true },
                                        { name: 'Metformin 500mg', time: '8:00 AM', taken: true },
                                        { name: 'Metformin 500mg', time: '6:00 PM', taken: false },
                                    ].map((med, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${med.taken ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                {med.taken ? '✓' : '💊'}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-bold text-sm ${med.taken ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                                                    {med.name}
                                                </p>
                                                <p className="text-xs text-slate-500">{med.time}</p>
                                            </div>
                                            {!med.taken && (
                                                <button className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-lg">
                                                    Take
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Care Plan Progress */}
                            <div className="glass-card p-6 rounded-2xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Care Plan</h3>
                                    <button
                                        onClick={() => setActiveSection('careplan')}
                                        className="text-primary text-sm font-bold hover:underline"
                                    >
                                        View All →
                                    </button>
                                </div>
                                <div className="text-center mb-4">
                                    <div className="text-4xl font-black text-primary">72%</div>
                                    <p className="text-sm text-slate-500">Overall Progress</p>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { name: 'Blood Sugar Control', progress: 65 },
                                        { name: 'BP Management', progress: 80 },
                                        { name: 'Weight Loss', progress: 40 },
                                    ].map((goal, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-600 dark:text-slate-400">{goal.name}</span>
                                                <span className="font-bold">{goal.progress}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full" style={{ width: `${goal.progress}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Emergency Card Mini */}
                            <EmergencyAccessCard />
                        </div>
                    </div>
                )}

                {/* Vitals Section */}
                {activeSection === 'vitals' && <VitalsTracker />}

                {/* Medications Section */}
                {activeSection === 'medications' && <PrescriptionManager />}

                {/* Specialized / Dental Section */}
                {activeSection === 'specialized' && <SpecializedHealthHub />}

                {/* Care Plan Section */}
                {activeSection === 'careplan' && <CarePlanManager />}

                {/* AI Insights Section */}
                {activeSection === 'insights' && <AIHealthInsights />}

                {/* Timeline Section */}
                {activeSection === 'timeline' && <HealthTimeline />}

                {/* Family Hub Section */}
                {activeSection === 'family' && <FamilyHealthHub />}

                {/* Insurance Section */}
                {activeSection === 'insurance' && <InsuranceCard />}

                {/* Privacy Shield Section */}
                {activeSection === 'privacy' && <PrivacyShield />}

                {/* Messages Section */}
                {
                    activeSection === 'messages' && (
                        <div className="glass-card p-6 rounded-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">💬 Messages</h2>
                                <button
                                    onClick={() => setShowMessaging(true)}
                                    className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors"
                                >
                                    Open Full Messaging
                                </button>
                            </div>
                            <p className="text-slate-500">Click the button above to open the full messaging center.</p>
                        </div>
                    )
                }

                {/* Messaging Modal */}
                <MessagingCenter isOpen={showMessaging} onClose={() => setShowMessaging(false)} />

                {/* Emergency Section */}
                {
                    activeSection === 'emergency' && (
                        <div className="max-w-2xl mx-auto">
                            <EmergencyAccessCard />
                            <div className="mt-6">
                                <MedicalIDCard />
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default PatientHealthHub;

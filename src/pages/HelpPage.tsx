import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const HelpPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'patient' | 'doctor' | 'admin'>('patient');
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            <Header
                onLoginClick={() => { }}
                onProfileClick={() => { }}
                onFeedbackClick={() => { }}
            />

            <main className="flex-grow container mx-auto px-4 py-8">
                {/* Hero Search */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">
                        How can we help you?
                    </h1>
                    <div className="max-w-2xl mx-auto relative">
                        <input
                            type="text"
                            placeholder="Search for answers (e.g., 'How to book appointment', 'Reset password')..."
                            className="w-full p-4 pl-12 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg focus:ring-2 focus:ring-primary outline-none text-lg bg-white dark:bg-slate-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
                    </div>
                </div>

                {/* Role Tabs */}
                <div className="flex justify-center gap-4 mb-8">
                    {(['patient', 'doctor', 'admin'] as const).map((role) => (
                        <button
                            key={role}
                            onClick={() => setActiveTab(role)}
                            className={`px-6 py-2 rounded-full font-bold capitalize transition-all ${activeTab === role
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 transform scale-105'
                                : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {role} Guide
                        </button>
                    ))}
                </div>

                {/* Help Content */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {activeTab === 'patient' && (
                        <>
                            <HelpCard icon="📅" title="Appointments" content="Learn how to book, reschedule, or cancel your visits with our specialists." />
                            <HelpCard icon="💊" title="Medications" content="Track your prescriptions and set smart reminders with our AI agent." />
                            <HelpCard icon="🤖" title="AI Assistant" content="Chat with our health AI for symptom checking and triage advice." />
                            <HelpCard icon="📁" title="Health Records" content="Access and download your medical history and lab results securely." />
                            <HelpCard icon="⌚" title="Device Sync" content="Connect your Fitbit or Apple Watch to track vitals automatically." />
                            <HelpCard icon="👨‍👩‍👧‍👦" title="Family Accounts" content="Manage profiles for your children or elderly parents." />
                        </>
                    )}

                    {activeTab === 'doctor' && (
                        <>
                            <HelpCard icon="🩺" title="Patient Profiles" content="View comprehensive patient histories and AI-summarized insights." />
                            <HelpCard icon="🧠" title="Clinical Decision Support" content="Use AI to analyze symptoms against global guidelines." />
                            <HelpCard icon="📝" title="Auto-Documentation" content="Generate SOAP notes automatically from voice consultations." />
                            <HelpCard icon="🔬" title="Lab Orders" content="Order labs and receive real-time integration results." />
                        </>
                    )}

                    {activeTab === 'admin' && (
                        <>
                            <HelpCard icon="👥" title="User Management" content="Add, remove, or modify staff and patient accounts." />
                            <HelpCard icon="📊" title="System Analytics" content="Monitor system usage, performance, and financial metrics." />
                            <HelpCard icon="⚙️" title="Configuration" content="Adjust AI settings, integration endpoints, and security rules." />
                        </>
                    )}
                </div>

                {/* FAQ Section */}
                <div className="mt-16 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <FAQQuestion q="Is my data secure?" a="Yes, we use enterprise-grade encryption and comply with HIPAA regulations." />
                        <FAQQuestion q="How do I reset my password?" a="Go to the login screen and click 'Forgot Password'. You will receive an email link." />
                        <FAQQuestion q="Can I video call my doctor?" a="Yes, Telehealth features are integrated directly into the appointment dashboard." />
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
};

const HelpCard: React.FC<{ icon: string, title: string, content: string }> = ({ icon, title, content }) => (
    <div className="glass-card p-6 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all cursor-pointer group">
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
        <h3 className="font-bold text-xl mb-2">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{content}</p>
    </div>
);

const FAQQuestion: React.FC<{ q: string, a: string }> = ({ q, a }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
        <h4 className="font-bold text-lg mb-2">{q}</h4>
        <p className="text-slate-500">{a}</p>
    </div>
);

export default HelpPage;

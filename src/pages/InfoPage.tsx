
import React from 'react';

const InfoPage: React.FC<{ type: 'about' | 'terms' | 'privacy' | 'security' }> = ({ type }) => {
    const content = {
        about: {
            title: "Our Mission",
            subtitle: "Democratizing Healthcare Intelligence",
            body: (
                <>
                    <p>Intelligent Health was founded on a simple premise: <strong>Healthcare should be proactive, not reactive.</strong></p>
                    <p>By preventing data silos and leveraging the power of Generative AI, we empower patients to take ownership of their health data while giving doctors the superpowers of instant, comprehensive analytics.</p>
                    <p>Our platform integrates disparate health records—from wearables to clinical history—into a unified Bio-Digital Twin, providing a holistic view of patient health that evolves in real-time.</p>
                </>
            )
        },
        terms: {
            title: "Terms of Service",
            subtitle: "User Agreement & Usage Policy",
            body: (
                <div className="space-y-6 text-sm md:text-base">
                    <p className="italic text-text-muted">Last Updated: January 2026</p>

                    <section>
                        <h3 className="text-xl font-bold text-text-main mb-2">1. Acceptance of Terms</h3>
                        <p>By accessing and using the Intelligent Health platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.</p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-text-main mb-2">2. Medical Disclaimer</h3>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50">
                            <p className="font-bold text-red-600 dark:text-red-400">NO MEDICAL ADVICE</p>
                            <p>Intelligent Health provides AI-driven data analysis and visualization for informational purposes only. The content is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-text-main mb-2">3. User Data & Privacy</h3>
                        <p>You retain full ownership of your health data. By connecting your data sources, you grant Intelligent Health a license to process and analyze this data solely for the purpose of providing you with our services. We do not sell your personal health data to third parties.</p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-text-main mb-2">4. AI & Accuracy</h3>
                        <p>Our services utilize advanced Artificial Intelligence (AI) and Machine Learning models. While we strive for high accuracy, AI predictions and summaries may contain errors. You acknowledge that reliance on any information provided by the AI is at your own risk.</p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-text-main mb-2">5. Account Security</h3>
                        <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
                    </section>
                </div>
            )
        },
        privacy: {
            title: "Privacy Policy",
            subtitle: "Your Data Rights & Protection Profile",
            body: (
                <div className="space-y-6 text-sm md:text-base">
                    <p className="italic text-text-muted">Last Updated: January 2026</p>

                    <section>
                        <h3 className="text-xl font-bold text-text-main mb-2">1. Introduction</h3>
                        <p>At Intelligent Health, your privacy is paramount. We believe that health data is the most sensitive personal information, and we treat it with the highest level of security and respect. This policy outlines how we collect, use, and protect your information.</p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-text-main mb-2">2. Information We Collect</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Personal Identity:</strong> Name, contact details, and authentication credentials.</li>
                            <li><strong>Health Records:</strong> Medical history, lab results, imaging, and prescriptions you choose to upload or link.</li>
                            <li><strong>Wearable Data:</strong> Vitals (heart rate, sleep, activity) from connected devices like Apple Watch, Oura, or Fitbit.</li>
                            <li><strong>Usage Data:</strong> Interactions with our platform to improve service performance.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-text-main mb-2">3. How We Use Your Data</h3>
                        <p>We use your data exclusively to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Generate your Bio-Digital Twin and health visualizations.</li>
                            <li>Provide AI-driven health insights and summaries.</li>
                            <li>Facilitate secure sharing with your authorized healthcare providers.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-text-main mb-2">4. Zero-Knowledge & Security</h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex gap-4">
                            <div className="text-2xl">🛡️</div>
                            <div>
                                <p className="font-bold text-blue-700 dark:text-blue-300">Advanced Encryption</p>
                                <p>We employ Zero-Knowledge Proofs (ZKP) for identity verification and Concordium blockchain technology to ensure data integrity. Your raw health data is encrypted at rest and in transit using AES-256 standards.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-text-main mb-2">5. Your Rights</h3>
                        <p>Under GDPR and HIPAA regulations, you have the right to access, correct, delete, or export your personal data at any time. You can manage these preferences directly in your user settings.</p>
                    </section>
                </div>
            )
        },
        security: {
            title: "Security Audit",
            subtitle: "Transparency Report",
            body: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-bold text-text-muted uppercase">Last Audit Date</p>
                            <p className="text-2xl font-black text-text-main">January 15, 2026</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-bold text-text-muted uppercase">Compliance Status</p>
                            <p className="text-2xl font-black text-green-500 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                                PASSED
                            </p>
                        </div>
                    </div>

                    <section>
                        <h3 className="text-xl font-bold text-text-main mb-2">Auditor</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">CS</div>
                            <div>
                                <p className="font-bold text-lg">CyberSec Global Solutions</p>
                                <p className="text-sm text-text-muted">Certified HIPAA & ISO/IEC 27001 Auditor</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-text-main mb-2">Key Findings</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 mt-1">✓</span>
                                <span>End-to-End Encryption verified for all patient records.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 mt-1">✓</span>
                                <span>Database access controls meet strict least-privilege standards.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 mt-1">✓</span>
                                <span>Blockchain ledger integrity confirmed for audit logs.</span>
                            </li>
                        </ul>
                    </section>
                </div>
            )
        }
    };

    const data = content[type];

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4 animate-fade-in">
            <div className="container mx-auto max-w-4xl">
                <div className="glass-card p-8 md:p-16 rounded-[40px] border border-white/20 dark:border-slate-700 shadow-2xl relative overflow-hidden">
                    {/* Decorative Blob */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-5xl font-heading font-black text-text-main mb-2">{data.title}</h1>
                        <p className="text-sm md:text-lg text-primary font-bold tracking-widest uppercase mb-10 border-b border-primary/20 pb-6 inline-block">
                            {data.subtitle}
                        </p>

                        <div className="prose prose-lg dark:prose-invert text-text-muted max-w-none">
                            {data.body}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoPage;

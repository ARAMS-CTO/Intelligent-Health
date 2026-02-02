import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';
import { useAuth } from '../components/Auth';
import { showToast } from '../components/Toast';
import { VIP_SERVICES, GENETICS_KNOWLEDGE, BLOCKCHAIN_IDENTITY } from '../config/medicalKnowledgeBase';
import { SpecialistAgentChat } from '../components/specialized/SpecialistAgentChat';
import { WorldIDVerification } from '../components/WorldIDVerification';

const VIPLongevityPage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [showGeneticsChat, setShowGeneticsChat] = useState(false);
    const [worldIdVerified, setWorldIdVerified] = useState(false);

    const handleEnroll = (serviceId: string) => {
        showToast.success(`Enrollment request submitted for ${serviceId}. Our VIP team will contact you within 24 hours.`);
    };

    const handleWorldIDVerified = (worldId: string) => {
        setWorldIdVerified(true);
        console.log("User verified with World ID:", worldId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pt-20 pb-10">
            {/* Hero Section */}
            <section className="container mx-auto px-4 mb-20 text-center relative">
                {/* Glowing Orbs Background */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 blur-[150px] rounded-full"></div>
                <div className="absolute top-20 right-1/4 w-80 h-80 bg-cyan-500/15 blur-[120px] rounded-full"></div>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        VIP Exclusive Services
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-heading font-black text-white tracking-tighter mb-6">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
                            Longevity & Genetics
                        </span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8">
                        Unlock the secrets of your DNA. Extend your healthspan.
                        Prepare for the future of consciousness preservation.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={() => setShowGeneticsChat(true)}
                            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-2xl shadow-2xl shadow-violet-500/30 transition-all hover:-translate-y-1"
                        >
                            🧬 Consult Genetics AI
                        </button>
                        <a href="#services" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition-all">
                            Explore Services
                        </a>
                    </div>
                </div>
            </section>

            {/* Genetics AI Chat Modal */}
            {showGeneticsChat && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-2xl">
                        <button
                            onClick={() => setShowGeneticsChat(false)}
                            className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                            ✕
                        </button>
                        <div className="bg-slate-900 rounded-3xl border border-violet-500/30 overflow-hidden shadow-2xl shadow-violet-500/20">
                            <div className="p-4 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border-b border-violet-500/20">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <span className="text-3xl">🧬</span>
                                    Genetics & Longevity AI Specialist
                                </h3>
                                <p className="text-sm text-violet-300 mt-1">
                                    Ask about hereditary patterns, pharmacogenomics, or longevity interventions
                                </p>
                            </div>
                            <SpecialistAgentChat
                                zone="genetics"
                                contextId="longevity_vip"
                                className="h-[500px] bg-slate-900"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* VIP Services Grid */}
            <section id="services" className="container mx-auto px-4 mb-20">
                <h2 className="text-3xl font-bold text-white text-center mb-12">Premium Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Genetic Analysis */}
                    <div className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-violet-500/20 p-8 hover:border-violet-500/50 transition-all hover:shadow-2xl hover:shadow-violet-500/10">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-violet-500/30">
                            🧬
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{VIP_SERVICES.GENETIC_ANALYSIS.name}</h3>
                        <p className="text-violet-300 text-sm mb-6">{VIP_SERVICES.GENETIC_ANALYSIS.price}</p>
                        <ul className="space-y-3 mb-8">
                            {VIP_SERVICES.GENETIC_ANALYSIS.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                    <span className="text-violet-400 mt-0.5">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleEnroll('genetics')}
                            className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all"
                        >
                            Request Enrollment
                        </button>
                    </div>

                    {/* Longevity Program */}
                    <div className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-8 hover:border-cyan-500/50 transition-all hover:shadow-2xl hover:shadow-cyan-500/10">
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-cyan-500/30">
                            ⏳
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{VIP_SERVICES.LONGEVITY_PROGRAM.name}</h3>
                        <p className="text-cyan-300 text-sm mb-6">{VIP_SERVICES.LONGEVITY_PROGRAM.price}</p>
                        <ul className="space-y-3 mb-8">
                            {VIP_SERVICES.LONGEVITY_PROGRAM.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                    <span className="text-cyan-400 mt-0.5">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleEnroll('longevity')}
                            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all"
                        >
                            Request Enrollment
                        </button>
                    </div>
                </div>
            </section>

            {/* 10-Year Roadmap */}
            <section className="container mx-auto px-4 mb-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">The 10-Year Vision</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        From comprehensive biometrics to consciousness preservation.
                        The future of human health and memory.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto relative">
                    {/* Timeline Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 via-fuchsia-500 to-cyan-500 transform -translate-x-1/2 hidden md:block"></div>

                    <div className="space-y-12">
                        {VIP_SERVICES.FUTURE_ROADMAP.phases.map((phase, index) => (
                            <div key={phase.year} className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                                    <div className={`inline-block bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 hover:border-violet-500/50 transition-all`}>
                                        <div className="text-sm font-mono text-violet-400 mb-2">{phase.year}</div>
                                        <h3 className="text-xl font-bold text-white mb-4">{phase.title}</h3>
                                        <ul className="space-y-2 text-sm text-slate-400">
                                            {phase.features.map((f, i) => (
                                                <li key={i}>• {f}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full border-4 border-slate-900 z-10 shadow-lg shadow-violet-500/50"></div>
                                <div className="flex-1 hidden md:block"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Orb / World ID Verification - Interactive Component */}
            <section className="container mx-auto px-4 mb-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">Biometric Verification</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Secure your identity with Orb iris verification. Link your genetic data on-chain.
                    </p>
                </div>
                <div className="max-w-lg mx-auto">
                    <WorldIDVerification
                        onVerified={handleWorldIDVerified}
                        showGeneticLink={true}
                    />
                </div>
            </section>

            {/* Genetic Identity Token */}
            <section className="container mx-auto px-4 mb-20">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">
                        Your Genetic Identity, Secured on Chain
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto mb-12">
                        Own your genomic data. Control who accesses it.
                        Participate in research on your terms and earn from your contributions.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {BLOCKCHAIN_IDENTITY.GENETIC_NFT.features.map((feature, i) => (
                            <div key={i} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
                                <div className="text-3xl mb-4">
                                    {['🔒', '📝', '💰', '🔬'][i]}
                                </div>
                                <p className="text-sm text-slate-300">{feature}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-cyan-600/20 rounded-3xl p-12 border border-violet-500/30">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to Begin Your Journey?</h2>
                    <p className="text-slate-400 mb-8">
                        Join our exclusive VIP program and gain access to cutting-edge longevity science.
                    </p>
                    <button
                        onClick={() => showToast.success("Our VIP concierge will contact you within 24 hours.")}
                        className="px-12 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-2xl shadow-2xl shadow-violet-500/30 transition-all hover:-translate-y-1 text-lg"
                    >
                        Contact VIP Concierge
                    </button>
                </div>
            </section>
        </div>
    );
};

export default VIPLongevityPage;

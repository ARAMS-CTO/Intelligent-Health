import React from 'react';

const Marketplace: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
            {/* Hero Section */}
            <div className="container mx-auto px-6 py-20">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 px-4 py-2 rounded-full mb-6">
                        <span className="text-indigo-600 dark:text-indigo-400">🔧</span>
                        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                            Coming Soon
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
                        Health Device Marketplace
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                        Our mission is to heal humans faster, coordinate healthcare stakeholders,
                        improve health support, and optimize costs for everyone.
                    </p>
                </div>

                {/* Mission Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-16">
                    <div className="glass-card p-6 text-center hover:scale-105 transition-transform">
                        <div className="w-12 h-12 text-4xl mx-auto mb-4">❤️</div>
                        <h3 className="font-semibold text-lg mb-2">Heal Faster</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Accelerate diagnosis and treatment with AI-powered insights
                        </p>
                    </div>

                    <div className="glass-card p-6 text-center hover:scale-105 transition-transform">
                        <div className="w-12 h-12 text-4xl mx-auto mb-4">👥</div>
                        <h3 className="font-semibold text-lg mb-2">Coordinate</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Seamlessly connect doctors, patients, and healthcare providers
                        </p>
                    </div>

                    <div className="glass-card p-6 text-center hover:scale-105 transition-transform">
                        <div className="w-12 h-12 text-4xl mx-auto mb-4">🛡️</div>
                        <h3 className="font-semibold text-lg mb-2">Improve Support</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Enhance patient care with continuous monitoring and feedback
                        </p>
                    </div>

                    <div className="glass-card p-6 text-center hover:scale-105 transition-transform">
                        <div className="w-12 h-12 text-4xl mx-auto mb-4">📈</div>
                        <h3 className="font-semibold text-lg mb-2">Optimize Costs</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Reduce unnecessary spending through data-driven decisions
                        </p>
                    </div>
                </div>

                {/* Future Vision Section */}
                <div className="max-w-4xl mx-auto mt-20 glass-card p-12">
                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-3xl">📡</span>
                        <h2 className="text-3xl font-bold">The Future of Connected Health</h2>
                    </div>

                    <div className="space-y-6 text-slate-700 dark:text-slate-300">
                        <p className="text-lg leading-relaxed">
                            When we reach <span className="font-bold text-indigo-600 dark:text-indigo-400">100,000 active users</span>,
                            our AI will have learned enough patterns to recommend intelligent health services and certified devices.
                        </p>

                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border-l-4 border-indigo-500">
                            <h3 className="font-semibold text-lg mb-3">What We'll Offer:</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
                                    <span><strong>Certified Health Monitoring Devices</strong> - Blood pressure monitors, glucometers, smart scales</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
                                    <span><strong>Data Capture Hardware</strong> - Wearables and sensors that automatically sync to your health profile</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
                                    <span><strong>Communication Devices</strong> - Telemedicine kits for remote consultations</span>
                                </li>
                            </ul>
                        </div>

                        <p className="text-lg leading-relaxed">
                            All devices will seamlessly integrate with our platform through our <strong>Hardware Partner SDK</strong>,
                            ensuring secure data transfer, automatic syncing, and real-time health insights.
                        </p>
                    </div>
                </div>

                {/* Hardware Partner CTA */}
                <div className="max-w-4xl mx-auto mt-12 glass-card p-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-2 border-indigo-200 dark:border-indigo-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Hardware Partner?</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Integrate your devices with our platform using our SDK
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/developer-portal'}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                        >
                            Get SDK Access
                        </button>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="max-w-4xl mx-auto mt-12 glass-card p-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Platform Growth</h3>
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {/* This would be dynamic in production */}
                            Loading...
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                            style={{ width: '12%' }}></div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Marketplace unlocks at 100,000 users
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Marketplace;

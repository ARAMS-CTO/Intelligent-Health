import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const RoadmapPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            <Header
                onLoginClick={() => { }}
                onProfileClick={() => { }}
                onFeedbackClick={() => { }}
            />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="text-center mb-16">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-bold text-xs uppercase tracking-wider">Vision 2026</span>
                    <h1 className="text-5xl font-black mt-4 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Product Roadmap
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                        We are building the future of healthcare. Here is our plan to deliver intelligent, accessible, and secure care this year.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-12 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-slate-200 dark:to-slate-800 hidden md:block"></div>

                    {/* Q1 */}
                    <RoadmapItem
                        quarter="Q1 2026"
                        title="Foundation & Pediatrics"
                        status="in-progress"
                        color="bg-blue-500"
                        items={[
                            "Launch Pediatrics Dashboard with Growth Tracking",
                            "Implement basic RAG for Specialist Agents",
                            "Stabilize Core Performance & Security",
                            "Initial Cost Transparency Tools"
                        ]}
                    />

                    {/* Q2 */}
                    <RoadmapItem
                        quarter="Q2 2026"
                        title="Specialized Intelligence"
                        status="planned"
                        color="bg-purple-500"
                        items={[
                            "Cardiology & Neurology Deep Dive Integrations",
                            "Advanced Voice AI for Triage & Notes",
                            "Enhanced Multi-User Collaboration Tools",
                            "Mobile App Beta Release"
                        ]}
                    />

                    {/* Q3 */}
                    <RoadmapItem
                        quarter="Q3 2026"
                        title="Hyper-Connectivity"
                        status="planned"
                        color="bg-indigo-500"
                        items={[
                            "IoT Integration (Apple Watch, Fitbit, Medical Devices)",
                            "Telehealth 2.0 with Real-time AI Analysis",
                            "Remote Patient Monitoring Dashboard",
                            "Partnership API Marketplace"
                        ]}
                    />

                    {/* Q4 */}
                    <RoadmapItem
                        quarter="Q4 2026"
                        title="Trust & Global Scale"
                        status="planned"
                        color="bg-green-500"
                        items={[
                            "Concordium Blockchain Mainnet for Records",
                            "Automated Global Compliance (GDPR, HIPAA)",
                            "Federated Learning for AI Models",
                            "Enterprise White-label Solutions"
                        ]}
                    />
                </div>
            </main>
            <Footer />
        </div>
    );
};

const RoadmapItem: React.FC<{ quarter: string, title: string, items: string[], status: 'done' | 'in-progress' | 'planned', color: string }> = ({ quarter, title, items, status, color }) => (
    <div className="relative pl-0 md:pl-24 group">
        {/* Dot */}
        <div className={`hidden md:flex absolute left-[27px] top-6 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 ${color} shadow-lg z-10 transition-transform group-hover:scale-125`}></div>

        <div className="glass-card p-8 rounded-2xl relative overflow-hidden border-l-4 border-l-transparent md:border-l-0 hover:shadow-xl transition-all">
            <div className={`absolute top-0 left-0 bottom-0 w-2 md:hidden ${color}`}></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
                <div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold text-white mb-2 ${color} opacity-90`}>{quarter}</span>
                    <h3 className="text-2xl font-bold">{title}</h3>
                </div>
                <div>
                    {status === 'in-progress' && <span className="text-blue-500 font-bold animate-pulse">Running Now</span>}
                </div>
            </div>

            <ul className="space-y-3">
                {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0"></span>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

export default RoadmapPage;

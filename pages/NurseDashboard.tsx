import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService, updateCaseStatus, GeminiService } from '../services/api';
import { ICONS } from '../constants/index';
import { Case, User } from '../types/index';
import Breadcrumbs from '../components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';

const NurseDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myDoctors, setMyDoctors] = useState<User[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            // In a real app, we would fetch only linked doctors
            const allUsers = await DataService.getUsers();
            const doctors = allUsers.filter(u => u.role === 'Doctor');
            setMyDoctors(doctors);

            const allCases = await DataService.getCases();
            setCases(allCases);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredCases = cases.filter(c => {
        if (selectedDoctorId !== 'all' && c.specialistId !== selectedDoctorId) return false;
        // Also strictly show Open/Under Review or Assigned to that doctor
        return true;
    });

    const triageCases = filteredCases.filter(c => c.status === 'Open' || !c.specialistId);
    const pendingOrdersCases = filteredCases.filter(c => c.status === 'Under Review'); // Simplified logic for pending

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen p-8">
            <div className="container mx-auto">
                <Breadcrumbs items={[{ label: 'Nurse Station' }]} />
                <div className="flex justify-between items-center mb-8 mt-4">
                    <h1 className="text-4xl font-heading font-black text-text-main">
                        Nurse <span className="text-indigo-500">Station</span>
                    </h1>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold uppercase text-text-muted px-2">Filter by Dr:</span>
                        <select
                            className="bg-transparent font-bold text-sm focus:outline-none"
                            value={selectedDoctorId}
                            onChange={(e) => setSelectedDoctorId(e.target.value)}
                        >
                            <option value="all">All My Doctors</option>
                            {myDoctors.map(d => (
                                <option key={d.id} value={d.id}>Dr. {d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Triage Queue */}
                    <div className="lg:col-span-2 space-y-6">
                        <section>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="p-2 bg-red-100 text-red-600 rounded-lg">{ICONS.clock}</span>
                                Triage Queue / Unassigned
                            </h2>
                            <div className="space-y-4">
                                {triageCases.length === 0 && <p className="text-gray-400 italic">No cases needing triage.</p>}
                                {triageCases.map(c => (
                                    <div key={c.id} onClick={() => navigate(`/case/${c.id}`)} className="glass-card p-5 rounded-xl hover:shadow-lg cursor-pointer transition-all border-l-4 border-red-500 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg">{c.title}</h3>
                                            <p className="text-sm text-gray-500">{c.complaint.substring(0, 60)}...</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{c.patientProfile.age}Y {c.patientProfile.sex}</span>
                                                <span className="text-[10px] font-bold bg-red-50 text-red-500 px-2 py-1 rounded">Needs Triage</span>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 text-sm">
                                            Start Intake
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">{ICONS.document}</span>
                                Active Cases (Assigned)
                            </h2>
                            <div className="space-y-4">
                                {pendingOrdersCases.map(c => (
                                    <div key={c.id} onClick={() => navigate(`/case/${c.id}`)} className="glass-card p-5 rounded-xl hover:shadow-lg cursor-pointer transition-all flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg">{c.title}</h3>
                                            <p className="text-sm text-gray-500">Dr. {myDoctors.find(u => u.id === c.specialistId)?.name || 'Unknown'}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-xs font-bold text-green-500 uppercase tracking-wider">{c.status}</span>
                                            <span className="text-[10px] text-gray-400">Updated {new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Quick Actions & Stats */}
                    <div className="space-y-8">
                        {/* Interactive Nurse AI Assistant */}
                        <NurseAssistantChat onRefresh={loadData} />

                        <div className="glass-card p-6 rounded-2xl">
                            <h3 className="font-bold text-lg mb-4">Pending Orders <span className="text-xs text-gray-400 font-normal">(Coming Soon)</span></h3>
                            {user?.role === 'Admin' ? (
                                <ul className="space-y-3 opacity-75">
                                    <li className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 relative">
                                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">Mock</div>
                                        <input type="checkbox" className="rounded text-indigo-500 focus:ring-indigo-500" disabled />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">CBC & BMP</p>
                                            <p className="text-xs text-gray-500">Case #1024 - Urgent</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300">
                                        <input type="checkbox" className="rounded text-indigo-500 focus:ring-indigo-500" disabled />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">Chest X-Ray</p>
                                            <p className="text-xs text-gray-500">Case #1029</p>
                                        </div>
                                    </li>
                                </ul>
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-sm italic border border-dashed border-gray-200 rounded-xl">
                                    Lab Integrations & Ordering System<br />Under Development
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

const NurseAssistantChat = ({ onRefresh }: { onRefresh?: () => void }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, isHtml?: boolean }[]>([
        { role: 'assistant', content: "Hi! I'm connected to the Hospital Agent Bus. I can help Triage patients or Check Interactions." }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsProcessing(true);

        try {
            // Updated to use the real Backend Orchestrator
            const response = await GeminiService.agentChat(userMsg);

            if (response.result && response.routed_to === 'triage') {
                // Enhanced Triage Display
                const results = response.result.details || [];
                const count = response.result.triaged_count || results.length;

                let summaryHtml = `Triaged ${count} cases:<br/><ul class='mt-2 space-y-2'>`;
                if (Array.isArray(results)) {
                    results.forEach((r: any) => {
                        const color = r.urgency >= 4 ? 'text-red-600 font-bold' : (r.urgency === 3 ? 'text-yellow-600' : 'text-green-600');
                        summaryHtml += `<li class='text-xs bg-gray-50 p-2 rounded'>
                             <span class='${color}'>Level ${r.urgency}</span>: Case ${r.id.substring(0, 6)}...<br/>
                             <span class='text-gray-500'>${r.rationale}</span>
                         </li>`;
                    });
                }
                summaryHtml += "</ul>";

                setMessages(prev => [...prev, { role: 'assistant', content: summaryHtml, isHtml: true }]);

                // Trigger Refresh of Dashboard Cases
                if (onRefresh && count > 0) {
                    onRefresh();
                }

            } else if (response.result && response.routed_to === 'check_drug_interaction') {
                // Render Drug Interaction
                setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
            }

        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to Agent Bus. Please try again." }]);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl flex flex-col h-[400px]">
            <h3 className="font-bold text-lg mb-2 border-b border-white/20 pb-2 flex items-center gap-2">
                {ICONS.ai} Nurse AI Assistant <span className="text-[10px] bg-white/20 px-2 rounded-full">MCP Active</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-thin scrollbar-thumb-white/20">
                {messages.map((m: any, i) => (
                    <div key={i} className={`p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-white/20 ml-8' : 'bg-black/20 mr-8'}`}>
                        {m.isHtml ? <div dangerouslySetInnerHTML={{ __html: m.content }} /> : m.content}
                    </div>
                ))}
                {isProcessing && <div className="text-xs animate-pulse opacity-75">Routing...</div>}
            </div>
            <div className="flex gap-2">
                <input
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:bg-white/20 transition-all"
                    placeholder="Ask to triage or check..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} disabled={isProcessing} className="p-2 bg-white text-indigo-600 rounded-lg font-bold hover:bg-indigo-50 transition-colors">
                    {ICONS.send}
                </button>
            </div>
        </div>
    );
};

export default NurseDashboard;

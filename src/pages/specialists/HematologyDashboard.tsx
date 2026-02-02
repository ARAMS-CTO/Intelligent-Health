import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
import { SpecialistAgentChat } from '../../components/specialized/SpecialistAgentChat';
import { medicalKnowledge } from '../../services/MedicalKnowledgeService';
import { showToast } from '../../components/Toast';


interface AnticoagPatient {
    id: number;
    name: string;
    drug: string;
    indication: string;
    lastCheck: string;
    status: string;
}

const HematologyDashboard: React.FC = () => {
    const { t } = useTranslation();
    const [selectedCondition, setSelectedCondition] = useState<string>("dvt_pe");
    const [anticoagRef, setAnticoagRef] = useState<any>(null);
    const [dvtCondition, setDvtCondition] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [patients, setPatients] = useState<AnticoagPatient[]>([]);

    // Condition options for blood clot specialization
    const conditionOptions = [
        { id: 'dvt_pe', label: 'DVT / PE', icon: '🩸', color: 'red' },
        { id: 'anticoagulation', label: 'Anticoagulation', icon: '💊', color: 'blue' },
        { id: 'thrombophilia', label: 'Thrombophilia Workup', icon: '🧬', color: 'purple' },
        { id: 'bleeding', label: 'Bleeding Disorders', icon: '🔴', color: 'orange' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load anticoagulation quick reference
            const anticoagData = await medicalKnowledge.getAnticoagulationQuickReference();
            setAnticoagRef(anticoagData);

            // Try to load DVT condition
            try {
                const dvt = await medicalKnowledge.getCondition('dvt');
                setDvtCondition(dvt);
            } catch (e) {
                console.log('DVT condition not in knowledge base yet');
            }
        } catch (error) {
            console.error('Failed to load medical knowledge:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Note: Patient loading is placeholder - in production, connect to real patient API
    const loadPatients = async () => {
        try {
            // Try to load real patient data from the API
            const response = await fetch('/api/patients?department=hematology&limit=10', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.patients) {
                    const mappedPatients = data.patients.map((p: any) => ({
                        id: p.id,
                        name: `${p.first_name} ${p.last_name?.charAt(0)}.`,
                        drug: p.current_medications?.[0] || 'Unknown',
                        indication: p.conditions?.[0] || 'Unknown',
                        lastCheck: p.last_visit || 'Not available',
                        status: 'active'
                    }));
                    setPatients(mappedPatients);
                }
            }
        } catch (error) {
            // If no real data, use placeholder
            console.log('Using placeholder patient data');
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-400">
                        Hematology Dept
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Thrombosis Management & Anticoagulation
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-primary">
                        {ICONS.plus} New DVT Workup
                    </button>
                    <button className="btn-secondary">
                        INR Clinic
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-2xl border-l-4 border-red-500">
                    <div className="text-sm text-text-secondary">Active DVT Cases</div>
                    <div className="text-2xl font-bold text-red-500">7</div>
                </div>
                <div className="glass-card p-4 rounded-2xl border-l-4 border-orange-500">
                    <div className="text-sm text-text-secondary">PE Alerts Today</div>
                    <div className="text-2xl font-bold text-orange-500">2</div>
                </div>
                <div className="glass-card p-4 rounded-2xl border-l-4 border-blue-500">
                    <div className="text-sm text-text-secondary">On Anticoagulation</div>
                    <div className="text-2xl font-bold text-blue-500">45</div>
                </div>
                <div className="glass-card p-4 rounded-2xl border-l-4 border-green-500">
                    <div className="text-sm text-text-secondary">INR in Range</div>
                    <div className="text-2xl font-bold text-green-500">89%</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel - Anticoagulation Reference */}
                <div className="glass-card p-6 rounded-3xl space-y-6">
                    <div>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            💊 Anticoagulation Quick Reference
                        </h3>

                        {isLoading ? (
                            <div className="text-center py-8 text-slate-500">Loading...</div>
                        ) : anticoagRef ? (
                            <div className="space-y-4">
                                {/* DOACs */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 rounded-xl border border-blue-500/20">
                                        <div className="font-bold text-blue-600 dark:text-blue-400">Apixaban (Eliquis)</div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            {anticoagRef.doacs?.apixaban?.dosing || '5mg BID'}
                                        </div>
                                        <div className="text-xs text-blue-500 mt-2">
                                            Reversal: {anticoagRef.doacs?.apixaban?.reversal}
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 rounded-xl border border-purple-500/20">
                                        <div className="font-bold text-purple-600 dark:text-purple-400">Rivaroxaban (Xarelto)</div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            {anticoagRef.doacs?.rivaroxaban?.dosing || '20mg daily'}
                                        </div>
                                        <div className="text-xs text-purple-500 mt-2">
                                            {anticoagRef.doacs?.rivaroxaban?.note}
                                        </div>
                                    </div>
                                </div>

                                {/* Warfarin */}
                                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-4 rounded-xl border border-amber-500/20">
                                    <div className="flex justify-between items-center">
                                        <div className="font-bold text-amber-600 dark:text-amber-400">Warfarin (Coumadin)</div>
                                        <span className="text-sm px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-700 dark:text-amber-300">
                                            Target INR: {anticoagRef.warfarin?.target_inr}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                        <strong>Monitoring:</strong> {anticoagRef.warfarin?.monitoring}
                                    </div>
                                    <div className="text-xs text-amber-500 mt-2">
                                        <strong>Key Interactions:</strong> {anticoagRef.warfarin?.key_interactions?.join(', ')}
                                    </div>
                                </div>

                                {/* Indications */}
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <div className="font-bold text-sm text-slate-600 dark:text-slate-400 mb-2">Common Indications:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {anticoagRef.indications?.map((ind: string, idx: number) => (
                                            <span key={idx} className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                {ind}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                Unable to load anticoagulation reference
                            </div>
                        )}
                    </div>

                    {/* Condition Context Selector */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-sm text-slate-500 mb-3">AI Focus Area:</h4>
                        <div className="flex flex-wrap gap-2">
                            {conditionOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setSelectedCondition(opt.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCondition === opt.id
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {opt.icon} {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel - AI Specialist */}
                <div className="h-full min-h-[600px]">
                    <SpecialistAgentChat
                        zone="hematology"
                        contextId={selectedCondition}
                        className="h-full shadow-lg"
                        key={selectedCondition}
                    />
                </div>
            </div>

            {/* Reversal Agents Quick Reference */}
            <div className="glass-card p-6 rounded-3xl">
                <h3 className="text-xl font-bold mb-4">⚡ Quick Reference: Reversal Agents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="font-bold text-blue-700 dark:text-blue-300">Eliquis/Xarelto (Xa Inhibitors)</div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                            <strong>Andexanet alfa (Andexxa)</strong>
                            <div className="text-xs mt-1">400mg bolus → 4mg/min infusion (low dose) or 800mg → 8mg/min (high dose)</div>
                        </div>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                        <div className="font-bold text-amber-700 dark:text-amber-300">Warfarin</div>
                        <div className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                            <strong>Vitamin K (Phytonadione)</strong> + <strong>4-Factor PCC</strong>
                            <div className="text-xs mt-1">PCC dose based on INR (25-50 units/kg)</div>
                        </div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="font-bold text-purple-700 dark:text-purple-300">Pradaxa (Dabigatran)</div>
                        <div className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                            <strong>Idarucizumab (Praxbind)</strong>
                            <div className="text-xs mt-1">5g IV (2 x 2.5g vials)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HematologyDashboard;

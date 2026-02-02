import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
import { SpecialistAgentChat } from '../../components/specialized/SpecialistAgentChat';

interface CancerType {
    id: string;
    name: string;
    icon: string;
    color: string;
    biomarkers: string[];
    keyTreatments: string[];
}

const OncologyDashboard: React.FC = () => {
    const { t } = useTranslation();
    const [selectedCancer, setSelectedCancer] = useState<string>("lung");

    // Cancer type definitions with key information
    const cancerTypes: CancerType[] = [
        {
            id: 'lung',
            name: 'Lung',
            icon: '🫁',
            color: 'slate',
            biomarkers: ['EGFR', 'ALK', 'ROS1', 'PD-L1', 'KRAS G12C'],
            keyTreatments: ['Surgery', 'Chemotherapy', 'TKIs', 'Immunotherapy']
        },
        {
            id: 'breast',
            name: 'Breast',
            icon: '🎀',
            color: 'pink',
            biomarkers: ['ER', 'PR', 'HER2', 'BRCA1/2', 'Ki-67'],
            keyTreatments: ['Surgery', 'Radiation', 'Hormonal', 'CDK4/6i']
        },
        {
            id: 'colorectal',
            name: 'Colorectal',
            icon: '🔵',
            color: 'blue',
            biomarkers: ['MSI-H/dMMR', 'KRAS', 'NRAS', 'BRAF V600E'],
            keyTreatments: ['Surgery', 'FOLFOX', 'FOLFIRI', 'Anti-EGFR', 'ICI']
        },
        {
            id: 'prostate',
            name: 'Prostate',
            icon: '🔷',
            color: 'indigo',
            biomarkers: ['PSA', 'Gleason Score', 'BRCA2', 'ATM'],
            keyTreatments: ['Active Surveillance', 'Surgery', 'ADT', 'PARPi']
        },
        {
            id: 'pancreatic',
            name: 'Pancreatic',
            icon: '⚠️',
            color: 'amber',
            biomarkers: ['CA 19-9', 'KRAS', 'BRCA1/2', 'SMAD4'],
            keyTreatments: ['Whipple', 'FOLFIRINOX', 'Gem/nab-P', 'BRCA+PARPi']
        },
        {
            id: 'melanoma',
            name: 'Melanoma',
            icon: '🟤',
            color: 'orange',
            biomarkers: ['BRAF V600E', 'PD-L1', 'LDH', 'NRAS'],
            keyTreatments: ['Surgery', 'BRAF/MEKi', 'Anti-PD1', 'Anti-CTLA4']
        },
        {
            id: 'brain',
            name: 'Brain',
            icon: '🧠',
            color: 'purple',
            biomarkers: ['IDH1/2', 'MGMT', '1p/19q', 'EGFR vIII'],
            keyTreatments: ['Surgery', 'TMZ', 'Radiation', 'TTFields']
        },
        {
            id: 'leukemia',
            name: 'Leukemia',
            icon: '🩸',
            color: 'red',
            biomarkers: ['BCR-ABL', 'FLT3', 'NPM1', 'Philadelphia+'],
            keyTreatments: ['Chemo', 'TKIs', 'SCT', 'CAR-T']
        }
    ];

    const selectedCancerData = cancerTypes.find(c => c.id === selectedCancer);

    // Mock tumor board cases
    const tumorBoardCases = [
        { id: 1, name: "Case #2024-089", type: "NSCLC", stage: "IIIA", biomarker: "EGFR L858R+", status: "pending", nextStep: "Osimertinib candidacy" },
        { id: 2, name: "Case #2024-090", type: "Breast", stage: "IIB", biomarker: "ER+/HER2-", status: "reviewed", nextStep: "Adjuvant AI + CDK4/6i" },
        { id: 3, name: "Case #2024-091", type: "CRC", stage: "IV", biomarker: "MSI-H", status: "urgent", nextStep: "Pembrolizumab" },
    ];

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-orange-400">
                        Oncology Center
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Comprehensive Cancer Care & Tumor Board
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-primary">
                        {ICONS.plus} New Tumor Board Case
                    </button>
                    <button className="btn-secondary">
                        Biomarker Panel
                    </button>
                </div>
            </div>

            {/* Cancer Type Selector */}
            <div className="glass-card p-4 rounded-2xl">
                <h3 className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-wide">Select Cancer Type for AI Consultation</h3>
                <div className="flex flex-wrap gap-2">
                    {cancerTypes.map(cancer => (
                        <button
                            key={cancer.id}
                            onClick={() => setSelectedCancer(cancer.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedCancer === cancer.id
                                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            <span>{cancer.icon}</span>
                            {cancer.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Cancer Info + AI Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Cancer Info */}
                <div className="glass-card p-6 rounded-3xl space-y-6">
                    {selectedCancerData && (
                        <>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-rose-500/30">
                                    {selectedCancerData.icon}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">{selectedCancerData.name} Cancer</h3>
                                    <p className="text-text-secondary">AI-Assisted Decision Support</p>
                                </div>
                            </div>

                            {/* Biomarkers */}
                            <div>
                                <h4 className="font-bold text-sm text-slate-500 mb-3">Key Biomarkers to Test:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCancerData.biomarkers.map((marker, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-sm font-medium"
                                        >
                                            {marker}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Treatments */}
                            <div>
                                <h4 className="font-bold text-sm text-slate-500 mb-3">Treatment Modalities:</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedCancerData.keyTreatments.map((treatment, i) => (
                                        <div
                                            key={i}
                                            className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm flex items-center gap-2"
                                        >
                                            <span className="text-rose-500">💊</span>
                                            {treatment}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Tumor Board Cases */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-sm text-slate-500 mb-3">📋 Active Tumor Board Cases</h4>
                        <div className="space-y-3">
                            {tumorBoardCases.map(caseItem => (
                                <div
                                    key={caseItem.id}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${caseItem.status === 'urgent'
                                            ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700'
                                            : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-sm">{caseItem.name}</div>
                                            <div className="text-xs text-slate-500">
                                                {caseItem.type} • Stage {caseItem.stage} • {caseItem.biomarker}
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${caseItem.status === 'urgent' ? 'bg-red-100 text-red-700' :
                                                caseItem.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-green-100 text-green-700'
                                            }`}>
                                            {caseItem.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                        → Next: {caseItem.nextStep}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: AI Specialist Chat */}
                <div className="h-full min-h-[600px]">
                    <SpecialistAgentChat
                        zone="oncology"
                        contextId={selectedCancer}
                        className="h-full shadow-lg"
                        key={selectedCancer}
                    />
                </div>
            </div>

            {/* Quick Reference: Staging */}
            <div className="glass-card p-6 rounded-3xl">
                <h3 className="text-xl font-bold mb-4">📊 AJCC Staging Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    {[
                        { stage: "0", desc: "In situ", color: "green" },
                        { stage: "I", desc: "Localized", color: "teal" },
                        { stage: "II", desc: "Regional spread", color: "amber" },
                        { stage: "III", desc: "Advanced regional", color: "orange" },
                        { stage: "IV", desc: "Metastatic", color: "red" }
                    ].map((s, i) => (
                        <div key={i} className={`p-4 bg-${s.color}-50 dark:bg-${s.color}-900/10 rounded-xl border border-${s.color}-200 dark:border-${s.color}-800`}>
                            <div className={`text-3xl font-black text-${s.color}-600 dark:text-${s.color}-400`}>{s.stage}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{s.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OncologyDashboard;

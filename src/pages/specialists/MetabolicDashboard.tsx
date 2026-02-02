import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
import { SpecialistAgentChat } from '../../components/specialized/SpecialistAgentChat';
import { medicalKnowledge, Medication } from '../../services/MedicalKnowledgeService';
import { showToast } from '../../components/Toast';

interface LabValue {
    name: string;
    value: number;
    unit: string;
    normalMin: number;
    normalMax: number;
    icon: string;
}

interface MedicationInfo {
    name: string;
    dose: string;
    indication: string;
    mechanism: string;
    target: string;
    warning: string;
    color: string;
}

const MetabolicDashboard: React.FC = () => {
    const { t } = useTranslation();
    const [selectedFocus, setSelectedFocus] = useState<string>("hyperuricemia");
    const [isLoading, setIsLoading] = useState(true);
    const [goutRef, setGoutRef] = useState<any>(null);
    const [medicationDetails, setMedicationDetails] = useState<Record<string, Medication>>({});

    // Focus area options
    const focusOptions = [
        { id: 'hyperuricemia', label: 'Uric Acid / Gout', icon: '🦶', color: 'amber' },
        { id: 'hyperlipidemia', label: 'Cholesterol', icon: '🫀', color: 'red' },
        { id: 'metabolic_syndrome', label: 'Metabolic Syndrome', icon: '⚖️', color: 'blue' },
        { id: 'diabetes', label: 'Diabetes Management', icon: '🩸', color: 'purple' }
    ];

    // Lab values - in production, these would come from patient records
    const [labValues] = useState<LabValue[]>([
        { name: 'Uric Acid', value: 8.2, unit: 'mg/dL', normalMin: 3.5, normalMax: 6.8, icon: '🦶' },
        { name: 'Total Cholesterol', value: 242, unit: 'mg/dL', normalMin: 0, normalMax: 200, icon: '🔵' },
        { name: 'LDL', value: 158, unit: 'mg/dL', normalMin: 0, normalMax: 100, icon: '⬇️' },
        { name: 'HDL', value: 38, unit: 'mg/dL', normalMin: 40, normalMax: 200, icon: '⬆️' },
        { name: 'Triglycerides', value: 210, unit: 'mg/dL', normalMin: 0, normalMax: 150, icon: '📈' },
        { name: 'HbA1c', value: 5.9, unit: '%', normalMin: 0, normalMax: 5.7, icon: '🍬' },
    ]);

    useEffect(() => {
        loadMedicalKnowledge();
    }, []);

    const loadMedicalKnowledge = async () => {
        try {
            // Load gout quick reference
            const goutData = await medicalKnowledge.getGoutQuickReference();
            setGoutRef(goutData);

            // Load medication details
            const meds: Record<string, Medication> = {};

            try {
                meds['febuxostat'] = await medicalKnowledge.getMedication('febuxostat');
            } catch (e) { console.log('Febuxostat not loaded'); }

            try {
                meds['atorvastatin'] = await medicalKnowledge.getMedication('atorvastatin');
            } catch (e) { console.log('Atorvastatin not loaded'); }

            try {
                meds['colchicine'] = await medicalKnowledge.getMedication('colchicine');
            } catch (e) { console.log('Colchicine not loaded'); }

            setMedicationDetails(meds);
        } catch (error) {
            console.error('Failed to load medical knowledge:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Build medications list from API data or fallback
    const getMedications = (): MedicationInfo[] => {
        const meds: MedicationInfo[] = [];

        if (medicationDetails['febuxostat']) {
            const med = medicationDetails['febuxostat'];
            meds.push({
                name: med.name,
                dose: '40-80mg daily',
                indication: 'Hyperuricemia',
                mechanism: med.mechanism.substring(0, 50) + '...',
                target: 'Uric acid < 6.0 mg/dL',
                warning: med.warnings?.[0] || 'CV risk - monitor',
                color: 'amber'
            });
        } else {
            meds.push({
                name: 'Febuxostat (Adenuric)',
                dose: '80mg daily',
                indication: 'Hyperuricemia',
                mechanism: 'Xanthine Oxidase Inhibitor',
                target: 'Uric acid < 6.0 mg/dL',
                warning: 'CV risk - monitor',
                color: 'amber'
            });
        }

        if (medicationDetails['atorvastatin']) {
            const med = medicationDetails['atorvastatin'];
            meds.push({
                name: med.name,
                dose: med.dosing?.split('.')[0] || '40mg daily',
                indication: 'Hyperlipidemia',
                mechanism: 'HMG-CoA Reductase Inhibitor',
                target: 'LDL < 70-100 mg/dL',
                warning: med.warnings?.[0] || 'Monitor LFTs, myalgia',
                color: 'red'
            });
        } else {
            meds.push({
                name: 'Atorvastatin (Lipitor)',
                dose: '40mg daily',
                indication: 'Hyperlipidemia',
                mechanism: 'HMG-CoA Reductase Inhibitor',
                target: 'LDL < 70-100 mg/dL',
                warning: 'Monitor LFTs, myalgia',
                color: 'red'
            });
        }

        if (medicationDetails['colchicine']) {
            const med = medicationDetails['colchicine'];
            meds.push({
                name: med.name,
                dose: '0.6mg daily-BID',
                indication: 'Gout prophylaxis',
                mechanism: med.mechanism.substring(0, 40) + '...',
                target: 'Prevent flares during ULT initiation',
                warning: med.side_effects?.[0] || 'GI upset, diarrhea',
                color: 'blue'
            });
        } else {
            meds.push({
                name: 'Colchicine',
                dose: '0.6mg BID',
                indication: 'Gout prophylaxis',
                mechanism: 'Microtubule disruption',
                target: 'Prevent flares during ULT initiation',
                warning: 'GI upset, diarrhea',
                color: 'blue'
            });
        }

        return meds;
    };

    const getStatusColor = (value: number, min: number, max: number) => {
        if (value < min || value > max) return 'text-red-500';
        if (value > max * 0.9 || value < min * 1.1) return 'text-amber-500';
        return 'text-green-500';
    };

    const getStatusBg = (value: number, min: number, max: number) => {
        if (value < min || value > max) return 'bg-red-500';
        if (value > max * 0.9) return 'bg-amber-500';
        return 'bg-green-500';
    };

    const medications = getMedications();

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-400">
                        Metabolic Medicine
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Hyperuricemia, Hyperlipidemia & Metabolic Syndrome Management
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-primary">
                        {ICONS.plus} New Lipid Panel
                    </button>
                    <button className="btn-secondary">
                        ASCVD Calculator
                    </button>
                </div>
            </div>

            {/* Lab Values Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {labValues.map((lab, i) => (
                    <div
                        key={i}
                        className={`glass-card p-4 rounded-2xl relative overflow-hidden ${lab.value > lab.normalMax || lab.value < lab.normalMin
                            ? 'border-2 border-red-400 dark:border-red-600'
                            : ''
                            }`}
                    >
                        <div className="text-2xl mb-2">{lab.icon}</div>
                        <div className="text-sm text-text-secondary">{lab.name}</div>
                        <div className={`text-2xl font-bold ${getStatusColor(lab.value, lab.normalMin, lab.normalMax)}`}>
                            {lab.value}
                            <span className="text-xs font-normal ml-1">{lab.unit}</span>
                        </div>
                        <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getStatusBg(lab.value, lab.normalMin, lab.normalMax)} transition-all`}
                                style={{ width: `${Math.min((lab.value / lab.normalMax) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <div className="text-[10px] text-text-secondary mt-1">
                            Normal: {lab.normalMin > 0 ? `${lab.normalMin}-` : '<'}{lab.normalMax}
                        </div>
                        {(lab.value > lab.normalMax || lab.value < lab.normalMin) && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel - Medication Management */}
                <div className="glass-card p-6 rounded-3xl space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        💊 Current Medications
                        {isLoading && <span className="text-xs text-slate-500 font-normal">(Loading from knowledge base...)</span>}
                    </h3>

                    <div className="space-y-4">
                        {medications.map((med, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-xl border ${med.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' :
                                        med.color === 'red' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                                            'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-lg">{med.name}</div>
                                        <div className="text-sm font-mono text-slate-600 dark:text-slate-400">{med.dose}</div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${med.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                                            med.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        }`}>
                                        {med.indication}
                                    </span>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-text-secondary">Mechanism:</span>
                                        <div className="font-medium">{med.mechanism}</div>
                                    </div>
                                    <div>
                                        <span className="text-text-secondary">Target:</span>
                                        <div className="font-medium text-green-600 dark:text-green-400">{med.target}</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    ⚠️ {med.warning}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Focus Area Selector */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-sm text-slate-500 mb-3">AI Focus Area:</h4>
                        <div className="flex flex-wrap gap-2">
                            {focusOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setSelectedFocus(opt.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedFocus === opt.id
                                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
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
                        zone="metabolic"
                        contextId={selectedFocus}
                        className="h-full shadow-lg"
                        key={selectedFocus}
                    />
                </div>
            </div>

            {/* Clinical Guidelines Quick Reference */}
            <div className="glass-card p-6 rounded-3xl">
                <h3 className="text-xl font-bold mb-4">📋 Treatment Targets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Uric Acid Targets */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                        <div className="font-bold text-amber-700 dark:text-amber-300 mb-3">🦶 Hyperuricemia / Gout</div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Target Uric Acid:</span>
                                <span className="font-bold text-amber-600">
                                    {goutRef?.chronic_management?.uric_acid_target || '< 6.0 mg/dL'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>For Tophaceous Gout:</span>
                                <span className="font-bold text-amber-600">&lt; 5.0 mg/dL</span>
                            </div>
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 p-2 bg-amber-100 dark:bg-amber-900/20 rounded">
                                💡 {goutRef?.key_points?.[0] || 'Start Adenuric at 40mg, titrate to 80mg. Add colchicine prophylaxis for 3-6 months.'}
                            </div>
                        </div>
                    </div>

                    {/* Cholesterol Targets */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="font-bold text-red-700 dark:text-red-300 mb-3">🫀 Hyperlipidemia</div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>General LDL Target:</span>
                                <span className="font-bold text-red-600">&lt; 100 mg/dL</span>
                            </div>
                            <div className="flex justify-between">
                                <span>High ASCVD Risk:</span>
                                <span className="font-bold text-red-600">&lt; 70 mg/dL</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Very High Risk:</span>
                                <span className="font-bold text-red-600">&lt; 55 mg/dL</span>
                            </div>
                            <div className="text-xs text-red-600 dark:text-red-400 mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded">
                                💡 High-intensity statin → If not at goal, add Ezetimibe → If still not at goal, consider PCSK9i.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MetabolicDashboard;

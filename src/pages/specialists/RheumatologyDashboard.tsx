import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
import { SpecialistAgentChat } from '../../components/specialized/SpecialistAgentChat';
import { medicalKnowledge, GoutProtocol } from '../../services/MedicalKnowledgeService';
import { showToast } from '../../components/Toast';

interface GoutAssessmentForm {
    jointsAffected: number;
    fever: boolean;
    priorAttacks: number;
    egfr: number;
    uricAcid: number | null;
    currentMedications: string[];
}

const RheumatologyDashboard: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'acute' | 'chronic' | 'protocol'>('acute');
    const [isLoading, setIsLoading] = useState(false);
    const [protocol, setProtocol] = useState<GoutProtocol | null>(null);
    const [quickRef, setQuickRef] = useState<any>(null);

    const [assessmentForm, setAssessmentForm] = useState<GoutAssessmentForm>({
        jointsAffected: 1,
        fever: false,
        priorAttacks: 0,
        egfr: 90,
        uricAcid: null,
        currentMedications: []
    });

    // Load quick reference on mount
    useEffect(() => {
        loadQuickReference();
    }, []);

    const loadQuickReference = async () => {
        try {
            const data = await medicalKnowledge.getGoutQuickReference();
            setQuickRef(data);
        } catch (error) {
            console.error('Failed to load quick reference:', error);
        }
    };

    const handleGetProtocol = async () => {
        setIsLoading(true);
        try {
            const result = await medicalKnowledge.getGoutAttackProtocol({
                joints_affected: assessmentForm.jointsAffected,
                fever: assessmentForm.fever,
                prior_attacks: assessmentForm.priorAttacks,
                egfr: assessmentForm.egfr,
                medications: assessmentForm.currentMedications,
                uric_acid: assessmentForm.uricAcid || undefined
            });
            setProtocol(result.protocol);
            setActiveTab('protocol');
            showToast.success('Treatment protocol generated successfully');
        } catch (error) {
            console.error('Failed to get protocol:', error);
            showToast.error('Failed to generate protocol');
        } finally {
            setIsLoading(false);
        }
    };

    const addMedication = (med: string) => {
        if (med && !assessmentForm.currentMedications.includes(med)) {
            setAssessmentForm(prev => ({
                ...prev,
                currentMedications: [...prev.currentMedications, med]
            }));
        }
    };

    const removeMedication = (med: string) => {
        setAssessmentForm(prev => ({
            ...prev,
            currentMedications: prev.currentMedications.filter(m => m !== med)
        }));
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-500">
                        Rheumatology - Gout Management
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Evidence-based gout attack assessment and treatment protocols
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('acute')}
                    className={`px-6 py-3 font-bold transition-all ${activeTab === 'acute'
                            ? 'text-amber-600 border-b-2 border-amber-600'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    🔥 Acute Assessment
                </button>
                <button
                    onClick={() => setActiveTab('chronic')}
                    className={`px-6 py-3 font-bold transition-all ${activeTab === 'chronic'
                            ? 'text-amber-600 border-b-2 border-amber-600'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    📋 Chronic Management
                </button>
                {protocol && (
                    <button
                        onClick={() => setActiveTab('protocol')}
                        className={`px-6 py-3 font-bold transition-all ${activeTab === 'protocol'
                                ? 'text-green-600 border-b-2 border-green-600'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        ✅ Generated Protocol
                    </button>
                )}
            </div>

            {/* Acute Assessment Tab */}
            {activeTab === 'acute' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left - Assessment Form */}
                    <div className="glass-card p-6 rounded-3xl space-y-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            🩺 Patient Assessment
                        </h3>

                        <div className="space-y-4">
                            {/* Joints Affected */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                    Number of Joints Affected
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setAssessmentForm(prev => ({ ...prev, jointsAffected: n }))}
                                            className={`w-12 h-12 rounded-xl font-bold transition-all ${assessmentForm.jointsAffected >= n
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                    <span className="ml-2 self-center text-sm text-slate-500">+</span>
                                </div>
                            </div>

                            {/* Fever */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                    Fever Present?
                                </label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setAssessmentForm(prev => ({ ...prev, fever: false }))}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all ${!assessmentForm.fever
                                                ? 'bg-green-500 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={() => setAssessmentForm(prev => ({ ...prev, fever: true }))}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all ${assessmentForm.fever
                                                ? 'bg-red-500 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}
                                    >
                                        Yes
                                    </button>
                                </div>
                            </div>

                            {/* Prior Attacks */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                    Prior Gout Attacks (lifetime)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={assessmentForm.priorAttacks}
                                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, priorAttacks: parseInt(e.target.value) || 0 }))}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>

                            {/* eGFR */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                    eGFR (mL/min/1.73m²)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={assessmentForm.egfr}
                                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, egfr: parseInt(e.target.value) || 90 }))}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                                {assessmentForm.egfr < 30 && (
                                    <p className="text-red-500 text-sm mt-1">⚠️ Severe renal impairment - colchicine dose adjustment needed</p>
                                )}
                            </div>

                            {/* Uric Acid (optional) */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                    Serum Uric Acid (mg/dL) - Optional
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="e.g., 8.5"
                                    value={assessmentForm.uricAcid || ''}
                                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, uricAcid: parseFloat(e.target.value) || null }))}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>

                            {/* Current Medications */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                                    Current Medications (for interaction check)
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {assessmentForm.currentMedications.map(med => (
                                        <span
                                            key={med}
                                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-2"
                                        >
                                            {med}
                                            <button onClick={() => removeMedication(med)} className="text-blue-500 hover:text-red-500">×</button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        onChange={(e) => { addMedication(e.target.value); e.target.value = ''; }}
                                        className="flex-1 p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                    >
                                        <option value="">Add medication...</option>
                                        <option value="Clarithromycin">Clarithromycin (interaction)</option>
                                        <option value="Cyclosporine">Cyclosporine (interaction)</option>
                                        <option value="Diltiazem">Diltiazem (interaction)</option>
                                        <option value="Verapamil">Verapamil (interaction)</option>
                                        <option value="Ritonavir">Ritonavir (interaction)</option>
                                        <option value="Aspirin">Aspirin</option>
                                        <option value="Lisinopril">Lisinopril</option>
                                        <option value="Metformin">Metformin</option>
                                    </select>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGetProtocol}
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50"
                            >
                                {isLoading ? '⏳ Generating Protocol...' : '🔬 Generate Treatment Protocol'}
                            </button>
                        </div>
                    </div>

                    {/* Right - AI Chat */}
                    <div className="h-full min-h-[600px]">
                        <SpecialistAgentChat
                            zone="rheumatology"
                            contextId="gout_acute"
                            className="h-full shadow-lg"
                        />
                    </div>
                </div>
            )}

            {/* Chronic Management Tab */}
            {activeTab === 'chronic' && quickRef && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-3xl space-y-6">
                        <h3 className="text-xl font-bold">📋 Chronic Gout Management</h3>

                        {/* Target */}
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                            <div className="text-green-800 dark:text-green-200 font-bold">🎯 Uric Acid Target</div>
                            <div className="text-2xl font-black text-green-600 dark:text-green-400 mt-2">
                                {quickRef.chronic_management?.uric_acid_target || '< 6 mg/dL'}
                            </div>
                        </div>

                        {/* First Line ULT */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="text-blue-800 dark:text-blue-200 font-bold mb-2">💊 First-Line: Allopurinol</div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                {quickRef.chronic_management?.allopurinol_dosing}
                            </p>
                        </div>

                        {/* Key Points */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-600 dark:text-slate-300">Key Points:</h4>
                            {quickRef.key_points?.map((point: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 text-sm">
                                    <span className="text-amber-500">•</span>
                                    <span className="text-slate-600 dark:text-slate-300">{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Colchicine Prophylaxis Card */}
                    <div className="glass-card p-6 rounded-3xl space-y-6">
                        <h3 className="text-xl font-bold">💊 Colchicine Protocol</h3>

                        <div className="space-y-4">
                            {/* Acute Dosing */}
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                <div className="text-amber-800 dark:text-amber-200 font-bold mb-2">🔥 Acute Attack</div>
                                <div className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
                                    <p><strong>Initial:</strong> 1.2 mg (2 tablets)</p>
                                    <p><strong>1 hour later:</strong> 0.6 mg (1 tablet)</p>
                                    <p><strong>Total Day 1:</strong> 1.8 mg maximum</p>
                                </div>
                            </div>

                            {/* Prophylaxis During ULT */}
                            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
                                <div className="text-violet-800 dark:text-violet-200 font-bold mb-2">🛡️ ULT Prophylaxis</div>
                                <div className="text-sm text-violet-700 dark:text-violet-300">
                                    <p>{quickRef.chronic_management?.prophylaxis_during_initiation}</p>
                                </div>
                            </div>

                            {/* Warnings */}
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                <div className="text-red-800 dark:text-red-200 font-bold mb-2">⚠️ Key Warnings</div>
                                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                                    <li>• Dose reduce in renal impairment (CrCl &lt; 30)</li>
                                    <li>• Major interactions: clarithromycin, cyclosporine, P-gp inhibitors</li>
                                    <li>• Do not repeat acute dosing within 3 days</li>
                                    <li>• Stop if severe diarrhea develops</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Generated Protocol Tab */}
            {activeTab === 'protocol' && protocol && (
                <div className="space-y-6">
                    {/* Severity Assessment */}
                    <div className={`glass-card p-6 rounded-3xl border-l-4 ${protocol.severity_assessment.includes('SEVERE') ? 'border-red-500' :
                            protocol.severity_assessment.includes('MODERATE') ? 'border-amber-500' :
                                'border-green-500'
                        }`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">Severity Assessment</h3>
                                <p className="text-2xl font-black mt-2">{protocol.severity_assessment}</p>
                            </div>
                            <div className="text-5xl">
                                {protocol.severity_assessment.includes('SEVERE') ? '🚨' :
                                    protocol.severity_assessment.includes('MODERATE') ? '⚠️' : '✅'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Colchicine Details */}
                        <div className="glass-card p-6 rounded-3xl">
                            <h3 className="text-xl font-bold mb-4">💊 Colchicine Recommendation</h3>

                            {protocol.colchicine_details.recommended ? (
                                <div className="space-y-4">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-700 dark:text-green-300 font-bold text-center">
                                        ✅ Colchicine Appropriate
                                    </div>

                                    {protocol.colchicine_details.regimen && (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                <div className="font-bold text-sm text-slate-500 mb-2">Day 1 Acute Regimen:</div>
                                                <p><strong>Initial:</strong> {protocol.colchicine_details.regimen.acute_attack.initial_dose}</p>
                                                <p><strong>Second dose:</strong> {protocol.colchicine_details.regimen.acute_attack.second_dose}</p>
                                                <p><strong>Total:</strong> {protocol.colchicine_details.regimen.acute_attack.total_day_1}</p>
                                            </div>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                                <p><strong>Timing:</strong> {protocol.colchicine_details.regimen.timing}</p>
                                                <p><strong>Expected:</strong> {protocol.colchicine_details.regimen.expected_response}</p>
                                            </div>
                                        </div>
                                    )}

                                    {protocol.colchicine_details.warnings && (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                            <div className="font-bold text-amber-700 dark:text-amber-300 text-sm mb-2">⚠️ Warnings:</div>
                                            <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                                                {protocol.colchicine_details.warnings.map((w, i) => (
                                                    <li key={i}>• {w}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-700 dark:text-red-300">
                                    <div className="font-bold">❌ Colchicine Not Recommended</div>
                                    <p className="text-sm mt-2">{protocol.colchicine_details.reason}</p>
                                </div>
                            )}
                        </div>

                        {/* Alternatives */}
                        <div className="glass-card p-6 rounded-3xl">
                            <h3 className="text-xl font-bold mb-4">🔄 Alternative Treatments</h3>
                            <div className="space-y-4">
                                {protocol.alternatives.map((alt, i) => (
                                    <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <div className="font-bold text-lg">{alt.name}</div>
                                        <p className="text-blue-600 dark:text-blue-400 text-sm">{alt.example}</p>
                                        {alt.duration && (
                                            <p className="text-sm text-slate-500 mt-1">Duration: {alt.duration}</p>
                                        )}
                                        <div className="mt-2">
                                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                                Cautions: {alt.cautions.join(', ')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 italic">{alt.when_to_use}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Prophylaxis Plan */}
                    {protocol.prophylaxis_plan && (
                        <div className="glass-card p-6 rounded-3xl">
                            <h3 className="text-xl font-bold mb-4">🛡️ Long-term Prophylaxis Plan</h3>

                            {protocol.prophylaxis_plan.first_line ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                        <div className="font-bold text-blue-800 dark:text-blue-200 mb-2">Urate-Lowering Therapy</div>
                                        <p><strong>Medication:</strong> {protocol.prophylaxis_plan.first_line.medication}</p>
                                        <p><strong>Starting:</strong> {protocol.prophylaxis_plan.first_line.starting_dose}</p>
                                        <p><strong>Titration:</strong> {protocol.prophylaxis_plan.first_line.titration}</p>
                                        <p><strong>Target:</strong> {protocol.prophylaxis_plan.first_line.target}</p>
                                        <p className="text-xs text-slate-500 mt-2">Timing: {protocol.prophylaxis_plan.timing}</p>
                                    </div>

                                    {protocol.prophylaxis_plan.flare_prophylaxis && (
                                        <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
                                            <div className="font-bold text-violet-800 dark:text-violet-200 mb-2">Flare Prophylaxis</div>
                                            <p>{protocol.prophylaxis_plan.flare_prophylaxis.medication}</p>
                                            <p className="text-sm text-slate-500">{protocol.prophylaxis_plan.flare_prophylaxis.duration}</p>
                                            <p className="text-xs italic mt-2">{protocol.prophylaxis_plan.flare_prophylaxis.rationale}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <p className="font-bold text-green-700 dark:text-green-300">{protocol.prophylaxis_plan.recommendation}</p>
                                    {protocol.prophylaxis_plan.lifestyle && (
                                        <ul className="mt-3 space-y-1 text-sm text-green-600 dark:text-green-400">
                                            {protocol.prophylaxis_plan.lifestyle.map((item, i) => (
                                                <li key={i}>• {item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reasoning Chain */}
                    <div className="glass-card p-6 rounded-3xl">
                        <h3 className="text-xl font-bold mb-4">🧠 AI Reasoning Chain</h3>
                        <div className="space-y-2">
                            {protocol.reasoning.map((step, i) => (
                                <div key={i} className="flex items-start gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                                        {step.step}
                                    </span>
                                    <span className="text-sm text-slate-600 dark:text-slate-300">{step.reasoning}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RheumatologyDashboard;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';
import { medicalKnowledge, PatientAnalysis, DrugAnalysis } from '../services/MedicalKnowledgeService';
import { showToast } from '../components/Toast';

interface PatientForm {
    age: number;
    sex: string;
    symptoms: string[];
    conditions: string[];
    medications: string[];
    allergies: string[];
    labResults: Record<string, number>;
}

const MasterDoctorPage: React.FC = () => {
    const { t } = useTranslation();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<PatientAnalysis | null>(null);
    const [drugAnalysis, setDrugAnalysis] = useState<DrugAnalysis | null>(null);
    const [activeTab, setActiveTab] = useState<'input' | 'analysis' | 'drug'>('input');

    const [symptomInput, setSymptomInput] = useState('');
    const [drugInput, setDrugInput] = useState('');

    const [patientForm, setPatientForm] = useState<PatientForm>({
        age: 55,
        sex: 'male',
        symptoms: [],
        conditions: [],
        medications: [],
        allergies: [],
        labResults: {}
    });

    const addSymptom = () => {
        if (symptomInput.trim() && !patientForm.symptoms.includes(symptomInput.trim())) {
            setPatientForm(prev => ({
                ...prev,
                symptoms: [...prev.symptoms, symptomInput.trim()]
            }));
            setSymptomInput('');
        }
    };

    const removeItem = (category: keyof PatientForm, item: string) => {
        if (Array.isArray(patientForm[category])) {
            setPatientForm(prev => ({
                ...prev,
                [category]: (prev[category] as string[]).filter(i => i !== item)
            }));
        }
    };

    const addCondition = (condition: string) => {
        if (condition && !patientForm.conditions.includes(condition)) {
            setPatientForm(prev => ({
                ...prev,
                conditions: [...prev.conditions, condition]
            }));
        }
    };

    const addMedication = (med: string) => {
        if (med && !patientForm.medications.includes(med)) {
            setPatientForm(prev => ({
                ...prev,
                medications: [...prev.medications, med]
            }));
        }
    };

    const handleAnalyze = async () => {
        if (patientForm.symptoms.length === 0 && patientForm.conditions.length === 0) {
            showToast.warning('Please enter at least one symptom or condition');
            return;
        }

        setIsAnalyzing(true);
        try {
            const result = await medicalKnowledge.getMasterDoctorAnalysis({
                age: patientForm.age,
                sex: patientForm.sex,
                symptoms: patientForm.symptoms,
                conditions: patientForm.conditions,
                medications: patientForm.medications,
                allergies: patientForm.allergies,
                lab_results: patientForm.labResults
            });

            setAnalysis(result.analysis);
            setActiveTab('analysis');
            showToast.success('Analysis complete - review results');
        } catch (error) {
            console.error('Analysis failed:', error);
            showToast.error('Failed to analyze - please try again');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDrugAnalysis = async () => {
        if (!drugInput.trim()) {
            showToast.warning('Please enter a drug name');
            return;
        }

        setIsAnalyzing(true);
        try {
            const result = await medicalKnowledge.analyzeDrugTherapy(drugInput, {
                age: patientForm.age,
                egfr: patientForm.labResults.egfr,
                medications: patientForm.medications
            });

            setDrugAnalysis(result.analysis);
            setActiveTab('drug');
            showToast.success('Drug analysis complete');
        } catch (error) {
            console.error('Drug analysis failed:', error);
            showToast.error('Drug not found in knowledge base');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 mb-4">
                    <span className="text-3xl">🧠</span>
                    <span className="text-indigo-400 font-bold uppercase tracking-wide text-sm">AI-Powered Clinical Decision Support</span>
                </div>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500">
                    Master AI Health Doctor
                </h1>
                <p className="text-text-secondary mt-2 max-w-2xl mx-auto">
                    Cross-referential analysis combining all specialist knowledge with transparent reasoning
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center gap-2">
                <button
                    onClick={() => setActiveTab('input')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'input'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                >
                    📝 Patient Input
                </button>
                {analysis && (
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'analysis'
                                ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                    >
                        📊 Analysis Results
                    </button>
                )}
                {drugAnalysis && (
                    <button
                        onClick={() => setActiveTab('drug')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'drug'
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                    >
                        💊 Drug Analysis
                    </button>
                )}
            </div>

            {/* Input Tab */}
            {activeTab === 'input' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left - Patient Info */}
                    <div className="glass-card p-6 rounded-3xl space-y-6">
                        <h3 className="text-xl font-bold">👤 Patient Information</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Age</label>
                                <input
                                    type="number"
                                    value={patientForm.age}
                                    onChange={(e) => setPatientForm(prev => ({ ...prev, age: parseInt(e.target.value) || 50 }))}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Sex</label>
                                <select
                                    value={patientForm.sex}
                                    onChange={(e) => setPatientForm(prev => ({ ...prev, sex: e.target.value }))}
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                        </div>

                        {/* Symptoms */}
                        <div>
                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Presenting Symptoms</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={symptomInput}
                                    onChange={(e) => setSymptomInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addSymptom()}
                                    placeholder="e.g., joint pain, swelling..."
                                    className="flex-1 p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                                <button onClick={addSymptom} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {patientForm.symptoms.map(s => (
                                    <span key={s} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm flex items-center gap-2">
                                        {s}
                                        <button onClick={() => removeItem('symptoms', s)} className="hover:text-red-500">×</button>
                                    </span>
                                ))}
                            </div>
                            {/* Quick symptom buttons */}
                            <div className="flex flex-wrap gap-1 mt-2">
                                {['Joint pain', 'Swelling', 'Redness', 'Fever', 'Leg swelling', 'Chest pain', 'Shortness of breath'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { setSymptomInput(s); addSymptom(); }}
                                        className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                                    >
                                        + {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Known Conditions */}
                        <div>
                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Known Conditions</label>
                            <select
                                onChange={(e) => { addCondition(e.target.value); e.target.value = ''; }}
                                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                            >
                                <option value="">Add condition...</option>
                                <option value="Gout">Gout</option>
                                <option value="Hyperuricemia">Hyperuricemia</option>
                                <option value="Deep Vein Thrombosis">DVT</option>
                                <option value="Atrial Fibrillation">Atrial Fibrillation</option>
                                <option value="Hyperlipidemia">Hyperlipidemia</option>
                                <option value="Hypertension">Hypertension</option>
                                <option value="Diabetes">Diabetes</option>
                                <option value="Chronic Kidney Disease">CKD</option>
                                <option value="Heart Failure">Heart Failure</option>
                            </select>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {patientForm.conditions.map(c => (
                                    <span key={c} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-2">
                                        {c}
                                        <button onClick={() => removeItem('conditions', c)} className="hover:text-red-500">×</button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Current Medications */}
                        <div>
                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Current Medications</label>
                            <select
                                onChange={(e) => { addMedication(e.target.value); e.target.value = ''; }}
                                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                            >
                                <option value="">Add medication...</option>
                                <option value="Apixaban (Eliquis)">Apixaban (Eliquis)</option>
                                <option value="Rivaroxaban (Xarelto)">Rivaroxaban (Xarelto)</option>
                                <option value="Warfarin">Warfarin</option>
                                <option value="Allopurinol">Allopurinol</option>
                                <option value="Colchicine">Colchicine</option>
                                <option value="Atorvastatin (Lipitor)">Atorvastatin (Lipitor)</option>
                                <option value="Lisinopril">Lisinopril</option>
                                <option value="Metformin">Metformin</option>
                                <option value="Clarithromycin">Clarithromycin</option>
                            </select>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {patientForm.medications.map(m => (
                                    <span key={m} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm flex items-center gap-2">
                                        {m}
                                        <button onClick={() => removeItem('medications', m)} className="hover:text-red-500">×</button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Lab Results */}
                        <div>
                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Key Lab Results</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500">eGFR (mL/min)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g., 85"
                                        onChange={(e) => setPatientForm(prev => ({
                                            ...prev,
                                            labResults: { ...prev.labResults, egfr: parseInt(e.target.value) || 0 }
                                        }))}
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500">Uric Acid (mg/dL)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g., 7.5"
                                        onChange={(e) => setPatientForm(prev => ({
                                            ...prev,
                                            labResults: { ...prev.labResults, uric_acid: parseFloat(e.target.value) || 0 }
                                        }))}
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                        >
                            {isAnalyzing ? '🧠 Analyzing...' : '🔬 Analyze with Master Doctor'}
                        </button>
                    </div>

                    {/* Right - Drug Analysis */}
                    <div className="glass-card p-6 rounded-3xl space-y-6">
                        <h3 className="text-xl font-bold">💊 Drug Therapy Analysis</h3>
                        <p className="text-sm text-slate-500">
                            Analyze a specific drug for this patient's profile
                        </p>

                        <div>
                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Drug Name</label>
                            <input
                                type="text"
                                value={drugInput}
                                onChange={(e) => setDrugInput(e.target.value)}
                                placeholder="e.g., Colchicine, Apixaban, Atorvastatin..."
                                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {['Colchicine', 'Apixaban', 'Allopurinol', 'Febuxostat', 'Atorvastatin', 'Warfarin'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDrugInput(d)}
                                    className="text-sm px-3 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-xl hover:bg-violet-200 dark:hover:bg-violet-800/50"
                                >
                                    {d}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleDrugAnalysis}
                            disabled={isAnalyzing || !drugInput}
                            className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/30 disabled:opacity-50"
                        >
                            {isAnalyzing ? '💊 Analyzing...' : '🔍 Analyze Drug for Patient'}
                        </button>

                        {/* Quick Info Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                <div className="text-3xl mb-2">🩺</div>
                                <div className="text-sm font-bold">10+</div>
                                <div className="text-xs text-slate-500">Specialist Domains</div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                <div className="text-3xl mb-2">⚡</div>
                                <div className="text-sm font-bold">Real-time</div>
                                <div className="text-xs text-slate-500">Cross-Reference</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Analysis Results Tab */}
            {activeTab === 'analysis' && analysis && (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="glass-card p-6 rounded-3xl">
                        <h3 className="text-xl font-bold mb-4">📋 Patient Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                <div className="text-2xl font-bold">{analysis.patient_summary.age}</div>
                                <div className="text-xs text-slate-500">Age</div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                <div className="text-2xl font-bold">{analysis.patient_summary.symptoms.length}</div>
                                <div className="text-xs text-slate-500">Symptoms</div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                <div className="text-2xl font-bold">{analysis.patient_summary.conditions.length}</div>
                                <div className="text-xs text-slate-500">Conditions</div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                <div className="text-2xl font-bold">{analysis.patient_summary.medications.length}</div>
                                <div className="text-xs text-slate-500">Medications</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Differential Diagnosis */}
                        <div className="glass-card p-6 rounded-3xl">
                            <h3 className="text-xl font-bold mb-4">🔍 Differential Diagnoses</h3>
                            <div className="space-y-3">
                                {analysis.differential_diagnoses.slice(0, 5).map((dx, i) => (
                                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center">
                                        <div>
                                            <div className="font-bold">{dx.condition}</div>
                                            <div className="text-xs text-slate-500">{dx.specialty}</div>
                                        </div>
                                        <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold">
                                            Score: {dx.match_score}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Specialist Consultations */}
                        <div className="glass-card p-6 rounded-3xl">
                            <h3 className="text-xl font-bold mb-4">👨‍⚕️ Recommended Consultations</h3>
                            <div className="space-y-3">
                                {analysis.specialist_consultations.map((consult, i) => (
                                    <div key={i} className={`p-3 rounded-xl border ${consult.priority === 'high'
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                        }`}>
                                        <div className="flex justify-between">
                                            <span className="font-bold">{consult.specialty}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${consult.priority === 'high' ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'
                                                }`}>
                                                {consult.priority}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{consult.reason}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Drug Interactions */}
                    {analysis.drug_interactions.length > 0 && (
                        <div className="glass-card p-6 rounded-3xl border-l-4 border-red-500">
                            <h3 className="text-xl font-bold mb-4 text-red-600">⚠️ Drug Interactions Detected</h3>
                            <div className="space-y-2">
                                {analysis.drug_interactions.map((interaction, i) => (
                                    <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                        <strong>{interaction.drug1}</strong> + <strong>{interaction.drug2}</strong>: {interaction.interaction}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reasoning Chain */}
                    <div className="glass-card p-6 rounded-3xl">
                        <h3 className="text-xl font-bold mb-4">🧠 AI Reasoning Chain</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {analysis.reasoning_chain.map((step, i) => (
                                <div key={i} className="flex items-start gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
                                        {step.step}
                                    </span>
                                    <span className="text-sm text-slate-600 dark:text-slate-300">{step.reasoning}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Drug Analysis Tab */}
            {activeTab === 'drug' && drugAnalysis && (
                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-3xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-3xl">
                                💊
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{drugAnalysis.medication.name}</h3>
                                <p className="text-slate-500">{drugAnalysis.medication.generic} • {drugAnalysis.medication.class}</p>
                            </div>
                        </div>

                        {/* Appropriateness */}
                        <div className={`p-4 rounded-xl mb-6 ${drugAnalysis.patient_specific.appropriate
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
                                : 'bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
                            }`}>
                            <div className={`font-bold text-lg ${drugAnalysis.patient_specific.appropriate ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                                }`}>
                                {drugAnalysis.patient_specific.appropriate ? '✅ Appropriate for This Patient' : '❌ May Not Be Appropriate'}
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="text-center">
                                    <div className={`text-sm font-bold ${drugAnalysis.patient_specific.contraindication_check === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
                                        {drugAnalysis.patient_specific.contraindication_check}
                                    </div>
                                    <div className="text-xs text-slate-500">Contraindications</div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-sm font-bold ${drugAnalysis.patient_specific.interaction_check === 'PASS' ? 'text-green-600' : 'text-amber-600'}`}>
                                        {drugAnalysis.patient_specific.interaction_check}
                                    </div>
                                    <div className="text-xs text-slate-500">Interactions</div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-sm font-bold ${drugAnalysis.patient_specific.dose_adjustment_needed ? 'text-amber-600' : 'text-green-600'}`}>
                                        {drugAnalysis.patient_specific.dose_adjustment_needed ? 'NEEDED' : 'STANDARD'}
                                    </div>
                                    <div className="text-xs text-slate-500">Dose Adjust</div>
                                </div>
                            </div>
                        </div>

                        {/* Warnings */}
                        {drugAnalysis.patient_specific.warnings.length > 0 && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-6">
                                <div className="font-bold text-amber-700 dark:text-amber-300 mb-2">⚠️ Patient-Specific Warnings:</div>
                                <ul className="space-y-1">
                                    {drugAnalysis.patient_specific.warnings.map((w, i) => (
                                        <li key={i} className="text-sm text-amber-600 dark:text-amber-400">• {w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Dosing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="font-bold mb-2">📋 Recommended Dosing</div>
                                <p className="text-sm">{drugAnalysis.dosing.recommended}</p>
                                {drugAnalysis.dosing.adjustments.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <div className="text-xs font-bold text-amber-600 mb-1">Adjustments:</div>
                                        <ul className="text-xs text-slate-500 space-y-1">
                                            {drugAnalysis.dosing.adjustments.map((adj, i) => (
                                                <li key={i}>• {adj}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="font-bold mb-2">📊 Monitoring</div>
                                <ul className="text-sm space-y-1">
                                    {drugAnalysis.monitoring.map((m, i) => (
                                        <li key={i}>• {m}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Patient Education */}
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <div className="font-bold text-blue-700 dark:text-blue-300 mb-2">📚 Patient Education Points</div>
                            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                                {drugAnalysis.patient_education.filter(p => p).map((point, i) => (
                                    <li key={i}>• {point}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterDoctorPage;

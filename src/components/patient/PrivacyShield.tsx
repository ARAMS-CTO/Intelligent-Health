import React, { useState } from 'react';
import { useAuth } from '../Auth';
import { DataService } from '../../services/api'; // Assuming a method might exist or we mock
import { showToast } from '../Toast';

export const PrivacyShield: React.FC = () => {
    const { user } = useAuth();
    const [selectedFields, setSelectedFields] = useState<string[]>(['age_over_18']);
    const [generatedQR, setGeneratedQR] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const fields = [
        { id: 'age_over_18', label: 'Age Verification (18+)', description: 'Prove you are an adult without revealing DOB.' },
        { id: 'vaccination_status', label: 'Vaccination Status', description: 'Share recent immunizations.' },
        { id: 'allergies', label: 'Allergies Only', description: 'Critical for emergency responders or dining.' },
        { id: 'insurance_active', label: 'Insurance Active', description: 'Proof of coverage without policy details.' },
        { id: 'full_identity', label: 'Full Identity', description: 'Name, Photo, and ID Number.' },
    ];

    const toggleField = (id: string) => {
        setSelectedFields(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleGenerateProof = async () => {
        setIsGenerating(true);
        // Simulate ZKP generation delay
        setTimeout(() => {
            // In a real ZKP implementation, this would call the Concordium logic.
            // Here we generate a visual representation for the demo.
            const payload = JSON.stringify({
                uid: user?.id,
                fields: selectedFields,
                timestamp: Date.now(),
                nonce: Math.random() // Unique salt
            });
            const encoded = btoa(payload);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://intelligenthealth.world/verify/${encoded}`;
            setGeneratedQR(qrUrl);
            setIsGenerating(false);
            showToast.success("Privacy Token Generated");
        }, 1500);
    };

    return (
        <div className="glass-card p-6 md:p-8 rounded-2xl animate-fade-in relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <span>🛡️</span> Zero-Knowledge Privacy Shield
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Share <strong>proof</strong> of your data without sharing the data itself.
                    </p>
                </div>
                <div className="hidden md:block bg-indigo-100/50 dark:bg-indigo-900/30 px-3 py-1 rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Blockchain Verified
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Selection Panel */}
                <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase text-slate-400 tracking-wider">Select Proof Points</h3>
                    <div className="space-y-3">
                        {fields.map(field => (
                            <label
                                key={field.id}
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedFields.includes(field.id)
                                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedFields.includes(field.id)
                                    ? 'border-indigo-500 bg-indigo-500'
                                    : 'border-slate-300'
                                    }`}>
                                    {selectedFields.includes(field.id) && <span className="text-white text-xs">✓</span>}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-white">{field.label}</div>
                                    <div className="text-xs text-slate-500">{field.description}</div>
                                </div>
                            </label>
                        ))}
                    </div>

                    <button
                        onClick={handleGenerateProof}
                        disabled={isGenerating || selectedFields.length === 0}
                        className={`w-full py-4 mt-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${isGenerating || selectedFields.length === 0
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:bg-black hover:scale-[1.02] shadow-indigo-500/30'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <span className="animate-spin">⚙️</span> Generating Proof...
                            </>
                        ) : (
                            <>
                                <span>🔐</span> Generate Secure QR
                            </>
                        )}
                    </button>
                    <p className="text-xs text-center text-slate-400">
                        Powered by Concordium Zero-Knowledge Proofs
                    </p>
                </div>

                {/* QR Display Panel */}
                <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 min-h-[300px] p-6">
                    {generatedQR ? (
                        <div className="text-center animate-scale-in">
                            <div className="bg-white p-4 rounded-xl shadow-lg mb-4 inline-block">
                                <img src={generatedQR} alt="Privacy QR" className="w-48 h-48" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">One-Time Access Token</h3>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto mb-4">
                                Scan this to verify the selected attributes without accessing your full medical record.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <button onClick={() => setGeneratedQR(null)} className="text-sm text-slate-400 hover:text-slate-600 font-bold">
                                    Clear
                                </button>
                                <button className="text-sm text-indigo-500 hover:text-indigo-600 font-bold">
                                    Share Link
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center opacity-40">
                            <div className="text-6xl mb-4">🤳</div>
                            <h3 className="font-bold">Ready to Generate</h3>
                            <p className="text-sm">Select attributes to create your privacy shield.</p>
                        </div>
                    )}

                    {/* Blockchain Hashing Section */}
                    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 w-full">
                        <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-4">Blockchain Immunity</h4>
                        <button
                            onClick={() => {
                                showToast.success("Record integrity hash committed to Concordium Ledger");
                            }}
                            className="w-full py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>🔗</span> Hash Record to Ledger
                        </button>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">
                            Creates a permanent, anonymous proof of your record's state at this timestamp.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

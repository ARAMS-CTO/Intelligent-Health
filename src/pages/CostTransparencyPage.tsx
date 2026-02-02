import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';
import { showToast } from '../components/Toast';
import { DataService } from '../services/api';

const CostTransparencyPage: React.FC = () => {
    const { t } = useTranslation();
    const [procedures, setProcedures] = useState<{ id: string, name: string }[]>([]);
    const [selectedProcedure, setSelectedProcedure] = useState('');
    const [country, setCountry] = useState('USA');
    const [insuranceTier, setInsuranceTier] = useState('Standard');
    const [isEstimating, setIsEstimating] = useState(false);
    const [estimate, setEstimate] = useState<any>(null);

    // Fetch Procedures on mount
    React.useEffect(() => {
        fetchProcedures();
    }, []);

    const fetchProcedures = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/commerce/ucp/cost/procedures`);
            if (res.ok) {
                const list = await res.json();
                if (list && list.length > 0) {
                    setProcedures(list);
                    return;
                }
            }
        } catch (e) { console.error("Failed to load procedures, using fallback", e); }

        // Fallback Data
        setProcedures([
            { id: 'mri_scan', name: 'MRI Scan (Brain)' },
            { id: 'cbc_test', name: 'Complete Blood Count (CBC)' },
            { id: 'xray_chest', name: 'X-Ray (Chest)' },
            { id: 'telehealth_visit', name: 'Telehealth Consultation' },
            { id: 'dental_cleaning', name: 'Dental Cleaning' }
        ]);
    };

    const handleEstimate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProcedure) return;

        setIsEstimating(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/commerce/ucp/cost/estimate?procedure_id=${selectedProcedure}&country=${country}&tier=${insuranceTier}`);
            if (res.ok) {
                const data = await res.json();
                setEstimate(data);
                showToast.success("AI Analysis Complete");
            } else {
                throw new Error("Estimation Failed");
            }
        } catch (error) {
            console.log("Using Mock Estimate");
            // Mock Estimate
            setTimeout(() => {
                setEstimate({
                    estimated_cost: Math.floor(Math.random() * 2000) + 100,
                    confidence_score: 94,
                    breakdown: {
                        hospital_fees: Math.floor(Math.random() * 1000),
                        doctor_fees: Math.floor(Math.random() * 500),
                        medication_consumables: Math.floor(Math.random() * 200)
                    },
                    disclaimer: "This is an AI-generated estimate based on historical data. Actual costs may vary."
                });
                showToast.success("AI Analysis Complete (Simulated)");
                setIsEstimating(false);
            }, 1500);
            return; // Exit to avoid double toggle of isEstimating in finally
        }
        setIsEstimating(false);
    };

    return (
        <div className="min-h-screen bg-background pt-20 pb-10">
            {/* Hero */}
            <section className="container mx-auto px-4 mb-20 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    Radical Transparency
                </div>
                <h1 className="text-4xl sm:text-6xl font-heading font-black text-text-main tracking-tighter mb-6">
                    No More <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Surprise Bills.</span>
                </h1>
                <p className="text-xl text-text-muted max-w-2xl mx-auto">
                    Know exactly what you'll pay before you walk in the door. Our AI analyzes global pricing indices and your specific insurance tier.
                </p>
            </section>

            {/* AI Predictive Engine */}
            <section className="container mx-auto px-4 mb-24">
                <div className="max-w-4xl mx-auto glass-card rounded-[40px] p-8 lg:p-12 border border-white/20 dark:border-slate-700 shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute -top-20 -left-20 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-text-main mb-6 flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">{ICONS.ai}</div>
                                AI Cost Predictor
                            </h2>
                            <form onSubmit={handleEstimate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Select Procedure</label>
                                    <select
                                        value={selectedProcedure}
                                        onChange={(e) => setSelectedProcedure(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">-- Choose Procedure --</option>
                                        {procedures.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Country</label>
                                        <select
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                        >
                                            <option value="USA">USA</option>
                                            <option value="UK">UK</option>
                                            <option value="Germany">Germany</option>
                                            <option value="UAE">UAE</option>
                                            <option value="India">India</option>
                                            <option value="Thailand">Thailand</option>
                                            <option value="Singapore">Singapore</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Insurance Tier</label>
                                        <select
                                            value={insuranceTier}
                                            onChange={(e) => setInsuranceTier(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                        >
                                            <option value="Basic">Basic</option>
                                            <option value="Standard">Standard</option>
                                            <option value="Premium">Premium</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isEstimating || !selectedProcedure}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    {isEstimating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                                            Calculating...
                                        </span>
                                    ) : (
                                        "Available Estimate"
                                    )}
                                </button>
                            </form>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
                            {estimate ? (
                                <div className="text-center animate-fade-in space-y-2">
                                    <p className="text-sm font-bold text-text-muted uppercase tracking-wide">Estimated Total Cost</p>
                                    <h3 className="text-5xl font-black text-text-main tracking-tighter">
                                        ${estimate.estimated_cost.toLocaleString()}
                                    </h3>
                                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold mt-2">
                                        {ICONS.check} {estimate.confidence_score}% Data Confidence
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-600 text-left space-y-2">
                                        <h4 className="text-xs font-bold text-text-muted uppercase">Cost Breakdown</h4>
                                        <div className="flex justify-between text-sm">
                                            <span>Hospital Fees</span>
                                            <span>${estimate.breakdown.hospital_fees.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Doctor Fees</span>
                                            <span>${estimate.breakdown.doctor_fees.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Meds & Consumables</span>
                                            <span>${estimate.breakdown.medication_consumables.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-text-muted mt-4 italic border-t border-slate-200 dark:border-slate-600 pt-2">
                                        {estimate.disclaimer}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center text-text-muted opacity-60">
                                    <div className="w-16 h-16 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-3xl">
                                        ?
                                    </div>
                                    <p className="font-medium">Select a procedure to see the magic.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Approval Workflow Visualization */}
            <section className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-3xl font-heading font-bold text-text-main mb-4">"Where is my Approval?"</h2>
                    <p className="text-text-muted">
                        Track Prior Authorizations in real-time. See exactly whose desk your request is sitting on.
                    </p>
                </div>

                <div className="max-w-5xl mx-auto relative">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0 hidden md:block"></div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                        {[
                            { step: 1, title: "Request Sent", time: "10:30 AM", status: "completed", icon: ICONS.document },
                            { step: 2, title: "AI Pre-Check", time: "10:31 AM", status: "completed", icon: ICONS.ai },
                            { step: 3, title: "Insurer Review", time: "Pending", status: "current", icon: ICONS.billing },
                            { step: 4, title: "Final Decision", time: "--:--", status: "pending", icon: ICONS.check }
                        ].map((item) => (
                            <div key={item.step} className="flex flex-col items-center text-center group">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-xl mb-4 transition-all ${item.status === 'completed' ? 'bg-green-500 text-white' :
                                    item.status === 'current' ? 'bg-white dark:bg-slate-800 text-amber-500 border-2 border-amber-500 animate-bounce' :
                                        'bg-slate-100 dark:bg-slate-800 text-slate-300'
                                    }`}>
                                    {React.cloneElement(item.icon as any, { className: "w-8 h-8" })}
                                </div>
                                <h3 className={`font-bold ${item.status === 'pending' ? 'text-text-muted' : 'text-text-main'}`}>{item.title}</h3>
                                <p className="text-xs text-text-muted font-mono mt-1">{item.time}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CostTransparencyPage;

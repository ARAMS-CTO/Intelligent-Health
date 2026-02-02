import React, { useState } from 'react';
import { DataService as ApiService } from '../../services/api';

interface PrescriptionAssistantProps {
    patientId: string;
    onPrescribe?: () => void;
}

export const PrescriptionAssistant: React.FC<PrescriptionAssistantProps> = ({ patientId, onPrescribe }) => {
    const [medication, setMedication] = useState("");
    const [dosage, setDosage] = useState("");
    const [notes, setNotes] = useState("");
    const [interactionResult, setInteractionResult] = useState<any>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const checkInteractions = async () => {
        if (!medication) return;
        setIsChecking(true);
        try {
            const res = await ApiService.checkDrugInteraction(patientId, medication, dosage);
            setInteractionResult(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsChecking(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await ApiService.createPrescription({
                patient_id: patientId,
                medication_name: medication,
                dosage,
                frequency: "Daily", // Simplified for demo
                duration: "7 days",
                notes
            });
            if (onPrescribe) onPrescribe();
            setMedication("");
            setDosage("");
            setInteractionResult(null);
            alert("Prescription Sent!");
        } catch (e) {
            alert("Error sending prescription");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 text-primary">💊 Digital Prescription</h3>

            <div className="space-y-3">
                <div>
                    <label className="text-xs font-bold opacity-70">Medication</label>
                    <div className="flex gap-2">
                        <input
                            className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                            value={medication}
                            onChange={(e) => setMedication(e.target.value)}
                            placeholder="e.g. Amoxicillin"
                        />
                        <input
                            className="w-24 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                            value={dosage}
                            onChange={(e) => setDosage(e.target.value)}
                            placeholder="500mg"
                        />
                    </div>
                </div>

                {/* AI Check Button */}
                <button
                    onClick={checkInteractions}
                    disabled={isChecking || !medication}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500 disabled:opacity-50 flex items-center gap-1"
                >
                    {isChecking ? "Checking AI..." : "✨ Check Interactions"}
                </button>

                {/* Interaction Result */}
                {interactionResult && (
                    <div className={`p-3 rounded-lg text-sm ${interactionResult.status === 'safe' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-900'
                        }`}>
                        <div className="font-bold mb-1">
                            {interactionResult.status === 'safe' ? '✅ No Interactions found' : '⚠️ Interaction Alert'}
                        </div>
                        <p>{interactionResult.message}</p>
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold opacity-70">Notes</label>
                    <textarea
                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 h-20"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !medication}
                    className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover transition-colors"
                >
                    {isSubmitting ? "Sending..." : "Send Prescription"}
                </button>
            </div>
        </div>
    );
};

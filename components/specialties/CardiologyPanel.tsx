import React, { useState } from 'react';
import { ICONS } from '../../constants/index';
import { GeminiService } from '../../services/api';

interface CardiologyPanelProps {
    caseId: string;
    patientAge: number;
    patientSex: string;
    history: string;
}

const CardiologyPanel: React.FC<CardiologyPanelProps> = ({ caseId, patientAge, patientSex, history }) => {
    const [dvtScore, setDvtScore] = useState<number | null>(null);
    const [longevityPlan, setLongevityPlan] = useState<string>("");
    const [isLoadingPlan, setIsLoadingPlan] = useState(false);

    // Mock Wells Score Criteria
    const [criteria, setCriteria] = useState<{ [key: string]: boolean }>({
        activeCancer: false,
        bedridden: false,
        swelling: false,
        tenderness: false,
    });

    const calculateDvt = () => {
        let score = 0;
        if (criteria.activeCancer) score += 1;
        if (criteria.bedridden) score += 1;
        if (criteria.swelling) score += 1;
        if (criteria.tenderness) score += 1;
        setDvtScore(score);
    };

    const generateLongevityPlan = async () => {
        setIsLoadingPlan(true);
        // In reality, this would call a specific endpoint or use the generic AI agent with a prompt
        try {
            // Mocking the AI call for now or using general chat
            const prompt = `Generate a Heart Longevity Plan for a ${patientAge} year old ${patientSex} with history: ${history}. Focus on diet, exercise, and screening.`;
            const plan = await GeminiService.getGeneralChatResponse([], prompt);
            setLongevityPlan(plan);
        } catch (e) {
            setLongevityPlan("Could not generate plan.");
        } finally {
            setIsLoadingPlan(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* DVT Risk Calculator */}
            <div className="glass-card p-6 rounded-2xl border-l-4 border-red-500">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    {ICONS.riskHigh} DVT Risk Calculator (Wells Score)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                        <input type="checkbox" checked={criteria.activeCancer} onChange={e => setCriteria({ ...criteria, activeCancer: e.target.checked })} className="rounded text-red-500 focus:ring-red-500" />
                        <span className="font-bold text-sm">Active Cancer</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                        <input type="checkbox" checked={criteria.bedridden} onChange={e => setCriteria({ ...criteria, bedridden: e.target.checked })} className="rounded text-red-500 focus:ring-red-500" />
                        <span className="font-bold text-sm">Bedridden {'>'} 3 days</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                        <input type="checkbox" checked={criteria.swelling} onChange={e => setCriteria({ ...criteria, swelling: e.target.checked })} className="rounded text-red-500 focus:ring-red-500" />
                        <span className="font-bold text-sm">Calf Swelling {'>'} 3cm</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                        <input type="checkbox" checked={criteria.tenderness} onChange={e => setCriteria({ ...criteria, tenderness: e.target.checked })} className="rounded text-red-500 focus:ring-red-500" />
                        <span className="font-bold text-sm">Localized Tenderness</span>
                    </label>
                </div>
                <div className="flex justify-between items-center">
                    <button onClick={calculateDvt} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                        Calculate Risk
                    </button>
                    {dvtScore !== null && (
                        <div className={`text-xl font-black ${dvtScore >= 2 ? 'text-red-500' : 'text-green-500'}`}>
                            Score: {dvtScore} ({dvtScore >= 2 ? 'High Risk' : 'Low Risk'})
                        </div>
                    )}
                </div>
            </div>

            {/* Heart Longevity Plan */}
            <div className="glass-card p-6 rounded-2xl border-l-4 border-indigo-500">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    {ICONS.heart || <span className="text-2xl">❤️</span>} AI Heart Longevity Plan
                </h3>
                {!longevityPlan && (
                    <button onClick={generateLongevityPlan} disabled={isLoadingPlan} className="w-full bg-indigo-50 text-indigo-600 font-bold py-8 rounded-xl border-2 border-dashed border-indigo-200 hover:bg-indigo-100 transition-colors flex flex-col items-center gap-2">
                        {isLoadingPlan ? <span className="animate-spin">⌛</span> : <span className="text-2xl">✨</span>}
                        Generate Personalized Longevity Plan
                    </button>
                )}
                {longevityPlan && (
                    <div className="prose dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl">
                        <pre className="whitespace-pre-wrap font-sans text-sm">{longevityPlan}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(CardiologyPanel);

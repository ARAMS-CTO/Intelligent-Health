
import React, { useState, useEffect, useMemo } from 'react';
import { ICONS } from '../constants';

type Gender = 'Male' | 'Female';

interface BodyPart {
    id: string;
    name: string;
    keywords: string[];
    path: string; // SVG Path
    color: string;
    icon: React.ReactNode;
    layer?: 'base' | 'overlay' | 'internal'; // Order of rendering
    genderSpecific?: Gender; // If set, only shows for this gender
}

interface InteractiveBodyMapProps {
    medicalRecords?: any[];
    onPartSelect?: (partId: string) => void;
    userGender?: string; // Optional prop to init gender
}

// Coordinate System: 0 0 200 600 (Higher res for detail)
const PATHS = {
    male: {
        head: "M 100 20 C 80 20 70 40 70 60 C 70 90 80 100 100 100 C 120 100 130 90 130 60 C 130 40 120 20 100 20",
        neck: "M 85 100 L 85 120 L 115 120 L 115 100",
        shoulders: "M 85 120 L 40 130 L 40 160 L 70 140 L 130 140 L 160 160 L 160 130 L 115 120",
        chest: "M 70 140 L 70 220 C 70 240 130 240 130 220 L 130 140",
        arms: "M 40 160 L 30 300 L 50 300 L 60 170 M 160 160 L 170 300 L 150 300 L 140 170",
        hands: "M 30 300 L 20 330 L 60 330 L 50 300 M 170 300 L 180 330 L 140 330 L 150 300",
        fingers: "M 20 330 L 15 350 L 65 350 L 60 330 M 180 330 L 185 350 L 135 350 L 140 330",
        abdomen: "M 70 220 L 75 300 L 125 300 L 130 220",
        genitals: "M 85 300 L 90 330 L 110 330 L 115 300",
        thighs: "M 75 300 L 70 420 L 90 420 L 95 330 L 105 330 L 110 420 L 130 420 L 125 300",
        knees: "M 70 420 L 68 450 L 92 450 L 90 420 M 110 420 L 108 450 L 132 450 L 130 420",
        calves: "M 68 450 L 70 550 L 90 550 L 92 450 M 108 450 L 110 550 L 130 550 L 132 450",
        ankles: "M 70 550 L 68 565 L 92 565 L 90 550 M 110 550 L 108 565 L 132 565 L 130 550",
        feet: "M 68 565 L 60 590 L 95 590 L 92 565 M 108 565 L 100 590 L 135 590 L 132 565",
    },
    female: {
        head: "M 100 25 C 85 25 75 40 75 60 C 75 85 85 95 100 95 C 115 95 125 85 125 60 C 125 40 115 25 100 25",
        neck: "M 90 95 L 90 115 L 110 115 L 110 95",
        shoulders: "M 90 115 L 50 125 L 50 150 L 80 140 L 120 140 L 150 150 L 150 125 L 110 115",
        chest: "M 80 140 L 75 210 C 75 230 125 230 125 210 L 120 140", // Breasts implied by curve
        arms: "M 50 150 L 45 280 L 60 280 L 70 160 M 150 150 L 155 280 L 140 280 L 130 160",
        hands: "M 45 280 L 40 310 L 65 310 L 60 280 M 155 280 L 160 310 L 135 310 L 140 280",
        fingers: "M 40 310 L 38 330 L 67 330 L 65 310 M 160 310 L 162 330 L 133 330 L 135 310",
        abdomen: "M 75 210 L 70 290 L 130 290 L 125 210", // Wider hips
        genitals: "M 90 290 L 95 310 L 105 310 L 110 290",
        thighs: "M 70 290 L 65 410 L 85 410 L 95 320 L 105 320 L 115 410 L 135 410 L 130 290",
        knees: "M 65 410 L 65 440 L 85 440 L 85 410 M 115 410 L 115 440 L 135 440 L 135 410",
        calves: "M 65 440 L 68 540 L 82 540 L 85 440 M 115 440 L 118 540 L 132 540 L 135 440",
        ankles: "M 68 540 L 68 555 L 82 555 L 82 540 M 118 540 L 118 555 L 132 555 L 132 540",
        feet: "M 68 555 L 65 580 L 85 580 L 82 555 M 118 555 L 115 580 L 135 580 L 132 555",
    }
};

// Internal Organ Overlays (Shared or lightly adjusted)
const INTERNAL_PATHS = {
    brain: "M 90 35 C 80 35 80 55 90 55 C 85 65 115 65 110 55 C 120 55 120 35 110 35 Z",
    heart: "M 105 160 C 110 155 115 155 118 160 C 120 165 115 175 105 180 C 95 175 90 165 92 160 C 95 155 100 155 105 160",
    lungs: "M 85 150 Q 75 150 75 170 Q 75 190 85 195 L 115 195 Q 125 190 125 170 Q 125 150 115 150 Z",
    liver: "M 90 230 Q 80 230 80 250 L 100 250 Q 110 240 110 230 Z",
    colon: "M 85 260 L 80 290 L 120 290 L 115 260 M 90 290 L 95 310 L 105 310 L 110 290", // Abstract rep
    veins: "M 45 170 L 35 290 M 155 170 L 165 290 M 75 310 L 75 540 M 125 310 L 125 540", // Simple lines
};


const getBodyParts = (gender: Gender): BodyPart[] => {
    const p = PATHS[gender.toLowerCase() as 'male' | 'female'];
    return [
        // Base Layer - Outer Shell
        { id: 'head', name: 'Head & Brain', keywords: ['brain', 'neuro', 'head', 'migraine', 'psych'], path: p.head, color: 'text-purple-500', icon: ICONS.ai, layer: 'base' },
        { id: 'neck', name: 'Neck & Throat', keywords: ['throat', 'thyroid', 'neck'], path: p.neck, color: 'text-gray-500', icon: ICONS.symptomCheck, layer: 'base' },
        { id: 'shoulders', name: 'Shoulders', keywords: ['shoulder', 'rotator', 'clavicle'], path: p.shoulders, color: 'text-orange-500', icon: ICONS.activity, layer: 'base' },
        { id: 'chest', name: 'Chest', keywords: ['chest', 'breast', 'pectoral'], path: p.chest, color: 'text-blue-500', icon: ICONS.symptomCheck, layer: 'base' },
        { id: 'abdomen', name: 'Abdomen', keywords: ['stomach', 'belly', 'abdomen'], path: p.abdomen, color: 'text-amber-500', icon: ICONS.pill, layer: 'base' },
        { id: 'genitals', name: 'Reproductive & Urinary', keywords: ['genital', 'sex', 'urinary', 'reproductive', 'prostate', 'uterine', 'bladder'], path: p.genitals, color: 'text-pink-500', icon: ICONS.symptomCheck, layer: 'base' },
        { id: 'thighs', name: 'Thighs', keywords: ['thigh', 'femur'], path: p.thighs, color: 'text-indigo-500', icon: ICONS.activity, layer: 'base' },
        { id: 'knees', name: 'Knees', keywords: ['knee', 'meniscus', 'acl'], path: p.knees, color: 'text-orange-500', icon: ICONS.activity, layer: 'base' },
        { id: 'calves', name: 'Calves & Shins', keywords: ['calf', 'shin'], path: p.calves, color: 'text-indigo-500', icon: ICONS.activity, layer: 'base' },
        { id: 'ankles', name: 'Ankles', keywords: ['ankle'], path: p.ankles, color: 'text-orange-500', icon: ICONS.activity, layer: 'base' },
        { id: 'feet', name: 'Feet', keywords: ['foot', 'feet', 'toe', 'plantar'], path: p.feet, color: 'text-indigo-500', icon: ICONS.activity, layer: 'base' },
        { id: 'arms', name: 'Arms', keywords: ['arm', 'bicep', 'elbow'], path: p.arms, color: 'text-orange-500', icon: ICONS.activity, layer: 'base' },
        { id: 'hands', name: 'Hands & Wrists', keywords: ['hand', 'wrist', 'carpal'], path: p.hands, color: 'text-orange-500', icon: ICONS.activity, layer: 'base' },
        { id: 'fingers', name: 'Fingers', keywords: ['finger', 'thumb'], path: p.fingers, color: 'text-orange-500', icon: ICONS.activity, layer: 'base' },

        // Internal Layer (Overlays)
        { id: 'brain', name: 'Brain', keywords: ['brain', 'stroke', 'seizure'], path: INTERNAL_PATHS.brain, color: 'text-purple-300', icon: ICONS.ai, layer: 'internal' },
        { id: 'lungs', name: 'Lungs', keywords: ['lung', 'respiratory', 'asthma', 'pneumonia'], path: INTERNAL_PATHS.lungs, color: 'text-sky-300', icon: ICONS.symptomCheck, layer: 'internal' },
        { id: 'heart', name: 'Heart', keywords: ['heart', 'cardio', 'coronary', 'atrial'], path: INTERNAL_PATHS.heart, color: 'text-red-500', icon: ICONS.activity, layer: 'internal' },
        { id: 'liver', name: 'Liver & Gut', keywords: ['liver', 'hepatic'], path: INTERNAL_PATHS.liver, color: 'text-rose-400', icon: ICONS.pill, layer: 'internal' },
        { id: 'colon', name: 'Colon & Rectum', keywords: ['colon', 'rectum', 'bowel', 'hemorrhoids', 'anal', 'digestive'], path: INTERNAL_PATHS.colon, color: 'text-amber-700', icon: ICONS.pill, layer: 'internal' },

        // Circulatory
        { id: 'veins', name: 'Circulatory / Veins', keywords: ['vein', 'dvt', 'vascular', 'blood', 'thrombosis'], path: INTERNAL_PATHS.veins, color: 'text-red-400', icon: ICONS.activity, layer: 'overlay' },
    ];
};

export const InteractiveBodyMap: React.FC<InteractiveBodyMapProps & { weight?: number; height?: number; heartRate?: number }> = ({ medicalRecords = [], onPartSelect, userGender = 'Male', weight = 70, height = 175, heartRate = 70 }) => {
    // Gender locked to Profile/Prop
    const gender = (userGender === 'Female' || userGender === 'female') ? 'Female' : 'Male';
    const [selectedPart, setSelectedPart] = useState<string | null>(null);
    const [hoveredPart, setHoveredPart] = useState<string | null>(null);

    // BMI Calculation for Visual Scaling (Digital Twin)
    const bmi = weight / ((height / 100) * (height / 100));
    const scaleX = useMemo(() => {
        if (bmi < 18.5) return 0.9;
        if (bmi > 25) return Math.min(1.3, 1 + ((bmi - 25) * 0.015));
        return 1;
    }, [bmi]);

    // Heart Beat Animation Speed
    const beatDuration = useMemo(() => 60 / Math.max(40, Math.min(180, heartRate)), [heartRate]);

    // Recompute body parts when gender changes
    const currentBodyParts = useMemo(() => getBodyParts(gender), [gender]);

    const activeConditions = useMemo(() => {
        const conditions: Record<string, string[]> = {};
        medicalRecords.forEach(record => {
            const text = (record.title + ' ' + (record.aiSummary || '') + ' ' + (record.type || '') + ' ' + (record.contentText || '')).toLowerCase();
            currentBodyParts.forEach(part => {
                if (part.keywords.some(k => text.includes(k))) {
                    if (!conditions[part.id]) conditions[part.id] = [];
                    const snippet = record.aiSummary ? record.aiSummary.substring(0, 50) + '...' : record.title;
                    if (!conditions[part.id].includes(snippet)) conditions[part.id].push(snippet);
                }
            });
            // Propagate 'legs' keyword to thighs/knees/calves active if generic
            if (text.includes('leg') && !text.includes('thigh') && !text.includes('calf') && !text.includes('knee')) {
                ['thighs', 'knees', 'calves'].forEach(sub => {
                    if (!conditions[sub]) conditions[sub] = [];
                    if (!conditions[sub].includes("General Leg Issue")) conditions[sub].push("General Leg Issue");
                });
            }
        });
        return conditions;
    }, [medicalRecords, currentBodyParts]);

    const handlePartClick = (partId: string) => {
        setSelectedPart(partId);
        if (onPartSelect) onPartSelect(partId);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in pb-20">
            {/* Visual Map Container */}
            <div className="relative flex-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-8 min-h-[600px] flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden group">

                {/* Background Grid/Effect */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full transform scale-50 animate-pulse"></div>

                <a href="/dashboard" className="absolute top-6 left-6 z-20 text-white/50 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold">
                    ← Dashboard
                </a>

                {/* Header Controls */}
                <div className="absolute top-16 left-6 z-10">
                    <h3 className="text-white font-bold text-lg flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Bio-Digital Twin
                    </h3>
                    <p className="text-slate-400 text-xs text-left ml-6">
                        BMI: {bmi.toFixed(1)} • {gender.toUpperCase()}
                        <br />
                        HR: {heartRate} BPM (Live)
                    </p>
                </div>

                {/* SVG Render */}
                <svg viewBox="0 0 200 600" className="h-[500px] w-auto drop-shadow-2xl z-0 transform transition-transform duration-700 ease-out hover:scale-[1.02]">
                    <defs>
                        <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                        </linearGradient>
                    </defs>

                    {/* Render Parts */}
                    {/* Render Order: Base -> Internal -> Overlay */}
                    {['base', 'internal', 'overlay'].map(layer =>
                        currentBodyParts.filter(p => p.layer === layer).map(part => {
                            const stats = activeConditions[part.id] || [];
                            const hasCondition = stats.length > 0;
                            const isHovered = hoveredPart === part.id;
                            const isSelected = selectedPart === part.id;

                            // Style Logic
                            let fill = "url(#bodyGradient)";
                            if (layer === 'internal' || layer === 'overlay') fill = "rgba(255,255,255,0.1)"; // Default internal

                            if (hasCondition) {
                                if (part.color.includes('red')) fill = "#EF4444";
                                else if (part.color.includes('blue')) fill = "#3B82F6";
                                else if (part.color.includes('amber')) fill = "#F59E0B";
                                else if (part.color.includes('purple')) fill = "#A855F7";
                                else if (part.color.includes('pink')) fill = "#EC4899";
                                else fill = "#F59E0B"; // Default warning
                            }

                            if (layer === 'overlay' && part.id === 'veins') {
                                fill = "none"; // Veins are strokes
                            }

                            const opacity = isSelected ? 0.8 : (isHovered ? 0.6 : (hasCondition ? 0.7 : (layer === 'base' ? 1.0 : 0.0)));
                            // Veins always visible slightly
                            const finalOpacity = (part.id === 'veins' && !hasCondition && !isHovered) ? 0.1 : opacity;

                            return (
                                <g
                                    key={part.id}
                                    onClick={(e) => { e.stopPropagation(); handlePartClick(part.id); }}
                                    onMouseEnter={() => setHoveredPart(part.id)}
                                    onMouseLeave={() => setHoveredPart(null)}
                                    className="cursor-pointer transition-all duration-300"
                                >
                                    <path
                                        d={part.path}
                                        fill={part.id === 'veins' ? 'none' : fill}
                                        fillOpacity={finalOpacity}
                                        stroke={isSelected ? "white" : (hasCondition ? "#fff" : "rgba(255,255,255,0.2)")}
                                        strokeWidth={isSelected ? 1.5 : (part.id === 'veins' ? 1 : 0.5)}
                                        filter={hasCondition || isHovered ? "url(#glow-active)" : ""}
                                        className="transition-all duration-300"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {hasCondition && (layer === 'base' || layer === 'internal') && (
                                        // Alert DOT center calculation approximation
                                        // Just placing it purely via path is hard, so we assume visual scan. 
                                        // We'll skip precise dot placement for complex paths to avoid clutter, 
                                        // reliant on glow effect.
                                        null
                                    )}
                                </g>
                            );
                        })
                    )}
                </svg>

                {/* Footer Status */}
                <div className="absolute bottom-6 left-6 right-6 flex justifies-between text-[10px] text-slate-500 font-mono">
                    <span>STATUS: MONITORING</span>
                    <span className="ml-auto">ID: {gender === 'Male' ? 'M-8392' : 'F-9281'}</span>
                </div>

                {/* Floating Label */}
                {(hoveredPart || selectedPart) && (
                    <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
                        <span className="inline-block bg-slate-900/80 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-lg shadow-2xl text-sm font-bold uppercase tracking-widest animate-slide-up-fade-in">
                            {currentBodyParts.find(p => p.id === (hoveredPart || selectedPart))?.name}
                        </span>
                    </div>
                )}
            </div>

            {/* Info / Analysis Panel */}
            <div className="w-full lg:w-1/3 space-y-4">
                <div className={`glass-card rounded-[30px] p-6 border border-white/20 dark:border-slate-700 h-full min-h-[500px] transition-all duration-500 ${selectedPart ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-100'}`}>
                    {selectedPart ? (
                        <div className="animate-fade-in h-full flex flex-col">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700/50">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${currentBodyParts.find(p => p.id === selectedPart)?.color.replace('text-', 'bg-').replace('500', '100')
                                    || 'bg-gray-100'
                                    }`}>
                                    {currentBodyParts.find(p => p.id === selectedPart)?.icon || ICONS.activity}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-text-main">
                                        {currentBodyParts.find(p => p.id === selectedPart)?.name}
                                    </h2>
                                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider mt-1">
                                        Physiological Zone {currentBodyParts.findIndex(p => p.id === selectedPart) + 1}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                                {activeConditions[selectedPart] && activeConditions[selectedPart].length > 0 ? (
                                    <>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-bold text-text-muted text-xs uppercase flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                    Active Conditions
                                                </h4>
                                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                                                    {activeConditions[selectedPart].length} DETECTED
                                                </span>
                                            </div>
                                            {activeConditions[selectedPart].map((condition, i) => (
                                                <div key={i} className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 flex gap-3">
                                                    <div className="mt-1 text-red-500 text-lg">⚠️</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">"{condition}"</p>
                                                        <p className="text-xs text-red-400 mt-1">Source: Medical Records</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🤖</div>
                                            <h5 className="font-bold text-sm mb-2 flex items-center gap-2">
                                                {ICONS.ai} AI Analysis
                                            </h5>
                                            <p className="text-sm opacity-90 leading-relaxed">
                                                Based on your history, symptoms in the <strong>{selectedPart}</strong> region may indicate localized inflammation.
                                                Recommended action: Monitor for swelling and schedule a follow-up if pain persists &gt; 3 days.
                                            </p>
                                            <button className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all">
                                                View Clinical Guidelines &rarr;
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-16 opacity-60 flex flex-col items-center">
                                        <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-3xl mb-4 text-green-500">
                                            ✓
                                        </div>
                                        <h4 className="text-lg font-bold text-text-main">Healthy</h4>
                                        <p className="text-sm text-text-muted mt-2 max-w-[200px]">
                                            No active conditions detected in this region based on your current records.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
                                <div className="w-24 h-24 bg-gradient-to-tr from-slate-100 to-white dark:from-slate-800 dark:to-slate-700 rounded-3xl flex items-center justify-center text-4xl shadow-xl relative z-10 border border-white/50">
                                    👆
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-text-main mb-3">Interactive Twin</h3>
                            <p className="text-text-muted leading-relaxed max-w-xs mx-auto">
                                Select a specific body zone on the digital twin to visualize detailed health metrics, identified conditions, and AI-driven insights for that region.
                            </p>
                            <div className="mt-8 flex gap-2 text-xs font-mono text-slate-400">
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">R: MALE/FEMALE</span>
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">V: 2.1.0</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

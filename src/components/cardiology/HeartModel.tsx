import React, { useState } from 'react';

interface HeartModelProps {
    onPartSelect: (partId: string) => void;
    selectedPart: string | null;
}

export const HeartModel: React.FC<HeartModelProps> = ({ onPartSelect, selectedPart }) => {
    // Simplified Interactive Heart SVG
    const partClass = "hover:fill-red-500 hover:opacity-80 cursor-pointer transition-all duration-300";
    const selectedClass = "fill-red-600 stroke-white stroke-2 drop-shadow-lg";
    const defaultFill = "fill-red-400";

    return (
        <div className="relative w-full aspect-square max-w-[400px] mx-auto">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl animate-pulse-slow">
                {/* Right Atrium (User's Left) */}
                <path
                    d="M60,60 Q40,60 40,90 Q40,120 70,110 Z"
                    className={`${selectedPart === 'right_atrium' ? selectedClass : defaultFill} ${partClass}`}
                    onClick={() => onPartSelect('right_atrium')}
                />
                <text x="50" y="85" className="text-[6px] fill-white font-bold pointer-events-none">RA</text>

                {/* Left Atrium (User's Right) */}
                <path
                    d="M140,60 Q160,60 160,90 Q160,120 130,110 Z"
                    className={`${selectedPart === 'left_atrium' ? selectedClass : defaultFill} ${partClass}`}
                    onClick={() => onPartSelect('left_atrium')}
                />
                <text x="145" y="85" className="text-[6px] fill-white font-bold pointer-events-none">LA</text>

                {/* Right Ventricle */}
                <path
                    d="M70,110 Q40,130 95,180 Q100,160 100,130 Z"
                    className={`${selectedPart === 'right_ventricle' ? selectedClass : defaultFill} ${partClass}`}
                    onClick={() => onPartSelect('right_ventricle')}
                />
                <text x="75" y="140" className="text-[6px] fill-white font-bold pointer-events-none">RV</text>

                {/* Left Ventricle */}
                <path
                    d="M130,110 Q160,130 105,180 Q100,160 100,130 Z"
                    className={`${selectedPart === 'left_ventricle' ? selectedClass : defaultFill} ${partClass}`}
                    onClick={() => onPartSelect('left_ventricle')}
                />
                <text x="120" y="140" className="text-[6px] fill-white font-bold pointer-events-none">LV</text>

                {/* Aorta */}
                <path
                    d="M90,40 Q100,10 110,40 L110,60 L90,60 Z"
                    className={`${selectedPart === 'aorta' ? selectedClass : 'fill-red-300'} ${partClass}`}
                    onClick={() => onPartSelect('aorta')}
                />
                <text x="95" y="45" className="text-[6px] fill-white font-bold pointer-events-none">Aorta</text>
            </svg>

            <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">Interactive Heart</p>
                <div className="flex justify-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Live Simulation</span>
                </div>
            </div>
        </div>
    );
};

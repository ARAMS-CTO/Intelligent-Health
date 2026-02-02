import React from 'react';

interface EyeModelProps {
    onPartSelect: (partId: string) => void;
    selectedPart: string | null;
}

export const EyeModel: React.FC<EyeModelProps> = ({ onPartSelect, selectedPart }) => {
    // Interactive Eye Cross-Section SVG
    const partClass = "hover:fill-blue-500 hover:opacity-80 cursor-pointer transition-all duration-300";
    const selectedClass = "fill-blue-600 stroke-white stroke-2 drop-shadow-lg";
    const defaultFill = "fill-cyan-100 dark:fill-slate-700";
    const lensFill = "fill-blue-200/50";

    return (
        <div className="relative w-full aspect-square max-w-[400px] mx-auto">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                {/* Sclera (Outer White) */}
                <circle cx="100" cy="100" r="90" className="fill-white stroke-slate-200 dark:stroke-slate-600 stroke-2" />

                {/* Cornea (Front Bulge) */}
                <path
                    d="M60,100 Q50,70 90,50 L110,50 Q150,70 140,100 Q150,130 110,150 L90,150 Q50,130 60,100 Z"
                    className={`${selectedPart === 'cornea' ? selectedClass : 'fill-blue-100/30'} ${partClass}`}
                    onClick={() => onPartSelect('cornea')}
                />

                {/* Iris (Colored Part) */}
                <path
                    d="M80,70 Q100,60 120,70 L120,130 Q100,140 80,130 Z"
                    className={`${selectedPart === 'iris' ? selectedClass : 'fill-indigo-400'} ${partClass}`}
                    onClick={() => onPartSelect('iris')}
                />

                {/* Pupil (Center hole) */}
                <circle cx="100" cy="100" r="15" className="fill-black pointer-events-none" />

                {/* Lens (Behind Iris) */}
                <ellipse
                    cx="100" cy="100" rx="10" ry="25"
                    className={`${selectedPart === 'lens' ? selectedClass : lensFill} ${partClass}`}
                    onClick={() => onPartSelect('lens')}
                />

                {/* Retina (Back lining) */}
                <path
                    d="M180,100 Q180,50 140,30 L160,30 Q190,60 190,100 Q190,140 160,170 L140,170 Q180,150 180,100 Z"
                    className={`${selectedPart === 'retina' ? selectedClass : 'fill-red-400/20'} ${partClass}`}
                    onClick={() => onPartSelect('retina')}
                />

                {/* Optic Nerve */}
                <rect
                    x="185" y="90" width="15" height="20"
                    className={`${selectedPart === 'optic_nerve' ? selectedClass : 'fill-yellow-200'} ${partClass}`}
                    onClick={() => onPartSelect('optic_nerve')}
                />

                {/* Labels (visible on hover or always?) - Let's keep clean for now */}
            </svg>

            <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">Interactive Eye Anatomy</p>
                <div className="flex justify-center flex-wrap gap-2 mt-2 px-8">
                    {['cornea', 'iris', 'lens', 'retina', 'optic_nerve'].map(part => (
                        <span
                            key={part}
                            onClick={() => onPartSelect(part)}
                            className={`text-[8px] uppercase font-bold px-2 py-1 rounded-full cursor-pointer transition-colors ${selectedPart === part ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                        >
                            {part.replace('_', ' ')}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

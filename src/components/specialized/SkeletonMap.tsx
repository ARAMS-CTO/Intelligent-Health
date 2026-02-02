
import React from 'react';

interface SkeletonMapProps {
    selectedJoint: string | null;
    onSelect: (jointId: string) => void;
    statuses?: Record<string, string>; // 'healthy', 'issue', 'recovering'
}

export const SkeletonMap: React.FC<SkeletonMapProps> = ({ selectedJoint, onSelect, statuses = {} }) => {

    // Helper to get fill color based on status and selection
    const getFill = (id: string) => {
        const isSelected = selectedJoint === id;
        const status = statuses[id];

        if (isSelected) return "#6366f1"; // Primary color (Indigo)

        switch (status) {
            case 'issue': return "#ef4444"; // Red
            case 'recovering': return "#3b82f6"; // Blue
            case 'healthy': return "#22c55e"; // Green
            default: return "#cbd5e1"; // Slate-300 (Neutral)
        }
    };

    const getOpacity = (id: string) => {
        return selectedJoint === id ? 0.8 : 0.4;
    }

    // Interactive Regions
    const regions = [
        { id: 'head', name: 'Head & Neck', path: "M100 20 A 15 15 0 0 1 100 50 A 15 15 0 0 1 100 20 M100 50 L100 60" },
        { id: 'shoulders', name: 'Shoulders', path: "M70 65 L130 65 L140 90 L60 90 Z" },
        { id: 'spine', name: 'Spine', path: "M90 65 L110 65 L105 140 L95 140 Z" },
        { id: 'arms', name: 'Arms', path: "M60 90 L50 160 M140 90 L150 160" }, // Simplified lines for arms
        { id: 'hips', name: 'Hips', path: "M80 140 L120 140 L125 170 L75 170 Z" },
        { id: 'knees', name: 'Knees', path: "M85 170 L80 240 M115 170 L120 240" } // Thighs/Knees
    ];

    return (
        <div className="relative w-full h-[400px] flex items-center justify-center select-none">
            <svg viewBox="0 0 200 300" className="h-full drop-shadow-lg">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background Silhouette (optional guide) */}
                <path d="M100 10 C 130 10 160 50 160 100 C 160 200 130 290 100 290 C 70 290 40 200 40 100 C 40 50 70 10 100 10"
                    fill="#f1f5f9" className="dark:fill-slate-800" stroke="none" />

                {/* Render Interactive Regions */}
                {regions.map(region => (
                    <g
                        key={region.id}
                        onClick={() => onSelect(region.id)}
                        className="cursor-pointer transition-all duration-300 hover:opacity-100 group"
                        style={{ opacity: selectedJoint === region.id ? 1 : 0.8 }}
                    >
                        <path
                            d={region.path}
                            stroke={getFill(region.id)}
                            strokeWidth={selectedJoint === region.id ? "4" : "3"}
                            fill={getFill(region.id)}
                            fillOpacity={selectedJoint === region.id ? 0.3 : 0.1}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter={selectedJoint === region.id ? "url(#glow)" : ""}
                        />
                        {/* Label on Hover */}
                        <title>{region.name}</title>
                    </g>
                ))}

                {/* Labels/Callouts */}
                {selectedJoint && (
                    <text x="10" y="290" className="text-xs font-bold fill-slate-500 dark:fill-slate-400">
                        Selected: {regions.find(r => r.id === selectedJoint)?.name || selectedJoint}
                    </text>
                )}
            </svg>

            {/* Overlay Instructions */}
            {!selectedJoint && (
                <div className="absolute top-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-slate-500">
                    Click a body region
                </div>
            )}
        </div>
    );
};

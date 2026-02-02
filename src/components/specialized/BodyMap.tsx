import { HealthZone } from './SpecializedHealthHub';

interface BodyMapProps {
    onZoneSelect: (zone: HealthZone) => void;
    activeZone: HealthZone;
}

export const BodyMap: React.FC<BodyMapProps> = ({ onZoneSelect, activeZone }) => {
    const hoverClass = "hover:fill-primary/20 cursor-pointer transition-colors";
    const activeClass = "fill-primary/40 stroke-primary stroke-2";

    return (
        <div className="relative w-full aspect-[1/2] bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 shadow-inner">
            <svg viewBox="0 0 200 500" className="w-full h-full drop-shadow-xl">
                {/* Silhouette */}
                <path
                    d="M100,20 C130,20 140,50 140,70 C160,80 170,110 160,180 C170,200 180,250 170,280 C160,450 120,480 100,480 C80,480 40,450 30,280 C20,250 30,200 40,180 C30,110 40,80 60,70 C60,50 70,20 100,20 Z"
                    className="fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600 stroke-[2px]"
                />

                {/* Head (Dentistry/Ophthalmology) */}
                <g onClick={() => onZoneSelect('dentistry')} className="group">
                    <circle cx="100" cy="55" r="30" className={`${activeZone === 'dentistry' ? activeClass : 'fill-transparent'} ${hoverClass}`} />
                    <text x="140" y="55" className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] fill-slate-500 font-bold">Dentistry</text>
                </g>

                {/* Eyes Detail Link (Small circles) */}
                <g onClick={(e) => { e.stopPropagation(); onZoneSelect('ophthalmology'); }} className="group">
                    <circle cx="90" cy="50" r="4" className="fill-blue-200 hover:fill-blue-400 cursor-pointer" />
                    <circle cx="110" cy="50" r="4" className="fill-blue-200 hover:fill-blue-400 cursor-pointer" />
                </g>

                {/* Chest (Cardiology) */}
                <g onClick={() => onZoneSelect('cardiology')} className="group">
                    <path d="M60,90 Q100,90 140,90 L130,160 Q100,170 70,160 Z" className={`${activeZone === 'cardiology' ? activeClass : 'fill-transparent'} ${hoverClass}`} />
                    <text x="150" y="120" className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] fill-slate-500 font-bold">Cardiology</text>
                    {/* Heart Icon */}
                    <path d="M100,115 L105,110 Q110,105 115,110 Q120,115 115,120 L100,135 L85,120 Q80,115 85,110 Q90,105 95,110 Z" className="fill-red-400/50 pointer-events-none" />
                </g>

                {/* Abdomen (Gastrology) */}
                <g onClick={() => onZoneSelect('gastrology')} className="group">
                    <path d="M70,160 Q100,170 130,160 L125,230 Q100,240 75,230 Z" className={`${activeZone === 'gastrology' ? activeClass : 'fill-transparent'} ${hoverClass}`} />
                </g>

                {/* Pelvis (Urology) */}
                <g onClick={() => onZoneSelect('urology')} className="group">
                    <path d="M75,230 Q100,240 125,230 L115,270 Q100,280 85,270 Z" className={`${activeZone === 'urology' ? activeClass : 'fill-transparent'} ${hoverClass}`} />
                </g>

                {/* Limbs (Orthopedics) - Simplified as one zone for now */}
                <g onClick={() => onZoneSelect('orthopedics')} className="group">
                    <rect x="20" y="100" width="30" height="150" rx="10" className={`${activeZone === 'orthopedics' ? activeClass : 'fill-transparent'} ${hoverClass}`} />
                    <rect x="150" y="100" width="30" height="150" rx="10" className={`${activeZone === 'orthopedics' ? activeClass : 'fill-transparent'} ${hoverClass}`} />
                    <text x="185" y="180" className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] fill-slate-500 font-bold">Orthopedics</text>
                </g>

            </svg>

            <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interactive Body Map</p>
                <p className="text-[10px] text-slate-300">Click a zone to explore</p>
            </div>
        </div>
    );
};

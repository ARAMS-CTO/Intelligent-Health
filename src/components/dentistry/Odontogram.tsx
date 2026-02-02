import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DentalChart } from '../../types/index';

interface ToothProps {
    number: number;
    condition?: string;
    selected: boolean;
    onClick: (number: number) => void;
}

const Tooth: React.FC<ToothProps> = React.memo(({ number, condition, selected, onClick }) => {
    // Simplified visual representation of a tooth
    // Top = Crown, Bottom = Root

    let colorClass = 'fill-white stroke-slate-400 dark:stroke-slate-600';
    if (condition === 'decay') colorClass = 'fill-red-400 stroke-red-600';
    if (condition === 'filled') colorClass = 'fill-slate-300 stroke-slate-500';
    if (condition === 'crown') colorClass = 'fill-yellow-400 stroke-yellow-600';
    if (condition === 'missing') colorClass = 'opacity-20';
    if (condition === 'implant') colorClass = 'fill-blue-300 stroke-blue-500';
    if (condition === 'root_canal') colorClass = 'fill-purple-300 stroke-purple-500';

    return (
        <div
            className={`flex flex-col items-center cursor-pointer transition-all transform hover:scale-110 ${selected ? 'scale-110' : ''}`}
            onClick={() => onClick(number)}
        >
            <div className="relative w-10 h-14">
                <svg viewBox="0 0 100 140" className={`w-full h-full drop-shadow-sm transition-colors ${selected ? 'drop-shadow-lg filter brightness-110' : ''}`}>
                    {/* Crown */}
                    <path
                        d="M10,40 Q10,10 50,10 Q90,10 90,40 L90,80 Q90,90 80,90 L20,90 Q10,90 10,80 Z"
                        className={`${colorClass} stroke-[3px]`}
                    />
                    {/* Roots */}
                    <path
                        d="M20,90 L25,130 Q50,120 75,130 L80,90"
                        className="fill-none stroke-slate-400 dark:stroke-slate-600 stroke-[3px]"
                    />

                    {/* Number */}
                    <text x="50" y="60" textAnchor="middle" className="text-2xl font-bold fill-slate-500 opacity-50 pointer-events-none">
                        {number}
                    </text>
                </svg>
                {selected && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                )}
            </div>
        </div>
    );
});

interface OdontogramProps {
    data?: DentalChart;
    onToothClick: (number: number) => void;
    selectedTooth: number | null;
}

export const Odontogram: React.FC<OdontogramProps> = ({ data, onToothClick, selectedTooth }) => {
    const { t } = useTranslation('dentistry');

    // Universal Numbering System
    // UR (1-8), UL (9-16)
    // LR (32-25), LL (24-17) - NOTE: Lower Right is 32..25, Lower Left is 24..17

    // Rows styling
    const rowClass = "flex justify-center gap-2 mb-4";

    return (
        <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-inner">
            <h3 className="text-center font-heading font-black text-slate-400 uppercase tracking-[0.3em] text-xs mb-8">Permanent Dentition</h3>

            {/* Maxillary (Upper) */}
            <div className="mb-8 border-b border-dashed border-slate-300 dark:border-slate-700 pb-8">
                <div className={rowClass}>
                    {/* UR 1-8 */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                        <Tooth
                            key={n}
                            number={n}
                            selected={selectedTooth === n}
                            onClick={onToothClick}
                            condition={data?.teeth?.find((t: any) => t.tooth_number === n)?.condition}
                        />
                    ))}
                    <div className="w-8 border-l border-slate-300 dark:border-slate-700 mx-2"></div>
                    {/* UL 9-16 */}
                    {[9, 10, 11, 12, 13, 14, 15, 16].map(n => (
                        <Tooth
                            key={n}
                            number={n}
                            selected={selectedTooth === n}
                            onClick={onToothClick}
                            condition={data?.teeth?.find((t: any) => t.tooth_number === n)?.condition}
                        />
                    ))}
                </div>
                <div className="text-center text-[10px] font-bold text-slate-400 uppercase">Maxillary</div>
            </div>

            {/* Mandibular (Lower) */}
            <div>
                <div className="text-center text-[10px] font-bold text-slate-400 uppercase mb-4">Mandibular</div>
                <div className={rowClass}>
                    {/* LR 32-25 */}
                    {[32, 31, 30, 29, 28, 27, 26, 25].map(n => (
                        <Tooth
                            key={n}
                            number={n}
                            selected={selectedTooth === n}
                            onClick={onToothClick}
                            condition={data?.teeth?.find((t: any) => t.tooth_number === n)?.condition}
                        />
                    ))}
                    <div className="w-8 border-l border-slate-300 dark:border-slate-700 mx-2"></div>
                    {/* LL 24-17 */}
                    {[24, 23, 22, 21, 20, 19, 18, 17].map(n => (
                        <Tooth
                            key={n}
                            number={n}
                            selected={selectedTooth === n}
                            onClick={onToothClick}
                            condition={data?.teeth?.find((t: any) => t.tooth_number === n)?.condition}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

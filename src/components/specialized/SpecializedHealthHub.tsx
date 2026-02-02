import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataService } from '../../services/api';
import { useAuth } from '../Auth';
import { BodyMap } from './BodyMap.tsx';
import { Odontogram } from '../dentistry/Odontogram';
import { DentalTimeline } from '../dentistry/DentalTimeline';
import { DentalServiceCatalog } from '../dentistry/DentalServiceCatalog';
import { SpecialistAgentChat } from './SpecialistAgentChat.tsx';
import { DentalChart, DentalProcedure } from '../../types/index';

import { HeartModel } from '../cardiology/HeartModel';
import { ECGViewer } from '../cardiology/ECGViewer';
import { OphthalmologyDashboard } from '../ophthalmology/OphthalmologyDashboard';
import { PediatricsDashboard } from '../pediatrics/PediatricsDashboard';

import { OrthopedicsDashboard } from './OrthopedicsDashboard';

export type HealthZone = 'general' | 'dentistry' | 'cardiology' | 'ophthalmology' | 'orthopedics' | 'pediatrics' | 'gastrology' | 'urology';

import { useSpecializedData } from '../hooks/useSpecializedData';

export const SpecializedHealthHub: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeZone, setActiveZone] = useState<HealthZone>('general');
    const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);

    // Use Custom Hook
    const {
        dentalChart,
        procedures,
        cardiologyData,
        ophthalmologyData
    } = useSpecializedData(activeZone, user?.patientProfileId);

    const renderActiveZone = () => {
        switch (activeZone) {
            case 'dentistry':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dentistry Zone</h2>
                                <p className="text-slate-500">Oral Health & Dental Records</p>
                            </div>
                            <button
                                onClick={() => setActiveZone('general')}
                                className="text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                            >
                                ← Back to Body Map
                            </button>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <div className="xl:col-span-2 space-y-6">
                                <Odontogram
                                    data={dentalChart}
                                    onToothClick={(n) => setSelectedStructureId(`tooth-${n}`)}
                                    selectedTooth={selectedStructureId?.startsWith('tooth-') ? parseInt(selectedStructureId.split('-')[1]) : null}
                                />
                            </div>
                            <div className="space-y-6">
                                <SpecialistAgentChat zone="dentistry" contextId={selectedStructureId} />
                                <div className="glass-card p-4 rounded-2xl">
                                    <h3 className="font-bold mb-4">Recent Procedures</h3>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        <DentalTimeline procedures={procedures} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DentalServiceCatalog />
                    </div>
                );
            case 'cardiology':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Cardiology Zone</h2>
                                <p className="text-slate-500">Heart & Vascular Health</p>
                            </div>
                            <button
                                onClick={() => setActiveZone('general')}
                                className="text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                            >
                                ← Back to Body Map
                            </button>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <div className="xl:col-span-2 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glass-card p-6 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                                        <HeartModel
                                            onPartSelect={(p) => setSelectedStructureId(p)}
                                            selectedPart={selectedStructureId}
                                        />
                                    </div>
                                    <div className="space-y-6">
                                        <ECGViewer />
                                        <div className="glass-card p-6">
                                            <h3 className="font-bold mb-2">Vitals Snapshot</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                                    <div className="text-xs text-red-500 font-bold uppercase">BP</div>
                                                    <div className="text-xl font-black text-slate-800 dark:text-white">{cardiologyData?.bp || "--"}</div>
                                                </div>
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                    <div className="text-xs text-blue-500 font-bold uppercase">O2 Sat</div>
                                                    <div className="text-xl font-black text-slate-800 dark:text-white">{cardiologyData?.o2 || "--"}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <SpecialistAgentChat zone="cardiology" contextId={selectedStructureId} />
                            </div>
                        </div>
                    </div>
                );
            case 'ophthalmology':
                return <OphthalmologyDashboard data={ophthalmologyData} />;
            case 'orthopedics':
                return <OrthopedicsDashboard />;
            case 'pediatrics':
                return <PediatricsDashboard />;
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center min-h-[600px]">
                        <div className="order-2 md:order-1">
                            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-6">
                                Interactive Health Zones
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                                Select a zone on the <strong>Body Map</strong> to access specialized care, AI agents, and detailed records for that specific system.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'dentistry', label: 'Dentistry', icon: '🦷' },
                                    { id: 'cardiology', label: 'Cardiology', icon: '❤️' },
                                    { id: 'ophthalmology', label: 'Ophthalmology', icon: '👁️' },
                                    { id: 'orthopedics', label: 'Orthopedics', icon: '🦴' },
                                    { id: 'pediatrics', label: 'Pediatrics', icon: '🧸' },
                                ].map(z => (
                                    <button
                                        key={z.id}
                                        onClick={() => setActiveZone(z.id as HealthZone)}
                                        className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary transition-all text-left group"
                                    >
                                        <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">{z.icon}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{z.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="order-1 md:order-2 flex justify-center">
                            <div className="w-full max-w-[400px]">
                                <BodyMap onZoneSelect={(z) => setActiveZone(z)} activeZone={activeZone} />
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="mt-6">
            {renderActiveZone()}
        </div>
    );
};

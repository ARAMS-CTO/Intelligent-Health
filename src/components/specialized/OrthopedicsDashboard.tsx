import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SpecialistAgentChat } from './SpecialistAgentChat';
import { SkeletonMap } from './SkeletonMap';

interface JointStatus {
    id: string;
    name: string;
    status: 'healthy' | 'issue' | 'recovering';
    painLevel?: number; // 0-10
    lastExam?: string;
}

export const OrthopedicsDashboard: React.FC = () => {
    const { t } = useTranslation();
    const [selectedJoint, setSelectedJoint] = useState<string | null>(null);

    // Mock Data (In production, fetch from API/FHIR)
    const joints: JointStatus[] = [
        { id: 'knees', name: 'Knees', status: 'healthy', painLevel: 0 },
        { id: 'spine', name: 'Spine/Back', status: 'issue', painLevel: 4, lastExam: '2024-12-10' },
        { id: 'shoulders', name: 'Shoulders', status: 'healthy', painLevel: 0 },
        { id: 'hips', name: 'Hips', status: 'recovering', painLevel: 2, lastExam: '2025-01-15' },
        { id: 'arms', name: 'Arms/Elbows', status: 'healthy', painLevel: 0 },
    ];

    // Convert joints array to status map for the visualizer
    const jointStatuses = useMemo(() => {
        const map: Record<string, string> = {};
        joints.forEach(j => { map[j.id] = j.status });
        return map;
    }, [joints]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Orthopedics & Skeleton</h2>
                    <p className="text-slate-500">Bone Health, Joints, and Mobility</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Visualizer / Joint Selector */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="glass-card p-6 min-h-[500px] flex flex-col md:flex-row gap-8">
                        {/* Selector List */}
                        <div className="w-full md:w-1/3 space-y-2 order-2 md:order-1">
                            <h3 className="font-bold mb-4">Select Region</h3>
                            {joints.map(joint => (
                                <button
                                    key={joint.id}
                                    onClick={() => setSelectedJoint(joint.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedJoint === joint.id
                                        ? 'border-primary bg-primary/5 dark:bg-primary/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold">{joint.name}</span>
                                        <StatusBadge status={joint.status} />
                                    </div>
                                    {joint.painLevel !== undefined && joint.painLevel > 0 && (
                                        <div className="mt-2 text-xs text-red-500 font-semibold">
                                            Pain Level: {joint.painLevel}/10
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Interactive Map */}
                        <div className="w-full md:w-2/3 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center relative overflow-hidden order-1 md:order-2 border border-slate-200 dark:border-slate-800">
                            <SkeletonMap
                                selectedJoint={selectedJoint}
                                onSelect={setSelectedJoint}
                                statuses={jointStatuses}
                            />
                        </div>
                    </div>
                </div>

                {/* AI Specialist */}
                <div className="space-y-6">
                    <SpecialistAgentChat
                        zone="orthopedics"
                        contextId={selectedJoint || "general"}
                    />

                    {/* Metrics */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold mb-4">Mobility Metrics</h3>
                        <div className="space-y-4">
                            <MetricRow label="Daily Steps" value="8,432" target="10,000" />
                            <MetricRow label="Stand Hours" value="6.5" target="8" />
                            <MetricRow label="Posture Score" value="88%" status="good" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
        healthy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        issue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        recovering: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${colors[status as keyof typeof colors] || ''}`}>
            {status}
        </span>
    );
};

const MetricRow = ({ label, value, target, status }: any) => (
    <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
        <span className="text-slate-500">{label}</span>
        <div className="text-right">
            <div className="font-bold text-slate-800 dark:text-white">{value}</div>
            {target && <div className="text-xs text-slate-400">Target: {target}</div>}
        </div>
    </div>
);

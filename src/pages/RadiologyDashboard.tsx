import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { useTranslation } from 'react-i18next';
import { Case, ImagingStudy } from '../types';
import { ClinicalVoiceRecorder } from '../components/ClinicalVoiceRecorder';
import { showToast } from '../components/Toast';
import { SpecialistAgentChat } from '../components/specialized/SpecialistAgentChat';

const RadiologyDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation('dashboard');
    const [cases, setCases] = useState<Case[]>([]);
    const [studies, setStudies] = useState<ImagingStudy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'worklist' | 'reported' | 'analytics'>('worklist');
    const [selectedModality, setSelectedModality] = useState<string>('All');
    const [selectedStudy, setSelectedStudy] = useState<ImagingStudy | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Stats calculation
    const stats = {
        pending: studies.filter(s => s.status === 'Pending').length,
        inProgress: studies.filter(s => s.status === 'In Progress').length,
        completedToday: studies.filter(s => s.status === 'Reported' || s.status === 'Reviewed').length,
        stat: studies.filter(s => s.priority === 'STAT').length,
        avgTurnaround: '2.4 hrs'
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [allCases, studiesData] = await Promise.all([
                    DataService.getCases(),
                    DataService.getImagingStudies()
                ]);

                const radiologyCases = allCases.filter(c =>
                    c.tags.some(tag => ['X-Ray', 'MRI', 'CT', 'Ultrasound', 'Imaging'].includes(tag)) ||
                    c.title.toLowerCase().includes('scan') ||
                    c.title.toLowerCase().includes('x-ray')
                );
                setCases(radiologyCases);
                setStudies(studiesData);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user]);

    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [aiFindings, setAiFindings] = useState<any[] | null>(null);

    const handleViewStudy = (study: ImagingStudy) => {
        setSelectedStudy(study);
        setGeneratedReport(null);
        setAiFindings(null);
        setIsDetailsOpen(true);
    };

    const handleDraftReport = async () => {
        if (!selectedStudy) return;
        try {
            const res = await DataService.draftRadiologyReport(selectedStudy.id);
            setGeneratedReport(res.report);
        } catch (e) {
            console.error(e);
            alert("Failed to generate report");
        }
    };

    const handleDetectAbnormality = async () => {
        if (!selectedStudy) return;
        try {
            const res = await DataService.detectAbnormalities(selectedStudy.id);
            setAiFindings(res.findings);
        } catch (e) {
            console.error(e);
            alert("Failed to detect abnormalities");
        }
    };



    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'STAT': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse';
            case 'Urgent': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    const getModalityIcon = (modality: string) => {
        const icons: Record<string, string> = {
            'CT': '🔬',
            'MRI': '🧲',
            'X-Ray': '☢️',
            'Ultrasound': '📡',
            'PET': '⚛️',
            'Mammography': '🎯'
        };
        return icons[modality] || '🏥';
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-blue-100 text-blue-700';
            case 'In Progress': return 'bg-green-100 text-green-700';
            case 'Reported': return 'bg-purple-100 text-purple-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const filteredStudies = selectedModality === 'All'
        ? studies
        : studies.filter(s => s.modality === selectedModality);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Radiology Dashboard
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {user?.name ? `Welcome back, Dr. ${user.name}` : 'Welcome back'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-all text-sm font-medium">
                            {ICONS.settings} Settings
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Pending Studies', value: stats.pending, icon: '⏳', color: 'bg-blue-50 text-blue-600' },
                        { label: 'In Progress', value: stats.inProgress, icon: '🔄', color: 'bg-amber-50 text-amber-600' },
                        { label: 'Completed Today', value: stats.completedToday, icon: '✅', color: 'bg-green-50 text-green-600' },
                        { label: 'STAT Request', value: stats.stat, icon: '🚨', color: 'bg-red-50 text-red-600' },
                        { label: 'Avg Turnaround', value: stats.avgTurnaround, icon: '⏱️', color: 'bg-purple-50 text-purple-600' },
                    ].map((stat, idx) => (
                        <div key={idx} className="glass-card p-4 rounded-2xl border border-white/20 dark:border-slate-700/50 hover:scale-105 transition-transform cursor-pointer">
                            <div className={`w-10 h-10 rounded-full ${stat.color} dark:bg-opacity-20 flex items-center justify-center text-xl mb-3`}>
                                {stat.icon}
                            </div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Worklist Section */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800/50 p-2 rounded-xl backdrop-blur-md sticky top-0 z-10 border border-slate-200 dark:border-slate-700">
                            {/* Tabs */}
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg w-full sm:w-auto">
                                {['Worklist', 'Reported', 'Analytics'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab.toLowerCase() as any)}
                                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === tab.toLowerCase()
                                            ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Filters */}
                            <div className="flex gap-2 w-full sm:w-auto">
                                <select
                                    className="px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={selectedModality}
                                    onChange={(e) => setSelectedModality(e.target.value)}
                                >
                                    <option value="All">All Modalities</option>
                                    <option value="CT">CT Scan</option>
                                    <option value="MRI">MRI</option>
                                    <option value="X-Ray">X-Ray</option>
                                    <option value="Ultrasound">Ultrasound</option>
                                </select>
                            </div>
                        </div>

                        {/* Loading State */}
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700/30 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            /* Study List */
                            <div className="space-y-4">
                                {filteredStudies.map((study) => (
                                    <div
                                        key={study.id}
                                        className="group bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-md cursor-pointer"
                                        onClick={() => handleViewStudy(study)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${study.modality === 'MRI' ? 'bg-blue-100 text-blue-600' :
                                                    study.modality === 'CT' ? 'bg-purple-100 text-purple-600' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {getModalityIcon(study.modality)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getPriorityStyle(study.priority)}`}>
                                                            {study.priority}
                                                        </span>
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getStatusStyle(study.status)}`}>
                                                            {study.status}
                                                        </span>
                                                        <span className="text-xs text-slate-400">#{study.id}</span>
                                                    </div>
                                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-primary transition-colors">
                                                        {study.patientName}
                                                    </h3>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                        {study.modality} • {study.bodyPart}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">{study.indication}</p>
                                                </div>
                                            </div>
                                            <div className="text-right text-xs text-slate-400">
                                                <p>Ordered: {new Date(study.orderedAt).toLocaleString()}</p>
                                                <p className="mt-1">{study.referringPhysician}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <button
                                                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                                                onClick={(e) => { e.stopPropagation(); handleViewStudy(study); }}
                                            >
                                                View Images
                                            </button>
                                            <button
                                                className="flex-1 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary hover:text-white transition-colors text-sm"
                                                onClick={(e) => { e.stopPropagation(); /* TODO: Draft */ }}
                                            >
                                                Create Report
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {filteredStudies.length === 0 && (
                                    <div className="text-center py-20">
                                        <p className="text-slate-400 dark:text-slate-500 text-lg">No imaging studies found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                ⚡ Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all text-sm">
                                    🔍 Open DICOM Viewer
                                </button>
                                <button className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm">
                                    📋 Report Templates
                                </button>
                                <button className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm">
                                    📊 View Statistics
                                </button>
                            </div>
                        </div>

                        {/* Recent Reports */}
                        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">
                                📝 Recent Reports
                            </h3>
                            <div className="space-y-3">
                                {[].map((report: any, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                        <div>
                                            <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{report.patient}</p>
                                            <p className="text-xs text-slate-500">{report.type}</p>
                                        </div>
                                        <span className="text-xs text-slate-400">{report.time}</span>
                                    </div>
                                ))}
                                <p className="text-xs text-slate-400 text-center italic">No recent reports</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Study Details Modal */}
            {isDetailsOpen && selectedStudy && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row">
                        {/* Modal Sidebar */}
                        <div className="md:w-1/3 bg-slate-50 dark:bg-slate-800/50 p-6 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4">{selectedStudy.patientName}</h2>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-slate-500 font-semibold uppercase text-xs">Patient ID</p>
                                    <p>{selectedStudy.patientId}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 font-semibold uppercase text-xs">Modality</p>
                                    <p className="font-medium">{selectedStudy.modality} - {selectedStudy.bodyPart}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 font-semibold uppercase text-xs">Indication</p>
                                    <p>{selectedStudy.indication}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 font-semibold uppercase text-xs">Priority</p>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPriorityStyle(selectedStudy.priority)}`}>
                                        {selectedStudy.priority}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-slate-500 font-semibold uppercase text-xs">Referring Physician</p>
                                    <p>{selectedStudy.referringPhysician}</p>
                                </div>
                            </div>

                            <hr className="my-6 border-slate-200 dark:border-slate-700" />

                            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                {ICONS.ai} AI Assistant
                            </h3>

                            <div className="flex-1 min-h-[500px]">
                                <SpecialistAgentChat
                                    zone="radiology"
                                    contextId={`${selectedStudy.modality} - ${selectedStudy.bodyPart}`}
                                    className="h-[600px] shadow-lg"
                                />
                            </div>

                            {generatedReport && (
                                <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700">
                                    <p className="font-bold mb-2 text-indigo-500">AI Draft Report:</p>
                                    {generatedReport}
                                </div>
                            )}

                            {aiFindings && (
                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl text-xs border border-red-100 dark:border-red-900/30">
                                    <p className="font-bold mb-2 text-red-500">AI Findings:</p>
                                    <ul className="space-y-1">
                                        {aiFindings.map((f, i) => (
                                            <li key={i} className="flex justify-between">
                                                <span>{f.finding}</span>
                                                <span className="font-bold opacity-70">{f.likelihood}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Modal Content - Viewer Placeholder */}
                        <div className="md:w-2/3 p-6 bg-black flex flex-col items-center justify-center relative min-h-[400px]">
                            {selectedStudy.imageUrl ? (
                                <img src={selectedStudy.imageUrl} alt="Scan" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <div className="text-center text-slate-500">
                                    <div className="text-6xl mb-4 opacity-30">☢️</div>
                                    <p>DICOM Viewer Integration</p>
                                    <p className="text-sm opacity-60">Visual interface would load here</p>
                                </div>
                            )}
                            <button
                                onClick={() => setIsDetailsOpen(false)}
                                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default RadiologyDashboard;

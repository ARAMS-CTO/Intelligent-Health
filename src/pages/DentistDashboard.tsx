import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/Auth';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants/index';
import { Odontogram } from '../components/dentistry/Odontogram';
import { DentalTimeline } from '../components/dentistry/DentalTimeline';
import { DataService } from '../services/api';
import { PatientSearch } from '../components/PatientSearch';
import { PatientProfile, DentalChart, DentalProcedure } from '../types/index';
import Modal from '../components/Modal';
import AppointmentBooking from '../components/AppointmentBooking';
import { showToast } from '../components/Toast';
import DoctorServiceSettings from '../components/DoctorServiceSettings';

const DentistDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [chartData, setChartData] = useState<DentalChart | any>({ teeth: [] });
    const [history, setHistory] = useState<DentalProcedure[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Default or Selected Patient
    const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);

    const fetchData = async () => {
        if (!selectedPatient) return;

        setIsLoading(true);
        try {
            const [chart, hist] = await Promise.all([
                DataService.getDentalChart(selectedPatient.id),
                DataService.getDentalHistory(selectedPatient.id)
            ]);
            setChartData(chart);
            setHistory(hist);
        } catch (error) {
            console.error("Failed to fetch dental data", error);
            // If new patient has no chart, chartData might be empty but valid
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Clear selection when patient changes
        setSelectedTooth(null);
    }, [selectedPatient]);

    const handleMarkCondition = async (condition: string) => {
        if (!selectedTooth || !selectedPatient) return;
        try {
            await DataService.updateToothStatus(selectedPatient.id, {
                tooth_number: selectedTooth,
                condition: condition,
                notes: `Marked as ${condition} by Dr. ${user?.name}`
            });
            // Refresh
            fetchData();
        } catch (error) {
            console.error("Failed to update tooth", error);
        }
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || !event.target.files[0] || !selectedPatient) return;
        const file = event.target.files[0];

        // Optimistic UI update or loading state
        // For now just console log
        console.log("Uploading...", file.name);

        try {
            await DataService.uploadFile(file, undefined, selectedPatient.id);
            // Ideally trigger a refresh of images list, but we don't have that endpoint in dental.py yet
            // Assuming images are part of "records" or similar.
            showToast.success("Image uploaded successfully!");
        } catch (error) {
            console.error("Upload failed", error);
            showToast.error("Upload failed. Please try again.");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

            {/* Schedule Modal */}
            <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)}>
                <AppointmentBooking
                    patientId={selectedPatient?.id}
                    onSuccess={() => setIsScheduleModalOpen(false)}
                    onClose={() => setIsScheduleModalOpen(false)}
                />
            </Modal>

            {/* Service Settings Modal */}
            <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Service Configuration">
                <DoctorServiceSettings />
            </Modal>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-primary/10 rounded-xl text-primary">{ICONS.user}</span>
                        {t('welcome')}, Dr. {user?.name}
                    </h1>
                    <div className="mt-4 flex items-center gap-3">
                        <PatientSearch onSelect={setSelectedPatient} placeholder="Search active patient..." />
                        {selectedPatient && (
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
                                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPatient.name}</span>
                                <span className="text-xs text-slate-500 font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    {selectedPatient.identifier}
                                </span>
                                <button onClick={() => setSelectedPatient(null)} className="ml-2 text-slate-400 hover:text-red-500 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-lg transition-all"
                    >
                        {ICONS.settings}
                        <span>Services</span>
                    </button>
                    <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-lg transition-all"
                    >
                        {ICONS.calendar}
                        <span>Schedule</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl shadow-lg hover:shadow-primary/30 transition-all">
                        + New Procedure
                    </button>
                </div>
            </div>

            {!selectedPatient ? (
                <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[40px] border border-dashed border-slate-300 dark:border-slate-700 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-6">
                        🦷
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No Patient Selected</h2>
                    <p className="text-slate-500 max-w-md">Search for a patient above to view their dental chart, history, and manage procedures.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                    {/* Main: Odontogram */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card p-1 rounded-[40px] shadow-xl border border-white/20 dark:border-slate-700/50">
                            <div className="p-6 border-b border-white/10 dark:border-slate-800 flex justify-between items-center">
                                <h2 className="font-heading font-black text-xl text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                    Odontogram
                                </h2>
                                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> Decay</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Crown</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Filled</span>
                                </div>
                            </div>
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center p-20 gap-4">
                                    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-sm font-bold text-slate-500 tracking-widest uppercase">Loading Dental Record...</span>
                                </div>
                            ) : (
                                <Odontogram
                                    data={chartData}
                                    selectedTooth={selectedTooth}
                                    onToothClick={setSelectedTooth}
                                />
                            )}
                        </div>

                        {/* Selected Tooth Details */}
                        {selectedTooth && (
                            <div className="glass-card p-6 rounded-3xl animate-fade-in-up md:flex items-start gap-6 border-l-4 border-primary">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-heading font-black text-4xl text-slate-400">
                                    {selectedTooth}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tooth #{selectedTooth}</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                        <div>
                                            <span className="block text-xs font-bold text-slate-400 uppercase">Condition</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-200 capitalize">
                                                {chartData.teeth?.find((t: any) => t.tooth_number === selectedTooth)?.condition || 'Healthy'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-slate-400 uppercase">History</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                                {history.filter(h => h.tooth_number === selectedTooth).length} Procedures
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleMarkCondition('decay')}
                                            className="text-xs font-bold px-3 py-1.5 bg-red-400/10 text-red-600 rounded-lg hover:bg-red-400 hover:text-white transition-colors"
                                        >
                                            Mark Decay
                                        </button>
                                        <button
                                            onClick={() => handleMarkCondition('crown')}
                                            className="text-xs font-bold px-3 py-1.5 bg-yellow-400/10 text-yellow-600 rounded-lg hover:bg-yellow-400 hover:text-white transition-colors"
                                        >
                                            Mark Crown
                                        </button>
                                        <button
                                            onClick={() => handleMarkCondition('filled')}
                                            className="text-xs font-bold px-3 py-1.5 bg-slate-400/10 text-slate-600 rounded-lg hover:bg-slate-400 hover:text-white transition-colors"
                                        >
                                            Mark Filled
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: History & Imaging */}
                    <div className="space-y-6">
                        <div className="glass-card p-6 rounded-[32px] border border-white/20 dark:border-slate-700/50">
                            <h3 className="font-heading font-black text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                {ICONS.activity} Dental History
                            </h3>
                            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {isLoading ? <div>Loading...</div> : <DentalTimeline procedures={history} />}
                            </div>
                        </div>

                        <div className="glass-card p-6 rounded-[32px] border border-white/20 dark:border-slate-700/50">
                            <h3 className="font-heading font-black text-lg text-slate-800 dark:text-white mb-4">Imaging</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="aspect-square bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center relative overflow-hidden group cursor-pointer">
                                    <img src="/dummy_xray.jpg" alt="X-Ray" className="opacity-50 group-hover:opacity-80 transition-opacity object-cover w-full h-full" />
                                    <span className="absolute bottom-2 left-2 text-[9px] font-bold text-white bg-black/50 px-1.5 rounded">Panoramic</span>
                                </div>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-colors cursor-pointer"
                                >
                                    <span className="text-2xl">+</span>
                                    <span className="text-[9px] font-bold uppercase mt-1">Upload</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DentistDashboard;

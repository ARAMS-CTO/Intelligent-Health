import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { showToast } from './Toast';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface VitalReading {
    id: string;
    type: string;
    value: number;
    unit: string;
    timestamp: string;
    source?: string;
}

interface VitalType {
    key: string;
    name: string;
    icon: string;
    unit: string;
    normalRange: { min: number; max: number };
    color: string;
}

const VITAL_TYPES: VitalType[] = [
    { key: 'blood_pressure_systolic', name: 'Blood Pressure', icon: '💓', unit: 'mmHg', normalRange: { min: 90, max: 120 }, color: 'red' },
    { key: 'heart_rate', name: 'Heart Rate', icon: '❤️', unit: 'bpm', normalRange: { min: 60, max: 100 }, color: 'pink' },
    { key: 'temperature', name: 'Temperature', icon: '🌡️', unit: '°F', normalRange: { min: 97, max: 99 }, color: 'orange' },
    { key: 'oxygen', name: 'Oxygen Saturation', icon: '🫁', unit: '%', normalRange: { min: 95, max: 100 }, color: 'blue' },
    { key: 'weight', name: 'Weight', icon: '⚖️', unit: 'kg', normalRange: { min: 0, max: 999 }, color: 'green' },
    { key: 'blood_glucose', name: 'Blood Glucose', icon: '🩸', unit: 'mg/dL', normalRange: { min: 70, max: 100 }, color: 'purple' },
];

export const VitalsTracker: React.FC = () => {
    const [selectedVital, setSelectedVital] = useState<string>('blood_pressure_systolic');
    const [readings, setReadings] = useState<VitalReading[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newValue, setNewValue] = useState('');
    const [isDeviceConnected, setIsDeviceConnected] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // Mock readings
    const mockReadings: VitalReading[] = [
        { id: '1', type: 'blood_pressure_systolic', value: 118, unit: 'mmHg', timestamp: new Date().toISOString(), source: 'Manual' },
        { id: '2', type: 'blood_pressure_systolic', value: 122, unit: 'mmHg', timestamp: new Date(Date.now() - 86400000).toISOString(), source: 'Apple Watch' },
        { id: '3', type: 'heart_rate', value: 72, unit: 'bpm', timestamp: new Date().toISOString(), source: 'Apple Watch' },
        { id: '4', type: 'oxygen', value: 98, unit: '%', timestamp: new Date().toISOString(), source: 'Pulse Oximeter' },
        { id: '5', type: 'weight', value: 75.5, unit: 'kg', timestamp: new Date().toISOString(), source: 'Smart Scale' },
        { id: '6', type: 'blood_glucose', value: 95, unit: 'mg/dL', timestamp: new Date().toISOString(), source: 'Glucometer' },
    ];

    useEffect(() => {
        // Try to fetch from API, fallback to mock
        const fetchVitals = async () => {
            try {
                setIsLoading(true);
                const data = await DataService.getVitals({ days: 30, limit: 50 });
                if (data && data.length > 0) {
                    setReadings(data.map(v => ({
                        id: v.id,
                        type: v.type,
                        value: parseFloat(v.value) || 0,
                        unit: v.unit,
                        timestamp: v.recorded_at,
                        source: v.source
                    })));
                } else {
                    setReadings(mockReadings);
                }
            } catch (e) {
                console.log('Using mock vitals data');
                setReadings(mockReadings);
            } finally {
                setIsLoading(false);
            }
        };
        fetchVitals();
    }, []);

    const currentVitalType = VITAL_TYPES.find(v => v.key === selectedVital)!;
    const filteredReadings = readings.filter(r => r.type === selectedVital);
    const latestReading = filteredReadings[0];

    const getStatusColor = (value: number, range: { min: number; max: number }) => {
        if (value < range.min) return 'text-blue-500';
        if (value > range.max) return 'text-red-500';
        return 'text-green-500';
    };

    const getStatusLabel = (value: number, range: { min: number; max: number }) => {
        if (value < range.min) return 'Low';
        if (value > range.max) return 'High';
        return 'Normal';
    };

    const handleAddReading = async () => {
        const value = parseFloat(newValue);
        if (isNaN(value)) {
            showToast.error('Please enter a valid number');
            return;
        }

        try {
            // Try to save to backend
            const saved = await DataService.recordVital({
                type: selectedVital,
                value: value.toString(),
                unit: currentVitalType.unit,
                source: 'Manual'
            });

            const newReading: VitalReading = {
                id: saved?.id || Date.now().toString(),
                type: selectedVital,
                value,
                unit: currentVitalType.unit,
                timestamp: new Date().toISOString(),
                source: 'Manual'
            };

            setReadings(prev => [newReading, ...prev]);
            setNewValue('');
            setShowAddModal(false);
            showToast.success('Vital recorded');
        } catch (e) {
            // Fallback to local state
            const newReading: VitalReading = {
                id: Date.now().toString(),
                type: selectedVital,
                value,
                unit: currentVitalType.unit,
                timestamp: new Date().toISOString(),
                source: 'Manual'
            };

            setReadings(prev => [newReading, ...prev]);
            setNewValue('');
            setShowAddModal(false);
            showToast.success('Vital recorded locally');
        }
    };

    const handleSyncDevice = () => {
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            setIsDeviceConnected(true);
            showToast.success("Synced with Apple Watch Series 9");
            // Add mock high-res data
            const newReadings: VitalReading[] = [];
            for (let i = 0; i < 7; i++) {
                newReadings.push({
                    id: `sync-${i}`,
                    type: 'heart_rate',
                    value: 70 + Math.floor(Math.random() * 20),
                    unit: 'bpm',
                    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                    source: 'Apple Watch'
                });
            }
            setReadings(prev => [...newReadings, ...prev]);
        }, 2500);
    };

    // Chart Data Preparation
    const chartData = {
        labels: filteredReadings.slice().reverse().map(r => new Date(r.timestamp).toLocaleDateString(undefined, { weekday: 'short' })),
        datasets: [
            {
                label: currentVitalType.name,
                data: filteredReadings.slice().reverse().map(r => r.value),
                borderColor: currentVitalType.color === 'red' ? 'rgb(239, 68, 68)' :
                    currentVitalType.color === 'blue' ? 'rgb(59, 130, 246)' :
                        currentVitalType.color === 'green' ? 'rgb(34, 197, 94)' :
                            'rgb(168, 85, 247)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                grid: {
                    display: false
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    return (
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    📊 My Vitals
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleSyncDevice}
                        disabled={isDeviceConnected || isScanning}
                        className={`px-3 py-2 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 ${isDeviceConnected
                            ? 'bg-green-500 cursor-default'
                            : 'bg-black dark:bg-slate-700 hover:bg-slate-800'
                            }`}
                    >
                        {isScanning ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Scanning...
                            </>
                        ) : isDeviceConnected ? (
                            <>⌚ Synced</>
                        ) : (
                            <>⌚ Connect Device</>
                        )}
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2"
                    >
                        {ICONS.plus} Log Vital
                    </button>
                </div>
            </div>

            {/* Vital Type Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                {VITAL_TYPES.map(vital => (
                    <button
                        key={vital.key}
                        onClick={() => setSelectedVital(vital.key)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedVital === vital.key
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        <span>{vital.icon}</span>
                        <span className="hidden sm:inline">{vital.name}</span>
                    </button>
                ))}
            </div>

            {/* Current Reading Card */}
            {latestReading && (
                <div className={`p-6 rounded-2xl bg-gradient-to-br from-${currentVitalType.color}-500/10 to-${currentVitalType.color}-600/10 border border-${currentVitalType.color}-200 dark:border-${currentVitalType.color}-800/30 mb-6`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">
                                Latest Reading
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-800 dark:text-white">
                                    {latestReading.value}
                                </span>
                                <span className="text-lg text-slate-500">{latestReading.unit}</span>
                            </div>
                            <p className={`text-sm font-bold mt-1 ${getStatusColor(latestReading.value, currentVitalType.normalRange)}`}>
                                {getStatusLabel(latestReading.value, currentVitalType.normalRange)}
                            </p>
                        </div>
                        <div className="text-6xl opacity-50">{currentVitalType.icon}</div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                        <span>📅 {new Date(latestReading.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>📱 {latestReading.source}</span>
                    </div>
                </div>
            )}

            {/* Trend Chart Placeholder */}
            {/* Trend Chart */}
            <div className="h-64 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-4 p-4 border border-slate-100 dark:border-slate-700">
                <Line options={chartOptions} data={chartData} />
            </div>

            {/* History */}
            <div>
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">Recent History</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredReadings.slice(0, 5).map(reading => (
                        <div key={reading.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className={`text-lg font-bold ${getStatusColor(reading.value, currentVitalType.normalRange)}`}>
                                    {reading.value}
                                </span>
                                <span className="text-sm text-slate-500">{reading.unit}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">{new Date(reading.timestamp).toLocaleDateString()}</p>
                                <p className="text-[10px] text-slate-400">{reading.source}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Reading Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            {currentVitalType.icon} Log {currentVitalType.name}
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                                Value ({currentVitalType.unit})
                            </label>
                            <input
                                type="number"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                placeholder={`e.g., ${currentVitalType.normalRange.min}`}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-bold focus:ring-2 focus:ring-primary outline-none"
                                autoFocus
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Normal range: {currentVitalType.normalRange.min} - {currentVitalType.normalRange.max} {currentVitalType.unit}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddReading}
                                disabled={!newValue}
                                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Compact Vitals Summary for Dashboard
export const VitalsSummary: React.FC = () => {
    const vitals = [
        { name: 'BP', value: '118/78', unit: 'mmHg', status: 'normal', icon: '💓' },
        { name: 'HR', value: '72', unit: 'bpm', status: 'normal', icon: '❤️' },
        { name: 'SpO2', value: '98', unit: '%', status: 'normal', icon: '🫁' },
        { name: 'Temp', value: '98.6', unit: '°F', status: 'normal', icon: '🌡️' },
    ];

    return (
        <div className="grid grid-cols-4 gap-3">
            {vitals.map((vital, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl text-center border border-slate-100 dark:border-slate-700">
                    <div className="text-lg mb-1">{vital.icon}</div>
                    <div className="font-black text-sm text-slate-800 dark:text-white">{vital.value}</div>
                    <div className="text-[10px] text-slate-500">{vital.name}</div>
                </div>
            ))}
        </div>
    );
};

export default VitalsTracker;

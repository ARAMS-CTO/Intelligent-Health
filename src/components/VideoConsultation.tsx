import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/api';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';
import { useAuth } from './Auth';

interface VideoConsultationProps {
    consultationId: string;
    patientName: string;
    onEnd: () => void;
}

export const VideoConsultation: React.FC<VideoConsultationProps> = ({ consultationId, patientName, onEnd }) => {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [duration, setDuration] = useState(0);
    const [notes, setNotes] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Simulate connection
        const timer = setTimeout(() => setIsConnected(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isConnected) {
            const interval = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isConnected]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleEndCall = async () => {
        try {
            await DataService.endTelemedicineSession(consultationId, notes);
            showToast.success('Consultation ended');
            onEnd();
        } catch (e) {
            onEnd();
        }
    };

    if (isMinimized) {
        return (
            <div
                className="fixed bottom-24 right-8 bg-slate-900 rounded-2xl shadow-2xl p-4 cursor-pointer z-50 animate-fade-in"
                onClick={() => setIsMinimized(false)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-16 h-12 bg-slate-800 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl">
                            👤
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">{patientName}</p>
                        <p className="text-green-400 text-xs font-bold">{formatDuration(duration)}</p>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEndCall(); }}
                        className="p-2 bg-red-500 text-white rounded-full"
                    >
                        📞
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-slate-800">
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                    <div>
                        <h3 className="font-bold text-white">{patientName}</h3>
                        <p className="text-slate-400 text-sm">
                            {isConnected ? `Connected • ${formatDuration(duration)}` : 'Connecting...'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsMinimized(true)}
                    className="p-2 text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                    ➖
                </button>
            </div>

            {/* Video Area */}
            <div className="flex-1 flex relative bg-slate-950">
                {/* Remote Video (Patient) */}
                <div className="flex-1 flex items-center justify-center">
                    {isConnected ? (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-6xl mb-4">
                                    👤
                                </div>
                                <p className="text-white font-bold text-xl">{patientName}</p>
                                <p className="text-slate-400 text-sm mt-1">Video placeholder</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-white font-bold">Connecting to patient...</p>
                        </div>
                    )}
                </div>

                {/* Local Video (Doctor) - PIP */}
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-slate-800 rounded-xl overflow-hidden shadow-2xl">
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-cyan-900 flex items-center justify-center">
                        {isVideoOn ? (
                            <div className="text-center">
                                <div className="text-4xl mb-1">👨‍⚕️</div>
                                <p className="text-white text-xs">You</p>
                            </div>
                        ) : (
                            <div className="text-center text-slate-400">
                                <div className="text-3xl mb-1">📵</div>
                                <p className="text-xs">Camera Off</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes Panel */}
                <div className="absolute top-4 right-4 w-80 bg-slate-800/90 backdrop-blur rounded-xl p-4 shadow-xl">
                    <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                        📝 Consultation Notes
                    </h4>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Type notes during the consultation..."
                        className="w-full h-32 bg-slate-900 text-white text-sm p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-slate-500 text-xs mt-2">Notes will be saved to the patient's record</p>
                </div>
            </div>

            {/* Controls */}
            <div className="p-6 bg-slate-800 flex justify-center gap-4">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-4 rounded-full transition-all ${isMuted
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                >
                    {isMuted ? '🔇' : '🎤'}
                </button>
                <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`p-4 rounded-full transition-all ${!isVideoOn
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                >
                    {isVideoOn ? '📹' : '📵'}
                </button>
                <button
                    className="p-4 bg-slate-700 text-white rounded-full hover:bg-slate-600 transition-all"
                >
                    🖥️
                </button>
                <button
                    onClick={handleEndCall}
                    className="px-8 py-4 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-all flex items-center gap-2"
                >
                    📞 End Call
                </button>
            </div>
        </div>
    );
};

// Start Consultation Button for Patient Dashboard
interface StartConsultationButtonProps {
    doctorId: string;
    doctorName: string;
    appointmentId?: string;
}

export const StartConsultationButton: React.FC<StartConsultationButtonProps> = ({ doctorId, doctorName, appointmentId }) => {
    const [isStarting, setIsStarting] = useState(false);
    const [consultation, setConsultation] = useState<any>(null);

    const handleStart = async () => {
        setIsStarting(true);
        try {
            const result = await DataService.startTelemedicineSession({
                doctor_id: doctorId,
                appointment_id: appointmentId,
                type: 'video'
            });
            setConsultation(result);
            showToast.success('Connecting to your doctor...');
        } catch (e) {
            showToast.error('Failed to start consultation');
        } finally {
            setIsStarting(false);
        }
    };

    if (consultation) {
        return (
            <VideoConsultation
                consultationId={consultation.id}
                patientName={doctorName}
                onEnd={() => setConsultation(null)}
            />
        );
    }

    return (
        <button
            onClick={handleStart}
            disabled={isStarting}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
            {isStarting ? (
                <>
                    <span className="animate-spin">⌛</span>
                    Connecting...
                </>
            ) : (
                <>
                    📹 Start Video Call
                </>
            )}
        </button>
    );
};

// Quick Actions Panel for Patient with Telemedicine
export const TelemedicineQuickActions: React.FC = () => {
    const [isScheduling, setIsScheduling] = useState(false);

    return (
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                🏥 Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <button
                    className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all text-center"
                    onClick={() => setIsScheduling(true)}
                >
                    <div className="text-2xl mb-1">📹</div>
                    <p className="font-bold text-sm">Video Visit</p>
                </button>
                <button className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all text-center">
                    <div className="text-2xl mb-1">💬</div>
                    <p className="font-bold text-sm">Message Doctor</p>
                </button>
                <button className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all text-center">
                    <div className="text-2xl mb-1">📋</div>
                    <p className="font-bold text-sm">Request Refill</p>
                </button>
                <button className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all text-center">
                    <div className="text-2xl mb-1">🧪</div>
                    <p className="font-bold text-sm">View Lab Results</p>
                </button>
            </div>

            {/* Emergency Banner */}
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">🚨</div>
                    <div>
                        <p className="font-bold text-red-700 dark:text-red-300 text-sm">Emergency?</p>
                        <p className="text-red-600 dark:text-red-400 text-xs">Call 911 or go to nearest ER</p>
                    </div>
                    <button className="ml-auto px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors">
                        Get Help
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoConsultation;

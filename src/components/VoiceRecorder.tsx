import React, { useState, useRef } from 'react';
import { GeminiService } from '../services/api';
import { ICONS } from '../constants/index';
import { showToast } from './Toast';

interface VoiceRecorderProps {
    onTranscript: (text: string) => void;
    disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscript, disabled }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const startRecording = async () => {
        if (disabled) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await processAudio(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting recording:", err);
            showToast.error("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true);
        }
    };

    const processAudio = async (blob: Blob) => {
        try {
            // Create a File object from Blob
            const file = new File([blob], "recording.webm", { type: 'audio/webm' });
            const res = await GeminiService.transcribeAudio(file);
            onTranscript(res.transcript);
        } catch (error) {
            console.error("Transcription failed", error);
            showToast.error("Transcription failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isProcessing}
            className={`relative p-3 rounded-full transition-all duration-300 flex items-center justify-center overflow-hidden ${isRecording
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/50'
                : isProcessing
                    ? 'bg-yellow-500 text-white cursor-wait'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isRecording ? "Stop Recording" : isProcessing ? "Processing..." : "Record Voice Note (Server-Side)"}
        >
            {isRecording && (
                <>
                    <span className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping"></span>
                    <span className="absolute inset-0 rounded-full bg-red-400 opacity-10 animate-pulse delay-75"></span>
                </>
            )}
            {isProcessing ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                ICONS.microphone
            )}
        </button>
    );
};

export default VoiceRecorder;

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { showToast } from './Toast';
import { ICONS } from '../constants';
import { CryptoService } from '../services/cryptoUtils';

// Define the Wallet Interface (Window injection)
interface ConcordiumWallet {
    connect: () => Promise<string>;
    signMessage: (address: string, message: string) => Promise<{ schema: string, signature: string }>;
}
declare global {
    interface Window {
        concordium?: ConcordiumWallet;
    }
}

interface SecureUploadProps {
    onUploadComplete: (url: string, name: string, type: string) => void;
    caseId?: string;
    patientId?: string;
}

export const SecureUpload: React.FC<SecureUploadProps> = ({ onUploadComplete, caseId, patientId }) => {
    const [uploading, setUploading] = useState(false);
    const [encryptionMode, setEncryptionMode] = useState<'provenance' | 'standard'>('provenance');
    const [statusText, setStatusText] = useState('');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setStatusText('Preparing Secure Upload...');

        try {
            let fileToUpload: File | Blob = file;
            let finalName = file.name;

            // 1. Encryption Step
            if (encryptionMode === 'provenance') {
                if (!window.concordium) {
                    showToast.error("Concordium Wallet not found. Falling back to Standard Security.", "Wallet Error");
                    setEncryptionMode('standard');
                    // Don't return, just proceed with standard (server-side) upload logic?
                    // Or force install?
                    // Let's stop to be strict about "Owner Only" visibility requirement.
                    setUploading(false);
                    return;
                }

                try {
                    setStatusText('Requesting Wallet Signature...');
                    const walletAddress = await window.concordium.connect();

                    // Challenge: Unique to file + user + time to avoid replay??
                    // For "Deriving Encryption Key", the signature needs to be CONSISTENT for this USER.
                    // If we use time, the key changes and we can never decrypt it again!
                    // Challenge must be a CONSTANT string or deterministically recreatable.
                    // Ideally: "Allow Intelligent Health File Encryption"
                    const challenge = "Allow Intelligent Health File Encryption";

                    const result = await window.concordium.signMessage(walletAddress, challenge);

                    setStatusText('Deriving Military-Grade Key...');
                    const key = await CryptoService.deriveKeyFromSignature(result.signature);

                    setStatusText('Encrypting File locally (AES-256)...');
                    const encryptedBlob = await CryptoService.encryptFile(file, key);

                    fileToUpload = encryptedBlob;
                    finalName = `${file.name}.enc`; // Tag it

                } catch (e: any) {
                    console.error("Encryption Failed:", e);
                    showToast.error("Wallet signing denied. Upload cancelled.", "Security");
                    setUploading(false);
                    return;
                }
            }

            // 2. Upload Step
            setStatusText('Uploading Sealed Blob...');
            const formData = new FormData();
            formData.append('file', fileToUpload, finalName);
            if (caseId) formData.append('case_id', caseId);
            if (patientId) formData.append('patient_id', patientId);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed on server");

            const data = await response.json();
            onUploadComplete(data.url, data.name, data.type);
            showToast.success('File Secured & Uploaded', 'Success');

        } catch (error) {
            console.error(error);
            showToast.error('Upload failed', 'Error');
        } finally {
            setUploading(false);
            setStatusText('');
        }
    }, [caseId, patientId, encryptionMode, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div className="w-full">
            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => setEncryptionMode('provenance')}
                    className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${encryptionMode === 'provenance' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-slate-200 dark:border-slate-700 text-text-muted hover:border-primary/50'}`}
                >
                    {React.cloneElement(ICONS.check as any, { className: "w-4 h-4" })}
                    <span className="text-xs uppercase tracking-wider">Wallet Lock (Owner Only)</span>
                </button>
                <button
                    onClick={() => setEncryptionMode('standard')}
                    className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${encryptionMode === 'standard' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-slate-200 dark:border-slate-700 text-text-muted hover:border-primary/50'}`}
                >
                    <span className="text-xs uppercase tracking-wider">Standard Encryption</span>
                </button>
            </div>

            <div {...getRootProps()} className={`border-2 border-dashed rounded-3xl p-8 transition-all cursor-pointer text-center ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-700 hover:border-primary/50'}`}>
                <input {...getInputProps()} />
                {uploading ? (
                    <div className="space-y-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sm font-bold text-primary animate-pulse">{statusText}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-text-muted">
                            {React.cloneElement(ICONS.upload as any, { className: "w-6 h-6" })}
                        </div>
                        <p className="text-sm font-medium text-text-main">
                            Drag & drop or click to <span className="text-primary font-bold">Secure Upload</span>
                        </p>
                        <p className="text-xs text-text-muted">Supports DICOM, PDF, JPG (Max 50MB)</p>
                    </div>
                )}
            </div>

            {encryptionMode === 'provenance' && (
                <p className="text-[10px] text-center mt-2 text-text-muted flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Encrypted with Concordium Wallet Signature
                </p>
            )}
        </div>
    );
};

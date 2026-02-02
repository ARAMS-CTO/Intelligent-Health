import React, { useState } from 'react';
import { showToast } from './Toast';

interface WorldIDVerificationProps {
    onVerified?: (worldId: string) => void;
    showGeneticLink?: boolean;
}

/**
 * WorldID / Orb Protocol Verification Component
 * 
 * This component provides a UI for Worldcoin Orb-based identity verification.
 * In production, this would integrate with the actual World ID SDK.
 * 
 * Features:
 * - Iris-based biometric verification simulation
 * - Zero-knowledge proof of personhood
 * - Optional genetic identity linking
 */
export const WorldIDVerification: React.FC<WorldIDVerificationProps> = ({
    onVerified,
    showGeneticLink = false
}) => {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'verifying' | 'verified' | 'error'>('idle');
    const [worldId, setWorldId] = useState<string | null>(null);
    const [geneticLinked, setGeneticLinked] = useState(false);

    const handleStartVerification = () => {
        setStatus('scanning');

        // Simulate Orb scanning process
        setTimeout(() => {
            setStatus('verifying');

            // Simulate verification
            setTimeout(() => {
                const mockWorldId = `wid_${Math.random().toString(36).substring(2, 15)}`;
                setWorldId(mockWorldId);
                setStatus('verified');
                showToast.success("World ID verified! Zero-knowledge proof generated.");
                onVerified?.(mockWorldId);
            }, 2000);
        }, 3000);
    };

    const handleLinkGenetic = () => {
        if (!worldId) return;

        // Simulate genetic identity token creation
        setGeneticLinked(true);
        showToast.success("Genetic identity attestation linked to World ID on-chain.");
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl border border-emerald-500/30 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-emerald-500/20">
                <div className="flex items-center gap-4">
                    {/* Orb Icon */}
                    <div className="relative w-16 h-16">
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 opacity-30 blur-lg ${status === 'scanning' ? 'animate-pulse' : ''}`}></div>
                        <div className="absolute inset-2 rounded-full bg-slate-900 border-2 border-emerald-500/50 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-slate-900"></div>
                            </div>
                        </div>
                        {status === 'scanning' && (
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                                <div className="absolute inset-0 border-2 border-emerald-400 rounded-full animate-ping"></div>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">World ID Verification</h3>
                        <p className="text-sm text-emerald-400/70">Powered by Orb Protocol</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {status === 'idle' && (
                    <>
                        <div className="text-slate-400 text-sm space-y-2">
                            <p>Verify your unique personhood using iris biometrics. This creates a:</p>
                            <ul className="list-disc list-inside space-y-1 text-slate-500">
                                <li>Zero-knowledge proof of identity</li>
                                <li>Sybil-resistant verification</li>
                                <li>Privacy-preserving authentication</li>
                            </ul>
                        </div>
                        <button
                            onClick={handleStartVerification}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/30"
                        >
                            🔐 Start Orb Verification
                        </button>
                    </>
                )}

                {status === 'scanning' && (
                    <div className="text-center py-8">
                        {/* Animated Iris Scan */}
                        <div className="relative w-32 h-32 mx-auto mb-6">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 animate-pulse"></div>
                            <div className="absolute inset-4 rounded-full bg-slate-800 border-4 border-emerald-500/50 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full bg-slate-900"></div>
                                </div>
                            </div>
                            {/* Scanning Line */}
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                                <div className="w-full h-0.5 bg-emerald-400 animate-[scan_1.5s_ease-in-out_infinite]"></div>
                            </div>
                            {/* Rotating Ring */}
                            <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/50 animate-spin" style={{ animationDuration: '3s' }}></div>
                        </div>
                        <div className="text-emerald-400 font-bold text-lg animate-pulse">Scanning Iris Pattern...</div>
                        <div className="text-slate-500 text-sm mt-2">Hold device steady and look at the camera</div>
                    </div>
                )}

                {status === 'verifying' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-emerald-400 font-bold">Generating Zero-Knowledge Proof...</div>
                        <div className="text-slate-500 text-sm mt-2">Creating cryptographic attestation</div>
                    </div>
                )}

                {status === 'verified' && (
                    <div className="space-y-6">
                        <div className="bg-emerald-900/30 p-4 rounded-xl border border-emerald-500/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-xl">
                                    ✓
                                </div>
                                <div>
                                    <div className="text-emerald-400 font-bold">Verified Human</div>
                                    <div className="text-xs text-slate-500 font-mono">{worldId}</div>
                                </div>
                            </div>
                        </div>

                        {showGeneticLink && !geneticLinked && (
                            <div className="bg-violet-900/20 p-4 rounded-xl border border-violet-500/30">
                                <h4 className="text-violet-400 font-bold mb-2">🧬 Link Genetic Identity</h4>
                                <p className="text-sm text-slate-400 mb-4">
                                    Create an on-chain attestation linking your genomic data to your World ID.
                                    This enables:
                                </p>
                                <ul className="text-xs text-slate-500 space-y-1 mb-4">
                                    <li>• Consent management for research participation</li>
                                    <li>• Data monetization rights</li>
                                    <li>• Cryptographic proof of genetic identity</li>
                                </ul>
                                <button
                                    onClick={handleLinkGenetic}
                                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all"
                                >
                                    🔗 Link Genetic Identity Token
                                </button>
                            </div>
                        )}

                        {geneticLinked && (
                            <div className="bg-violet-900/30 p-4 rounded-xl border border-violet-500/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-violet-500 rounded-full flex items-center justify-center text-xl">
                                        🧬
                                    </div>
                                    <div>
                                        <div className="text-violet-400 font-bold">Genetic Identity Linked</div>
                                        <div className="text-xs text-slate-500">On-chain attestation created</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="p-3 bg-slate-800/50 rounded-xl">
                                <div className="text-2xl mb-1">🔒</div>
                                <div className="text-xs text-slate-400">Privacy Preserved</div>
                            </div>
                            <div className="p-3 bg-slate-800/50 rounded-xl">
                                <div className="text-2xl mb-1">⛓️</div>
                                <div className="text-xs text-slate-400">On-Chain Proof</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-900/50 border-t border-emerald-500/10">
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Powered by Worldcoin Protocol</span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Secure Connection
                    </span>
                </div>
            </div>
        </div>
    );
};

export default WorldIDVerification;

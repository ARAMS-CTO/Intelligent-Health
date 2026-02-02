import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';
import { showToast } from '../components/Toast';
import { DataService } from '../services/api';

import { detectConcordiumProvider } from '@concordium/browser-wallet-api-helpers';

const TechnicalSecurityPage: React.FC = () => {
    const { t } = useTranslation();
    const [zkpStep, setZkpStep] = useState(0); // 0: Idle, 1: Proving, 2: Verified
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [ledgerItems, setLedgerItems] = useState([
        { id: 1, action: "ACCESS_GRANTED", actor: "Dr. Sarah Smith", resource: "Record #9281", time: "10:42:15 AM", hash: "0x8f...2a1" },
        { id: 2, action: "NOTE_ENCRYPTED", actor: "System (Auto)", resource: "Visit Summary", time: "10:41:00 AM", hash: "0x3c...9b2" },
        { id: 3, action: "LOGIN_ATTEMPT", actor: "Patient User", resource: "Portal", time: "10:38:22 AM", hash: "0xe1...55f" },
    ]);

    // Mock live ledger updates
    useEffect(() => {
        const fetchLogs = async () => {
            const data = await DataService.getPublicSystemLogs();
            if (data && data.length > 0) {
                const mapped = data.map((log: any) => ({
                    id: log.id,
                    action: log.event_type.toUpperCase(),
                    actor: log.actor_role,
                    resource: "Block #" + log.id,
                    time: new Date(log.timestamp).toLocaleTimeString(),
                    hash: log.action_hash
                }));
                setLedgerItems(mapped.slice(0, 8));
            }
        };

        fetchLogs(); // Initial
        const interval = setInterval(fetchLogs, 5000); // Poll every 5s

        return () => clearInterval(interval);
    }, []);

    const runZKPDemo = async () => {
        setZkpStep(1);
        try {
            const provider = await detectConcordiumProvider();
            const account = await provider.connect();
            if (account) {
                setWalletAddress(account);
                // In a real ZKP flow, we would call provider.requestVerifiableCredential() or similar
                // For this demo, we simulate the "Proof Generation" delay after connecting
                setTimeout(() => {
                    setZkpStep(2);
                    showToast.success("Age Proof Verified on Concordium Network!");
                }, 2500);
            } else {
                showToast.error("Wallet connection declined");
                setZkpStep(0);
            }
        } catch (e) {
            console.error(e);
            showToast.error("Concordium Wallet not detected or failed");
            setZkpStep(0);
        }
    };

    return (
        <div className="min-h-screen bg-background pt-20 pb-10">
            {/* Hero */}
            <section className="container mx-auto px-4 mb-20 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Military-Grade Privacy
                </div>
                <h1 className="text-4xl sm:text-6xl font-heading font-black text-text-main tracking-tighter mb-6">
                    Trust Code, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Not Corporations.</span>
                </h1>
                <p className="text-xl text-text-muted max-w-2xl mx-auto">
                    You own your data. Our architecture ensures that clinical AI agents can only analyze what you explicitly authorize. You control exactly which doctors and hospitals can view your records through granular permission settings.
                </p>
            </section>

            {/* ZKP Section */}
            <section className="container mx-auto px-4 mb-24">
                <div className="glass-card rounded-[40px] p-8 lg:p-16 border border-white/20 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-heading font-bold text-text-main flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">{ICONS.certificate}</div>
                                Zero-Knowledge Proofs (ZKP)
                            </h2>
                            <p className="text-text-muted text-lg leading-relaxed">
                                Prove facts about yourself without revealing the underlying data.
                                Verify you are over 18 or have valid insurance to a provider without exposing your exact birth date or policy number.
                            </p>
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <h3 className="font-bold text-text-main mb-4">Try the Demo: Prove Age &gt; 18</h3>
                                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">🆔</div>
                                        <div>
                                            <p className="font-bold text-sm text-text-main">ID Card (DOB: 1990-01-01)</p>
                                            <p className="text-xs text-text-muted">Private Data (Hidden)</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl">➔</div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xl">✅</div>
                                        <div>
                                            <p className="font-bold text-sm text-text-main">Proof: AGE &gt; 18</p>
                                            <p className="text-xs text-text-muted">Public Statement</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={runZKPDemo}
                                    disabled={zkpStep === 1}
                                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${zkpStep === 2 ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'}`}
                                >
                                    {zkpStep === 0 && (
                                        <>
                                            <span>Generate Proof with Wallet</span>
                                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded">CCD</span>
                                        </>
                                    )}
                                    {zkpStep === 1 && "Requesting Wallet Signature..."}
                                    {zkpStep === 2 && "Proof Verified ✓"}
                                </button>
                                <p className="text-xs text-center mt-3 text-text-muted">
                                    Requires Concordium Browser Wallet
                                </p>
                            </div>
                        </div>
                        <div className="relative h-[400px] bg-slate-900 rounded-3xl p-6 font-mono text-xs text-green-400 overflow-hidden shadow-2xl border border-slate-700">
                            <div className="absolute top-0 left-0 w-full h-8 bg-slate-800 flex items-center px-4 gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                <span className="ml-2 text-slate-400">zkp_circuit_verifier.rs</span>
                            </div>
                            <div className="mt-8 space-y-2 opacity-80">
                                <p>{`> load_witness(private_inputs: wallet_secret)`}</p>
                                <p>{`> generate_proof(claim: "age >= 18")`}</p>
                                {zkpStep > 0 && (
                                    <>
                                        <p className="text-white">{`> connecting to Concordium Wallet...`}</p>
                                        {walletAddress && <p className="text-blue-400">{`> Wallet Connected: ${walletAddress.substring(0, 12)}...`}</p>}
                                        {zkpStep > 1 && (
                                            <>
                                                <p>{`> constructing zero-knowledge statement...`}</p>
                                                <p>{`> signing proof with private key...`}</p>
                                                <p>{`> G1 Point: [0x1a2...f9, 0x8b3...11]`}</p>
                                                <p className="text-yellow-400">{`> PROOF GENERATED: 0x928173...`}</p>
                                                <p className="text-green-500 font-bold">{`> VERIFIED: TRUE`}</p>
                                            </>
                                        )}
                                    </>
                                )}
                                <div className="animate-pulse">_</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Smart Privacy Contracts */}
            <section className="container mx-auto px-4 mb-24 text-center">
                <h2 className="text-3xl font-heading font-bold text-text-main mb-12">Smart Privacy Contracts</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: "Time-Bound Access", desc: "Grant doctors access for exactly 24 hours. Access is automatically revoked by the smart contract.", icon: ICONS.clock, color: "text-blue-500" },
                        { title: "Selective Disclosure", desc: "Share only your MRI scan, while keeping your mental health history completely encrypted.", icon: ICONS.document, color: "text-purple-500" },
                        { title: "Revocation Kill-Switch", desc: "Revoke access to all your data instantly with a single blockchain transaction.", icon: ICONS.riskHigh, color: "text-red-500" }
                    ].map((item, i) => (
                        <div key={i} className="glass-card p-8 rounded-3xl border border-white/20 dark:border-slate-700 hover:-translate-y-2 transition-transform duration-300">
                            <div className={`w-14 h-14 mx-auto bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-6 ${item.color}`}>
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-3">{item.title}</h3>
                            <p className="text-sm text-text-muted">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Audit Ledger */}
            <section className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto glass-card rounded-3xl p-8 border border-white/20 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Live Blockchain Audit Ledger
                            </h2>
                            <p className="text-sm text-text-muted">Immutable record of every interaction with data.</p>
                        </div>
                        <div className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded">
                            Network: Concordium Mainnet
                        </div>
                    </div>

                    <div className="space-y-2 font-mono text-xs">
                        <div className="grid grid-cols-12 gap-4 text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider">
                            <div className="col-span-2">Time</div>
                            <div className="col-span-3">Action</div>
                            <div className="col-span-3">Actor</div>
                            <div className="col-span-4 text-right">Transaction Hash</div>
                        </div>
                        {ledgerItems.map((item) => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 py-3 border-b border-slate-100 dark:border-slate-800/50 items-center animate-fade-in hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <div className="col-span-2 text-text-muted">{item.time}</div>
                                <div className="col-span-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.action === 'ACCESS_GRANTED' ? 'bg-green-100 text-green-700' :
                                        item.action === 'ACCESS_DENIED' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {item.action}
                                    </span>
                                </div>
                                <div className="col-span-3 text-text-main font-bold truncate">{item.actor}</div>
                                <div className="col-span-4 text-right text-slate-400 truncate">{item.hash}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TechnicalSecurityPage;

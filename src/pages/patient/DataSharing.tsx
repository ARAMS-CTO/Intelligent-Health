
import React, { useState } from 'react';
import { useAuth } from '../../components/Auth';
import { ICONS } from '../../constants';

export const DataSharingPage: React.FC = () => {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<string | null>(null);
    const [accessList, setAccessList] = useState([
        { id: 1, name: 'Dr. Sarah Connor', role: 'Cardiologist', hospital: 'General Hospital', access: true },
        { id: 2, name: 'AI Research Institute', role: 'Research', hospital: 'Global Health', access: false },
    ]);

    const connectWallet = async () => {
        // Mock Concordium Browser Wallet Interaction
        const mockAddress = "3kY7...9Lp2"; // Concordium-like address
        setWallet(mockAddress);

        // TODO: Call /api/concordium/connect real endpoint in production
    };

    const toggleAccess = (id: number) => {
        setAccessList(prev => prev.map(item => {
            if (item.id === id) {
                // If turning ON, simulate blockchain transaction
                if (!item.access && wallet) {
                    alert(`Simulating Concordium Smart Contract Call...\nGranting Access to: ${item.name}`);
                }
                return { ...item, access: !item.access };
            }
            return item;
        }));
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        {ICONS.security}
                        Data Security & Trust
                    </h1>
                    <p className="text-gray-500 mt-2">Manage who can see your health data using Blockchain Identity.</p>
                </div>

                {wallet ? (
                    <div className="text-right">
                        <span className="text-xs text-green-600 font-bold uppercase tracking-wider block mb-1">
                            Concordium Wallet Connected
                        </span>
                        <code className="bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded text-xs font-mono">
                            {wallet}
                        </code>
                    </div>
                ) : (
                    <button
                        onClick={connectWallet}
                        className="bg-[#2C3E50] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#34495E] transition-all flex items-center gap-2"
                    >
                        <span>🔗</span> Connect Concordium ID
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ZKP ID Card */}
                <div className="col-span-1 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-20 text-9xl">🆔</div>
                    <h3 className="font-bold text-lg mb-1">Zero-Knowledge ID</h3>
                    <p className="text-indigo-200 text-sm mb-8">Proof of Age & Insurance</p>

                    <div className="space-y-4">
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex justify-between items-center">
                            <span className="text-sm font-bold">Attribute: Over18</span>
                            <span className="bg-green-400 text-green-900 text-[10px] font-bold px-2 py-0.5 rounded-full">VERIFIED</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex justify-between items-center">
                            <span className="text-sm font-bold">Attribute: Patient</span>
                            <span className="bg-green-400 text-green-900 text-[10px] font-bold px-2 py-0.5 rounded-full">VERIFIED</span>
                        </div>
                    </div>
                </div>

                {/* Access List */}
                <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6">Smart Contract Permissions</h3>

                    <div className="space-y-4">
                        {accessList.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-gray-500">
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{item.name}</h4>
                                        <p className="text-xs text-gray-500">{item.role} • {item.hospital}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold uppercase ${item.access ? 'text-green-500' : 'text-slate-400'}`}>
                                        {item.access ? 'Granted' : 'Revoked'}
                                    </span>
                                    <button
                                        onClick={() => toggleAccess(item.id)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${item.access ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-300 ${item.access ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!wallet && (
                        <div className="mt-6 text-center text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">
                            ⚠️ Wallet not connected. Changes will not be saved to blockchain.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <a href="/dashboard" className="text-gray-500 hover:text-primary transition-colors text-sm font-medium flex items-center gap-2">
                    ← Back to Dashboard
                </a>
            </div>
        </div>
    );
};

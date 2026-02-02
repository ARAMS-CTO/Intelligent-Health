import React, { useState } from 'react';
import { useAuth } from '../components/Auth';
import PayPalPayment from '../components/PayPalPayment';
import { CreditBalance } from '../components/CreditBalance';
import { ICONS } from '../constants/index';
import { showToast } from '../components/Toast';

const CreditsPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedMethod, setSelectedMethod] = useState<'paypal' | 'crypto' | 'ccd'>('paypal');

    const handleSuccess = (details: any) => {
        showToast.success("Payment successful! Credits added.");
        console.log("Payment success:", details);
        // Here you would typically refresh the user's credits
        // e.g. await DataService.refreshCredits();
    };

    if (!user) return <div className="p-8">Please log in.</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <h1 className="text-3xl font-heading font-black mb-2 flex items-center gap-3">
                <span className="text-primary">{ICONS.creditCard}</span> Manage Credits
            </h1>
            <p className="text-gray-500 mb-8">Purchase credits to use premium AI features and detailed analysis.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Balance & Status */}
                <div className="md:col-span-1 space-y-6">
                    <CreditBalance />

                    <div className="glass-card p-6 rounded-2xl">
                        <h3 className="font-bold mb-4">Why upgrade?</h3>
                        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✓</span> Access to GPT-5 Medical
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✓</span> Unlimited AI Analysis
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✓</span> Priority Support
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500">✓</span> Comprehensive Reports
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="md:col-span-2 space-y-6">
                    <div className="glass-card p-6 rounded-2xl">
                        <h2 className="text-xl font-bold mb-6">Top Up</h2>

                        {/* Method Selection */}
                        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                            <button
                                onClick={() => setSelectedMethod('paypal')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold border-2 transition-all whitespace-nowrap ${selectedMethod === 'paypal'
                                        ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                    }`}
                            >
                                PayPal / Card
                            </button>
                            <button
                                onClick={() => setSelectedMethod('crypto')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold border-2 transition-all whitespace-nowrap ${selectedMethod === 'crypto'
                                        ? 'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-orange-300'
                                    }`}
                            >
                                Crypto (USDT/USDC)
                            </button>
                            <button
                                onClick={() => setSelectedMethod('ccd')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold border-2 transition-all whitespace-nowrap ${selectedMethod === 'ccd'
                                        ? 'border-teal-500 bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-300'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-teal-300'
                                    }`}
                            >
                                Concordium (CCD)
                            </button>
                        </div>

                        {/* Payment Components */}
                        <div className="animate-fade-in">
                            {selectedMethod === 'paypal' && (
                                <PayPalPayment onSuccess={handleSuccess} />
                            )}

                            {selectedMethod === 'crypto' && (
                                <div className="text-center py-8 space-y-4">
                                    <div className="bg-orange-100 dark:bg-orange-900/20 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-3xl">
                                        ₿
                                    </div>
                                    <h3 className="font-bold text-lg">Pay with Stablecoins</h3>
                                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                                        Use your Web3 wallet to pay with USDT or USDC on Ethereum, Polygon, or BSC networks.
                                    </p>
                                    <button
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
                                        onClick={() => showToast.info("Crypto gateway coming soon!")}
                                    >
                                        Connect Wallet
                                    </button>
                                </div>
                            )}

                            {selectedMethod === 'ccd' && (
                                <div className="text-center py-8 space-y-4">
                                    <div className="bg-teal-100 dark:bg-teal-900/20 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-3xl text-teal-600">
                                        Ͼ
                                    </div>
                                    <h3 className="font-bold text-lg">Pay with Concordium</h3>
                                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                                        Secure, private, and fast transactions using CCD tokens. Zero-Knowledge Proof verified.
                                    </p>
                                    <button
                                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
                                        onClick={() => showToast.info("CCD Wallet integration coming soon!")}
                                    >
                                        Connect Concordium Wallet
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditsPage;

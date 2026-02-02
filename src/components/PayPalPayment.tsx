import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { DataService } from '../services/api';

interface PayPalPaymentProps {
    onSuccess: (details: any) => void;
    amount?: number; // Optional amount override
}

const PayPalPayment: React.FC<PayPalPaymentProps> = ({ onSuccess, amount: initialAmount }) => {
    const [selectedAmount, setSelectedAmount] = useState(initialAmount || 10); // Default $10
    const [isCustom, setIsCustom] = useState(false);
    const [currency, setCurrency] = useState("USD");

    // Initial Options for Script
    const initialOptions = {
        clientId: "AbetxW7E4e1oEk3pR4SO5mMO_lYo8p3cfuvdWQT84w2ax5tD4dto-Vlffzfg-7glTtf3MYJlD6ggyo4n", // Sandbox ID
        currency: currency,
        intent: "capture",
    };

    const handleCreateOrder = async (data: any, actions: any) => {
        try {
            const order = await DataService.createPayPalOrder(selectedAmount, currency);
            return order.id;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const handleApprove = async (data: any, actions: any) => {
        try {
            const result = await DataService.capturePayPalOrder(data.orderID);
            if (result.status === "success") {
                onSuccess(result);
            } else {
                alert("Payment captured but status not success?");
            }
        } catch (error) {
            console.error("Capture Error", error);
            alert("Payment failed during capture.");
        }
    };

    const amountDisplay = (vals: number) => {
        return currency === 'EUR' ? `€${vals}` : currency === 'AED' ? `AED ${vals}` : `$${vals}`;
    };

    return (
        <div className="w-full">
            <h3 className="text-lg font-bold text-text-main mb-4">Add Credits / Donate</h3>

            <div className="mb-4">
                <label className="block text-xs font-bold text-text-muted mb-2">Select Currency</label>
                <div className="flex flex-wrap gap-2">
                    {["USD", "EUR", "AED", "CNY", "RUB"].map(curr => (
                        <button
                            key={curr}
                            onClick={() => setCurrency(curr)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${currency === curr ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-text-muted border-transparent hover:border-indigo-300'}`}
                        >
                            {curr}
                        </button>
                    ))}
                </div>
            </div>

            {/* Force re-render of ScriptProvider when currency changes by using key */}
            <PayPalScriptProvider options={initialOptions} key={currency}>
                <div className="space-y-4">
                    {/* Amount Selector */}
                    {!initialAmount && (
                        <div className="grid grid-cols-3 gap-3">
                            {[10, 25, 50, 100].map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => { setSelectedAmount(amt); setIsCustom(false); }}
                                    className={`py-2 px-4 rounded-xl border-2 font-bold text-sm transition-all ${!isCustom && selectedAmount === amt ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-text-muted hover:border-indigo-300'}`}
                                >
                                    {amountDisplay(amt)}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Custom Amount */}
                    {!initialAmount && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-text-muted">Custom:</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">{currency === 'EUR' ? '€' : currency === 'AED' ? 'د.إ' : '$'}</span>
                                <input
                                    type="number"
                                    value={selectedAmount}
                                    onChange={(e) => { setSelectedAmount(Number(e.target.value)); setIsCustom(true); }}
                                    className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-text-main focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Warning for Rubles/CNY on PayPal */}
                    {(currency === 'RUB' || currency === 'CNY') && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs rounded-lg">
                            Note: PayPal support for {currency} might be limited depending on your region.
                        </div>
                    )}

                    <div className="relative z-0">
                        <PayPalButtons
                            style={{ layout: "vertical", shape: "rect", borderRadius: 12 }}
                            createOrder={handleCreateOrder}
                            onApprove={handleApprove}
                        />
                    </div>
                </div>
            </PayPalScriptProvider>

            <p className="text-xs text-center text-text-muted mt-4">
                Payments processed securely by PayPal. Funds support server costs and development.
            </p>
        </div>
    );
};

export default PayPalPayment;

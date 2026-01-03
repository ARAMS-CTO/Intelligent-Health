import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { DataService } from '../services/api';

const CheckoutForm = ({ amount, currency, onSuccess }: { amount: number, currency: string, onSuccess: (id: string) => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        try {
            // 1. Create Intent Backend
            const { clientSecret, id } = await DataService.createStripePaymentIntent(amount, currency);

            // 2. Confirm Card Payment
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                }
            });

            if (result.error) {
                setError(result.error.message || "Payment failed");
            } else {
                if (result.paymentIntent?.status === 'succeeded') {
                    // 3. Verify on Backend
                    await DataService.verifyStripePayment(id);
                    onSuccess(id);
                }
            }
        } catch (e: any) {
            console.error(e);
            setError("Payment processing failed. Ensure backend is configured.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': { color: '#aab7c4' },
                        },
                        invalid: { color: '#9e2146' },
                    },
                }} />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
                {processing ? 'Processing...' : `Pay ${amount} ${currency.toUpperCase()}`}
            </button>
        </form>
    );
};

export const StripePayment = ({ onSuccess }: { onSuccess: () => void }) => {
    const [amount, setAmount] = useState(10);
    const [currency, setCurrency] = useState('usd');
    const [started, setStarted] = useState(false);
    const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
    const [isLoadingKey, setIsLoadingKey] = useState(true);

    useEffect(() => {
        // Load key dynamically
        fetch('/api/auth/config')
            .then(res => res.json())
            .then(data => {
                if (data.stripePublicKey) {
                    setStripePromise(loadStripe(data.stripePublicKey));
                }
            })
            .catch(err => console.error("Failed to load Stripe key", err))
            .finally(() => setIsLoadingKey(false));
    }, []);

    // Also fetch supported billing config for currency defaults?
    // For now, simple selector or passed prop would be better, but we keep local state for MVP.

    if (isLoadingKey) return <div className="text-center py-4 text-xs text-text-muted">Loading Secure Payment...</div>;
    if (!stripePromise) return <div className="text-center py-4 text-xs text-red-500">Stripe is not configured by Admin.</div>;

    return (
        <div className="w-full">
            <h3 className="text-lg font-bold text-text-main mb-4">Pay with Card / WeChat</h3>

            {!started ? (
                <div className="space-y-4">
                    <div className="flex gap-2 mb-2">
                        {['usd', 'eur', 'cny', 'rub'].map(c => (
                            <button
                                key={c}
                                onClick={() => setCurrency(c)}
                                className={`px-3 py-1 text-xs font-bold uppercase rounded-lg border ${currency === c ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-text-muted border-slate-200'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[10, 25, 50].map(amt => (
                            <button
                                key={amt}
                                onClick={() => setAmount(amt)}
                                className={`py-2 rounded-xl text-sm font-bold border ${amount === amt ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-text-main border-slate-200'}`}
                            >
                                {amount === amt ? `Selected` : `${amt}`}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-muted uppercase">{currency.toUpperCase()}</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-text-main"
                        />
                    </div>

                    <button onClick={() => setStarted(true)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">
                        Proceed to Payment
                    </button>
                    <p className="text-xs text-text-muted text-center">
                        Securely processed by Stripe. WeChat Pay supported for CNY.
                    </p>
                </div>
            ) : (
                <Elements stripe={stripePromise}>
                    <CheckoutForm amount={amount} currency={currency} onSuccess={() => { setStarted(false); onSuccess(); }} />
                    <button onClick={() => setStarted(false)} className="mt-2 text-sm text-text-muted hover:underline w-full text-center">Cancel</button>
                </Elements>
            )}
        </div>
    );
};

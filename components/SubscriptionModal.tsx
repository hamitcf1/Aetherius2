import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { createCheckoutSession } from '../services/stripe';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userEmail?: string;
    currentTier?: string;
}

const TIERS = [
    {
        id: 'price_novice', // Replace with actual Stripe Price ID
        name: 'Novice',
        price: '$4.99',
        features: ['No Ads', 'Access to Standard AI', 'Basic Cloud Saves'],
        color: 'text-gray-400',
        borderColor: 'border-gray-500',
        bg: 'bg-gray-900'
    },
    {
        id: 'price_apprentice', // Replace with actual Stripe Price ID
        name: 'Apprentice',
        price: '$9.99',
        features: ['All Novice Features', 'Advanced AI Models', 'Priority Support', 'Exclusive Cosmetics'],
        color: 'text-skyrim-gold',
        borderColor: 'border-skyrim-gold',
        bg: 'bg-yellow-900/20'
    },
    {
        id: 'price_master', // Replace with actual Stripe Price ID
        name: 'Master',
        price: '$19.99',
        features: ['All Apprentice Features', 'GPT-4 Access', 'Unlimited Cloud Storage', 'Early Access Features', 'Custom AI Personality'],
        color: 'text-purple-400',
        borderColor: 'border-purple-500',
        bg: 'bg-purple-900/20'
    }
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, userId, userEmail, currentTier }) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubscribe = async (priceId: string) => {
        setLoading(priceId);
        setError(null);
        try {
            await createCheckoutSession(priceId, userId, userEmail);
        } catch (err: any) {
            setError(err.message || 'Checkout failed');
            setLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl bg-skyrim-dark border border-skyrim-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-skyrim-border flex items-center justify-between bg-black/40">
                    <div>
                        <h2 className="text-2xl font-bold text-skyrim-gold font-serif">Premium Aetherius</h2>
                        <p className="text-skyrim-text text-sm mt-1">Unlock your true potential with a subscription.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6 text-skyrim-text" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 text-red-200 rounded">
                            {error}
                        </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-6">
                        {TIERS.map((tier) => (
                            <div
                                key={tier.id}
                                className={`flex flex-col border rounded-lg p-6 relative transition-all duration-300 hover:scale-105 ${tier.bg} ${currentTier === tier.name.toLowerCase() ? 'border-green-500 ring-2 ring-green-500/50' : tier.borderColor
                                    }`}
                            >
                                {currentTier === tier.name.toLowerCase() && (
                                    <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-bl">
                                        CURRENT
                                    </div>
                                )}

                                <h3 className={`text-xl font-bold ${tier.color} mb-2 font-serif`}>{tier.name}</h3>
                                <div className="text-3xl font-bold text-white mb-6">{tier.price}<span className="text-sm text-gray-400 font-normal">/mo</span></div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {tier.features.map((feat, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                            <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSubscribe(tier.id)}
                                    disabled={!!loading || currentTier === tier.name.toLowerCase()}
                                    className={`w-full py-2 px-4 rounded font-bold transition-all ${currentTier === tier.name.toLowerCase()
                                            ? 'bg-green-900/50 text-green-400 cursor-default'
                                            : 'bg-skyrim-gold text-skyrim-dark hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    {loading === tier.id ? 'Loading...' : currentTier === tier.name.toLowerCase() ? 'Active' : 'Subscribe'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';

interface PricingSectionProps {
    onLogin?: () => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onLogin }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const plans = [
        {
            id: 'novice',
            name: "Novice",
            price: "0",
            description: "Essential tools for the casual adventurer.",
            features: [
                "Create up to 1 Character",
                "Basic Interactive Map",
                "Quest Journal",
                "Community Support"
            ],
            highlight: false
        },
        {
            id: 'adept',
            name: "Adept",
            price: billingCycle === 'monthly' ? "4.99" : "49.99",
            description: "Advanced features for the dedicated player.",
            features: [
                "Create up to 5 Characters",
                "Advanced Combat Simulator",
                "Unlimited AI Scribe entries",
                "Cloud Save Sync",
                "Priority Support"
            ],
            highlight: true
        },
        {
            id: 'master',
            name: "Master",
            price: billingCycle === 'monthly' ? "9.99" : "99.99",
            description: "Complete mastery over your Skyrim experience.",
            features: [
                "Unlimited Characters",
                "Custom Mod Integration Tools",
                "Early Access to New Features",
                "Exclusive Profile Badges",
                "Developer Direct Access",
                "4K Map Downloads"
            ],
            highlight: false
        }
    ];

    const handleAction = (planId: string) => {
        if (onLogin) {
            // In a real app, we might save the plan selection in sessionStorage
            // to automatically open the Stripe checkout after login.
            if (planId !== 'novice') {
                sessionStorage.setItem('aetherius:pendingPlan', planId);
            }
            onLogin();
        }
    };

    return (
        <section className="py-24 relative z-10" id="pricing">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-amber-200 mb-4"
                    >
                        Choose Your Path
                    </motion.h2>
                    <p className="text-gray-400 mb-8">Unlock the full potential of Aetherius.</p>

                    <div className="inline-flex items-center p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Yearly <span className="text-amber-300 text-xs ml-1">-20%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative p-8 rounded-2xl border backdrop-blur-sm flex flex-col ${plan.highlight
                                ? 'bg-blue-900/10 border-blue-500/50 shadow-2xl shadow-blue-500/10 scale-105 z-10'
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1">
                                    <Star size={12} fill="currentColor" /> MOST POPULAR
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-blue-400' : 'text-white'}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                                    <span className="text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-2">{plan.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-gray-300 text-sm">
                                        <div className={`p-1 rounded-full ${plan.highlight ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400'}`}>
                                            <Check size={12} />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleAction(plan.id)}
                                className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.highlight
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-white/10 hover:bg-white/15 text-white'
                                    }`}>
                                {index === 0 ? 'Start Free' : 'Subscribe Now'}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingSection;

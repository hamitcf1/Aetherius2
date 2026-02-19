import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface TermsPageProps {
    onBack: () => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-16">
            <div className="max-w-4xl mx-auto">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-white">
                        Terms of Service
                    </h1>

                    <div className="space-y-8 text-gray-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using Aetherius, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                            <p>
                                Aetherius is a companion application for Skyrim, providing tools for character tracking, quest management, and gameplay simulation. We are not affiliated with Bethesda Softworks.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                            <p>
                                You are responsible for maintaining the security of your account and for all activities that occur under your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Prohibited Conduct</h2>
                            <p>
                                You agree not to use the service for any illegal purpose or in any way that interrupts, damages, or impairs the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Disclaimer</h2>
                            <p>
                                The service is provided "as is" without warranties of any kind. We do not guarantee that the service will be error-free or uninterrupted.
                            </p>
                        </section>

                        <section className="pt-8 text-sm text-gray-500">
                            Last Updated: {new Date().toLocaleDateString()}
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsPage;

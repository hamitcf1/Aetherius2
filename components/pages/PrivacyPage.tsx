import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPageProps {
    onBack: () => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
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
                    <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">
                        Privacy Policy
                    </h1>

                    <div className="space-y-8 text-gray-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                            <p>
                                We collect information you provide directly to us when you create an account, create a character, or communicate with us. This may include your email address, username, and gameplay data (character stats, inventory, quests).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                            <p>
                                We use the information we collect to provide, maintain, and improve our services, including:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li>Processing your gameplay data to provide features like the combat simulator and AI scribe.</li>
                                <li>Syncing your progress across devices (if applicable).</li>
                                <li>Responding to your comments and questions.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. Data Storage</h2>
                            <p>
                                Your data is stored securely using Firebase. We do not sell your personal data to third parties.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Updates to this Policy</h2>
                            <p>
                                We may update this privacy policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy.
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

export default PrivacyPage;

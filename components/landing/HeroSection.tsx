import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';

interface HeroSectionProps {
    onGetStarted: () => void;
    onViewFeatures: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onViewFeatures }) => {
    return (
        <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '6s' }} />
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md"
                    >
                        <Sparkles size={16} className="text-amber-400" />
                        <span className="text-sm font-medium text-gray-300">Next Gen Skyrim Companion</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 mb-6 tracking-tight leading-tight">
                        Master Your <br />
                        <span className="text-blue-500">Dragonborn</span> Destiny
                    </h1>

                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        The ultimate companion app for Skyrim. Track quests, manage inventory, simulate combat, and explore Tamriel like never before with AI-powered insights.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onGetStarted}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all w-full sm:w-auto justify-center"
                        >
                            Get Started Free
                            <ArrowRight size={20} />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onViewFeatures}
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold text-lg backdrop-blur-md transition-all w-full sm:w-auto justify-center"
                        >
                            Explore Features
                        </motion.button>
                    </div>
                </motion.div>

                {/* Floating Feature Icons */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 -left-4 md:left-10 lg:left-20 bg-gray-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md hidden md:block"
                >
                    <Shield size={32} className="text-blue-400" />
                </motion.div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-1/3 -right-4 md:right-10 lg:right-20 bg-gray-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md hidden md:block"
                >
                    <Zap size={32} className="text-amber-400" />
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{ delay: 1, duration: 2, repeat: Infinity }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500"
            >
                <div className="w-1 h-12 rounded-full bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            </motion.div>
        </div>
    );
};

export default HeroSection;

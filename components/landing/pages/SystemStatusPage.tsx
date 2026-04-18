import React from 'react';
import { motion } from 'framer-motion';

interface SystemStatusPageProps {
  onBack: () => void;
}

export const SystemStatusPage: React.FC<SystemStatusPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-skyrim-dark p-4 relative pt-24 pb-12">
        <div className="max-w-4xl mx-auto relative z-10">
            <button 
                onClick={onBack}
                className="text-skyrim-gold hover:text-yellow-400 transition-colors uppercase tracking-widest text-sm font-bold flex items-center mb-12"
            >
                ← Return
            </button>

            <div className="mb-16 text-center">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-skyrim-gold tracking-widest mb-4 uppercase">Network <span className="text-white">Status</span></h1>
                <p className="text-xl text-skyrim-silver">Real-time health of Aetherius services</p>
            </div>

            <div className="bg-black/60 border border-green-500/30 p-8 mb-12">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                    <h2 className="text-xl font-serif font-bold text-green-400 uppercase">All Systems Operational</h2>
                </div>
                <p className="text-skyrim-silver">The network is stable. Syncing is functioning normally.</p>
            </div>

            <div className="space-y-4">
                {[
                    { name: "Bethesda.net Auth API", status: "Operational", color: "text-green-400" },
                    { name: "Modlist Sync Service", status: "Operational", color: "text-green-400" },
                    { name: "Save Game Backup Servers", status: "Operational", color: "text-green-400" }
                ].map((service, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-6 border border-skyrim-gold/10 bg-black/40"
                    >
                        <span className="text-white font-bold tracking-wide">{service.name}</span>
                        <span className={`${service.color} font-black uppercase tracking-widest text-sm`}>{service.status}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    </div>
  );
};

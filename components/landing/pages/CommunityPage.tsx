import React from 'react';
import { motion } from 'framer-motion';

interface CommunityPageProps {
  onBack: () => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-skyrim-dark p-4 relative pt-24 pb-12">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
            <button 
                onClick={onBack}
                className="absolute -top-12 left-0 text-skyrim-gold hover:text-yellow-400 transition-colors uppercase tracking-widest text-sm font-bold flex items-center"
            >
                ← Return
            </button>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-16"
            >
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-skyrim-gold tracking-widest uppercase mb-4">
                    The <span className="text-white">Nexus</span>
                </h1>
                <p className="text-xl text-skyrim-silver max-w-2xl mx-auto">
                    Join thousands of Dovahkiin sharing modlists and battle stories.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                {[
                    { title: "Tavern Chat", desc: "Join our official Discord to coordinate mod testing and share screenshots.", link: "Join Discord" },
                    { title: "Mod Forums", desc: "Deep dive into load order logic and technical troubleshooting.", link: "Visit Forums" }
                ].map((comm, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="p-8 border border-skyrim-gold/20 bg-black/40 hover:bg-black/60 transition-colors"
                    >
                        <h3 className="text-2xl font-serif font-bold text-white mb-4 uppercase tracking-wider">{comm.title}</h3>
                        <p className="text-skyrim-silver leading-relaxed mb-8">
                            {comm.desc}
                        </p>
                        <button className="text-skyrim-gold font-bold uppercase tracking-widest border border-skyrim-gold px-6 py-3 hover:bg-skyrim-gold hover:text-black transition-colors w-full">
                            {comm.link}
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    </div>
  );
};

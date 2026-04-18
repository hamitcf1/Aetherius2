import React from 'react';
import { Shield, Sparkles, BookOpen, Sword } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeaturesPageProps {
  onBack: () => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-skyrim-dark text-skyrim-text p-4 relative overflow-hidden pt-24 pb-12">
      <div className="max-w-6xl mx-auto relative z-10">
        <button 
          onClick={onBack}
          className="text-skyrim-gold hover:text-yellow-400 transition-colors uppercase tracking-widest text-sm font-bold flex items-center mb-12"
        >
          ← Return
        </button>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
        >
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-skyrim-gold tracking-widest uppercase mb-4">
                Arcane <span className="text-white">Mechanics</span>
            </h1>
            <p className="text-xl text-skyrim-silver max-w-2xl">
                Aetherius is built from the ground up to stabilize and enhance your ongoing Modlists.
            </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
                { icon: Shield, title: "Save Corruption Protection", desc: "Automated backups of your SKSE co-saves, ensuring a corrupted active script never claims your 200-hour playthrough." },
                { icon: Sparkles, title: "Dynamic Load Order", desc: "Conflict resolution happens beautifully through our web app before you even launch Mod Organizer 2." },
                { icon: BookOpen, title: "Lore Library Sync", desc: "Read in-game books on your mobile device by syncing your character's discovered texts instantly." },
                { icon: Sword, title: "Combat Metrics", desc: "A robust dashboard dissecting your DPS, staggered times, and damage taken per encounter." }
            ].map((feat, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="p-8 border border-skyrim-gold/20 bg-black/40 hover:bg-black/60 transition-colors relative group"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-skyrim-gold to-yellow-800 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    
                    <feat.icon className="w-10 h-10 text-skyrim-gold mb-6" />
                    <h3 className="text-2xl font-serif font-bold text-white mb-4 uppercase tracking-wider">{feat.title}</h3>
                    <p className="text-skyrim-silver leading-relaxed">
                        {feat.desc}
                    </p>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
};

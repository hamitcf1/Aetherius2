import React from 'react';
import { motion } from 'framer-motion';

interface ChangelogPageProps {
  onBack: () => void;
}

export const ChangelogPage: React.FC<ChangelogPageProps> = ({ onBack }) => {
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
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-skyrim-gold tracking-widest mb-4 uppercase">The Elder <span className="text-white">Scrolls</span></h1>
                <p className="text-xl text-skyrim-silver">Changelog & Updates</p>
            </div>

            <div className="space-y-12">
                {[
                    { v: "Update 1.4", title: "The Dragonborn Integration", desc: "Added full synchronization for all Shouts and cooldown mechanics across the web view. Fixed an issue where the map would glitch on 4K monitors." },
                    { v: "Update 1.3", title: "Guild Statistics", desc: "Added the Thieves Guild and Dark Brotherhood tracking overlays. You can now see exact gold fenced directly in your dashboard." },
                    { v: "Update 1.0", title: "Initial Release", desc: "The dawn of Aetherius. Web-based modlist management and character tracking." }
                ].map((patch, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-black/60 border border-skyrim-gold/20 p-8 relative overflow-hidden"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-skyrim-gold text-sm font-black uppercase tracking-widest">
                                {patch.v}
                            </span>
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-white mb-3 uppercase">{patch.title}</h2>
                        <p className="text-skyrim-silver leading-relaxed">
                            {patch.desc}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    </div>
  );
};

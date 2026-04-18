import React from 'react';
import { motion } from 'framer-motion';

interface BlogPageProps {
  onBack: () => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-skyrim-dark p-4 relative pt-24 pb-12">
        <div className="max-w-5xl mx-auto relative z-10">
            <button 
                onClick={onBack}
                className="text-skyrim-gold hover:text-yellow-400 transition-colors uppercase tracking-widest text-sm font-bold flex items-center mb-12"
            >
                ← Return
            </button>

            <div className="mb-16 text-center">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-skyrim-gold tracking-widest mb-4 uppercase">The Courier's <span className="text-white">Letters</span></h1>
                <p className="text-xl text-skyrim-silver">Developer updates, lore deep-dives, and community spotlights.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { title: "Building an immersive Modlist in 2026", cat: "Guides", date: "Fredas, Hearthfire 15", desc: "Our definitive guide to maximizing frame rates without compromising on those glorious 4K textures.", img: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=800&q=80" },
                    { title: "Why Auto-Saves corrupt, and how we fixed it", cat: "Engineering", date: "Tirdas, Frostfall 2", desc: "A technical retrospective on the papyrus string dictionary limits and how Aetherius safely unbinds orphaned scripts.", img: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80" },
                ].map((post, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        className="bg-black/40 border border-skyrim-gold/20 hover:border-skyrim-gold/50 transition-colors group cursor-pointer"
                    >
                        <div className="h-48 overflow-hidden relative border-b border-skyrim-gold/20">
                            <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60" />
                            <div className="absolute top-4 left-4 bg-skyrim-dark/80 backdrop-blur border border-skyrim-gold/30 px-3 py-1 text-xs font-black uppercase text-skyrim-gold">
                                {post.cat}
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="text-xs text-skyrim-silver mb-3 uppercase tracking-widest">{post.date}</div>
                            <h2 className="text-2xl font-serif font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">{post.title}</h2>
                            <p className="text-skyrim-silver/80 line-clamp-3">{post.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </div>
  );
};

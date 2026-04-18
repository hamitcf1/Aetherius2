import React from 'react';
import { Download, MonitorPlay } from 'lucide-react';
import { motion } from 'framer-motion';

interface DownloadPageProps {
  onBack: () => void;
}

export const DownloadPage: React.FC<DownloadPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-skyrim-dark flex items-center justify-center p-4 relative overflow-hidden pt-24 pb-12">
      <div className="absolute top-0 right-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=2000')] opacity-5 bg-cover bg-center mix-blend-overlay pointer-events-none" />
      
      <div className="max-w-4xl w-full mx-auto relative z-10 text-center">
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
        >
            <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-yellow-800 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-yellow-600/20 border border-skyrim-gold/30">
                <Download className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-skyrim-gold tracking-widest mb-8 uppercase">
                Install <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">Aetherius</span>
            </h1>
            
            <p className="text-xl text-skyrim-silver mb-16 max-w-2xl mx-auto leading-relaxed">
                Connect your Bethesda.net account, synchronize your modlists, and step back into Tamriel with unparalleled stability.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button className="w-full sm:w-auto flex items-center gap-4 bg-skyrim-gold text-skyrim-dark px-8 py-5 rounded-sm hover:scale-105 transition-all hover:bg-yellow-500 font-bold group border border-yellow-300">
                    <Download className="w-8 h-8" />
                    <div className="text-left">
                        <p className="text-[10px] uppercase tracking-wider text-black/70 font-black">Download for</p>
                        <p className="text-xl font-serif">Windows</p>
                    </div>
                </button>
                
                <button className="w-full sm:w-auto flex items-center gap-4 bg-black/40 border border-skyrim-gold/30 text-skyrim-gold px-8 py-5 rounded-sm hover:-translate-y-1 transition-all hover:bg-white/5 font-bold">
                    <MonitorPlay className="w-8 h-8" />
                    <div className="text-left">
                        <p className="text-[10px] uppercase tracking-wider text-skyrim-silver font-black">Launch</p>
                        <p className="text-xl font-serif">Web Client</p>
                    </div>
                </button>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

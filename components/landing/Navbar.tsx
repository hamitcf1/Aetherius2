import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Menu, X } from 'lucide-react';

interface NavbarProps {
    onEnterApp: () => void;
    onNavigate: (path: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onEnterApp, onNavigate }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#050505]/80 border-b border-white/5 transition-all">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                
                {/* Brand / Logo */}
                <button onClick={() => onNavigate('/')} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all group-hover:scale-105">
                        <Swords className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-xl text-white tracking-tight">Aetherius</span>
                </button>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    <button onClick={() => onNavigate('/features')} className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Features</button>
                    <button onClick={() => {
                        const el = document.getElementById('pricing');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }} className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Pricing</button>
                    <button onClick={() => onNavigate('/community')} className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Community</button>
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <button onClick={onEnterApp} className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                        Sign In
                    </button>
                    <button
                        onClick={onEnterApp}
                        className="text-sm font-bold bg-white text-blue-950 px-6 py-2.5 rounded-full transition-all hover:scale-105 hover:bg-gray-100 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                    >
                        Get Started
                    </button>
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                    className="md:hidden p-2 -mr-2 text-gray-400 hover:text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl overflow-hidden"
                    >
                        <div className="px-6 py-6 flex flex-col gap-4">
                            <button onClick={() => { setMobileMenuOpen(false); onNavigate('/features'); }} className="text-left text-lg font-medium text-gray-300 hover:text-white">Features</button>
                            <button onClick={() => { setMobileMenuOpen(false); const el = document.getElementById('pricing'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} className="text-left text-lg font-medium text-gray-300 hover:text-white">Pricing</button>
                            <button onClick={() => { setMobileMenuOpen(false); onNavigate('/community'); }} className="text-left text-lg font-medium text-gray-300 hover:text-white">Community</button>
                            <div className="h-[1px] w-full bg-white/10 my-2"></div>
                            <button onClick={() => { setMobileMenuOpen(false); onEnterApp(); }} className="text-left text-lg font-medium text-gray-300 hover:text-white">Sign In</button>
                            <button
                                onClick={() => { setMobileMenuOpen(false); onEnterApp(); }}
                                className="w-full mt-2 text-center text-lg font-bold bg-white text-black px-6 py-3 rounded-xl shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                            >
                                Get Started
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;

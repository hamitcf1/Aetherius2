import React from 'react';
import { Github, Twitter, Youtube, Swords } from 'lucide-react';

interface FooterProps {
    onNavigate: (path: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
    return (
        <footer className="py-16 border-t border-white/5 bg-[#050505] relative z-10 shrink-0">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    
                    {/* Column 1: Brand & Socials */}
                    <div className="col-span-1 md:col-span-1">
                        <button onClick={() => onNavigate('/')} className="flex items-center gap-2 mb-4 group w-fit">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-amber-500 flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-blue-500/20">
                                <Swords className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-white">Aetherius</span>
                        </button>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6 pr-4">
                            The ultimate companion for your Skyrim adventures. Track, plan, and simulate your journey with ease.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://github.com/hamitcf1" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" aria-label="GitHub">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="https://twitter.com/hamitcf" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" aria-label="Twitter">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://youtube.com/@hamitcf" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" aria-label="YouTube">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Product */}
                    <div>
                        <h4 className="text-sm font-bold text-white mb-6">Product</h4>
                        <ul className="flex flex-col gap-4">
                            <li><button onClick={() => onNavigate('/features')} className="text-sm text-gray-400 hover:text-blue-500 transition-colors">Features</button></li>
                            <li><button onClick={() => {
                                const el = document.getElementById('pricing');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }} className="text-sm text-gray-400 hover:text-blue-500 transition-colors">Pricing</button></li>
                            <li><button onClick={() => onNavigate('/download')} className="text-sm text-gray-400 hover:text-blue-500 transition-colors">Download App</button></li>
                            <li><button onClick={() => onNavigate('/changelog')} className="text-sm text-gray-400 hover:text-blue-500 transition-colors">Changelog</button></li>
                        </ul>
                    </div>

                    {/* Column 3: Resources */}
                    <div>
                        <h4 className="text-sm font-bold text-white mb-6">Resources</h4>
                        <ul className="flex flex-col gap-4">
                            <li><button onClick={() => onNavigate('/blog')} className="text-sm text-gray-400 hover:text-blue-500 transition-colors">Blog</button></li>
                            <li><button onClick={() => onNavigate('/docs')} className="text-sm text-gray-400 hover:text-blue-500 transition-colors">Documentation</button></li>
                            <li><button onClick={() => onNavigate('/status')} className="text-sm text-gray-400 hover:text-blue-500 transition-colors">System Status</button></li>
                            <li><button onClick={() => onNavigate('/community')} className="text-sm text-gray-400 hover:text-blue-500 transition-colors">Community</button></li>
                        </ul>
                    </div>

                    {/* Column 4: Legal */}
                    <div>
                        <h4 className="text-sm font-bold text-white mb-6">Legal</h4>
                        <ul className="flex flex-col gap-4">
                            <li><button onClick={() => onNavigate('/privacy')} className="text-sm text-gray-400 hover:text-blue-500 transition-colors">Privacy Policy</button></li>
                            <li><button onClick={() => onNavigate('/terms')} className="text-sm text-gray-400 hover:text-blue-500 transition-colors">Terms of Service</button></li>
                            <li><button onClick={() => onNavigate('/cookie-policy')} className="text-sm text-gray-400 hover:text-blue-500 transition-colors">Cookie Policy</button></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Aetherius project. Not affiliated with Bethesda Softworks.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        Crafted by <span className="text-blue-500 font-medium">Hamit Can Fındık</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

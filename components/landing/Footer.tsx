import React from 'react';
import { Github, Twitter, MessageCircle } from 'lucide-react';

interface FooterProps {
    onNavigate: (path: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
    return (
        <footer className="border-t border-white/5 bg-black/20 backdrop-blur-xl relative z-10">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <h3 className="text-xl font-bold text-white mb-4">Aetherius</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            The ultimate companion for your Skyrim adventures. Track, plan, and simulate your journey with ease.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-blue-400 transition-colors">Features</button></li>
                            <li><button onClick={() => { }} className="hover:text-blue-400 transition-colors">Pricing</button></li>
                            <li><button onClick={() => { }} className="hover:text-blue-400 transition-colors">Download</button></li>
                            <li><button onClick={() => { }} className="hover:text-blue-400 transition-colors">Changelog</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><button onClick={() => { }} className="hover:text-blue-400 transition-colors">Documentation</button></li>
                            <li><button onClick={() => { }} className="hover:text-blue-400 transition-colors">API Reference</button></li>
                            <li><button onClick={() => { }} className="hover:text-blue-400 transition-colors">Community</button></li>
                            <li><button onClick={() => { }} className="hover:text-blue-400 transition-colors">Help Center</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <button
                                    onClick={() => onNavigate('/privacy')}
                                    className="hover:text-blue-400 transition-colors"
                                >
                                    Privacy Policy
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => onNavigate('/terms')}
                                    className="hover:text-blue-400 transition-colors"
                                >
                                    Terms of Service
                                </button>
                            </li>
                            <li><button onClick={() => { }} className="hover:text-blue-400 transition-colors">Cookie Policy</button></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} Aetherius project. Not affiliated with Bethesda Softworks.
                    </p>

                    <div className="flex items-center gap-4">
                        <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                            <Github size={18} />
                        </a>
                        <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                            <Twitter size={18} />
                        </a>
                        <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                            <MessageCircle size={18} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

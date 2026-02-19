import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface InformationPageProps {
    title: string;
    description: string;
    onBack: () => void;
    children?: React.ReactNode;
}

export const InformationPage: React.FC<InformationPageProps> = ({ title, description, onBack, children }) => {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </button>
                    <div className="text-xl font-bold tracking-tighter">Aetherius</div>
                </div>
            </nav>

            {/* Content */}
            <main className="pt-32 pb-24 container mx-auto px-4 max-w-4xl">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-amber-200">
                        {title}
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="glass-panel p-8 md:p-12 border border-white/10 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

                    <article className="prose prose-invert prose-blue max-w-none">
                        {children || (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
                                <p className="text-gray-400">Our Scribes are currently documenting this section. Check back soon for the full details.</p>
                            </div>
                        )}
                    </article>
                </div>
            </main>

            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px]"></div>
                <div className="absolute bottom-1/4 -left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px]"></div>
            </div>
        </div>
    );
};

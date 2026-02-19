import React from 'react';
import { motion } from 'framer-motion';
import { Map, Scroll, Sword, Brain, ShoppingBag, Users } from 'lucide-react';

const features = [
    {
        icon: <Map className="w-8 h-8 text-blue-400" />,
        title: "Interactive Map",
        description: "Track your location, discover hidden dungeons, and mark custom points of interest across Skyrim."
    },
    {
        icon: <Scroll className="w-8 h-8 text-amber-400" />,
        title: "Quest Management",
        description: "Organize your active quests, track objectives, and never lose sight of your dragonborn duties."
    },
    {
        icon: <Sword className="w-8 h-8 text-red-400" />,
        title: "Combat Simulator",
        description: "Test your build against various enemies with our advanced combat calculator before entering the fray."
    },
    {
        icon: <Brain className="w-8 h-8 text-purple-400" />,
        title: "AI Scribe",
        description: "Let our AI document your adventures, generating rich journals and stories from your gameplay."
    },
    {
        icon: <ShoppingBag className="w-8 h-8 text-green-400" />,
        title: "Inventory & Trade",
        description: "Manage your loot, calculate encumbrance, and find the best merchants for your goods."
    },
    {
        icon: <Users className="w-8 h-8 text-indigo-400" />,
        title: "Character Profiles",
        description: "Create and manage multiple character builds, tracking skills, perks, and morality."
    }
];

const FeaturesSection: React.FC = () => {
    return (
        <section className="py-24 relative z-10">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-4"
                    >
                        Everything You Need
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 text-lg max-w-2xl mx-auto"
                    >
                        Aetherius provides a comprehensive suite of tools to enhance your Skyrim experience, from planning builds to chronicling your journey.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                            className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300 group hover:border-blue-500/30"
                        >
                            <div className="mb-6 p-4 rounded-xl bg-white/5 w-fit group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;

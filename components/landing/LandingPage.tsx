import React from 'react';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import PricingSection from './PricingSection';
import Footer from './Footer';

interface LandingPageProps {
    onEnterApp: () => void;
    onNavigate: (path: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onNavigate }) => {
    const scrollToFeatures = () => {
        const featuresSection = document.getElementById('features');
        if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Fallback if ID is missing or component not mounted yet (though it should be)
            window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            <HeroSection onGetStarted={onEnterApp} onViewFeatures={scrollToFeatures} />

            <div id="features">
                <FeaturesSection />
            </div>

            <PricingSection />

            <Footer onNavigate={onNavigate} />
        </div>
    );
};

export default LandingPage;

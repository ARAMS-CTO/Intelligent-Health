import React, { useState } from 'react';
import { Role } from '../types/index';
import { ICONS } from '../constants/index';

const featuresByRole = {
  [Role.Doctor]: {
    title: "For Doctors",
    description: "Create anonymised cases, invite specialists, and receive AI-assisted diagnostic and treatment options to enhance your clinical decisions.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  },
  [Role.Nurse]: {
    title: "For Nurses",
    description: "Document crucial bedside observations, upload photos of clinical signs, and contribute to care protocols with practical, on-the-ground insights.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
  },
  [Role.Specialist]: {
    title: "For Specialists",
    description: "Engage in deep case analysis, provide expert opinions, and contribute to the evolution of AI models by validating their outputs.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-12v4m-2-2h4m5 4v4m-2-2h4M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5z" /></svg>
  },
  [Role.Patient]: {
    title: "For Patients",
    description: "Manage your personal health record, upload reports, and use a personal AI assistant to understand your conditions and treatment options better.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  },
};

const HeroSection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => (
  <div className="text-center py-20 lg:py-32 bg-background">
    <h1 className="text-4xl lg:text-6xl font-extrabold text-text-main">
      Collaborative Care, Intelligent Insights.
    </h1>
    <p className="mt-4 text-lg lg:text-xl text-text-muted max-w-3xl mx-auto">
      A knowledge-sharing platform where medical expertise and artificial intelligence unite to prioritize one thing: <span className="font-bold text-accent">improving patient health outcomes.</span>
    </p>
    <div className="mt-8 flex justify-center gap-4 flex-wrap">
      <button onClick={onGetStarted} className="bg-primary text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-primary-hover transition duration-300 transform hover:scale-105">
        Get Started as Medical Staff
      </button>
      <button onClick={onGetStarted} className="bg-accent text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-accent-hover transition duration-300 transform hover:scale-105">
        Get Started as a Patient
      </button>
    </div>
  </div>
);

const VideoSection: React.FC = () => (
    <div className="py-16 bg-surface">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-text-main mb-4">See How It Works</h2>
            <p className="text-text-muted max-w-2xl mx-auto mb-8">
                Watch this short video to see how our platform transforms collaboration and decision-making in healthcare.
            </p>
            <div className="aspect-w-16 aspect-h-9 max-w-4xl mx-auto rounded-lg shadow-2xl overflow-hidden bg-black">
                {/* Placeholder for an embedded video */}
                <div className="flex items-center justify-center h-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
        </div>
    </div>
);

const FeatureCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const roles = Object.keys(featuresByRole) as (keyof typeof featuresByRole)[];

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % roles.length);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + roles.length) % roles.length);

  const activeFeature = featuresByRole[roles[activeIndex]];

  return (
    <div className="bg-primary py-20 text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Designed for Every Role in Patient Care</h2>
        <div className="relative flex items-center justify-center max-w-4xl mx-auto min-h-[250px]">
          <button onClick={prevSlide} className="absolute left-0 -translate-x-1/2 p-2 bg-white/20 rounded-full hover:bg-white/40 transition">
            {ICONS.chevronLeft}
          </button>
          
          <div className="w-full text-center px-12">
            <div className="flex justify-center mb-4">{activeFeature.icon}</div>
            <h3 className="text-2xl font-bold mb-2">{activeFeature.title}</h3>
            <p className="text-lg opacity-90 max-w-xl mx-auto">{activeFeature.description}</p>
          </div>

          <button onClick={nextSlide} className="absolute right-0 translate-x-1/2 p-2 bg-white/20 rounded-full hover:bg-white/40 transition">
            {ICONS.chevronRight}
          </button>
        </div>
        <div className="flex justify-center mt-8 space-x-2">
            {roles.map((_, index) => (
                <button key={index} onClick={() => setActiveIndex(index)} className={`w-3 h-3 rounded-full ${activeIndex === index ? 'bg-white' : 'bg-white/50'} transition`}></button>
            ))}
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  return (
    <main>
      <HeroSection onGetStarted={onGetStarted} />
      <VideoSection />
      <FeatureCarousel />
      <footer className="bg-slate-800 dark:bg-slate-900 text-slate-300 dark:text-slate-400 text-center p-4">
        <p>&copy; 2025 Intelligent Hospital, where Patient health outcomes is always first!</p>
      </footer>
    </main>
  );
};

export default LandingPage;
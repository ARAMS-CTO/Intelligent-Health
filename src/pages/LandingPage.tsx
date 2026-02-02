import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS, APP_VERSION } from '../constants/index';
import { showToast } from '../components/Toast';


import { Link } from 'react-router-dom';

const ECOSYSTEM_NODES = [
  { id: 'patient', role: "rolePatient", desc: "ecoPatientDesc", icon: ICONS.user, color: "from-emerald-400 to-teal-500" },
  { id: 'doctor', role: "roleDoctor", desc: "ecoDoctorDesc", icon: ICONS.specialist, color: "from-blue-500 to-indigo-600" },
  { id: 'ai', role: "roleAI", desc: "ecoAIDesc", icon: ICONS.ai, color: "from-purple-500 to-pink-500" },
  { id: 'nurse', role: "roleNurse", desc: "ecoNurseDesc", icon: ICONS.nurse, color: "from-cyan-400 to-blue-400" },
  { id: 'lab', role: "roleLab", desc: "ecoLabDesc", icon: ICONS.microscope, color: "from-amber-400 to-orange-500" },
  { id: 'pharma', role: "rolePharma", desc: "ecoPharmaDesc", icon: ICONS.pill, color: "from-red-400 to-rose-500" },
  { id: 'insurance', role: "roleInsurance", desc: "ecoInsuranceDesc", icon: ICONS.billing, color: "from-green-500 to-emerald-600" },
];

const EcosystemSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Connection Lines Background (Abstract) */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M50 50 L20 20 M50 50 L80 20 M50 50 L20 80 M50 50 L80 80 M50 50 L50 20" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" fill="none" />
          <circle cx="50" cy="50" r="20" className="animate-pulse text-primary/5" fill="currentColor" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            {t('featureList3')}
          </div>
          <h2 className="text-4xl sm:text-6xl font-heading font-black text-text-main tracking-tighter">
            {t('ecosystemTitle')}
          </h2>
          <p className="text-xl text-text-muted font-medium max-w-2xl mx-auto leading-relaxed">
            {t('ecosystemDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          {/* Center Node (AI/Patient Core) */}
          <div className="lg:col-start-2 lg:row-start-2 flex justify-center items-center">
            <div className="relative group w-full max-w-sm">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-[40px] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <div className="relative h-full bg-white dark:bg-slate-900 ring-1 ring-gray-900/5 rounded-[40px] leading-none flex items-top justify-start space-x-6 p-8 shadow-2xl">
                <div className="space-y-6 text-center w-full">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-primary to-purple-600 rounded-3xl flex items-center justify-center text-white shadow-lg animate-float">
                    {React.cloneElement(ICONS.ai as any, { className: "w-10 h-10" })}
                  </div>
                  <h3 className="text-2xl font-black text-text-main">{t('roleAI')}</h3>
                  <p className="text-sm text-text-muted font-medium leading-relaxed">{t('ecoAIDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Orbiting Nodes */}
          {ECOSYSTEM_NODES.filter(n => n.id !== 'ai').map((node, i) => (
            <div key={node.id} className="glass-card p-8 rounded-3xl border border-white/20 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${node.color} flex items-center justify-center text-white mb-6 shadow-lg transform -rotate-3`}>
                {React.cloneElement(node.icon as any, { className: "w-7 h-7" })}
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">{t(node.role)}</h3>
              <p className="text-sm text-text-muted font-medium">{t(node.desc)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HeroSection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const { t } = useTranslation();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const heroImages = [
    { src: "/hero.png", alt: "Intelligent Health Dashboard" },
    { src: "/analysis.png", alt: "AI Analysis" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden py-20 px-4">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-primary/10 blur-[160px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[40%] h-[60%] bg-accent/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="animate-fade-in space-y-10 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/20 dark:border-slate-700/50 backdrop-blur-xl shadow-sm bg-white/40 dark:bg-slate-800/40">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t('heroBadge')}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-heading font-black text-text-main leading-[0.95] tracking-tighter">
            {t('heroTitlePre')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-accent">{t('heroTitlePost')}</span>
          </h1>

          <p className="text-xl lg:text-2xl text-text-muted font-medium leading-relaxed max-w-xl">
            {t('heroDescription')}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 pt-6">
            <button onClick={onGetStarted} className="btn-primary group flex items-center justify-center gap-3 py-5 px-10 text-base">
              <span>{t('accessProviderPortal')}</span>
              <span className="group-hover:translate-x-1 transition-transform w-[20px] h-[20px]">
                {React.cloneElement(ICONS.chevronRight as any, { className: 'w-5 h-5' })}
              </span>
            </button>
            <button onClick={onGetStarted} className="btn-secondary py-5 px-10 text-base flex items-center justify-center">
              {t('patientGateway')}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 pt-10 border-t border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-2xl sm:text-3xl font-heading font-black text-text-main tracking-tighter">Global</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{t('diagnosticAccuracy')}</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-heading font-black text-text-main tracking-tighter">Unified</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{t('casesAnalyzed')}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-2xl sm:text-3xl font-heading font-black text-text-main tracking-tighter">24/7</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{t('aiVigilance')}</p>
            </div>
          </div>
        </div>

        <div className="relative group perspective-1000">
          <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 to-accent/30 rounded-[40px] blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-700"></div>

          <div className="relative rounded-[40px] overflow-hidden shadow-2xl border-4 border-slate-800/5 dark:border-slate-700/50 transform group-hover:rotate-y-2 group-hover:rotate-x-2 transition-transform duration-500 ease-out bg-slate-900 aspect-video flex items-center justify-center">
            {heroImages.map((img, index) => (
              <img
                key={index}
                src={img.src}
                alt={img.alt}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === activeImageIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                  }`}
              />
            ))}

            {/* Carousel Metrics Overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-20">
              <div className="flex gap-2">
                {heroImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === activeImageIndex ? 'w-8 bg-primary' : 'w-2 bg-white/50'
                      }`}
                  />
                ))}
              </div>
              <div className="px-4 py-2 glass rounded-full text-xs font-bold text-white bg-black/40 backdrop-blur-md">
                System Active
              </div>
            </div>
          </div>

          {/* Floating UI Elements for Depth */}
          <div className="absolute -right-8 top-20 glass-card p-4 rounded-2xl animate-float delay-100 hidden md:block border-l-4 border-l-green-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 text-green-500 rounded-lg">{ICONS.check}</div>
              <div>
                <p className="text-xs font-bold text-text-main">Analysis Complete</p>
                <p className="text-[10px] text-text-muted">95% Confidence</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTASection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const { t } = useTranslation();
  return (
    <section className="py-32">
      <div className="container mx-auto px-4">
        <div className="glass-card rounded-[40px] sm:rounded-[80px] p-8 sm:p-16 lg:p-32 text-center bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden" style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(var(--color-primary-rgb), 0.1), rgba(var(--color-surface-rgb), 0.5), rgba(var(--color-accent-rgb), 0.1))' }}>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 to-transparent"></div>

          <div className="relative z-10 space-y-8 sm:space-y-12">
            <h2 className="text-4xl sm:text-7xl lg:text-9xl font-heading font-black text-text-main tracking-tighter leading-none italic">
              {t('readyMedicalEra')} <br /> <span className="text-primary">{t('medicalEra')}</span>
            </h2>
            <p className="text-lg sm:text-xl lg:text-3xl text-text-muted font-medium max-w-3xl mx-auto leading-relaxed">
              {t('ctaDescription')}
            </p>
            <div className="pt-8">
              <button onClick={onGetStarted} className="btn-primary py-6 px-16 text-xl rounded-[30px] animate-float">
                {t('getStarted')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LandingPage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    showToast.success(t('newsletterSuccess', 'Successfully subscribed to intelligence feed!'), 'Newsletter');
    setEmail('');
  };

  return (
    <main className="bg-background pt-10 overflow-x-hidden">
      <HeroSection onGetStarted={onGetStarted} />

      {/* Trust Bar */}
      <div className="py-20 border-y border-slate-200 dark:border-slate-800 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-background to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-background to-transparent z-10"></div>
        <div className="flex animate-marquee whitespace-nowrap gap-20">
          {['HealthTrust Global', 'MedCore Solutions', 'Clinical Dynamics', 'BioSync Partners', 'Emerald Care Group', 'Vitality Systems'].map(partner => (
            <span key={partner} className="text-3xl font-heading font-black text-text-muted/20 uppercase tracking-tighter">{partner}</span>
          ))}
          {['HealthTrust Global', 'MedCore Solutions', 'Clinical Dynamics', 'BioSync Partners', 'Emerald Care Group', 'Vitality Systems'].map(partner => (
            <span key={partner + '-alt'} className="text-3xl font-heading font-black text-text-muted/20 uppercase tracking-tighter">{partner}</span>
          ))}
        </div>
      </div>

      <EcosystemSection />

      <CTASection onGetStarted={onGetStarted} />

      <footer className="py-32 border-t border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                {React.cloneElement(ICONS.ai as any, { style: { width: '20px', height: '20px' } })}
              </div>
              <h3 className="text-xl font-heading font-black text-text-main tracking-tighter">{t('appName', 'Intelligent Health')}</h3>
            </div>
            <p className="text-sm text-text-muted font-medium leading-relaxed">
              {t('missionStatement', 'Pioneering the synthesis of human expertise and machine intelligence to ensure a healthier tomorrow for everyone.')}
            </p>
          </div>

          <div>

            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main mb-8">{t('platform')}</h4>
            <ul className="space-y-4 text-sm font-bold text-text-muted">
              <li><Link to="/triage" className="hover:text-primary transition-colors">{t('clinicalTriage')}</Link></li>
              <li><Link to="/specialists" className="hover:text-primary transition-colors">{t('specialistNetwork')}</Link></li>
              <li><button onClick={onGetStarted} className="hover:text-primary transition-colors text-left">{t('patientRecords')}</button></li>
              <li><Link to="/research-community" className="hover:text-primary transition-colors">{t('aiResearch')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main mb-8">{t('company')}</h4>
            <ul className="space-y-4 text-sm font-bold text-text-muted">
              <li><Link to="/about" className="hover:text-primary transition-colors">{t('aboutMission')}</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">{t('termsOfCare')}</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">{t('privacyShield')}</Link></li>
              <li><Link to="/security-audit" className="hover:text-primary transition-colors">{t('securityAudit')}</Link></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main mb-8">{t('intelligenceFeed', 'Intelligence Feed')}</h4>
            <div className="p-6 glass-card rounded-3xl space-y-4" style={{ height: 'auto' }}>
              <p className="text-[10px] font-bold text-text-muted italic">{t('subscribePrompt', 'Subscribe to our newsletter for the latest in clinical AI.')}</p>
              <form onSubmit={handleNewsletter} className="relative">
                <input
                  type="email"
                  placeholder="email@hospital.com"
                  className="w-full pr-12 text-xs"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="absolute right-2 top-1.5 p-2 rounded-xl bg-primary text-white">
                  {React.cloneElement(ICONS.send as any, { style: { width: '16px', height: '16px' } })}
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 pt-20 mt-20 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest flex items-center gap-4">
            <span>&copy; 2025 {t('footerCredit')}</span>
            <span className="opacity-50" style={{ color: 'red', fontWeight: 'bold' }}>v{APP_VERSION}</span>
          </p>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
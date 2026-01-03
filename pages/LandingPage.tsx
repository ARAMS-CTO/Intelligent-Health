import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Role } from '../types/index';
import { ICONS, APP_VERSION } from '../constants/index';
import { showToast } from '../components/Toast';

const featuresByRole = {
  [Role.Doctor]: {
    titleKey: "featureDoctorTitle",
    descriptionKey: "featureDoctorDesc",
    icon: ICONS.specialist,
    image: "/analysis.png",
    items: ["featureList1", "featureList2", "featureList3"]
  },
  [Role.Nurse]: {
    titleKey: "featureNurseTitle",
    descriptionKey: "featureNurseDesc",
    icon: ICONS.userPlus,
    image: "/hero.png",
    items: ["featureList1", "featureList2", "featureList3"]
  },
  [Role.Patient]: {
    titleKey: "featurePatientTitle",
    descriptionKey: "featurePatientDesc",
    icon: ICONS.user,
    image: "/analysis.png",
    items: ["featureList1", "featureList2", "featureList3"]
  },
};

const HeroSection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden py-20 px-4">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-primary/10 blur-[160px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[40%] h-[60%] bg-accent/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="animate-fade-in space-y-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/20 dark:border-slate-700/50 backdrop-blur-xl shadow-sm" style={{ backgroundColor: 'rgba(var(--color-surface-rgb), 0.4)' }}>
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
              <span className="group-hover:translate-x-1 transition-transform" style={{ width: '20px', height: '20px' }}>
                {React.cloneElement(ICONS.chevronRight as any, { style: { width: '20px', height: '20px' } })}
              </span>
            </button>
            <button onClick={onGetStarted} className="btn-secondary py-5 px-10 text-base flex items-center justify-center">
              {t('patientGateway')}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 pt-10 border-t border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-2xl sm:text-3xl font-heading font-black text-text-main tracking-tighter">99.2%</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{t('diagnosticAccuracy')}</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-heading font-black text-text-main tracking-tighter">1.2M+</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{t('casesAnalyzed')}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-2xl sm:text-3xl font-heading font-black text-text-main tracking-tighter">24/7</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">{t('aiVigilance')}</p>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 rounded-[60px] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="relative glass-card p-3 rounded-[50px] overflow-hidden shadow-2xl border border-white/40 dark:border-slate-700/50">
            <img
              src="/hero.png"
              alt="Clinical Collaboration"
              className="w-full h-auto rounded-[40px] transform hover:scale-105 transition-transform duration-1000"
            />
            {/* Overlay stats card */}
            <div className="absolute bottom-10 left-10 right-10 p-6 glass backdrop-blur-3xl rounded-3xl border border-white/20 shadow-2xl animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  {React.cloneElement(ICONS.ai as any, { style: { width: '24px', height: '24px' } })}
                </div>
                <div>
                  <p className="text-xs font-black text-text-main tracking-tight uppercase tracking-widest">{t('medicalLlmActive')}</p>
                  <p className="text-[10px] text-text-muted font-bold truncate italic opacity-80">{t('scanningParameters')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureSection: React.FC = () => {
  const { t } = useTranslation();
  const roles = [Role.Doctor, Role.Nurse, Role.Patient];
  const [activeRole, setActiveRole] = useState(Role.Doctor);

  return (
    <section className="py-20 sm:py-32 container mx-auto px-4">
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20 space-y-4 sm:space-y-6">
        <h2 className="text-3xl sm:text-5xl font-heading font-black text-text-main tracking-tighter">{t('specializedToolsets')}</h2>
        <p className="text-lg sm:text-xl text-text-muted font-medium leading-relaxed">{t('toolsetsDescription')}</p>

        <div className="flex flex-wrap justify-center gap-4 pt-6">
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${activeRole === role ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' : 'bg-white dark:bg-slate-800 text-text-muted border-slate-200 dark:border-slate-700 hover:border-primary/40'}`}
            >
              {t(role)}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-[60px] p-4 lg:p-12 border border-white/40 dark:border-slate-700 animate-fade-in" key={activeRole}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] sm:rounded-[32px] bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-primary/30">
              {React.cloneElement(featuresByRole[activeRole].icon as any, { style: { width: '32px', height: '32px' } })}
            </div>
            <h3 className="text-3xl sm:text-5xl font-heading font-black text-text-main tracking-tighter leading-tight">
              {t(featuresByRole[activeRole].titleKey, featuresByRole[activeRole].titleKey)} <br />
              <span className="text-primary opacity-60">{t('solutions')}</span>
            </h3>
            <p className="text-xl text-text-muted font-medium leading-relaxed">
              {t(featuresByRole[activeRole].descriptionKey, featuresByRole[activeRole].descriptionKey)}
            </p>
            <ul className="space-y-4">
              {featuresByRole[activeRole].items.map(itemKey => (
                <li key={itemKey} className="flex items-center gap-4 text-sm font-bold text-text-main">
                  <div className="p-1 rounded-full bg-accent/20 text-accent">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                  <span>{t(itemKey)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/5 blur-2xl rounded-full"></div>
            <img
              src={featuresByRole[activeRole].image}
              alt={featuresByRole[activeRole].titleKey}
              className="relative w-full h-[300px] sm:h-[500px] object-cover rounded-[32px] sm:rounded-[48px] shadow-2xl border border-white/20"
            />
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

      <FeatureSection />

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
              <li><a href="#" onClick={(e) => { e.preventDefault(); showToast.info(t('clinicalTriage')); }} className="hover:text-primary transition-colors">{t('clinicalTriage')}</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); showToast.info(t('specialistNetwork')); }} className="hover:text-primary transition-colors">{t('specialistNetwork')}</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); showToast.info(t('patientRecords')); }} className="hover:text-primary transition-colors">{t('patientRecords')}</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); showToast.info(t('aiResearch')); }} className="hover:text-primary transition-colors">{t('aiResearch')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main mb-8">{t('company')}</h4>
            <ul className="space-y-4 text-sm font-bold text-text-muted">
              <li><a href="#" onClick={(e) => { e.preventDefault(); showToast.info(t('aboutMission')); }} className="hover:text-primary transition-colors">{t('aboutMission')}</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); showToast.info(t('termsOfCare')); }} className="hover:text-primary transition-colors">{t('termsOfCare')}</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); showToast.info(t('privacyShield')); }} className="hover:text-primary transition-colors">{t('privacyShield')}</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); showToast.info(t('securityAudit')); }} className="hover:text-primary transition-colors">{t('securityAudit')}</a></li>
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
            <span className="opacity-50">v{APP_VERSION}</span>
          </p>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
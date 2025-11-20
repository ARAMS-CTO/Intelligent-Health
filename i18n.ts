
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files using strict relative paths
import common_en from './locales/en/common.json';
import dashboard_en from './locales/en/dashboard.json';
import patientPortal_en from './locales/en/patientPortal.json';

import common_ar from './locales/ar/common.json';
import dashboard_ar from './locales/ar/dashboard.json';
import patientPortal_ar from './locales/ar/patientPortal.json';

import common_de from './locales/de/common.json';
import dashboard_de from './locales/de/dashboard.json';
import patientPortal_de from './locales/de/patientPortal.json';

import common_es from './locales/es/common.json';
import dashboard_es from './locales/es/dashboard.json';
import patientPortal_es from './locales/es/patientPortal.json';

import common_fa from './locales/fa/common.json';
import dashboard_fa from './locales/fa/dashboard.json';
import patientPortal_fa from './locales/fa/patientPortal.json';

import common_fr from './locales/fr/common.json';
import dashboard_fr from './locales/fr/dashboard.json';
import patientPortal_fr from './locales/fr/patientPortal.json';

import common_hi from './locales/hi/common.json';
import dashboard_hi from './locales/hi/dashboard.json';
import patientPortal_hi from './locales/hi/patientPortal.json';

import common_it from './locales/it/common.json';
import dashboard_it from './locales/it/dashboard.json';
import patientPortal_it from './locales/it/patientPortal.json';

import common_ru from './locales/ru/common.json';
import dashboard_ru from './locales/ru/dashboard.json';
import patientPortal_ru from './locales/ru/patientPortal.json';

import common_tl from './locales/tl/common.json';
import dashboard_tl from './locales/tl/dashboard.json';
import patientPortal_tl from './locales/tl/patientPortal.json';

import common_tr from './locales/tr/common.json';
import dashboard_tr from './locales/tr/dashboard.json';
import patientPortal_tr from './locales/tr/patientPortal.json';

import common_zh from './locales/zh/common.json';
import dashboard_zh from './locales/zh/dashboard.json';
import patientPortal_zh from './locales/zh/patientPortal.json';

const resources = {
  en: { common: common_en, dashboard: dashboard_en, patientPortal: patientPortal_en },
  ar: { common: common_ar, dashboard: dashboard_ar, patientPortal: patientPortal_ar },
  de: { common: common_de, dashboard: dashboard_de, patientPortal: patientPortal_de },
  es: { common: common_es, dashboard: dashboard_es, patientPortal: patientPortal_es },
  fa: { common: common_fa, dashboard: dashboard_fa, patientPortal: patientPortal_fa },
  fr: { common: common_fr, dashboard: dashboard_fr, patientPortal: patientPortal_fr },
  hi: { common: common_hi, dashboard: dashboard_hi, patientPortal: patientPortal_hi },
  it: { common: common_it, dashboard: dashboard_it, patientPortal: patientPortal_it },
  ru: { common: common_ru, dashboard: dashboard_ru, patientPortal: patientPortal_ru },
  tl: { common: common_tl, dashboard: dashboard_tl, patientPortal: patientPortal_tl },
  tr: { common: common_tr, dashboard: dashboard_tr, patientPortal: patientPortal_tr },
  zh: { common: common_zh, dashboard: dashboard_zh, patientPortal: patientPortal_zh },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    ns: ['common', 'dashboard', 'patientPortal'],
    defaultNS: 'common',
  });

export default i18n;

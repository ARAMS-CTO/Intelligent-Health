
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files using strict relative paths
import common_en from './locales/en/common.json';
import dashboard_en from './locales/en/dashboard.json';
import patientPortal_en from './locales/en/patientPortal.json';
import patientIntake_en from './locales/en/patientIntake.json';

import common_ar from './locales/ar/common.json';
import dashboard_ar from './locales/ar/dashboard.json';
import patientPortal_ar from './locales/ar/patientPortal.json';
import patientIntake_ar from './locales/ar/patientIntake.json';

import common_de from './locales/de/common.json';
import dashboard_de from './locales/de/dashboard.json';
import patientPortal_de from './locales/de/patientPortal.json';
import patientIntake_de from './locales/de/patientIntake.json';

import common_es from './locales/es/common.json';
import dashboard_es from './locales/es/dashboard.json';
import patientPortal_es from './locales/es/patientPortal.json';
import patientIntake_es from './locales/es/patientIntake.json';

import common_fa from './locales/fa/common.json';
import dashboard_fa from './locales/fa/dashboard.json';
import patientPortal_fa from './locales/fa/patientPortal.json';
import patientIntake_fa from './locales/fa/patientIntake.json';

import common_fr from './locales/fr/common.json';
import dashboard_fr from './locales/fr/dashboard.json';
import patientPortal_fr from './locales/fr/patientPortal.json';
import patientIntake_fr from './locales/fr/patientIntake.json';

import common_hi from './locales/hi/common.json';
import dashboard_hi from './locales/hi/dashboard.json';
import patientPortal_hi from './locales/hi/patientPortal.json';
import patientIntake_hi from './locales/hi/patientIntake.json';

import common_it from './locales/it/common.json';
import dashboard_it from './locales/it/dashboard.json';
import patientPortal_it from './locales/it/patientPortal.json';
import patientIntake_it from './locales/it/patientIntake.json';

import common_ru from './locales/ru/common.json';
import dashboard_ru from './locales/ru/dashboard.json';
import patientPortal_ru from './locales/ru/patientPortal.json';
import patientIntake_ru from './locales/ru/patientIntake.json';

import common_tl from './locales/tl/common.json';
import dashboard_tl from './locales/tl/dashboard.json';
import patientPortal_tl from './locales/tl/patientPortal.json';
import patientIntake_tl from './locales/tl/patientIntake.json';

import common_tr from './locales/tr/common.json';
import dashboard_tr from './locales/tr/dashboard.json';
import patientPortal_tr from './locales/tr/patientPortal.json';
import patientIntake_tr from './locales/tr/patientIntake.json';

import common_zh from './locales/zh/common.json';
import dashboard_zh from './locales/zh/dashboard.json';
import patientPortal_zh from './locales/zh/patientPortal.json';
import patientIntake_zh from './locales/zh/patientIntake.json';

import common_pt from './locales/pt/common.json';
import dashboard_pt from './locales/pt/dashboard.json';
import patientPortal_pt from './locales/pt/patientPortal.json';
import patientIntake_pt from './locales/pt/patientIntake.json';

import common_nl from './locales/nl/common.json';
import dashboard_nl from './locales/nl/dashboard.json';
import patientPortal_nl from './locales/nl/patientPortal.json';
import patientIntake_nl from './locales/nl/patientIntake.json';

import common_ja from './locales/ja/common.json';
import dashboard_ja from './locales/ja/dashboard.json';
import patientPortal_ja from './locales/ja/patientPortal.json';
import patientIntake_ja from './locales/ja/patientIntake.json';

import common_el from './locales/el/common.json';
import dashboard_el from './locales/el/dashboard.json';
import patientPortal_el from './locales/el/patientPortal.json';
import patientIntake_el from './locales/el/patientIntake.json';

import common_ro from './locales/ro/common.json';
import dashboard_ro from './locales/ro/dashboard.json';
import patientPortal_ro from './locales/ro/patientPortal.json';
import patientIntake_ro from './locales/ro/patientIntake.json';

import common_bg from './locales/bg/common.json';
import dashboard_bg from './locales/bg/dashboard.json';
import patientPortal_bg from './locales/bg/patientPortal.json';
import patientIntake_bg from './locales/bg/patientIntake.json';

import common_ga from './locales/ga/common.json';
import dashboard_ga from './locales/ga/dashboard.json';
import patientPortal_ga from './locales/ga/patientPortal.json';
import patientIntake_ga from './locales/ga/patientIntake.json';

import common_hr from './locales/hr/common.json';
import dashboard_hr from './locales/hr/dashboard.json';
import patientPortal_hr from './locales/hr/patientPortal.json';
import patientIntake_hr from './locales/hr/patientIntake.json';

import common_pl from './locales/pl/common.json';
import dashboard_pl from './locales/pl/dashboard.json';
import patientPortal_pl from './locales/pl/patientPortal.json';
import patientIntake_pl from './locales/pl/patientIntake.json';

import common_ko from './locales/ko/common.json';
import dashboard_ko from './locales/ko/dashboard.json';
import patientPortal_ko from './locales/ko/patientPortal.json';
import patientIntake_ko from './locales/ko/patientIntake.json';

const resources = {
  en: { common: common_en, dashboard: dashboard_en, patientPortal: patientPortal_en, patientIntake: patientIntake_en },
  ar: { common: common_ar, dashboard: dashboard_ar, patientPortal: patientPortal_ar, patientIntake: patientIntake_ar },
  de: { common: common_de, dashboard: dashboard_de, patientPortal: patientPortal_de, patientIntake: patientIntake_de },
  es: { common: common_es, dashboard: dashboard_es, patientPortal: patientPortal_es, patientIntake: patientIntake_es },
  fa: { common: common_fa, dashboard: dashboard_fa, patientPortal: patientPortal_fa, patientIntake: patientIntake_fa },
  fr: { common: common_fr, dashboard: dashboard_fr, patientPortal: patientPortal_fr, patientIntake: patientIntake_fr },
  hi: { common: common_hi, dashboard: dashboard_hi, patientPortal: patientPortal_hi, patientIntake: patientIntake_hi },
  it: { common: common_it, dashboard: dashboard_it, patientPortal: patientPortal_it, patientIntake: patientIntake_it },
  ru: { common: common_ru, dashboard: dashboard_ru, patientPortal: patientPortal_ru, patientIntake: patientIntake_ru },
  tl: { common: common_tl, dashboard: dashboard_tl, patientPortal: patientPortal_tl, patientIntake: patientIntake_tl },
  tr: { common: common_tr, dashboard: dashboard_tr, patientPortal: patientPortal_tr, patientIntake: patientIntake_tr },
  zh: { common: common_zh, dashboard: dashboard_zh, patientPortal: patientPortal_zh, patientIntake: patientIntake_zh },
  pt: { common: common_pt, dashboard: dashboard_pt, patientPortal: patientPortal_pt, patientIntake: patientIntake_pt },
  nl: { common: common_nl, dashboard: dashboard_nl, patientPortal: patientPortal_nl, patientIntake: patientIntake_nl },
  ja: { common: common_ja, dashboard: dashboard_ja, patientPortal: patientPortal_ja, patientIntake: patientIntake_ja },
  el: { common: common_el, dashboard: dashboard_el, patientPortal: patientPortal_el, patientIntake: patientIntake_el },
  ro: { common: common_ro, dashboard: dashboard_ro, patientPortal: patientPortal_ro, patientIntake: patientIntake_ro },
  bg: { common: common_bg, dashboard: dashboard_bg, patientPortal: patientPortal_bg, patientIntake: patientIntake_bg },
  ga: { common: common_ga, dashboard: dashboard_ga, patientPortal: patientPortal_ga, patientIntake: patientIntake_ga },
  hr: { common: common_hr, dashboard: dashboard_hr, patientPortal: patientPortal_hr, patientIntake: patientIntake_hr },
  pl: { common: common_pl, dashboard: dashboard_pl, patientPortal: patientPortal_pl, patientIntake: patientIntake_pl },
  ko: { common: common_ko, dashboard: dashboard_ko, patientPortal: patientPortal_ko, patientIntake: patientIntake_ko },
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
    ns: ['common', 'dashboard', 'patientPortal', 'patientIntake'],
    defaultNS: 'common',
  });

export default i18n;

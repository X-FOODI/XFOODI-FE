import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import vi from './locales/vi.json';

const resources = {
  en: {
    common: en,
    dashboard: en.dashboard,
    auth: en.auth,
  },
  vi: {
    common: vi,
    dashboard: vi.dashboard,
    auth: vi.auth,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi', // Always start with 'vi', client will override if needed
    fallbackLng: 'vi',
    ns: ['common', 'dashboard', 'auth'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: false,
    },
    initImmediate: false,
  });

export default i18n;

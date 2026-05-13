'use client';

import { LanguageContext, SupportedLanguage } from '@/lib/contexts/LanguageContext';
import '@/lib/i18n/i18n';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export { useLanguage } from '@/lib/contexts/LanguageContext';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const initialized = useRef(false);

  const normalizeLanguage = (lang?: string): SupportedLanguage => {
    if (lang?.toLowerCase().startsWith('en')) return 'en';
    return 'vi';
  };

  // Get initial language from localStorage or i18n — only once
  const getInitialLanguage = (): SupportedLanguage => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language');
      if (savedLang === 'en' || savedLang === 'vi') return savedLang;
    }
    return normalizeLanguage(i18n.language);
  };

  const [language, setLanguage] = useState<SupportedLanguage>(getInitialLanguage);

  // On mount: sync i18n to the saved language (one-time only)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initial = getInitialLanguage();
    if (i18n.language !== initial) {
      i18n.changeLanguage(initial);
    }

    // Listen for external language changes (e.g. from i18n itself)
    const handleLanguageChange = (lng: string) => {
      const normalized = normalizeLanguage(lng);
      setLanguage(normalized);
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', normalized);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeLanguage = (lang: SupportedLanguage | string) => {
    const normalized = normalizeLanguage(lang);
    // i18n.changeLanguage will trigger the 'languageChanged' event
    // which will update state and localStorage via the listener above
    i18n.changeLanguage(normalized);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

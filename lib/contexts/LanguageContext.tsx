'use client';
import { createContext, useContext } from 'react';

export type SupportedLanguage = 'en' | 'vi';

export type LanguageContextType = {
    language: SupportedLanguage;
    changeLanguage: (lang: SupportedLanguage | string) => void;
};

export const LanguageContext = createContext<LanguageContextType>({
    language: 'vi',
    changeLanguage: () => { },
});

export const useLanguage = () => useContext(LanguageContext);

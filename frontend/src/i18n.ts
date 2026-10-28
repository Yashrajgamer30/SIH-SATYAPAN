import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

export type SupportedLanguage = 'en' | 'hi' | 'mr';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    keySeparator: '.',
    returnNull: false,
    saveMissing: true,
    missingKeyHandler: (lngs, ns, key) => {
      if (import.meta.env?.DEV) {
        console.warn(`[i18n Missing Key] Language(s): ${lngs}, NS: ${ns}, Key: "${key}"`);
      }
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

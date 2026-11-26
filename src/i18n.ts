import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './locales/tr.json';
import en from './locales/en.json';

export type Language = 'tr' | 'en';

// Language is owned by AppSettings (localStorage 'weave_app_settings');
// read it here so the first render already uses the right language.
const initialLanguage: Language = (() => {
  try {
    return JSON.parse(localStorage.getItem('weave_app_settings') || '{}').language === 'en' ? 'en' : 'tr';
  } catch {
    return 'tr';
  }
})();

// Both languages are bundled: the drawing (document) language may differ from the app language.
i18n
  .use(initReactI18next)
  .init({
    resources: { tr: { translation: tr }, en: { translation: en } },
    lng: initialLanguage,
    fallbackLng: 'tr',
    supportedLngs: ['tr', 'en'],
    load: 'languageOnly',
    initAsync: false,
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

/** The app (interface) language. Use inside plain functions; components use `useTranslation`. */
export const appLanguage = (): Language => (i18n.language === 'en' ? 'en' : 'tr');

/** Translator for text that is part of the drawing and follows the project's document language. */
export const documentT = (language: Language) => i18n.getFixedT(language);

export default i18n;

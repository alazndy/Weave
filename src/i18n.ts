import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

// Language is owned by AppSettings (localStorage 'weave_app_settings');
// read it here so the first render already uses the right language.
const initialLanguage = (() => {
  try {
    const lang = JSON.parse(localStorage.getItem('weave_app_settings') || '{}').language;
    return lang === 'en' ? 'en' : 'tr';
  } catch {
    return 'tr';
  }
})();

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: initialLanguage,
    fallbackLng: 'tr',
    supportedLngs: ['tr', 'en'],
    load: 'languageOnly',
    debug: false,
    backend: {
      // Relative path so it also resolves under file:// in the Electron build.
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;

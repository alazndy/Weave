import { createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { documentT, type Language } from './i18n';

const DocumentLanguage = createContext<Language>('tr');
export const DocumentLanguageProvider = DocumentLanguage.Provider;

/** `t` bound to the document language, for everything that ends up on a sheet or in an export. */
export function useDocumentT() {
    const language = useContext(DocumentLanguage);
    useTranslation(); // re-render when resources change
    return useMemo(() => documentT(language), [language]);
}

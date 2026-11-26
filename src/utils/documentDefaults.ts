import { documentT, type Language } from '../i18n';
import type { Page, ProjectMetadata } from '../types';
import { generateDocNo } from './docNo';

export const docLanguageOf = (metadata: { docLanguage?: Language }): Language => (metadata.docLanguage === 'en' ? 'en' : 'tr');

export const defaultPageName = (language: Language, order: number) => documentT(language)('doc.defaults.pageName', { number: order });

/** Default texts printed on the sheet. The user can edit all of them. */
const TEXT_FIELDS = ['projectName', 'companyName', 'technicalNotes'] as const;
const defaultText = (language: Language, field: typeof TEXT_FIELDS[number]) => documentT(language)(`doc.defaults.${field}`);

export function createMetadata(language: Language): ProjectMetadata {
    const projectName = defaultText(language, 'projectName');
    return {
        docLanguage: language,
        projectName,
        companyName: defaultText(language, 'companyName'),
        companyLogo: null,
        customerName: '',
        preparedBy: '',
        approvedBy: '',
        documentNo: generateDocNo(projectName, 'R.01'),
        scale: '1:1',
        pixelScale: 10,
        paperSize: 'A4',
        orientation: 'landscape',
        revision: 'R.01',
        date: new Date().toLocaleDateString(language === 'en' ? 'en-GB' : 'tr-TR'),
        technicalNotes: defaultText(language, 'technicalNotes'),
        customFields: [],
        externalParts: [],
    };
}

/** Translates "Page 3" and "Page 3 (Copy)"; any other name is user text and stays. */
function retranslatePageName(name: string, from: Language, to: Language): string {
    const suffix = documentT(from)('doc.defaults.pageCopy', { name: '' });
    if (name.endsWith(suffix)) {
        const base = name.slice(0, -suffix.length);
        const translated = retranslatePageName(base, from, to);
        return translated === base ? name : documentT(to)('doc.defaults.pageCopy', { name: translated });
    }
    const number = name.match(/\d+$/)?.[0];
    return number && name === defaultPageName(from, Number(number)) ? defaultPageName(to, Number(number)) : name;
}

/**
 * After a document language change, translates the default texts the user never changed.
 * `from` is the previous language; the new one is read from `metadata`.
 */
export function retranslateDefaults(metadata: ProjectMetadata, pages: Page[], from: Language): { metadata: ProjectMetadata; pages: Page[] } {
    const to = docLanguageOf(metadata);
    if (to === from) return { metadata, pages };
    const nextMetadata = { ...metadata };
    for (const field of TEXT_FIELDS) {
        if (metadata[field] === defaultText(from, field)) nextMetadata[field] = defaultText(to, field);
    }
    const nextPages = pages.map(p => {
        const name = retranslatePageName(p.name, from, to);
        return name === p.name ? p : { ...p, name };
    });
    return { metadata: nextMetadata, pages: nextPages };
}

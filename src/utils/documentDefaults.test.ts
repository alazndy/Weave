import { describe, it, expect } from 'vitest';
import '../i18n';
import { createMetadata, defaultPageName, retranslateDefaults, docLanguageOf } from './documentDefaults';
import type { Page } from '../types';

const page = (name: string): Page => ({ id: name, name, instances: [], connections: [], zones: [], textNodes: [], comments: [], order: 1 });

describe('document language defaults', () => {
    it('creates default sheet text in the chosen document language', () => {
        expect(createMetadata('en')).toMatchObject({ docLanguage: 'en', projectName: 'New System Schematic', companyName: 'Company Name' });
        expect(createMetadata('tr')).toMatchObject({ docLanguage: 'tr', projectName: 'Yeni Sistem Şeması', companyName: 'Şirket Adı' });
        expect(createMetadata('en').technicalNotes).toMatch(/^1\. All connections/);
        expect(defaultPageName('en', 2)).toBe('Page 2');
    });

    it('treats a project without the field as Turkish', () => {
        expect(docLanguageOf({})).toBe('tr');
        expect(docLanguageOf({ docLanguage: 'en' })).toBe('en');
    });

    it('translates untouched defaults when the language changes and keeps user text', () => {
        const metadata = { ...createMetadata('tr'), companyName: 'Ancyra A.Ş.' };
        const result = retranslateDefaults({ ...metadata, docLanguage: 'en' }, [page('Sayfa 1'), page('Güç dağıtımı'), page('Sayfa 3 yedek'), page('Sayfa 1 (Kopya)'), page('Güç (Kopya)')], 'tr');
        expect(result.metadata.projectName).toBe('New System Schematic');
        expect(result.metadata.companyName).toBe('Ancyra A.Ş.');
        expect(result.metadata.technicalNotes).toBe(createMetadata('en').technicalNotes);
        expect(result.pages.map(p => p.name)).toEqual(['Page 1', 'Güç dağıtımı', 'Sayfa 3 yedek', 'Page 1 (Copy)', 'Güç (Kopya)']);
    });

    it('returns the same objects when the language did not change', () => {
        const metadata = createMetadata('tr');
        const pages = [page('Sayfa 1')];
        const result = retranslateDefaults(metadata, pages, 'tr');
        expect(result.metadata).toBe(metadata);
        expect(result.pages).toBe(pages);
    });
});

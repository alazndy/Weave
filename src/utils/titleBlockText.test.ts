import { describe, it, expect } from 'vitest';
import '../i18n';
import { createMetadata } from './documentDefaults';
import { headingOverride, withHeading, fieldHeading, withFieldHeading } from './titleBlockText';

describe('title block headings per document language', () => {
    it('ignores headings stored by older versions, so every heading follows the language', () => {
        const old = { ...createMetadata('tr'), legendLabels: { customer: 'Customer', company: 'Firm' } };
        expect(headingOverride(old, 'customer', 'tr')).toBeUndefined();
        expect(headingOverride(old, 'company', 'en')).toBeUndefined();
    });

    it('keeps a typed heading only for the language it was typed in', () => {
        const metadata = { ...createMetadata('tr'), ...withHeading(createMetadata('tr'), 'scale', 'tr', 'Skala') };
        expect(headingOverride(metadata, 'scale', 'tr')).toBe('Skala');
        expect(headingOverride(metadata, 'scale', 'en')).toBeUndefined();
    });

    it('removes the override when the heading is cleared', () => {
        const typed = { ...createMetadata('tr'), ...withHeading(createMetadata('tr'), 'scale', 'tr', 'Skala') };
        expect(headingOverride({ ...typed, ...withHeading(typed, 'scale', 'tr', '') }, 'scale', 'tr')).toBeUndefined();
    });

    it('shows a custom field heading in each language and falls back to the original', () => {
        const field = { id: 'a', label: 'Araç Sayısı:', value: '40' };
        expect(fieldHeading(field, 'en')).toBe('Araç Sayısı:');
        const english = withFieldHeading(field, 'en', 'Vehicle Count:');
        expect(fieldHeading(english, 'en')).toBe('Vehicle Count:');
        expect(fieldHeading(english, 'tr')).toBe('Araç Sayısı:');
        expect(fieldHeading(withFieldHeading(english, 'en', ''), 'en')).toBe('Araç Sayısı:');
    });
});

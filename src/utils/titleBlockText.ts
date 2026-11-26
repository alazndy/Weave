import type { Language } from '../i18n';
import type { CustomField, ProjectMetadata } from '../types';

/**
 * A heading the user typed, for this document language only. The older `legendLabels` field has no
 * language, so it is not shown: standard headings must always follow the document language.
 */
export const headingOverride = (metadata: ProjectMetadata, id: string, language: Language): string | undefined =>
    metadata.legendHeadings?.[language]?.[id];

/** Metadata patch that sets a heading for one language; an empty value restores the default. */
export function withHeading(metadata: ProjectMetadata, id: string, language: Language, value: string): Pick<ProjectMetadata, 'legendHeadings'> {
    const headings = { ...metadata.legendHeadings?.[language] };
    if (value) headings[id] = value; else delete headings[id];
    return { legendHeadings: { ...metadata.legendHeadings, [language]: headings } };
}

export const fieldHeading = (field: CustomField, language: Language): string => field.labels?.[language] || field.label;

export function withFieldHeading(field: CustomField, language: Language, value: string): CustomField {
    return { ...field, labels: { ...field.labels, [language]: value } };
}

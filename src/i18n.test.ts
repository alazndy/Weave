// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import tr from './locales/tr.json';
import en from './locales/en.json';

const sources = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return ['test', 'locales'].includes(e.name) ? [] : sources(path);
    return /\.tsx?$/.test(e.name) && !/\.(test|d)\.tsx?$/.test(e.name) ? [path] : [];
});

/** Names and units that read the same in both languages. */
const NEUTRAL = /^(Weave|Gemini|Google Gemini|AC|DC|GND|PDF|PNG|CSV|BOM|REV|NO|MODEL|ID|px|mm|A3|A4|A6|Ctrl|Shift|Alt|Del|Delete|Esc|TR|EN|AI|OK|Logo|AIza\.\.\.|A[346] \(\d+ x \d+ mm\)|1 mm =|(🇹🇷 )?Türkçe|(🇺🇸 )?English)$/u;
const VISIBLE_ATTRIBUTES = new Set(['title', 'placeholder', 'aria-label', 'alt', 'label']);
const DIALOGS = new Set(['alert', 'confirm', 'prompt']);

const worded = (s: string) => /\p{L}{2,}/u.test(s) && !NEUTRAL.test(s.trim());

function hardcoded(file: string): string[] {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const found: string[] = [];
    const report = (node: ts.Node, text: string) =>
        found.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}: ${text.trim().replace(/\s+/g, ' ')}`);
    const visit = (node: ts.Node) => {
        if (ts.isJsxText(node)) {
            if (worded(node.text)) report(node, node.text);
        } else if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
            const text = node.text;
            let parent: ts.Node = node.parent;
            const attribute = ts.isJsxAttribute(parent) ? parent.name.getText() : null;
            if (ts.isImportDeclaration(parent)) return;
            const dialog = ts.isCallExpression(parent) && DIALOGS.has(parent.expression.getText().replace(/^window\./, ''));
            const turkish = /[çğışöüÇĞİŞÖÜ]/.test(text);
            if (worded(text) && (turkish || dialog || (attribute && VISIBLE_ATTRIBUTES.has(attribute)))) report(node, text);
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return found;
}

const keys = (o: object, prefix = ''): string[] => Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [prefix + k]);
const placeholders = (s: string) => (s.match(/\{\{\w+\}\}/g) ?? []).sort().join();
const at = (o: any, path: string): string => path.split('.').reduce((v, k) => v[k], o);

describe('i18n', () => {
    it('has the same keys and placeholders in both languages, none empty', () => {
        expect(keys(en).sort()).toEqual(keys(tr).sort());
        for (const k of keys(tr)) {
            expect(at(tr, k).trim(), k).not.toBe('');
            expect(at(en, k).trim(), k).not.toBe('');
            expect(placeholders(at(en, k)), k).toBe(placeholders(at(tr, k)));
        }
    });

    it('has no Turkish letters in the English texts', () => {
        expect(keys(en).filter(k => /[çğışÇĞİŞ]/.test(at(en, k)) && !k.startsWith('keep.'))).toEqual([]);
    });

    it('has no hardcoded user-facing text in the source', () => {
        expect(sources('src').flatMap(hardcoded)).toEqual([]);
    });
});

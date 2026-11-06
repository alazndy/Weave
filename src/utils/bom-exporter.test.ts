import { describe, it, expect } from 'vitest';
import { buildBOM, bomToCSV } from './bom-exporter';
import type { ProductInstance, ProductTemplate } from '../types';

const template = (id: string, name: string, extra: Partial<ProductTemplate> = {}): ProductTemplate => ({
  id, name, imageUrl: '', width: 10, height: 10, ports: [], ...extra,
});
const inst = (id: string, templateId: string): ProductInstance => ({ id, templateId, x: 0, y: 0 });

describe('buildBOM', () => {
  const templates = [
    template('cam', 'Kamera', { modelNumber: 'VBV-770' }),
    template('mon', 'Monitör'),
    template('blk', 'Blok', { isBlock: true }),
  ];

  it('counts instances per template, skips blocks and unknown templates', () => {
    const rows = buildBOM(
      [inst('1', 'cam'), inst('2', 'cam'), inst('3', 'mon'), inst('4', 'blk'), inst('5', 'missing')],
      templates
    );
    expect(rows).toEqual([
      { name: 'Kamera', modelNumber: 'VBV-770', description: '', quantity: 2 },
      { name: 'Monitör', modelNumber: '', description: '', quantity: 1 },
    ]);
  });

  it('appends external parts', () => {
    const rows = buildBOM([], templates, [{ id: 'x', name: 'Kablo 5m', count: 3 }]);
    expect(rows).toEqual([{ name: 'Kablo 5m', modelNumber: '', description: 'Harici parça', quantity: 3 }]);
  });
});

describe('bomToCSV', () => {
  it('quotes cells and escapes embedded quotes', () => {
    const csv = bomToCSV([{ name: 'Monitör 7"', modelNumber: 'M,1', description: '', quantity: 2 }]);
    expect(csv.split('\r\n')).toEqual([
      '"Ürün","Model No","Açıklama","Adet"',
      '"Monitör 7""","M,1","","2"',
    ]);
  });
});

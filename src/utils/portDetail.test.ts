import { describe, it, expect } from 'vitest';
import { pinCountOf, seedPins, cleanDetail, scaledSize, newCardPosition } from './portDetail';

const row = (pin: string, color = '', description = '') => ({ id: 'r' + pin, pin, color, description });

describe('portDetail', () => {
  it('reads the pin count from the connector type', () => {
    expect(pinCountOf('deutsch-dt04-6pin')).toBe(6);
    expect(pinCountOf('brigade-vbv-5pin-shutter')).toBe(5);
    expect(pinCountOf('mdr-15pin-heavy-duty')).toBe(15);
    expect(pinCountOf('generic')).toBe(0);
    expect(pinCountOf('amp-superseal-1.5')).toBe(0);
  });
  it('seeds numbered rows only when nothing was typed', () => {
    expect(seedPins(undefined, 'deutsch-dt04-3pin').map(p => p.pin)).toEqual(['1', '2', '3']);
    expect(seedPins({ pins: [row('1'), row('2')] }, 'deutsch-dt04-4pin')).toHaveLength(4);
    const typed = [row('A', 'Kırmızı')];
    expect(seedPins({ pins: typed }, 'deutsch-dt04-6pin')).toEqual(typed);
  });
  it('drops a detail that has no picture and no typed text', () => {
    expect(cleanDetail({ pins: [row('1'), row('2', '  ')] })).toBeUndefined();
    expect(cleanDetail({ image: 'data:x', pins: [row('1')] })).toEqual({ image: 'data:x', pins: [] });
    const d = { pins: [row('1', '', '+12V'), row('2')] };
    expect(cleanDetail(d)?.pins).toHaveLength(2);
  });
  it('limits the long side to 800 px without upscaling', () => {
    expect(scaledSize(1600, 800)).toEqual({ w: 800, h: 400 });
    expect(scaledSize(400, 2000)).toEqual({ w: 160, h: 800 });
    expect(scaledSize(300, 200)).toEqual({ w: 300, h: 200 });
  });
  it('places a new card inside the paper', () => {
    const paper = { w: 1000, h: 700 }, card = { w: 240, h: 300 };
    expect(newCardPosition({ x: 100, y: 100, width: 120 }, card, paper)).toEqual({ x: 260, y: 100 });
    expect(newCardPosition({ x: 800, y: 600, width: 120 }, card, paper)).toEqual({ x: 520, y: 400 });
  });
});

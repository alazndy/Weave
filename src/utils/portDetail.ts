import type { ConnectorType, Point, PortDetail, PortPin } from '../types';

export const MAX_IMAGE_SIDE = 800;
const CARD_GAP = 40;

export const pinCountOf = (type: ConnectorType): number => Number(/(\d+)pin/.exec(type)?.[1] ?? 0);

const hasText = (p: PortPin) => !!(p.color.trim() || p.description.trim());

/** Rows to show in the editor. Typed rows are never replaced; blank ones are re-numbered to fit the connector. */
export function seedPins(detail: PortDetail | undefined, type: ConnectorType): PortPin[] {
    const pins = detail?.pins ?? [];
    if (pins.some(hasText)) return pins;
    const count = pinCountOf(type);
    if (!count) return pins;
    return Array.from({ length: count }, (_, i) => ({ id: crypto.randomUUID(), pin: String(i + 1), color: '', description: '' }));
}

/** What gets stored: undefined when there is neither a picture nor any typed pin text. */
export function cleanDetail(detail: PortDetail): PortDetail | undefined {
    const pins = detail.pins.some(hasText) ? detail.pins : [];
    if (!detail.image && !pins.length) return undefined;
    return detail.image ? { image: detail.image, pins } : { pins };
}

export function scaledSize(w: number, h: number, max = MAX_IMAGE_SIDE) {
    const k = Math.min(1, max / Math.max(w, h));
    return { w: Math.round(w * k), h: Math.round(h * k) };
}

/** Right of the part, or left of it when there is no room, always inside the paper. */
export function newCardPosition(inst: { x: number; y: number; width: number }, card: { w: number; h: number }, paper: { w: number; h: number }): Point {
    const right = inst.x + inst.width + CARD_GAP;
    const x = right + card.w <= paper.w ? right : inst.x - CARD_GAP - card.w;
    return {
        x: Math.max(0, Math.min(x, paper.w - card.w)),
        y: Math.max(0, Math.min(inst.y, paper.h - card.h)),
    };
}

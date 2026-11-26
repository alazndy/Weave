import { useEffect, useRef } from 'react';
import type { Point, PortCard, PortDefinition, ProductInstance, ProductTemplate } from '../../../types';
import { newCardPosition } from '../../../utils/portDetail';
import { PORT_CARD_WIDTH } from '../PortCardNode';

const MIN_SCALE = 0.5, MAX_SCALE = 3;

interface Options {
    cards: PortCard[];
    onChange?: (cards: PortCard[]) => void;
    instances: ProductInstance[];
    templates: ProductTemplate[];
    scale: number;
    getMouseCoords: (e: React.MouseEvent) => Point;
    onUndoCheckpoint: () => void;
}

export function usePortCards(options: Options) {
    const latest = useRef(options);
    latest.current = options;
    const gesture = useRef<{ kind: 'move' | 'resize'; card: PortCard; start: Point; changed: boolean } | null>(null);

    // Cards of a deleted instance or port stay in the page data but are not drawn, so undo brings them back.
    const visibleCards = options.cards.flatMap(card => {
        const instance = options.instances.find(i => i.id === card.instanceId);
        const template = options.templates.find(t => t.id === instance?.templateId);
        const port = template?.ports.find(p => p.id === card.portId);
        return instance && !instance.hidden && template && port?.detail ? [{ card, instance, template, port }] : [];
    });

    const showCard = (instanceId: string, port: PortDefinition, paper: { w: number; h: number }) => {
        const { cards, onChange, instances, templates } = latest.current;
        const instance = instances.find(i => i.id === instanceId);
        if (!instance || !port.detail || cards.some(c => c.instanceId === instanceId && c.portId === port.id)) return;
        const width = instance.width || templates.find(t => t.id === instance.templateId)?.width || 100;
        // rough height, only used to keep a new card on the paper
        const height = 60 + (port.detail.image ? 170 : 0) + (port.detail.pins.length ? (port.detail.pins.length + 1) * 18 : 0);
        const position = newCardPosition({ x: instance.x, y: instance.y, width }, { w: PORT_CARD_WIDTH, h: height }, paper);
        onChange?.([...cards, { id: crypto.randomUUID(), instanceId, portId: port.id, scale: 1, ...position }]);
    };

    const start = (kind: 'move' | 'resize') => (e: React.MouseEvent, id: string) => {
        const card = latest.current.cards.find(c => c.id === id);
        if (e.button !== 0 || !card) return; // middle button still pans
        e.stopPropagation(); e.preventDefault();
        gesture.current = { kind, card, start: latest.current.getMouseCoords(e), changed: false };
    };

    const removeCard = (id: string) => {
        latest.current.onUndoCheckpoint();
        latest.current.onChange?.(latest.current.cards.filter(c => c.id !== id));
    };

    useEffect(() => {
        const move = (ev: MouseEvent) => {
            const g = gesture.current;
            if (!g) return;
            if (ev.buttons === 0) { gesture.current = null; return; }
            const o = latest.current;
            const p = o.getMouseCoords(ev as unknown as React.MouseEvent);
            const dx = p.x - g.start.x, dy = p.y - g.start.y;
            if (!g.changed) {
                if (Math.hypot(dx, dy) * o.scale < 4) return;
                g.changed = true;
                o.onUndoCheckpoint();
            }
            const next = g.kind === 'move'
                ? { ...g.card, x: g.card.x + dx, y: g.card.y + dy }
                : { ...g.card, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, g.card.scale + dx / PORT_CARD_WIDTH)) };
            o.onChange?.(o.cards.map(c => c.id === next.id ? next : c));
        };
        const up = () => { gesture.current = null; };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    }, []);

    return { visibleCards, showCard, startCardMove: start('move'), startCardResize: start('resize'), removeCard };
}

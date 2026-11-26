import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowDownRight, X } from 'lucide-react';
import type { Point, PortCard, PortDefinition } from '../../types';
import { connectorLabel } from '../../types';
import { useTranslation } from 'react-i18next';
import { useDocumentT } from '../../i18nDocument';

export const PORT_CARD_WIDTH = 260;

interface Props {
    card: PortCard;
    port: PortDefinition;
    heading: string;
    /** Port position in sheet pixels; the leader line ends here. */
    anchor: Point;
    theme: 'light' | 'dark';
    onMoveStart: (e: React.MouseEvent, id: string) => void;
    onResizeStart: (e: React.MouseEvent, id: string) => void;
    onRemove: (id: string) => void;
}

/** Connector picture and pin table on the sheet. Lives inside the export area, so exports include it. */
export const PortCardNode = ({ card, port, heading, anchor, theme, onMoveStart, onResizeStart, onRemove }: Props) => {
    const { t } = useTranslation();
    const td = useDocumentT();
    const ref = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
        observer.observe(el);
        setHeight(el.offsetHeight);
        return () => observer.disconnect();
    }, []);

    const light = theme === 'light';
    const colors = { background: light ? '#ffffff' : '#18181b', color: light ? '#18181b' : '#f4f4f5', border: light ? '#3f3f46' : '#a1a1aa' };
    const cell = { border: `1px solid ${colors.border}`, padding: '2px 5px', verticalAlign: 'top' as const, wordBreak: 'break-word' as const };
    // the line starts at the point of the card edge nearest to the port
    const from = {
        x: Math.max(card.x, Math.min(anchor.x, card.x + PORT_CARD_WIDTH * card.scale)),
        y: Math.max(card.y, Math.min(anchor.y, card.y + height * card.scale)),
    };
    const detail = port.detail!;

    return (
        <>
            <svg className="absolute top-0 left-0 overflow-visible pointer-events-none z-40" width={1} height={1}>
                <line data-testid="port-card-leader" x1={from.x} y1={from.y} x2={anchor.x} y2={anchor.y} stroke={colors.border} strokeWidth={1} strokeDasharray="4 3" />
                <circle cx={anchor.x} cy={anchor.y} r={2.5} fill={colors.border} />
            </svg>
            <div ref={ref} data-portcard-id={card.id} onMouseDown={e => onMoveStart(e, card.id)}
                className="group/card absolute z-[45] cursor-move rounded"
                style={{ left: card.x, top: card.y, width: PORT_CARD_WIDTH, transform: `scale(${card.scale})`, transformOrigin: '0 0', background: colors.background, color: colors.color, border: `1px solid ${colors.border}`, padding: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.3 }}>{heading}</div>
                <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 6 }}>{connectorLabel(port.connectorType, td)}</div>
                {detail.image && <img src={detail.image} alt={td('doc.portCard.image')} draggable={false} style={{ display: 'block', margin: '0 auto 6px', maxWidth: '100%', maxHeight: 160, background: '#ffffff' }} />}
                {detail.pins.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, lineHeight: 1.25, tableLayout: 'fixed' }}>
                        <thead><tr>
                            <th style={{ ...cell, width: 30 }}>{td('doc.portCard.pin')}</th>
                            <th style={{ ...cell, width: 78 }}>{td('doc.portCard.color')}</th>
                            <th style={cell}>{td('doc.portCard.function')}</th>
                        </tr></thead>
                        <tbody>{detail.pins.map(p => (
                            <tr key={p.id}><td style={{ ...cell, textAlign: 'center' }}>{p.pin}</td><td style={cell}>{p.color}</td><td style={cell}>{p.description}</td></tr>
                        ))}</tbody>
                    </table>
                )}
                <button type="button" aria-label={t('portCard.remove')} title={t('portCard.remove')} onMouseDown={e => e.stopPropagation()} onClick={() => onRemove(card.id)}
                    className="no-print absolute -top-3 -right-3 rounded-full bg-red-600 p-1 text-white opacity-0 shadow transition group-hover/card:opacity-100"><X size={12} /></button>
                <div data-testid="port-card-resize" title={t('common.dragToResize')} onMouseDown={e => onResizeStart(e, card.id)}
                    className="no-print absolute -bottom-3 -right-3 cursor-nwse-resize rounded-full bg-teal-600 p-1 text-white opacity-0 shadow transition group-hover/card:opacity-100"><ArrowDownRight size={12} /></div>
            </div>
        </>
    );
};

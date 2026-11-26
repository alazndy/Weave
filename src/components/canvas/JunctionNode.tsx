import type { Junction } from '../../types';

interface Props {
    junction: Junction;
    color: string;
    selected: boolean;
    theme: 'light' | 'dark';
    onMouseDown: (e: React.MouseEvent, id: string) => void;
    onMouseUp: (e: React.MouseEvent, id: string) => void;
}

/** Filled dot where cable branches meet. SVG, so it stays vector in exports. */
export const JunctionNode = ({ junction, color, selected, theme, onMouseDown, onMouseUp }: Props) => (
    <g data-junction-id={junction.id} className="pointer-events-auto cursor-move"
        onMouseDown={e => onMouseDown(e, junction.id)} onMouseUp={e => onMouseUp(e, junction.id)}
        onClick={e => e.stopPropagation()}>
        <title>Birleşme noktası: tıkla ve kol çek, sürükle ve taşı</title>
        <circle cx={junction.x} cy={junction.y} r={12} fill="transparent" />
        {selected && <circle cx={junction.x} cy={junction.y} r={10} fill="none" stroke="#38bdf8" strokeWidth={3} className="no-print" />}
        <circle cx={junction.x} cy={junction.y} r={6} fill={color} stroke={theme === 'light' ? '#ffffff' : '#09090b'} strokeWidth={1.5} />
    </g>
);

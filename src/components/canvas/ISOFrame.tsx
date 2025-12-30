import React from 'react';

interface ISOFrameProps {
    width: number;
    height: number;
    theme: 'light' | 'dark';
}

export const ISOFrame: React.FC<ISOFrameProps> = ({ width, height, theme }) => {
    const margin = 20; 
    const divisionsH = Math.floor(width / 100); 
    const divisionsV = Math.floor(height / 100); 

    const innerW = width - (margin * 2);
    const innerH = height - (margin * 2);
    
    const horizontalLabels = Array.from({length: divisionsH}, (_, i) => i + 1);
    const verticalLabels = Array.from({length: divisionsV}, (_, i) => String.fromCharCode(65 + i)); 

    const stepH = innerW / divisionsH;
    const stepV = innerH / divisionsV;
    
    const gridStroke = theme === 'light' ? '#e4e4e7' : '#27272a';
    const frameStroke = theme === 'light' ? '#000' : '#52525b';
    const textFill = theme === 'light' ? '#000' : '#71717a';

    return (
        <svg className="absolute top-0 left-0 pointer-events-none z-0 select-none overflow-visible" style={{ width: width, height: height }}>
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke={gridStroke} strokeWidth="1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />
            <g stroke={frameStroke} strokeWidth="2" fill="none">
                <rect x="5" y="5" width={width - 10} height={height - 10} strokeWidth="1" />
                <rect x={margin} y={margin} width={innerW} height={innerH} strokeWidth="3" />
            </g>
            <g stroke={frameStroke} strokeWidth="2">
                <line x1={width/2} y1={0} x2={width/2} y2={margin + 10} />
                <line x1={width/2} y1={height} x2={width/2} y2={height - margin - 10} />
                <line x1={0} y1={height/2} x2={margin + 10} y2={height/2} />
                <line x1={width} y1={height/2} x2={width - margin - 10} y2={height/2} />
            </g>
            <g className="text-xs font-bold font-mono" fill={textFill}>
                {horizontalLabels.map((label, i) => (
                    <React.Fragment key={`h-${i}`}>
                        <text x={margin + (i * stepH) + (stepH/2)} y={margin - 5} textAnchor="middle">{label}</text>
                        <line x1={margin + (i * stepH)} y1={margin} x2={margin + (i * stepH)} y2={margin + 5} stroke={frameStroke} />
                        <text x={margin + (i * stepH) + (stepH/2)} y={height - margin + 12} textAnchor="middle">{label}</text>
                        <line x1={margin + (i * stepH)} y1={height - margin} x2={margin + (i * stepH)} y2={height - margin - 5} stroke={frameStroke} />
                    </React.Fragment>
                ))}
                {verticalLabels.map((label, i) => (
                    <React.Fragment key={`v-${i}`}>
                        <text x={margin - 8} y={margin + (i * stepV) + (stepV/2) + 4} textAnchor="middle">{label}</text>
                        <line x1={margin} y1={margin + (i * stepV)} x2={margin + 5} y2={margin + (i * stepV)} stroke={frameStroke} />
                        <text x={width - margin + 8} y={margin + (i * stepV) + (stepV/2) + 4} textAnchor="middle">{label}</text>
                        <line x1={width - margin} y1={margin + (i * stepV)} x2={width - margin - 5} y2={margin + (i * stepV)} stroke={frameStroke} />
                    </React.Fragment>
                ))}
            </g>
            <text x={width / 2} y={height - 5} textAnchor="middle" fill={textFill} fontSize="14" fontFamily="monospace" fontWeight="bold" className="tracking-widest">
                TS 88-20 EN ISO 128-20 • TS EN ISO 5457 UYUMLUDUR
            </text>
        </svg>
    );
};
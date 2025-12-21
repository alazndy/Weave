import React, { useMemo } from 'react';
import { DRCWarning, runDRC } from '../../utils/drc';
import { Connection, ProductInstance, ProductTemplate, Point } from '../../types';
import { getPortPosition } from '../../utils/canvasHelpers';

interface DRCOverlayProps {
  connections: Connection[];
  instances: ProductInstance[];
  templates: ProductTemplate[];
  scale: number;
  onWarningClick?: (warning: DRCWarning) => void;
}

export const DRCOverlay: React.FC<DRCOverlayProps> = ({
  connections,
  instances,
  templates,
  scale,
  onWarningClick
}) => {
  const drcResult = useMemo(() => 
    runDRC(connections, instances, templates),
    [connections, instances, templates]
  );

  const allIssues = [...drcResult.errors, ...drcResult.warnings];

  if (allIssues.length === 0) return null;

  const getConnectionMidpoint = (connId: string): Point | null => {
    const conn = connections.find(c => c.id === connId);
    if (!conn) return null;

    const fromInst = instances.find(i => i.id === conn.fromInstanceId);
    const toInst = instances.find(i => i.id === conn.toInstanceId);
    if (!fromInst || !toInst) return null;

    const fromTemplate = templates.find(t => t.id === fromInst.templateId);
    const toTemplate = templates.find(t => t.id === toInst.templateId);
    if (!fromTemplate || !toTemplate) return null;

    const fromPort = fromTemplate.ports.find(p => p.id === conn.fromPortId);
    const toPort = toTemplate.ports.find(p => p.id === conn.toPortId);
    if (!fromPort || !toPort) return null;

    const fromPos = getPortPosition(fromInst, fromTemplate, conn.fromPortId);
    const toPos = getPortPosition(toInst, toTemplate, conn.toPortId);

    return {
      x: (fromPos.x + toPos.x) / 2,
      y: (fromPos.y + toPos.y) / 2
    };
  };


  return (
    <g className="drc-overlay">
      {allIssues.map(issue => {
        const midpoint = getConnectionMidpoint(issue.connectionId);
        if (!midpoint) return null;

        const isError = issue.severity === 'error';
        const bgColor = isError ? '#EF4444' : '#F59E0B';
        const iconPath = isError 
          ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
          : 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';

        return (
          <g
            key={issue.id}
            transform={`translate(${midpoint.x}, ${midpoint.y})`}
            style={{ cursor: 'pointer' }}
            onClick={() => onWarningClick?.(issue)}
          >
            {/* Pulsing ring for errors */}
            {isError && (
              <circle
                r={16 / scale}
                fill="none"
                stroke={bgColor}
                strokeWidth={2 / scale}
                opacity={0.5}
                className="animate-ping"
              />
            )}
            
            {/* Main badge */}
            <circle
              r={12 / scale}
              fill={bgColor}
              stroke="white"
              strokeWidth={2 / scale}
            />
            
            {/* Icon */}
            <svg
              x={-8 / scale}
              y={-8 / scale}
              width={16 / scale}
              height={16 / scale}
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={iconPath} />
            </svg>

            {/* Tooltip on hover */}
            <title>{issue.message}</title>
          </g>
        );
      })}
    </g>
  );
};

// Summary badge component for toolbar
export const DRCSummaryBadge: React.FC<{
  connections: Connection[];
  instances: ProductInstance[];
  templates: ProductTemplate[];
  onClick?: () => void;
}> = ({ connections, instances, templates, onClick }) => {
  const drcResult = useMemo(() => 
    runDRC(connections, instances, templates),
    [connections, instances, templates]
  );

  const errorCount = drcResult.errors.length;
  const warningCount = drcResult.warnings.length;

  if (errorCount === 0 && warningCount === 0) {
    return (
      <button 
        onClick={onClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        DRC OK
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {errorCount > 0 && <span>{errorCount} Hata</span>}
      {warningCount > 0 && <span className="text-amber-400">{warningCount} Uyarı</span>}
    </button>
  );
};

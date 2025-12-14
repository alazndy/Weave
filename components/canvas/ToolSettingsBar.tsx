
import React from 'react';
import { ActiveTool } from './CanvasToolbar';
import { Minus, MoreHorizontal, GripHorizontal, Type, Square, Palette, Cable, Scaling } from 'lucide-react';
import { LineStyle } from '../../types';

export interface ToolSettings {
    route: {
        color: string;
        lineStyle: LineStyle;
        strokeWidth: 'thin' | 'normal' | 'thick';
        cornerRadius: number;
    };
    text: {
        fontSize: number;
        color: string;
    };
    zone: {
        color: string;
        labelPrefix: string;
    };
    scale: {
        maintainAspectRatio: boolean;
    }
}

interface ToolSettingsBarProps {
    activeTool: ActiveTool;
    settings: ToolSettings;
    onUpdateSettings: (category: keyof ToolSettings, key: string, value: any) => void;
    theme: 'light' | 'dark';
}

export const ToolSettingsBar: React.FC<ToolSettingsBarProps> = ({ activeTool, settings, onUpdateSettings, theme }) => {
    // Only show for tools that have settings
    if (!['manual-route', 'text', 'zone', 'scale'].includes(activeTool)) return null;

    const panelClass = `absolute top-20 left-20 z-40 flex flex-col gap-3 border p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px] animate-in slide-in-from-left-2 duration-200 no-print ${theme === 'light' ? 'bg-white/95 border-zinc-300' : 'bg-ink/95 border-zinc-700'}`;
    const labelClass = "text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block";
    const inputClass = `w-full text-xs rounded px-2 py-1.5 border outline-none ${theme === 'light' ? 'bg-zinc-100 border-zinc-300 text-zinc-800 focus:border-paprika' : 'bg-black/40 border-zinc-700 text-zinc-200 focus:border-paprika'}`;

    return (
        <div className={panelClass}>
            {/* HEADER */}
            <div className="flex items-center gap-2 border-b border-zinc-700/20 pb-2 mb-1">
                {activeTool === 'manual-route' && <Cable size={14} className="text-paprika"/>}
                {activeTool === 'text' && <Type size={14} className="text-paprika"/>}
                {activeTool === 'zone' && <Square size={14} className="text-paprika"/>}
                {activeTool === 'scale' && <Scaling size={14} className="text-paprika"/>}
                <span className={`text-xs font-bold ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-200'}`}>
                    {activeTool === 'manual-route' ? 'Kablo Ayarları' : 
                     activeTool === 'text' ? 'Metin Ayarları' : 
                     activeTool === 'zone' ? 'Bölge Ayarları' : 'Ölçekleme'}
                </span>
            </div>

            {/* ROUTE SETTINGS */}
            {activeTool === 'manual-route' && (
                <>
                    <div>
                        <label className={labelClass}>Renk</label>
                        <div className="flex items-center gap-2">
                             <input 
                                type="color" 
                                value={settings.route.color}
                                onChange={(e) => onUpdateSettings('route', 'color', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                            />
                            <span className="text-xs font-mono opacity-70">{settings.route.color}</span>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Çizgi Stili</label>
                        <div className="flex bg-black/20 rounded p-1 gap-1">
                            <button onClick={() => onUpdateSettings('route', 'lineStyle', 'solid')} title="Düz" className={`flex-1 p-1 rounded flex justify-center ${settings.route.lineStyle === 'solid' ? 'bg-paprika text-white' : 'hover:bg-white/10 text-zinc-500'}`}><Minus size={14}/></button>
                            <button onClick={() => onUpdateSettings('route', 'lineStyle', 'dashed')} title="Kesikli" className={`flex-1 p-1 rounded flex justify-center ${settings.route.lineStyle === 'dashed' ? 'bg-paprika text-white' : 'hover:bg-white/10 text-zinc-500'}`}><GripHorizontal size={14}/></button>
                            <button onClick={() => onUpdateSettings('route', 'lineStyle', 'dotted')} title="Noktalı" className={`flex-1 p-1 rounded flex justify-center ${settings.route.lineStyle === 'dotted' ? 'bg-paprika text-white' : 'hover:bg-white/10 text-zinc-500'}`}><MoreHorizontal size={14}/></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <div>
                            <label className={labelClass}>Kalınlık</label>
                            <select 
                                value={settings.route.strokeWidth}
                                onChange={(e) => onUpdateSettings('route', 'strokeWidth', e.target.value)}
                                className={inputClass}
                            >
                                <option value="thin">İnce</option>
                                <option value="normal">Normal</option>
                                <option value="thick">Kalın</option>
                            </select>
                         </div>
                         <div>
                            <label className={labelClass}>Radius</label>
                            <input 
                                type="number" 
                                min="0" max="50" step="5"
                                value={settings.route.cornerRadius}
                                onChange={(e) => onUpdateSettings('route', 'cornerRadius', Number(e.target.value))}
                                className={inputClass}
                            />
                         </div>
                    </div>
                </>
            )}

            {/* TEXT SETTINGS */}
            {activeTool === 'text' && (
                <>
                    <div>
                        <label className={labelClass}>Yazı Boyutu (px)</label>
                        <input 
                            type="number" 
                            min="8" max="100"
                            value={settings.text.fontSize}
                            onChange={(e) => onUpdateSettings('text', 'fontSize', Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Renk</label>
                        <div className="flex items-center gap-2">
                             <input 
                                type="color" 
                                value={settings.text.color}
                                onChange={(e) => onUpdateSettings('text', 'color', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                            />
                            <span className="text-xs font-mono opacity-70">{settings.text.color}</span>
                        </div>
                    </div>
                </>
            )}

            {/* ZONE SETTINGS */}
            {activeTool === 'zone' && (
                <>
                    <div>
                        <label className={labelClass}>Varsayılan Etiket</label>
                        <input 
                            type="text" 
                            value={settings.zone.labelPrefix}
                            onChange={(e) => onUpdateSettings('zone', 'labelPrefix', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Kenarlık Rengi</label>
                        <div className="flex items-center gap-2">
                             <input 
                                type="color" 
                                value={settings.zone.color}
                                onChange={(e) => onUpdateSettings('zone', 'color', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                            />
                            <span className="text-xs font-mono opacity-70">{settings.zone.color}</span>
                        </div>
                    </div>
                </>
            )}

            {/* SCALE SETTINGS */}
            {activeTool === 'scale' && (
                 <div className="flex items-center gap-2 mt-1">
                    <input 
                        type="checkbox"
                        checked={settings.scale.maintainAspectRatio}
                        onChange={(e) => onUpdateSettings('scale', 'maintainAspectRatio', e.target.checked)}
                        className="accent-paprika"
                        id="aspect-check"
                    />
                    <label htmlFor="aspect-check" className={`text-xs font-medium cursor-pointer ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>En/Boy Oranını Koru</label>
                 </div>
            )}
        </div>
    );
};

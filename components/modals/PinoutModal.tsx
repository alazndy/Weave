

import React from 'react';
import { Connection, ProductInstance, ProductTemplate, CONNECTOR_LABELS } from '../../types';
import { X, Network } from 'lucide-react';

interface PinoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    connections: Connection[];
    instances: ProductInstance[];
    templates: ProductTemplate[];
}

export const PinoutModal: React.FC<PinoutModalProps> = ({ isOpen, onClose, connections, instances, templates }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[150] no-print" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-700 w-[90vw] max-w-6xl h-[80vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-zinc-700 flex justify-between items-center bg-zinc-950/50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                            <Network className="text-blue-400 w-6 h-6" />
                        </div>
                        Pin Haritası (Pinout Matrix)
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 custom-scrollbar bg-zinc-950/30">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-700 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                <th className="p-3 bg-zinc-900/80 sticky top-0">Kablo ID</th>
                                <th className="p-3 bg-zinc-900/80 sticky top-0">Kaynak Cihaz</th>
                                <th className="p-3 bg-zinc-900/80 sticky top-0">Kaynak Port</th>
                                <th className="p-3 bg-zinc-900/80 sticky top-0 text-center">Yön</th>
                                <th className="p-3 bg-zinc-900/80 sticky top-0">Hedef Cihaz</th>
                                <th className="p-3 bg-zinc-900/80 sticky top-0">Hedef Port</th>
                                <th className="p-3 bg-zinc-900/80 sticky top-0">Konnektör Tipi</th>
                                <th className="p-3 bg-zinc-900/80 sticky top-0">Sinyal/Güç</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
                            {connections.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-zinc-500 italic">Henüz bağlantı yapılmamış.</td>
                                </tr>
                            ) : (
                                connections.map(conn => {
                                    const fromInst = instances.find(i => i.id === conn.fromInstanceId);
                                    const toInst = instances.find(i => i.id === conn.toInstanceId);
                                    const fromTemp = templates.find(t => t.id === fromInst?.templateId);
                                    const toTemp = templates.find(t => t.id === toInst?.templateId);
                                    const fromPort = fromTemp?.ports.find(p => p.id === conn.fromPortId);
                                    const toPort = toTemp?.ports.find(p => p.id === conn.toPortId);

                                    if (!fromPort || !toPort || !fromTemp || !toTemp) return null;

                                    return (
                                        <tr key={conn.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-mono font-bold text-teal-400">{conn.label || '-'}</td>
                                            <td className="p-3 font-medium">{fromTemp.name} <span className="text-zinc-600 text-xs">({fromTemp.modelNumber})</span></td>
                                            <td className="p-3 font-bold">{fromPort.label}</td>
                                            <td className="p-3 text-center text-zinc-600">→</td>
                                            <td className="p-3 font-medium">{toTemp.name} <span className="text-zinc-600 text-xs">({toTemp.modelNumber})</span></td>
                                            <td className="p-3 font-bold">{toPort.label}</td>
                                            <td className="p-3 text-xs text-zinc-400">{CONNECTOR_LABELS[fromPort.connectorType]}</td>
                                            <td className="p-3 text-xs font-mono">
                                                {fromPort.isPower ? (
                                                    <span className={fromPort.isGround ? 'text-zinc-500' : 'text-yellow-500'}>
                                                        {fromPort.isGround ? 'GND' : `${fromPort.voltage}V ${fromPort.powerType}`}
                                                    </span>
                                                ) : (
                                                    <span className="text-blue-400">Sinyal</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
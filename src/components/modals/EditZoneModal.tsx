import React, { useState } from 'react';
import { Zone } from '../../types';

export const EditZoneModal = ({ zone, onSave, onCancel }: { zone: Zone, onSave: (z: Zone) => void, onCancel: () => void }) => {
    const [label, setLabel] = useState(zone.label);
    const [color, setColor] = useState(zone.color);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print" onClick={onCancel}>
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-zinc-200 mb-5">Bölge Düzenle</h3>
                <div className="space-y-5">
                    <div>
                        <label className="text-sm text-zinc-400 block mb-2 font-bold">Bölge Adı</label>
                        <input value={label} onChange={e => setLabel(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-2.5 text-base font-medium text-white focus:border-teal-500 outline-none"/>
                    </div>
                    <div>
                        <label className="text-sm text-zinc-400 block mb-2 font-bold">Renk (Şeffaf)</label>
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 rounded cursor-pointer"/>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                        <button onClick={onCancel} className="px-4 py-2.5 text-sm font-bold text-zinc-400 hover:text-white">İptal</button>
                        <button onClick={() => onSave({ ...zone, label, color })} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-sm font-bold shadow-lg shadow-teal-900/20">Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Upload } from 'lucide-react';
import type { ConnectorType, PortDetail, PortPin } from '../../types';
import { connectorLabel } from '../../types';
import { cleanDetail, seedPins } from '../../utils/portDetail';
import { readPortImage } from '../../utils/portImage';

interface Props {
    title: string;
    connectorType: ConnectorType;
    detail?: PortDetail;
    onSave: (detail: PortDetail | undefined) => void;
    onCancel: () => void;
}

const field = 'w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-teal-500';
const COLUMNS = [
    { key: 'pin', label: 'portDetail.pinNo', aria: 'portDetail.pinNumber', width: 'w-16' },
    { key: 'color', label: 'portDetail.wireColor', aria: 'portDetail.wireColor', width: 'w-40' },
    { key: 'description', label: 'portDetail.function', aria: 'portDetail.function', width: '' },
] as const;

/** Edits the connector picture and pinout of one port. */
export const PortDetailDialog = ({ title, connectorType, detail, onSave, onCancel }: Props) => {
    const { t } = useTranslation();
    const [image, setImage] = useState(detail?.image);
    const [pins, setPins] = useState<PortPin[]>(() => seedPins(detail, connectorType));
    const [error, setError] = useState('');

    const patch = (id: string, key: keyof PortPin, value: string) => setPins(list => list.map(p => p.id === id ? { ...p, [key]: value } : p));

    const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try { setImage(await readPortImage(file)); setError(''); }
        catch { setError(t('portDetail.unreadable')); }
    };

    return (
        <div data-testid="port-detail-dialog" className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 no-print" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-[40rem] max-w-full max-h-full overflow-y-auto p-5 shadow-2xl space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-teal-400">{t('portDetail.title', { name: title })}</h3>
                    <p className="text-xs text-zinc-500">{connectorLabel(connectorType, t)}</p>
                </div>

                <div className="flex items-start gap-3">
                    {image && <img src={image} alt={t('portDetail.image')} className="max-h-36 max-w-[14rem] rounded border border-zinc-700 bg-white object-contain" />}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-bold text-zinc-200 hover:bg-zinc-700">
                            <Upload size={14} /> {image ? t('portDetail.replaceImage') : t('portDetail.uploadImage')}
                            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} />
                        </label>
                        {image && <button type="button" onClick={() => setImage(undefined)} className="text-xs text-zinc-500 underline hover:text-red-400">{t('portDetail.removeImage')}</button>}
                        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex gap-2 pr-8 text-xs font-bold text-zinc-500">
                        {COLUMNS.map(c => <span key={c.key} className={c.width || 'flex-1'}>{t(c.label)}</span>)}
                    </div>
                    {pins.map((p, i) => (
                        <div key={p.id} className="flex gap-2 items-center">
                            {COLUMNS.map(c => (
                                <div key={c.key} className={c.width || 'flex-1'}>
                                    <input aria-label={`${t(c.aria)} ${i + 1}`} value={p[c.key]} onChange={e => patch(p.id, c.key, e.target.value)} className={field} />
                                </div>
                            ))}
                            <button type="button" aria-label={t('portDetail.removeRow', { number: i + 1 })} onClick={() => setPins(list => list.filter(x => x.id !== p.id))} className="w-6 text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
                        </div>
                    ))}
                    <button type="button" onClick={() => setPins(list => [...list, { id: crypto.randomUUID(), pin: String(list.length + 1), color: '', description: '' }])}
                        className="flex items-center gap-1 pt-1 text-sm font-bold text-teal-400 hover:text-teal-300"><Plus size={14} /> {t('portDetail.addRow')}</button>
                </div>

                <div className="flex justify-end gap-3 border-t border-zinc-800 pt-3">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white">{t('common.discard')}</button>
                    <button type="button" onClick={() => onSave(cleanDetail({ image, pins }))} className="rounded-md bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-500">{t('portDetail.ok')}</button>
                </div>
            </div>
        </div>
    );
};

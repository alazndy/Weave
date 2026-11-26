import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, RefreshCw } from 'lucide-react';
import { getUpdater, useUpdateStatus } from '../utils/updater';

/** Bottom-left card: new version available → download → restart & install. Silent when nothing to do. */
export const UpdateBanner: React.FC = () => {
  const { t } = useTranslation();
  const s = useUpdateStatus();
  const u = getUpdater();
  if (!u || !['available', 'downloading', 'ready'].includes(s.state)) return null;
  return (
    <div role="status" data-testid="update-banner"
      className="fixed bottom-4 left-4 z-[400] flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-zinc-900/95 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur no-print">
      {s.state === 'available' && (<>
        <Download className="h-4 w-4 text-emerald-400" />
        <span>{t('update.available')}{s.version ? `: v${s.version}` : ''}</span>
        <button type="button" onClick={() => u.download()} className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold hover:bg-emerald-500">{t('update.download')}</button>
      </>)}
      {s.state === 'downloading' && (<>
        <Download className="h-4 w-4 animate-pulse text-emerald-400" />
        <span>{t('update.downloading', { percent: s.percent ?? 0 })}</span>
        <span className="h-1.5 w-28 overflow-hidden rounded bg-white/15"><span className="block h-full bg-emerald-500" style={{ width: `${s.percent ?? 0}%` }} /></span>
      </>)}
      {s.state === 'ready' && (<>
        <RefreshCw className="h-4 w-4 text-emerald-400" />
        <span>{t('update.ready')}{s.version ? ` (v${s.version})` : ''}</span>
        <button type="button" onClick={() => u.install()} className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold hover:bg-emerald-500">{t('update.restart')}</button>
      </>)}
    </div>
  );
};

/** Settings row: manual "check for updates" with the last result. Hidden where updates are not supported. */
export const UpdateSettings: React.FC = () => {
  const { t } = useTranslation();
  const s = useUpdateStatus();
  const u = getUpdater();
  if (!u || s.state === 'unsupported') return null;
  const text =
    s.state === 'checking' ? t('update.checking') :
    s.state === 'none' ? t('update.upToDate') :
    s.state === 'available' ? t('update.newVersion', { version: s.version }) :
    s.state === 'downloading' ? t('update.progress', { percent: s.percent ?? 0 }) :
    s.state === 'ready' ? t('update.readyLong') :
    s.state === 'error' ? t('update.failed', { reason: s.message ?? t('update.checkConnection') }) : '';
  return (
    <div className="space-y-2" data-testid="update-settings">
      <div className="text-base font-semibold">{t('update.heading')}</div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => u.check()} disabled={s.state === 'checking' || s.state === 'downloading'}
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-50">{t('update.check')}</button>
        <span className="text-xs text-muted-foreground">{text}</span>
      </div>
    </div>
  );
};

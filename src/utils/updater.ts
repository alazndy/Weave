import { useEffect, useState } from 'react';

export type UpdateState = 'unsupported' | 'idle' | 'checking' | 'available' | 'none' | 'downloading' | 'ready' | 'error';
export interface UpdateStatus { state: UpdateState; version?: string; percent?: number; message?: string }

interface UpdaterBridge {
  getStatus(): Promise<UpdateStatus>;
  check(): Promise<void>;
  download(): Promise<void>;
  install(): Promise<void>;
  onStatus(cb: (s: UpdateStatus) => void): () => void;
}
export const getUpdater = (): UpdaterBridge | undefined =>
  typeof window !== 'undefined' ? (window as unknown as { electron?: { updater?: UpdaterBridge } }).electron?.updater : undefined;

/** Live update status from the desktop app ('unsupported' in browsers and portable/dev builds). */
export function useUpdateStatus(): UpdateStatus {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'unsupported' });
  useEffect(() => {
    const u = getUpdater();
    if (!u) return;
    let alive = true;
    u.getStatus().then(s => { if (alive && s) setStatus(s); }).catch(() => undefined);
    const off = u.onStatus(s => { if (alive) setStatus(s); });
    return () => { alive = false; off(); };
  }, []);
  return status;
}

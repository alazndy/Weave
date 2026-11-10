const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  /** Prints the current page to a vector PDF at the given size (mm); resolves to the PDF bytes. */
  printToPDF: (opts: { widthMm: number; heightMm: number }): Promise<Uint8Array> => ipcRenderer.invoke('weave:print-pdf', opts),
  updater: {
    getStatus: (): Promise<unknown> => ipcRenderer.invoke('weave:update-status'),
    check: (): Promise<void> => ipcRenderer.invoke('weave:update-check'),
    download: (): Promise<void> => ipcRenderer.invoke('weave:update-download'),
    install: (): Promise<void> => ipcRenderer.invoke('weave:update-install'),
    onStatus: (cb: (s: unknown) => void) => {
      const h = (_e: unknown, s: unknown) => cb(s);
      ipcRenderer.on('weave:update-event', h);
      return () => ipcRenderer.removeListener('weave:update-event', h);
    },
  },
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

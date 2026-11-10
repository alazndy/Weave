const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  /** Prints the current page to a vector PDF at the given size (mm); resolves to the PDF bytes. */
  printToPDF: (opts: { widthMm: number; heightMm: number }): Promise<Uint8Array> => ipcRenderer.invoke('weave:print-pdf', opts),
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

import { app, BrowserWindow, ipcMain, Menu, net, protocol, shell, screen } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Weave desktop shell.
 *
 * The renderer is served from a custom `app://weave/` origin instead of file://.
 * IndexedDB / localStorage are scoped per origin, so a fixed origin keeps projects and
 * libraries in the same place across updates, install paths and restarts (they live
 * in the per-user `userData` folder, not in the app bundle).
 */

const isDev = process.env.NODE_ENV === 'development';
const DIST_DIR = path.join(__dirname, '..', 'dist');
const APP_ORIGIN = 'app://weave';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

// ---- window state (size, position, maximised) ----
interface WindowState { width: number; height: number; x?: number; y?: number; maximized?: boolean }
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState(): WindowState {
  const fallback: WindowState = { width: 1440, height: 900 };
  try {
    const s = JSON.parse(fs.readFileSync(stateFile(), 'utf8')) as WindowState;
    const visible = screen.getAllDisplays().some(d => {
      const b = d.workArea;
      return s.x !== undefined && s.y !== undefined && s.x >= b.x - 50 && s.y >= b.y - 50 && s.x < b.x + b.width && s.y < b.y + b.height;
    });
    return visible || s.x === undefined ? { ...fallback, ...s } : fallback;
  } catch {
    return fallback;
  }
}

function saveWindowState(win: BrowserWindow) {
  try {
    const maximized = win.isMaximized();
    const b = maximized ? win.getNormalBounds() : win.getBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ ...b, maximized }));
  } catch { /* non-fatal */ }
}

// ---- serve the built web app over app:// ----
function registerAppProtocol() {
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/' || rel === '') rel = '/index.html';
    const file = path.normalize(path.join(DIST_DIR, rel));
    // never serve anything outside dist/
    if (!file.startsWith(DIST_DIR + path.sep) && file !== DIST_DIR) {
      return new Response('Forbidden', { status: 403 });
    }
    return net.fetch(pathToFileURL(file).toString()).catch(() => new Response('Not found', { status: 404 }));
  });
}

let mainWindow: BrowserWindow | null = null;

/**
 * Vector PDF: Chromium's own print pipeline keeps text as real text and SVG as paths,
 * so the result stays sharp at any zoom. The renderer prepares one sheet at a time
 * (print overlay) and asks for it here; it merges the single-page PDFs afterwards.
 */
ipcMain.handle('weave:print-pdf', async (event, opts: { widthMm: number; heightMm: number }) => {
  const w = Number(opts?.widthMm), h = Number(opts?.heightMm);
  if (!(w > 20 && w < 2000 && h > 20 && h < 2000)) throw new Error('Invalid page size');
  const buf = await event.sender.printToPDF({
    pageSize: { width: w / 25.4, height: h / 25.4 },   // inches
    margins: { marginType: 'none' },
    printBackground: true,
    preferCSSPageSize: true,
  });
  return new Uint8Array(buf);
});

function createWindow() {
  const state = loadWindowState();
  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 960,
    minHeight: 600,
    show: false,
    backgroundColor: '#0b111e',
    title: 'Weave',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (!isDev) Menu.setApplicationMenu(null);
  if (state.maximized) mainWindow.maximize();
  mainWindow.once('ready-to-show', () => mainWindow?.show());

  // External links open in the system browser, never inside the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(APP_ORIGIN) && !(isDev && url.startsWith('http://localhost:3004'))) {
      e.preventDefault();
      if (/^https?:\/\//.test(url)) void shell.openExternal(url);
    }
  });

  if (isDev) {
    void mainWindow.loadURL('http://localhost:3004');
    mainWindow.webContents.openDevTools();
  } else {
    void mainWindow.loadURL(`${APP_ORIGIN}/index.html`);
  }

  mainWindow.on('close', () => { if (mainWindow) saveWindowState(mainWindow); });
  mainWindow.on('closed', () => { mainWindow = null; });
}

// One instance only: a second launch focuses the existing window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    registerAppProtocol();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

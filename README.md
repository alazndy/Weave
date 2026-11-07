# Weave

![Status](https://img.shields.io/badge/Status-Alpha-rose) ![License](https://img.shields.io/badge/License-MIT-green)

Weave is a standalone editor for **system cabling schematics**: you photograph or import a product,
mark its connection points (ports), then place products on multi-page drawing sheets and wire them
together. The output is an installation document with a title block, a pin map and a bill of materials.

It ships with a connector catalogue aimed at vehicle safety systems (camera, radar, ultrasonic sensor,
CAN, FAKRA, M12, Deutsch and so on), but any product with a picture and ports works.

Everything runs locally. There is no account, no backend and no telemetry.

## Features

- **Product editor**: import an image or PDF, crop and clean it, then place ports with direction,
  connector type, voltage, current, power and ground flags.
- **Libraries**: multiple local product libraries, with JSON import/export of a whole library or a single product.
- **Canvas**: grid snapping, curved, straight and orthogonal wires, auto-routing around devices, zones,
  text, comments, grouping, saved blocks and a minimap.
- **Pages**: multiple sheets per project, A3/A4/A6 in portrait or landscape, with a title block and technical notes.
- **Undo/redo and snapshots**: checkpoint history of up to 50 steps, plus named snapshots.
- **Saving**: projects autosave to IndexedDB and appear on the welcome screen. A `.weave` file
  (JSON) can be saved and opened with Ctrl+S.
- **Exports**: PNG of the sheet, BOM as CSV (opens correctly in Excel), and a pin map table.
- **AI (optional)**: schematic review and BOM-from-image extraction via Google Gemini. Enter your own
  API key under *App Settings → AI*. The key stays on the device and is never bundled into the build.

## Getting started

Requires Node.js 20+ and pnpm 9.

```bash
pnpm install
pnpm dev          # http://localhost:3004
```

| Script | Purpose |
|---|---|
| `pnpm build` | Production web build to `dist/` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | Browser UI tests (Playwright, `tests/e2e/`). Set `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium` to use a system Chromium |
| `pnpm electron:dev` / `pnpm electron:build` | Desktop app (Electron) |
| `pnpm mobile:build` | Build and sync Capacitor Android/iOS projects |

## Desktop app (Linux)

Weave ships as an Electron desktop app that runs fully offline. Projects and libraries are
stored per user in `~/.config/weave` (IndexedDB), so they survive restarts and updates.

```bash
scripts/install-linux.sh              # builds if needed, installs to ~/.local/opt/Weave + menu entry
scripts/install-linux.sh --uninstall  # removes the app, keeps your projects
scripts/install-linux.sh --purge      # removes the app and all saved data
```

`pnpm desktop:build` produces `release/Weave-*.AppImage` and a `.deb` (Debian/Ubuntu). For Windows
(`nsis`) and macOS (`dmg`) run `electron-builder` on that platform. `pnpm test:desktop` launches the
real app twice and verifies that data persists across restarts.

## Keyboard shortcuts

| Key | Action |
|---|---|
| V / M / S / B | Select / Move / Scale / Box select |
| R / Alt+R | Manual route / Auto-route |
| Z / T / C | Zone / Text / Comment |
| Ctrl+Z / Ctrl+Y | Undo / Redo |
| Ctrl+C / Ctrl+V | Copy / Paste device |
| Ctrl+G / Ctrl+Shift+G | Group / Ungroup |
| Ctrl+S | Save project as `.weave` |
| Delete | Delete selection |

## Project layout

```
src/
├── App.tsx                 # Document state (pages, templates, metadata) and actions
├── components/
│   ├── Canvas.tsx          # Drawing surface
│   ├── canvas/             # Nodes, wires, zones, toolbars, minimap
│   ├── ProductEditor.tsx   # Image → product template with ports
│   ├── layout/             # Sidebars, toolbar, page bar
│   └── modals/             # Settings, pin map, history, ...
├── hooks/
│   ├── useHistory.ts       # Checkpoint undo/redo + snapshots
│   └── useLibraryManager.ts# Local product libraries (localStorage)
├── services/
│   ├── projectStore.ts     # IndexedDB autosave / recent projects
│   └── geminiService.ts    # Optional AI features
├── utils/                  # Geometry, routing, BOM export
└── types/                  # Data model
```

## License

MIT

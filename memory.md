# Project Memory: Weave

## Context
- **Status:** v0.1.1 released. New work is on branch `fix/drag-pan` (from `integration`), not pushed.
- **Stack:** React 19, TypeScript, Vite, Electron, Vitest, Playwright.
- **Last milestone:** Turkish/English coverage with a separate document language.

## Active Objectives
- [ ] Install the new build on this machine (ask the user first: the running app must close).

## Technical Decisions
- Memoized canvas children get stable handlers (`useStableHandlers`); stale closures caused jumps and bad undo.
- App language drives the interface. `ProjectMetadata.docLanguage` drives sheet text and exports (user decision).
  Rules: `docs/superpowers/plans/2026-11-26-i18n.md`.
- A junction is passed to cable code as a zero-size virtual part (`src/utils/junctions.ts`).
- Port compatibility is not checked through junctions (accepted by the user).

## Important Links & Paths
- Local install: `scripts/install-linux.sh` uses an existing `release/linux-unpacked`; run `pnpm run desktop:build` first.
- Browser tests: `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium pnpm exec playwright test` (about 8-13 min).

## Current Focus
`src-tauri/` is untracked build output from the Tauri experiment.

## Change Log & Agent Trail
- [2026-11-26] [Claude Kaira]: Fixed drag jumps, undo, wheel zoom, panning. Added port detail cards and wire junctions
  (196 browser tests, 64 unit tests passed). Bundled translations. Installed build has fixes and port cards, not junctions.
- [2026-11-26] [Claude Kaira]: Translated the interface and sheet text. Added the document language setting.
  Fixed `html lang`: English uppercase text showed dotted İ. Unit tests: 71 passed. Browser tests: 195 of 200 passed
  in the full run; the other 5 passed when run alone (machine load about 15).

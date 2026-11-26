# Project Memory: Weave

## Context
- **Status:** v0.1.1 released. New work is on branch `fix/drag-pan` (from `integration`), not pushed.
- **Stack:** React 19, TypeScript, Vite, Electron, Vitest, Playwright.
- **Last milestone:** drag/pan fixes, port detail cards, wire junctions.

## Active Objectives
- [ ] Full Turkish/English coverage with a separate document language.
      See `docs/superpowers/plans/2026-11-26-i18n.md`.

## Technical Decisions
- Memoized canvas children get stable handlers (`useStableHandlers`); stale closures caused jumps and bad undo.
- A junction is passed to cable code as a zero-size virtual part (`src/utils/junctions.ts`).
- Port compatibility is not checked through junctions (accepted by the user).

## Important Links & Paths
- Local install: `scripts/install-linux.sh` uses an existing `release/linux-unpacked`; run `pnpm run desktop:build` first.
- Browser tests: `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium pnpm exec playwright test` (about 8-13 min).

## Current Focus
Convert hardcoded strings. `src-tauri/` is untracked build output from the Tauri experiment.

## Change Log & Agent Trail
- [2026-11-26] [Claude Kaira]: Fixed drag jumps, undo, wheel zoom, panning. Added port detail cards and wire junctions
  (196 browser tests, 64 unit tests passed). Bundled translations. Installed build has fixes and port cards, not junctions.

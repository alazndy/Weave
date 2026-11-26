# Project Memory: Weave

## Context
- **Status:** v0.1.1 released. New work is on branch `fix/drag-pan` (from `integration`), not pushed.
- **Stack:** React 19, TypeScript, Vite, Electron, Vitest, Playwright.
- **Last milestone:** Turkish/English coverage with a separate document language.

## Active Objectives
- [ ] Collect user feedback on the installed build.
- [ ] Review `pnpm audit --prod` results (70 findings on 2026-11-26, not caused by this work).

## Technical Decisions
- Memoized canvas children get stable handlers (`useStableHandlers`); stale closures caused jumps and bad undo.
- App language drives the interface. `ProjectMetadata.docLanguage` drives sheet text and exports (user decision).
  Rules: `docs/superpowers/plans/2026-11-26-i18n.md`.
- User rule: every title-block heading follows the document language. A typed heading is stored per language
  (`legendHeadings`, `CustomField.labels`). The old `legendLabels` stays in the file but is not shown.
- A junction is passed to cable code as a zero-size virtual part (`src/utils/junctions.ts`).
- Port compatibility is not checked through junctions (accepted by the user).

## Important Links & Paths
- Local install: `scripts/install-linux.sh` uses an existing `release/linux-unpacked`; run `pnpm run desktop:build` first.
- Browser tests: `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium pnpm exec playwright test` (about 8-13 min).

## Current Focus
`src-tauri/` is untracked build output from the Tauri experiment.

## Change Log & Agent Trail
- [2026-11-26] [Claude Kaira]: Fixed drag jumps, undo, wheel zoom, panning. Added port detail cards and wire junctions
  (196 browser tests, 64 unit tests passed). Bundled translations. At that time the installed build had no junctions.
- [2026-11-26] [Claude Kaira]: Translated the interface and sheet text. Added the document language setting.
  Fixed `html lang`: English uppercase text showed dotted İ. Unit tests: 71 passed. Browser tests: 195 of 200 passed
  in the full run; the other 5 passed when run alone (machine load about 15).
- [2026-11-26] [Claude Kaira]: Installed the build of commit 876774f on this machine. The app took more than 30 s to quit.
  Data backup: `~/.local/share/weave-backups/config-20261126-180655`.
- [2026-11-26] [Claude Kaira]: Fixed title-block headings that did not follow the document language. Not installed yet.

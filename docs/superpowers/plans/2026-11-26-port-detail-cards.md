# Port Detail Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Execution: inline, in one session.

**Goal:** Pin table and picture per port, shown as movable cards on a sheet.
**Architecture:** `PortDefinition.detail` holds content. `Page.portCards` holds link and layout. Cards render inside `#canvas-export-area`.
**Tech Stack:** React 19, TypeScript, Vitest, Playwright.
**Spec:** docs/superpowers/specs/2026-11-26-port-detail-cards-design.md

## Global Constraints
- New fields are optional. UI text is Turkish. No new dependencies.
- Picture: PNG, JPG, WebP; long side at most 800 px. Card scale 0.5 to 3.
- Memoized canvas children get stable handlers.

## Review Focus
- A pin row with only a pin number (pre-filled rows) must count as empty.
- A change of connector type must keep typed rows.
- A card whose instance or port is gone is not drawn and does not break export.
- A card near the right paper edge must open inside the paper.
- A drag on a card must not pan or box-select.

### Task 1: Pure model and helpers
Files: modify `src/types/index.ts`; create `src/utils/portDetail.ts`, `src/utils/portDetail.test.ts`.
Interfaces:
- `PortPin {id,pin,color,description}`, `PortDetail {image?: string; pins: PortPin[]}`, `PortCard {id,instanceId,portId,x,y,scale}`
- `pinCountOf(type: ConnectorType): number` (0 when unknown)
- `seedPins(detail: PortDetail | undefined, type: ConnectorType): PortPin[]` (existing rows with text win; otherwise numbered rows)
- `cleanDetail(d: PortDetail): PortDetail | undefined` (undefined without picture and without text in colour/description)
- `scaledSize(w, h, max=800): {w,h}`
- `newCardPosition(inst:{x,y,width}, card:{w,h}, paper:{w,h}): Point` (right of instance, else left, clamped)
Steps: failing unit tests, implement, `pnpm exec vitest run`, commit.

### Task 2: Detail dialog and the two entry points
Files: create `src/components/modals/PortDetailDialog.tsx`; modify `EditPortModal.tsx`, `ProductEditor.tsx`; create `tests/e2e/20-port-detail.spec.ts`.
Interfaces: `PortDetailDialog({title, connectorType, detail, onSave(detail|undefined), onCancel})`; `EditPortModal` gains `onShowCard?(port: PortDefinition)`.
Steps: failing browser test (enter detail on canvas port, reopen, values stay; editor popover opens the dialog), implement, run, commit.

### Task 3: Cards on the sheet
Files: create `src/components/canvas/PortCardNode.tsx`; modify `Canvas.tsx`, `App.tsx`, `types`.
Interfaces: Canvas props `portCards?: PortCard[]`, `onPortCardsChange?(cards: PortCard[])`. Elements: `data-portcard-id`, `data-testid="port-card-leader"`.
Orphan cards are filtered at render time (instance, template, port, detail must resolve; hidden instance hides).
Steps: failing browser tests (add once, inside export area, move + undo, resize, remove, delete instance, page duplicate, save/load, no pan on drag, inside paper), implement, run the full suite, update README, commit.

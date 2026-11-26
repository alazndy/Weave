# Wire Junctions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Execution: inline.

**Goal:** Cables join and split at a movable junction.
**Architecture:** A junction is passed to cable code as a zero-size virtual part with one port (`junction`).
`getRouteEnds` alone knows its exit direction: toward the nearest stored waypoint, else toward the other end.
Wiring edits (split, join, remove) are pure functions.
**Spec:** docs/superpowers/specs/2026-11-26-wire-junctions-design.md

## Global Constraints
Optional fields only. Turkish UI text. No new dependencies.

## Review Focus
- Manual-route tool: a click on a cable while drawing must join, not add a bend.
- Join must work for all four branch orientations; arrow heads follow.
- Join that would give a self-loop or a duplicate cable removes the branches instead.
- Delete of a selection with parts and junctions together leaves no cable with a missing end.
- Locked or hidden cable: no junction can be added to a locked cable.

## Task 1: pure logic (`src/utils/junctions.ts`, `junctions.test.ts`, types, `connectionRoute.ts`)
- `Junction {id,x,y}`; `Page.junctions?`; `JUNCTION_PORT='junction'`
- `withJunctions(instances, templates, junctions) => {instances, templates}`
- `splitConnection(conn, at, ends, newId, ids:[string,string]) => {junction, branches:[Connection,Connection]}`
- `removeJunction(id, connections) => Connection[]` (2 branches: join; otherwise drop)
- `pruneJunctions(junctions, connections) => Junction[]`
- `cablePairs(connections, junctionIds) => {id, from, to, label, via}[]`
- `hasCable(connections, a, b) => boolean`

## Task 2: canvas and app (`JunctionNode.tsx`, `useJunctions.ts`, `Canvas.tsx`, `ConnectionLine.tsx`, `useCanvasInteraction.ts`, `App.tsx`, `tests/e2e/21-junctions.spec.ts`)
## Task 3: other readers (`PinoutModal.tsx`, `geminiService.ts`, `Minimap`, `PageGrid`), README, full suite

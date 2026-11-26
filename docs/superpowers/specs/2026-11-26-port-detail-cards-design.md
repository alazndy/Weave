# Port detail cards: design

Status: waiting for approval

## Intent
The user must show what each pin of a connector does (example: a Deutsch DT04 6-pin port on a device).
The user must also show a picture of the connector. The reference is a Brigade cable drawing:
connector face picture plus a pin table.

## Goals
- Enter a picture and a pin table once per port. Store them in the product template.
- Put a "port detail card" on a drawing sheet. Move it and resize it.
- The card appears in all sheet exports (PNG, vector PDF, raster PDF).

## Non-goals
- Wire junctions and splits. This is the next, separate design.
- A built-in library of connector pictures or standard pinouts.
- Automatic pin-to-pin wiring or validation.
- Cards in marquee selection, group scale, alignment guides, or the BOM.

## Anti-goals
- The user types the same pin table again for each placed instance.
- Old projects or libraries stop opening.
- Large pictures make project files or autosave much bigger.

## Approaches
- A (chosen by the user): movable card on the sheet. It is in the PDF and the user controls the layout. It uses sheet space.
- B: automatic pinout pages at the end of the PDF. The drawing stays clean. The reader changes pages.
- C: popup in the app only. Smallest work. It is not in the PDF.

## Data model (all new fields are optional)
- `PortDefinition.detail?: { image?: string; pins: { id: string; pin: string; color: string; description: string }[] }`
- `Page.portCards?: { id: string; instanceId: string; portId: string; x: number; y: number; scale: number }[]`
- Card content always comes from the template port. The card stores only the link and the layout.
  An edit to the port updates every card.

## Editing port detail
- One shared dialog, "Port detayı". Open it from the product editor port popover and from the canvas port dialog.
- Picture: upload PNG, JPG, or WebP. Remove it or replace it.
  Scale it down to a maximum of 800 px on the long side before storage.
- Pin table columns: Pin No, Wire colour, Function. Add, delete, and edit rows.
- For an empty table, create N rows when the connector type gives a pin count (`...-6pin` gives 6).
  A change of connector type never deletes or overwrites rows that have text.
- Existing port save paths must keep `detail`.

## Card on the sheet
- The canvas port dialog has the button "Detayı sayfada göster". One card per instance port per page.
  If the card exists, select it and do not add a second one.
- The button is disabled while the port has no picture and no pin row with text.
- Card content: heading (product name, component number, port label), connector type name,
  picture if present, pin table if present.
- A thin leader line goes from the card to the port. It follows both when they move.
- Drag the card to move it. Drag its corner handle to resize it (scale 0.5 to 3). A close button removes it.
- New card position: next to the instance, kept inside the paper.
- Cards follow the sheet theme (light and dark).
- Add, move, resize, and remove are each one undo step.
- Dragging a card must not pan the view or start box selection.
- Delete an instance: its cards go too. Delete a port: its cards go too. A hidden instance hides its cards.
  Page duplicate and project save/open keep cards and keep them linked to the correct instance.

## Constraints
- Memoized canvas children must receive stable handlers (see `src/hooks/useStableHandlers.ts`).
- The card must be inside `#canvas-export-area` so that exports include it. Editing controls use `no-print`.
- Turkish UI text.

## Tests
- Unit: pin count from connector type; detail survives port edits.
- Browser: enter detail, add card, move, undo, delete instance, save and reopen, card is in the export area.

## Builder's choice
Component names, dialog layout, card default size, leader line attach point.

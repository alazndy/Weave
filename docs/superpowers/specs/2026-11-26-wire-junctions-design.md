# Wire junctions: design

Status: waiting for approval

## Intent
Cables must join at one point, or split from it, on the drawing.

## Goals
- A junction is a movable point. Two or more cable branches end on it.
- Create it on an existing cable. Draw branches from it and to it.
- Old projects open without change.

## Non-goals
- No electrical rules at a junction. It does not record which pin goes to which branch.
- A junction is not a part. It is not in the BOM.
- No automatic detection of cables that cross.
- No shared style for the branches of one junction.

## Approaches
- A (chosen by the user): real junction node. Branching is direct. Most work.
- B: cables stay port to port; only the drawing merges them. Hard to add branches later.
- C: splitter as a library product. Works today. Adds a part to the BOM.

## Data model
- `Page.junctions?: { id: string; x: number; y: number }[]`
- A branch is a normal `Connection`. A junction end uses `instanceId = junction.id`, `portId = 'junction'`.
- One resolver gives position and exit direction for both kinds of end. All code that reads cable ends uses it:
  routing, line drawing and jumps, minimap, page grid, pin map, AI review, validation, delete, copy and block save.
- At a junction a branch leaves toward its other end (main axis). It has no clearance stub for a part body.

## Behaviour
- Right-click a cable > "Birleşme noktası ekle": split it there into two branches. Both keep the cable style.
  The label stays on the first branch. The drawn route stays the same.
- While drawing from a port, click an existing cable: add a junction there and connect the new branch.
- Click a junction to start a branch. Click a port or another junction to end it.
- A new branch from a junction takes the style of a branch that is already there.
- Drag a junction: all branches follow. One drag is one undo step. Grid snap applies.
- Delete a junction with 2 branches: join them into one cable. Keep the first branch style. Keep the route.
- Delete a junction with 3 or more branches: delete the junction and its branches. Undo restores them.
- A junction with no branches is removed.
- Delete a part or a port: its branches go. The other branches stay.
- Port compatibility warnings apply only to a direct port-to-port cable.
- No branch from a junction to itself. No second branch between the same two ends.
- The junction is a filled dot in the cable colour. It appears in all exports.
- Select-all style operations (marquee, group move) move a junction that is inside the selection.

## Pin map
- Ports that connect through junctions are listed as connected pairs, marked "birleşme noktası üzerinden".

## Constraints
- Turkish UI text. Optional fields only. Stable handlers for memoized canvas children.

## Tests
- Unit: end resolver, split, join, network port pairs, empty junction cleanup.
- Browser: split, branch to a third port, drag, undo, delete (2 and 3 branches), delete part,
  save and reopen, pin map.

## Builder's choice
Hit areas, dot size, split math for curved cables.

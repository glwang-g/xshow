# Improve wire snapping and routing

## Problem

Wire editing is already interactive, but the connection behavior can feel too approximate. Users should be able to drag endpoints confidently and understand where a wire will attach before releasing it.

## Proposal

Improve wire endpoint snapping and routing so circuit connections feel more physical and readable.

## Acceptance Criteria

- [x] Wire endpoints visually snap to nearby terminals while dragging
- [x] The active drop target is highlighted clearly
- [x] Dropping on empty space cancels the reconnect and keeps the previous connection
- [x] Selected wires remain above overlapping wires and endpoints
- [x] Routed wires avoid covering component labels when practical
- [x] Orthogonal routes remove consecutive collinear points to avoid small endpoint curls
- [x] Same-side terminals can use an outside detour
- [x] Wire crossings use a visual bridge to communicate "crossing without connecting"
- [x] Clicking blank canvas space clears both part and wire selection

## Notes

This should stay lightweight. We do not need a full graph layout engine yet. The bridge is a visual SVG treatment only and does not change circuit topology: the horizontal wire leaves a gap and arches over a continuous vertical wire.

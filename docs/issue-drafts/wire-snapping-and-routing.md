# Improve wire snapping and routing

## Problem

Wire editing is already interactive, but the connection behavior can feel too approximate. Users should be able to drag endpoints confidently and understand where a wire will attach before releasing it.

## Proposal

Improve wire endpoint snapping and routing so circuit connections feel more physical and readable.

## Acceptance Criteria

- Wire endpoints visually snap to nearby terminals while dragging
- The active drop target is highlighted clearly
- Dropping on empty space cancels the reconnect and keeps the previous connection
- Selected wires remain above overlapping wires and endpoints
- Routed wires avoid covering component labels when practical

## Notes

This should stay lightweight. We do not need a full graph layout engine yet.

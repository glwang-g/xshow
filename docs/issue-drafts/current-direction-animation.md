# Refine current direction animation

## Problem

The app has an initial current flow animation for closed circuits, but the animation can become more expressive and physically intuitive.

## Proposal

Refine the current flow animation so it communicates direction, strength, and circuit state more clearly.

## Acceptance Criteria

- Current animation appears only when a valid closed circuit exists
- Animation stops immediately when the switch opens
- Animation speed reflects simulated current strength
- Wires remain readable when animation is active
- The animation direction follows battery polarity

## Notes

This can start as a visual teaching approximation. It does not need to model electron flow precisely.

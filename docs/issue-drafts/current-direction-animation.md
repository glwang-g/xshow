# Add current direction animation

## Problem

The app shows whether the circuit is closed and displays a current value, but users cannot yet see current moving through the wires.

## Proposal

Add animated current flow along connected wires when the circuit is closed.

## Acceptance Criteria

- Current animation appears only when a valid closed circuit exists
- Animation stops immediately when the switch opens
- Animation speed reflects simulated current strength
- Wires remain readable when animation is active
- The animation direction follows battery polarity

## Notes

This can start as a visual teaching approximation. It does not need to model electron flow precisely.

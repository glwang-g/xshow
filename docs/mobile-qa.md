# Mobile QA Checklist

This document tracks manual checks for the `xshow circuits` mobile and touch experience. Use it for v0.2 regression testing.

## Suggested Devices

| Scenario | Goal |
| --- | --- |
| Phone portrait | Confirm the HUD does not block core operations and the component drawer/status panel work. |
| Phone landscape | Confirm board pan, zoom, and bottom HUD controls feel usable. |
| iPad landscape | Confirm touch interaction feels close to desktop and lesson details are available from the status panel. |
| Desktop browser | Confirm the three-column layout, mouse dragging, and top actions did not regress. |

## Core Flow

- [ ] The app opens with the board, lesson hint strip, and bottom HUD visible.
- [ ] The bottom component button opens the left component drawer.
- [ ] Tapping a component adds it to the workbench and closes the drawer.
- [ ] Dragging empty board space pans the view.
- [ ] Pinching zooms the workbench and updates the zoom label.
- [ ] Recenter view moves the workbench back to a useful starting position.
- [ ] Dragging a component body does not pan the board.
- [ ] Dragging from one terminal to another creates a wire.
- [ ] Dragging a wire endpoint reconnects it to another terminal.
- [ ] Tapping the lesson hint strip opens the status panel.
- [ ] The status panel can switch lessons, load starter workspaces, and view records.
- [ ] Clear Wires removes all wires without deleting components.
- [ ] Export Image downloads a PNG of the current workbench.

## Lesson Checks

- [ ] Lesson 1: Light the bulb can complete all steps.
- [ ] Lesson 2: Open the circuit can complete all steps.
- [ ] Lesson 3: Brighten the bulb can complete all steps.
- [ ] Lesson 4: Series bulbs detects two bulbs, the series route, and both bulbs lit.
- [ ] Lesson 5: Parallel bulbs detects two bulbs, the parallel branches, and both bulbs lit.

## Known Limits

- The circuit model is still an educational approximation, not a SPICE-level simulator.
- Series and parallel brightness comparison checks are not yet physically detailed.
- URL sharing for circuit state is not implemented yet.

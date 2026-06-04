# Mobile QA Checklist

This document tracks manual checks for the `xshow circuits` mobile, touch, PWA, and public-beta release experience. Use it for public beta / v0.4 regression testing.

## Suggested Devices

| Scenario | Goal |
| --- | --- |
| Phone portrait | Confirm the HUD does not block core operations and the component drawer/status panel work. |
| Phone landscape | Confirm board pan, zoom, and bottom HUD controls feel usable. |
| iPad landscape | Confirm touch interaction feels close to desktop and lesson details are available from the status panel. |
| Desktop browser | Confirm the three-column layout, mouse dragging, top actions, and property panel did not regress. |
| Installed PWA | Confirm standalone launch, offline relaunch, and the update-check button work. |

## Core Flow

- [ ] The app opens with the board, compact lesson hint strip, and bottom HUD visible.
- [ ] Small screens do not show top floating GitHub/reset buttons that block the board.
- [ ] The bottom HUD includes component, status, clear-wires, export, update-check, GitHub, reset, and zoom controls.
- [ ] The bottom component button opens the left component drawer.
- [ ] Tapping a component adds it to the workbench and closes the drawer.
- [ ] Dragging empty board space pans the view.
- [ ] Pinching zooms the workbench and updates the zoom label.
- [ ] Recenter view returns phone portrait to the vertical default layout and keeps the workbench usable.
- [ ] Dragging a component body does not pan the board.
- [ ] Dragging from one terminal to another creates a wire.
- [ ] Dragging a wire endpoint reconnects it to another terminal.
- [ ] Tapping the lesson hint strip opens the status panel.
- [ ] The status panel can switch lessons, load starter workspaces, and view records.
- [ ] Clear Wires removes all wires without deleting components.
- [ ] Export Image downloads a PNG of the current workbench.
- [ ] Export JSON downloads the current workbench archive.
- [ ] Import JSON restores the workbench from a valid archive.
- [ ] Copy Share Link generates and copies a URL for the current workbench.
- [ ] Opening a share URL restores the matching workbench state.
- [ ] After adding to the home screen, the app opens in a standalone app window.
- [ ] After one online launch, a later offline visit shows the app shell or offline fallback.

## Layout And Rotation Checks

- [ ] On first launch or after recentering in phone portrait, parts use a vertical layout and wires do not visibly cut through component bodies.
- [ ] Phone landscape and iPad landscape recenter the workbench with useful empty drag space.
- [ ] Selecting a part exposes angle controls in the status panel.
- [ ] Angle buttons, number input, and slider rotate the selected part without jumping its position.
- [ ] Rotated terminal visual positions match their tap/connection hit areas.
- [ ] Rotated parts remain aligned in wiring, circuit evaluation, and PNG export.

## PWA, Update, And Sharing Checks

- [ ] The production deployment is installable as a PWA, with the correct manifest icons and app name.
- [ ] The installed PWA shows a working Check Update button.
- [ ] When there is no new version, the update check gives short "latest version" feedback.
- [ ] After a new deployment, the browser and installed PWA show a refresh prompt, or manual update check triggers the update.
- [ ] Offline access shows the cached app shell or offline fallback for users who have loaded the app online once.
- [ ] Share links restore the workspace in signed-out browsers, mobile browsers, and the installed PWA.

## Cloud Records Checks

- [ ] Without Supabase build env vars, the cloud area shows a not-configured state and the local workbench remains fully usable.
- [ ] With Supabase configured, users can sign up, sign in, and sign out.
- [ ] Signed-in users can save the current workspace to cloud records.
- [ ] Users can load, rename, and delete cloud records.
- [ ] When local edits conflict with a cloud record, users can overwrite cloud or save as a copy.
- [ ] A shared workspace can be copied into the signed-in user's cloud records.

## Lesson Checks

- [ ] Lesson 1: Light the bulb can complete all steps.
- [ ] Lesson 2: Open the circuit can complete all steps.
- [ ] Lesson 3: Brighten the bulb can complete all steps.
- [ ] Lesson 4: Series bulbs detects two bulbs, the series route, both bulbs lit, and dim series brightness.
- [ ] Lesson 5: Parallel bulbs detects two bulbs, the parallel branches, both bulbs lit, and visible parallel brightness.
- [ ] Lesson 6: Light the LED detects correct polarity, light output, and current limiting.

## Known Limits

- The circuit model is still an educational approximation, not a SPICE-level simulator.
- Series and parallel brightness comparison checks are not yet physically detailed.
- Cloud records depend on Supabase environment variables at production build time; without them, local workflows stay available but sign-in is not exposed.
- Real kit SKU mapping and printable physical assembly sheets are not required for the public beta.

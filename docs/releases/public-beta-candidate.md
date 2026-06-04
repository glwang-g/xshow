# Public Beta Candidate Release Notes Draft

Status: **draft; wait for real-device QA plus deployed PWA/cloud verification before choosing the version number and tag**.

The `xshow circuits` public beta candidate is for teachers, students, parents, and electronics beginners who want to demonstrate simple circuits quickly. It is not a replacement for a professional simulator. The goal is a lightweight, visual electronic-brick workbench: drag parts, connect wires, toggle a switch, adjust resistance, and immediately see feedback from bulbs, LEDs, motors, meters, and animated wires.

## Ready For Public Testing

- Circuit workbench usable on desktop and mobile.
- Bottom HUD, mobile default recenter layout, and full-screen canvas feel for phone/PWA layouts.
- Battery, switch, bulb, variable resistor, LED, diode, capacitor, buzzer, motor, ammeter, and voltmeter parts.
- Free dragging and arbitrary part rotation, with rotated wire endpoints and PNG export kept aligned.
- Six guided lessons: basic bulb, open circuit, brighter bulb, series, parallel, and LED polarity.
- First-pass educational simulation feedback driven by the node/branch model.
- Local autosave, JSON import/export, PNG export, and share links.
- PWA installation, offline relaunch, and update prompts/manual update checks.
- Optional Supabase cloud records: sign-in, save, load, rename, delete, and conflict handling.
- First-pass physical build plans, purchase keywords, wiring steps, and Markdown export.

## Must Verify Before Release

- Phone portrait, phone landscape, iPad landscape, and desktop browser regression tests.
- Production manifest, service worker, offline fallback, and update-check button.
- Share links restoring the workbench in fresh browsers, mobile browsers, and installed PWA windows.
- Supabase production sign-in and cloud-record flows; if cloud records are not opened for beta, the UI should clearly show the not-configured/beta state.
- README screenshots and the public demo entry point should match the current UI.

## Known Limits

- The circuit model is an educational approximation, not a SPICE-level simulator.
- Series/parallel brightness comparisons provide teaching feedback but are not full physical precision.
- Cloud records depend on Supabase environment variables at production build time; without them, the local workbench remains fully usable.
- Physical build bridge currently provides part types, purchase keywords, and wiring steps, but no real SKU mapping or printable assembly sheet yet.
- The workbench archive format may still be adjusted during public beta; share links and JSON archives should be treated as teaching/demo artifacts.

## Feedback

- Bugs: use the GitHub bug report template.
- Feature requests: use the GitHub feature request template.
- Include the device, browser, whether the app is installed as a PWA, reproduction steps, and a share link or JSON archive when possible.

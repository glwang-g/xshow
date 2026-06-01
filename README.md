# xshow circuits

[中文文档](README.zh-CN.md)

An interactive electronic brick circuit playground built with Vue 3, Vite, TypeScript, and Tailwind CSS.

**Live Demo:** https://labs.freexlib.com

`xshow circuits` is an early-stage educational prototype for building simple circuits with visual components such as batteries, switches, bulbs, buzzers, motors, wires, and variable resistors. It is designed for quick classroom-style demonstrations: connect parts, toggle the switch, change resistance, and watch the circuit respond immediately.

![xshow circuits screenshot](docs/screenshot.png)

![xshow circuits mobile screenshot](docs/mobile-screenshot.png)

## Features

- Drag electronic components around the workbench
- Drag from a terminal to another terminal to create a wire
- Drag an existing wire endpoint to reconnect it
- Hold Alt while dragging an existing endpoint to branch a new wire from that terminal
- Toggle a switch to open or close the circuit
- Reverse battery polarity and watch wire direction and LED state update
- Adjust a variable resistor with a slider
- Simulate bulb brightness from circuit state and resistance
- Simulate a buzzer that becomes active in a powered closed loop
- Simulate a motor that spins in a powered closed loop
- Simulate polarity-sensitive LEDs with reverse-connection and over-current feedback
- Animate current flow on energized wires
- Switch between guided lesson experiments with automatic step checks
- Include basic, open-circuit, brightness, series, parallel, and LED guided lessons
- Load a lesson starter workspace with one click
- Show contextual hints for the next unfinished lesson step
- Highlight the relevant workbench parts and terminals for the active lesson step
- Use a canvas-first mobile HUD with a component drawer and floating status panel
- Pan and zoom the workbench on touch devices with larger terminal and wire hit targets
- Add the app to the home screen as a PWA and cache core static assets for offline relaunch
- Automatically restore the last workspace in the same browser
- Save named local workspace records for intermediate experiment states
- Sign in with email/password and keep the cloud session in the browser
- Save, load, rename, and delete cloud workspace records across devices
- Import or export the current workbench as a JSON archive for cross-device migration
- Copy a shareable URL that restores the current workbench state
- Display circuit status, current, equivalent resistance, and brightness
- Use editor-style shortcuts for delete, cancel, nudge, duplicate, zoom, undo, and redo
- Export the current workbench as a PNG image
- Reset to a ready-made demo circuit

## Demo Scope

This project is currently a teaching-oriented interactive prototype, not a full SPICE-level circuit simulator.

The current model focuses on simple closed-loop behavior:

- A battery provides a fixed 9V source with reversible polarity
- A switch can break or complete the circuit
- A variable resistor changes equivalent resistance
- A bulb brightness value is derived from the simulated current path
- A buzzer becomes active when it is connected through the powered circuit
- A motor spins when it is connected through the powered circuit
- An LED only conducts when its polarity is connected in the forward direction

## Tech Stack

- Vue 3
- Vite
- TypeScript
- Tailwind CSS
- Pinia
- Vue Router
- lucide-vue icons
- shadcn-vue inspired local components
- Supabase client for the v0.3 cloud records slice

## Getting Started

```bash
pnpm install
pnpm dev
```

Then open the local Vite URL, usually:

```text
http://localhost:5173
```

Optional cloud sync configuration:

```bash
cp .env.example .env.local
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm preview
```

## How To Use

1. Drag a component body to move it around the workbench.
2. Drag from one terminal to another terminal to create a wire.
3. Drag an existing wire endpoint to reconnect it to another terminal.
4. Hold Alt while dragging an existing endpoint to create a new branch wire.
5. Click the switch to open or close the circuit.
6. Select the battery and reverse polarity to flip current direction.
7. Drag the variable resistor slider to change the bulb brightness.
8. On phones and tablets, use the bottom HUD to open the component drawer, status panel, image export, view recentering, and zoom controls.
9. Use **Export** to save the current workbench as a PNG image.
10. Use **Records** to save and reload named local workspace snapshots.
11. Use **Import JSON / Export JSON** to move the current workbench between devices.
12. Use **Copy Share Link** to send the current workbench state as a URL.
13. Use **Clear Wires** to remove connections.
14. Use **Reset** to restore the default demo circuit.

Keyboard shortcuts:

- `Delete` / `Backspace`: delete the selected component or wire
- `Esc`: cancel the current wire/drag state, or clear selection
- Arrow keys: nudge the selected component by 4px, or 16px with `Shift`
- `Cmd/Ctrl + Z`: undo, `Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y`: redo
- `Cmd/Ctrl + D`: duplicate the selected component
- `Enter` / `Space`: toggle a selected switch
- `+` / `-` / `0`: zoom in, zoom out, and reset the view

## Deployment

Pushes to `main` can automatically build and deploy the static app to a cloud server over SSH. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the current project direction.

Chinese version: [docs/ROADMAP.zh-CN.md](docs/ROADMAP.zh-CN.md).

Release backlog: [docs/release-backlog.md](docs/release-backlog.md).

Cloud records and cross-device sync planning: [docs/cloud-sync-plan.md](docs/cloud-sync-plan.md).

Architecture notes: [docs/architecture.md](docs/architecture.md).

Supabase table setup for cloud records: [docs/supabase-schema.sql](docs/supabase-schema.sql).

v0.2 release notes: [docs/releases/v0.2.0.md](docs/releases/v0.2.0.md). QA report: [docs/v0.2-qa-report.md](docs/v0.2-qa-report.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Documentation changes should keep English and Chinese versions in sync.

Near-term priorities:

- Current focus: v0.4 more components and better simulation rules
- Done for v0.1: current direction animation
- Done for v0.1: guided lesson mode first slice
- Done for v0.1: multiple guided lesson experiments
- Done for v0.2: polarity-sensitive LED component and guided lesson
- First slice for v0.4: buzzer and motor components with powered-state feedback
- Done for v0.1: one-click lesson starter workspaces
- Done for v0.1: contextual hints for incomplete lesson steps
- Done for v0.1: workbench highlights for active lesson steps
- Done for v0.1: direct wire manipulation without separate select/wire modes
- Done for v0.1: local autosave and named workspace records
- Done for v0.2: URL-based workspace sharing
- Released in v0.2: mobile HUD, touch pan/zoom, and larger hit targets
- Released in v0.2: series, parallel, and LED circuit examples
- Released in v0.2: export the current workbench as an image
- Released in v0.2: PWA installability, offline relaunch, update prompt, and JSON workspace archives
- v0.3 feature complete: Supabase-backed sign-in, cloud records, renaming, conflict handling, and sync states

## License

Apache-2.0

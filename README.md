# xshow circuits

[中文文档](README.zh-CN.md)

An interactive electronic brick circuit playground built with Vue 3, Vite, TypeScript, and Tailwind CSS.

`xshow circuits` is an early-stage educational prototype for building simple circuits with visual components such as batteries, switches, bulbs, wires, and variable resistors. It is designed for quick classroom-style demonstrations: connect parts, toggle the switch, change resistance, and watch the bulb respond immediately.

![xshow circuits screenshot](docs/screenshot.png)

## Features

- Drag electronic components around the workbench
- Drag from a terminal to another terminal to create a wire
- Drag an existing wire endpoint to reconnect it
- Hold Alt while dragging an existing endpoint to branch a new wire from that terminal
- Toggle a switch to open or close the circuit
- Adjust a variable resistor with a slider
- Simulate bulb brightness from circuit state and resistance
- Animate current flow on energized wires
- Switch between guided lesson experiments with automatic step checks
- Load a lesson starter workspace with one click
- Show contextual hints for the next unfinished lesson step
- Highlight the relevant workbench parts and terminals for the active lesson step
- Display circuit status, current, equivalent resistance, and brightness
- Reset to a ready-made demo circuit

## Demo Scope

This project is currently a teaching-oriented interactive prototype, not a full SPICE-level circuit simulator.

The current model focuses on simple closed-loop behavior:

- A battery provides a fixed 9V source
- A switch can break or complete the circuit
- A variable resistor changes equivalent resistance
- A bulb brightness value is derived from the simulated current path

## Tech Stack

- Vue 3
- Vite
- TypeScript
- Tailwind CSS
- Pinia
- Vue Router
- lucide-vue icons
- shadcn-vue inspired local components

## Getting Started

```bash
pnpm install
pnpm dev
```

Then open the local Vite URL, usually:

```text
http://localhost:5173
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
6. Drag the variable resistor slider to change the bulb brightness.
7. Use **Clear Wires** to remove connections.
8. Use **Reset** to restore the default demo circuit.

## Deployment

Pushes to `main` can automatically build and deploy the static app to a cloud server over SSH. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the current project direction.

Chinese version: [docs/ROADMAP.zh-CN.md](docs/ROADMAP.zh-CN.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Documentation changes should keep English and Chinese versions in sync.

Near-term priorities:

- Current focus: expand circuit examples and guided lesson guidance
- Done for v0.1: current direction animation
- Done for v0.1: guided lesson mode first slice
- Done for v0.1: multiple guided lesson experiments
- Done for v0.1: one-click lesson starter workspaces
- Done for v0.1: contextual hints for incomplete lesson steps
- Done for v0.1: workbench highlights for active lesson steps
- Done for v0.1: direct wire manipulation without separate select/wire modes
- Next major area: series and parallel circuit examples

## License

Apache-2.0

# Rust/WASM Computer Core Integration

This document describes how `modules/cpu-sim` can move from an independent Tauri prototype into the main Web/PWA application.

The goal is not to rewrite the Rust core in TypeScript. The goal is to keep Rust as the machine-model core and expose it to the Vue/TypeScript frontend through WASM.

## Background

Current state:

- Main app: Vue + Vite + TypeScript, Web/PWA-first.
- CPU simulator: `modules/cpu-sim`, Tauri + Rust + Vue.
- The CPU frontend calls Rust through Tauri `invoke()` from `@tauri-apps/api`.

Problem:

- Normal browsers do not have the Tauri runtime, so the current CPU frontend cannot be mounted directly as a main-app route.
- Rewriting the CPU core in TypeScript would be the fastest short-term route, but it would discard Rust's long-term value.

Recommended direction:

```text
cpu-sim Rust core -> wasm package -> main Vue app -> /computer-lab
```

## Target Architecture

```text
modules/cpu-sim/src-tauri/core
  assembler.rs
  cpu.rs
        |
        v
modules/cpu-sim/wasm or packages/computer-core
  wasm-bindgen facade
        |
        v
src/lib/computer-core.ts
  typed wrapper
        |
        v
src/views/ComputerLab.vue
  Vue UI
```

## Phased Plan

### Phase 1: Clarify The Rust Core Boundary

Goal: keep the Rust core independent from Tauri.

Existing foundation:

- `modules/cpu-sim/src-tauri/core/src/cpu.rs`
- `modules/cpu-sim/src-tauri/core/src/assembler.rs`

Confirm:

- The core crate can run `cargo test` by itself.
- `CpuState`, assembler output, and error structures are easy to wrap from a WASM facade.
- The Tauri command layer only forwards calls and does not own domain behavior.

### Phase 2: Add A WASM Facade

Goal: allow the Web main app to call the CPU core.

Current state:

- `modules/cpu-sim/wasm` now contains a wasm-bindgen facade scaffold.
- The facade reuses `cpu-sim-core`'s `assembler` and `Cpu`, then serializes snapshots into the camelCase fields the main app expects.
- `src/lib/computer-core.ts` now exposes `createWasmComputerCore()` for wrapping wasm-bindgen output.
- The current environment does not have `cargo`, so the Rust scaffold has not been compiled locally yet.

Candidate API:

```ts
type CpuSnapshot = {
  a: number;
  b: number;
  pc: number;
  flags: { z: boolean; n: boolean; c: boolean };
  flagsByte: number;
  memory: number[];
  log: string[];
  halted: boolean;
  currentInstruction: string;
};

loadProgram(source: string): CpuSnapshot;
step(): CpuSnapshot;
reset(): CpuSnapshot;
getState(): CpuSnapshot;
runUntilHalt(maxSteps: number): CpuSnapshot;
```

The first Rust facade can keep a single VM instance. Multi-machine support can come later if the product needs it.

### Phase 3: Integrate Computer Lab Into The Main App

Goal: expose the simulator as the mainline "machine layer" from the hub.

Outputs:

- `src/views/ComputerLab.vue`
- `/computer-lab` or `/cpu-sim` route
- Hub entry under the machine layer
- `src/lib/computer-core.ts` typed wrapper

`/computer-lab` now has an interactive Assembly Console:

- Assembly editor
- load / step / run / reset controls
- linked registers, FLAGS, PC, memory, and execution log panels
- the `ComputerCoreApi` contract in `src/lib/computer-core.ts`
- a fixed-sample `createPreviewComputerCore()` adapter

The preview adapter exists only to validate the main-app UI and state contract. It is not the real CPU interpreter. The first execution UI should replace `createPreviewComputerCore()` with the WASM bridge, not Tauri `invoke()` and not a TypeScript rewrite of the core.

### Phase 4: Test And Release Path

Goal: verify both the Rust core and Web bridge.

Coverage:

- Rust core unit tests
- WASM wrapper smoke test
- Main app typecheck/build
- Minimal browser validation for load/step/run/reset

## How To Keep Tauri

Do not delete `modules/cpu-sim` in the short term.

It can remain as:

- Rust core prototype
- Desktop experiment
- Future Tauri-shell reference

After the main-app WASM version stabilizes, decide whether to:

- Keep an independent desktop version
- Make the Tauri shell reuse the same Rust/WASM core
- Archive `modules/cpu-sim` as a historical prototype

## Non-Goals

- Do not put the CPU simulator directly into `src/lib/circuit.ts`.
- Do not make the browser main app depend on the Tauri runtime.
- Do not merge circuit simulation and the CPU VM into one large model yet.
- Do not chase a fully realistic CPU first; start with a teachable, observable, testable small machine.

## Immediate Next Steps

1. Install or confirm local Rust/Cargo setup and run `cargo test` under `modules/cpu-sim/src-tauri`.
2. Compile `modules/cpu-sim/wasm`, adding a `wasm-pack` build script if needed.
3. Wire `/computer-lab` to the minimal WASM load/step/reset/run loop, replacing the current preview adapter.
4. Add a WASM wrapper smoke test and minimal browser validation for the controls.

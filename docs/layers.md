# Mainline Layer Map

[中文版本](layers.zh-CN.md)

`xshow` should converge around one mainline:

```text
signal/circuit -> logic/memory -> machine -> algorithm/battle
```

The world engine contract should serve this path while still allowing experiments to exist in a clearly secondary area.

## Layer Ownership

| Layer | Current modules | Current UI | World Engine role |
| --- | --- | --- | --- |
| Signal/circuit | `src/lib/circuit.ts`, `src/lib/workbench-ui.ts`, lesson data, physical-build helpers | Workbench route and workbench components | Foundational signal propagation rule module. It evaluates a workspace into circuit state. |
| Logic/memory | `src/lib/logic-core.ts` | `src/views/LogicLab.vue` | Boolean and memory rule module. It bridges circuit signals into retained state. |
| Machine | `modules/cpu-sim/src-tauri/core`, `modules/cpu-sim/wasm`, `src/lib/computer-core.ts` | `src/views/ComputerLab.vue` | CPU rule module and typed core API. Rust remains authoritative; TypeScript wraps snapshots/actions. |
| Algorithm/battle | future algorithm modules, `src/lib/tank-lab.ts` as prototype | `src/views/TankLab.vue` | Programmable action loop, bot strategy, replay, and competition/mission prototype. |
| Experiment zone | Tank Lab today, 3D Rubik's Cube, standalone prototypes | Secondary routes | Keep visible but secondary unless they strengthen the mainline path. |

## Current Placement

### Signal/Circuit Layer

`src/lib/circuit.ts` owns the current signal model:

- `CircuitPart`, `Wire`, `TerminalRef` are the current entities.
- `evaluateCircuit()` is the rule entry point.
- Solved output `CircuitSimulation` is the current state projection.
- Workbench lessons and starter workspaces are scenario-like content.
- Workbench canvas/status rendering is the visualization layer.

This layer should remain framework-agnostic and testable. It should become a `CircuitWorld` adapter only after the shared interfaces have settled.

### Logic/Memory Layer

`src/lib/logic-core.ts` owns pure logic rules:

- `evaluateGate()` and `truthTable()` cover combinational logic.
- `srLatchStep()` covers one-step state retention.
- `buildSrLatchTrace()` and `buildRegisterTrace()` are trace/replay-like helpers.

`src/views/LogicLab.vue` currently owns interactive refs and UI controls. The first useful migration is to express latch/register button operations as actions, not to rewrite the page.

### Machine Layer

Machine behavior is split intentionally:

- Rust core in `modules/cpu-sim/src-tauri/core` owns CPU and assembler rules.
- `modules/cpu-sim/wasm` is the browser facade scaffold.
- `src/lib/computer-core.ts` owns the TypeScript API contract, snapshots, preview adapter, and view-model helpers.
- `src/views/ComputerLab.vue` owns the assembly editor and machine visualization.

The migration path remains Rust core -> WASM bridge -> Vue/TypeScript UI.

### Algorithm/Battle Layer

`src/lib/tank-lab.ts` is currently an experiment, but it is also the best working prototype for a programmable world:

- `TankLabBattle` is a world state.
- `TankAction` is an action.
- `TankStrategy` is a bot/program interface.
- `stepTankBattle()` is a tick rule.
- `events` and `tick` are replay foundations.

Keep it secondary in product navigation, but reuse its architecture lessons for future algorithm worlds.

## Minimal First Stage

- Keep all existing modules where they are.
- Add `src/lib/world-engine.ts` as a type-only contract.
- Use `docs/world-engine.md` for migration rules and `docs/layers.md` for ownership.
- Prefer adapters over rewrites.
- Let each layer keep its domain data shape until a shared runner needs a common envelope.


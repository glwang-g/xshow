# Decisions

## 2026-07-05: Adopt A Contract-First World Engine Direction

Status: Accepted

Source of truth:

- `docs/world-engine.zh-CN.md`
- `docs/world-engine.md`
- `docs/layers.zh-CN.md`
- `docs/layers.md`
- `src/lib/world-engine.ts`

### Decision

The project will gradually converge around a shared World Engine contract instead of letting each lab become an isolated demo.

The phase-one core abstractions are:

- `World`: a runnable rule world.
- `Entity`: an object inside the world.
- `Component`: an entity capability or property.
- `State`: the current world state.
- `Tick`: the smallest world-advance step.
- `Action`: an operation emitted by a user, entity, bot, scenario, or system.
- `Rule`: logic that advances state.
- `Scenario`: a lesson, level, experiment, or battle configuration.
- `Replay`: recorded frames for playback, debugging, and teaching.
- `Visualization`: a projection from state to UI/view model.

`Signal` remains important domain language, especially for the signal/circuit and logic/memory layers, but it is not a required top-level engine primitive in phase one. Represent it through `Component.value`, `WorldState.data`, `WorldAction.payload`, or `WorldEvent.payload` unless adapters prove a shared `Signal` type is needed.

### Reason

The project already has a layered mainline:

1. Signal/circuit
2. Logic/memory
3. Machine
4. Algorithm/battle

These layers share a common shape: stateful objects, actions, rules, ticks, scenarios, traces, and visualizations. A contract-first engine lets the project reuse those ideas without prematurely rewriting working labs.

### Implications

- Keep `src/lib/circuit.ts`, `src/lib/logic-core.ts`, `src/lib/computer-core.ts`, and `src/lib/tank-lab.ts` as current domain boundaries.
- Keep Rust CPU/assembler behavior authoritative for the machine layer; do not rewrite the CPU core in TypeScript just to fit the engine.
- Treat `evaluateCircuit()`, `srLatchStep()`, Rust CPU fetch/decode/execute, and `stepTankBattle()` as Rule Module seeds.
- Add thin adapters later: `CircuitWorld`, `LogicWorld`, `ComputerWorld`, and `TankBattleWorld`.
- Do not extract a shared run/pause/step/reset controller until at least two adapters actually use `World.tick()`.
- Keep formal decisions and migration maps in `docs/`; keep `.codex` files short and agent-oriented.

### First-Phase Boundary

Allowed:

- Type-only engine contract.
- Migration and layer docs.
- Short `.codex` memory, decisions, and open questions.
- Small unused or tested adapter stubs later.

Avoid:

- Large UI rewrites.
- Moving all lesson/scenario data at once.
- Replacing the Rust machine core.
- Building a complete WASM sandbox immediately.
- Forcing all existing domain objects into normalized ECS-style components.

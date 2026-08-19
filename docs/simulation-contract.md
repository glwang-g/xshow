# Simulation Contract Migration Assessment

[中文版本](simulation-contract.zh-CN.md)

This document records the first migration assessment for gradually converging `xshow` from several independent labs into a shared simulation contract. `World` remains a possible future product concept for richer interactive scenarios, not the current runtime name.

The goal is not a rewrite. The first step is a shared simulation contract: `Simulation`, `Entity`, `Component`, `State`, `Tick`, `Action`, `Rule`, `Scenario`, `Replay`, and `Visualization`.

## Existing Abstraction Map

| Simulation abstraction | Current matches | Notes |
| --- | --- | --- |
| `Simulation` | `TankLabBattle`, `ComputerCoreApi`, circuit workbench state, Logic Lab preview state | Tank Lab is the closest complete interactive simulation. Computer Lab already has a core API boundary. Circuit and Logic are currently rule/evaluation modules. |
| `Entity` | `CircuitPart`, `Wire`, `TankState`, `BulletState`, CPU registers/memory cells as implied entities | Circuit parts and tank objects already have stable ids. CPU entities are currently represented inside `CpuSnapshot`, not as entity records. |
| `Component` | circuit part attributes such as `type`, `x`, `y`, `closed`, `resistance`; tank position/energy/hp/gun state; CPU flags/register/memory fields | Components are still embedded in domain-specific state objects. Do not normalize them yet. |
| `State` | `CircuitSimulation`, `TankLabBattle`, `CpuSnapshot`, latch/register refs in `LogicLab.vue` | Each lab has a state shape, but no shared envelope with tick/status/events. |
| `Tick` | `stepTankBattle()`, `ComputerCoreApi.step()`, `runUntilHalt()`, `buildSrLatchTrace()`, `buildRegisterTrace()` | Tank and CPU have explicit step semantics. Circuit currently recomputes a static solved state from workspace input. |
| `Action` | `TankAction`, Computer Lab load/step/run/reset commands, Logic Lab latch/register button operations, workbench interactions | Tank actions are already domain actions. Other actions are UI handlers today. |
| `Rule` | `evaluateCircuit()`, `srLatchStep()`, `buildRegisterTrace()`, CPU fetch/decode/execute in Rust, `stepTankBattle()` | These are the main candidates to keep as rule modules. |
| `Scenario` | circuit lessons and starter workspaces, sample assembly program, tank strategy/opponent presets, default logic traces | Scenario data exists but is scattered across data files and Vue views. |
| `Replay` | CPU execution log, tank `events` plus tick history opportunity, logic trace arrays, workspace records | Replay is present as partial traces, not yet a shared data structure. |
| `Visualization` | workbench canvas/components, `memoryRows()`, `registerRows()`, `flagChips()`, `drawBattle()`, Logic Lab truth/trace tables | Visualization mapping is often mixed with view components. The migration should extract view-model projection before extracting rendering. |

## Rule Modules To Keep

- `src/lib/circuit.ts`: keep topology building, node merging, branch resistance, network solving, LED/diode iteration, meter and actuator state derivation as the signal/circuit rule module.
- `src/lib/logic-core.ts`: keep `evaluateGate()`, `truthTable()`, `srLatchStep()`, `buildSrLatchTrace()`, and `buildRegisterTrace()` as logic/memory rules.
- `src/lib/computer-core.ts`: keep `ComputerCoreApi`, `CpuSnapshot`, `createWasmComputerCore()`, and view-model helpers. Treat `createPreviewComputerCore()` as a temporary scenario/replay adapter, not the real machine rule.
- `modules/cpu-sim/src-tauri/core`: keep Rust `cpu.rs` and `assembler.rs` as the authoritative machine-layer rule module.
- `src/lib/tank-lab.ts`: keep `createInitialTankBattle()`, `stepTankBattle()`, `TankAction`, `TankStrategy`, context building, collision, bullet, and rival strategy rules as the algorithm/battle rule module.

## Duplicate Patterns

| Pattern | Current duplication | Migration direction |
| --- | --- | --- |
| Run/step/reset loop | `ComputerLab.vue` wraps core actions; `TankLab.vue` owns run/pause/step/reset and animation loop; Logic Lab has apply/reset functions | Introduce a shared simulation controller/composable only after at least two adapters use `Simulation.tick()`. |
| Scenario data | Tank presets live in `TankLab.vue`; CPU sample program lives in `computer-core.ts`; logic default traces live in `logic-core.ts`; circuit lessons live in lesson data | Move future scenario definitions toward typed `SimulationScenario` records. Do not move all existing content at once. |
| Replay/trace/event records | CPU `log`, tank `events`, logic trace arrays, workspace records | Add a common `SimulationReplay` type first. Later record frames from adapters. |
| Visualization projection | `memoryRows()`, `registerRows()`, `flagChips()`, `drawBattle()`, Logic Lab table mapping, circuit simulation status mapping | Extract projection helpers before touching component layout. Rendering can stay in Vue/canvas. |
| Action sanitization | `tank-lab.ts` sanitizes strategy output; `TankLab.vue` also lightly sanitizes compiled output | Keep domain sanitization in rule modules. UI should only compile/collect actions. |
| Status/tick messaging | `actionMessage`, `battleStatus`, `resultInsight`, circuit status panels, lesson hints | Eventually expose status/events from simulation state, but keep existing UI text for now. |

## Minimal Migration Route

1. **Contract only:** add `src/lib/simulation-contract.ts` with TypeScript interfaces and no runtime coupling.
2. **Document boundaries:** keep this document and `docs/layers.md` as the migration map.
3. **Adapter prototypes:** create thin adapters later, one at a time:
   - `CircuitSimulation`: input is parts/wires; rule calls `evaluateCircuit()`.
   - `LogicSimulation`: actions toggle inputs or pulse storage; rules call `evaluateGate()` and `srLatchStep()`.
   - `ComputerSimulation`: wraps `ComputerCoreApi`; first use preview, then WASM.
   - `TankBattleSimulation`: wraps `stepTankBattle()` and records replay frames.
4. **Shared controller only after adapters exist:** a `useSimulationRunner()` composable can then own run/pause/step/reset/replay capture.
5. **Scenario registry:** move new lessons, battles, sample programs, and algorithm demos into typed scenario records. Migrate existing data gradually.
6. **Replay capture:** record `{ tick, actions, state, events }` for Tank and Computer first because they already have step semantics.
7. **Visualization adapters:** project state into existing Vue/canvas view models before any UI rewrite.

## First-Phase Code Changes Allowed

- Add type-only `src/lib/simulation-contract.ts`.
- Add docs for the engine model and layer map.
- Update `.codex/memory.md`, `.codex/decisions.md`, and the context indexes.
- Optionally add small adapter stubs later, but only if they are unused or covered by tests.

Do not in phase one:

- rewrite existing labs,
- delete experimental routes,
- replace the Rust CPU core,
- build a full WASM sandbox,
- move lesson content or UI layouts in bulk,
- force every domain object into ECS-style normalized components.

## Suggested New Type Definitions

The first type pass now lives in `src/lib/simulation-contract.ts`:

- `SimulationLayer`
- `SimulationEntity`
- `SimulationComponent`
- `SimulationState`
- `SimulationAction`
- `SimulationRule`
- `SimulationScenario`
- `SimulationReplay`
- `SimulationVisualization`
- `SimulationRuleModule`

These types are intentionally broad. They should guide adapters without forcing immediate changes to the existing domain models.

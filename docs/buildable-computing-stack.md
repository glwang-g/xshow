# Buildable Computing Stack

## Decision

The `xshow` mainline is not a set of parallel circuit, logic, CPU, and algorithm tools. A learner's construction at one layer must become a reusable input to the next:

```text
Signal and circuit → component workshop → logic and memory → machine → algorithm
```

Circuit repair remains an introductory, diagnostic, and teaching activity in the signal/circuit layer. It is no longer the center of mainline expansion.

## Layer outputs

| Layer | Learner builds | Published output | Used by next layer |
| --- | --- | --- | --- |
| Signal and circuit | Circuits, measurement, continuity, and fault diagnosis | Observable circuit behavior and basic connections | Component workshop |
| Component workshop | Coils, spring contacts, relays, NOT / AND / OR | Ported circuit module | Logic gates and latches |
| Logic and memory | Gates, latches, registers, adders | Stateful logic module | ALUs, RAM, controllers |
| Machine | Buses, ALUs, register files, controllers | Executable hardware configuration | Instructions and programs |
| Algorithm | Instruction sequences, data, algorithm steps | Replayable execution | Observe changes to machine state |

Every published module must be expandable back into its lower-layer structure; upper layers must not become unexplained black boxes.

## Module contract

The first version of a module needs durable storage for:

- `name`: module name and description.
- `ports`: input, output, and optional clock or power terminals.
- `implementation`: a snapshot of the lower-layer workbench or logic graph.
- `kind`: combinational or sequential.
- `evaluate`: input-to-output behavior, or input plus current state to next state behavior.
- `publishedFrom`: the source construction and version, so it can be expanded, copied, and evolved.

At publication time, learners explicitly mark ports and observable outputs. Circuit simulation should then verify that the construction stably expresses its intended logic; never infer behavior from a static screenshot alone.

## Simulation requirements

Relays, latches, registers, and clocks cannot depend on one static solve. Circuit rules need to grow toward:

1. Steady-state combinational evaluation for wires, contacts, coils, and outputs.
2. A `tick` to retain and advance stateful components.
3. Convergence and diagnostics for oscillation, floating ports, shorts, or unstable feedback.
4. Hierarchical evaluation: upper layers call published module interfaces rather than copying their internals, while learners can always expand them.

## Near-term order

1. Complete the hand-built relay foundation: coils, normally-open and normally-closed spring contacts, mechanical links, latching, and interlocking examples.
2. Create the circuit-module publication workflow: port marking, naming, saving, importing, and expanding.
3. Let Logic Lab import published circuit modules, starting with NOT, AND, OR, and an SR latch.
4. Publish and compose logic modules into half adders, full adders, registers, and an 8-bit ALU.
5. Assemble an 8-bit machine from those composable modules, then grow word width and the instruction set.
6. Let the algorithm unit expose how a program affects that machine's registers, memory, buses, and clock state.

First deliver an explainable, expandable 8-bit loop. 16/32/64-bit machines are extensions of the same module contract, not work to start before that loop works.

## Current first step

The workbench now includes a coil and normally-open/normally-closed spring contacts. A contact can bind to a coil through a mechanical link and switches according to its NO/NC rule once coil current reaches the pull-in threshold. An assembled relay can now be published locally as `RelaySwitch`: publishing is available only after every structural and observable step of the active Component Workshop lesson has passed and the current complete circuit passes every input combination in its truth-table verification; the record retains the lesson source and verification rows. It extracts the relay itself from the lesson verification circuit, saving only the coil and contact, their four terminals, and their mechanical link. The battery, switches, bulb, and verification wires do not become part of the module. Logic Lab reads the module and shows the contact output from a live coil input; its core can be reopened directly in the Component Workshop for editing.

## Signal/Circuit Unit and Component Workshop

These two independent learning units do not split into two editors. They share one workbench, component model, and simulation state:

- **Signal and Circuit** starts with circuit-phenomenon scenarios such as continuity, series/parallel paths, diode polarity, and measurement, then allows free changes to parts, wiring, and parameters.
- **Component Workshop** starts with construction tasks such as a relay, NOT, AND, and OR. Learners verify ports and behavior, then publish the work as a module consumable by the logic and memory unit.

Repair tasks remain separate diagnostic practice. This makes both “try a circuit” and “build a component” explicit without forcing learners to move work between incompatible models.

## First Course Loop

The first mainline lessons start in the circuit workbench and explicitly name the module and ports that the next layer can consume:

```text
Relay → NOT → AND / OR → XOR → half adder
```

The first implementation adds lesson entries for Relay, NOT, AND, and OR, plus normally-open/normally-closed contacts. The Logic Lab now composes published, truth-table-verified AND, OR, and NOT modules into a half adder: `SUM = (A OR B) AND NOT(A AND B)` and `CARRY = A AND B`; every participating module remains expandable back in the workshop. XOR and the half adder as independently publishable composition modules/netlists remain the next increment.

The machine layer now reads published, truth-table-verified AND, OR, and NOT modules into an inspectable “machine logic foundation” manifest. It identifies their carry/control-path roles and links back to the logic layer so their origins remain expandable. Actual instruction execution still belongs to the core adapter; turning this manifest into a composable ALU netlist is the next step, rather than mislabeling preview execution as gate-level execution.

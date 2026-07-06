# Product North Star

`xshow` is an interactive computer science visualization platform that connects signals, circuits, machines, and algorithms.

This sentence is the project's direction anchor. It is not marketing copy; it is a way to make product, architecture, and prioritization decisions.

## Origin

The original instinct behind the project is to make the hidden layers of computer science observable, interactive, and traceable again.

The path can begin with a tiny signal:

1. A light, a switch, and a wire
2. Circuit continuity, direction, measurement, and faults
3. Logic gates, latches, registers, and memory
4. ALUs, FLAGS, PC, memory, and instruction cycles
5. Assembly programs changing machine state step by step
6. Algorithms and data structures landing in memory, registers, and execution traces

The project may be inspired by classics such as *Code* and *The Art of Computer Programming*, but `xshow` should create original interactive demonstrations, exercises, and visualizations. It should not reproduce copyrighted text, page structure, or solutions.

## Main Layers

### 1. Signal And Circuit Layer

Goal: help users understand how state propagates through connections.

Existing foundation:

- Circuit workbench
- Component dragging, wiring, switching, and measuring
- Current-flow animation
- Repair tasks and fault diagnosis

This layer is the foundation of the whole project. `src/lib/circuit.ts` is not just a circuit toy; it is the first verifiable model in the "from signal upward" path.

### 2. Logic And Memory Layer

Goal: turn circuit signals into Boolean logic and remembered state.

Existing foundation:

- `/logic-lab`
- AND / OR / XOR / NOT truth tables
- SR latch state-retention preview
- 1-bit register rising-edge capture preview

Candidate capabilities:

- Flip-flops
- Clocks, edges, and registers
- Small RAM or memory-cell demonstrations

This layer explains why circuits can express logic and why machines can retain state.

### 3. Machine Layer

Goal: let users see how a small computer runs.

Existing foundation:

- `modules/cpu-sim`
- 8-bit CPU
- A/B/PC/FLAGS
- 256 bytes of memory
- Assembler, execution log, register panel, and memory panel

This layer is now a main-app preview, not just another experiment. Long term, it fits best as a Rust/WASM core with a Vue/TypeScript frontend so the machine model stays stable, testable, and embeddable in the Web/PWA product.

### 4. Algorithm Layer

Goal: make algorithms more than code snippets or animations by letting users drill into machine behavior.

Candidate capabilities:

- Stacks, queues, linked lists, trees, and hash tables
- Sorting, searching, recursion, backtracking, and graph algorithms
- Synchronized views of array changes, memory reads/writes, register updates, and instruction execution

The ideal experience is not just "watch an algorithm animation"; it is being able to trace an algorithm down through program, machine, and signal.

## Current Content Map

| Content | Role | Notes |
| --- | --- | --- |
| Circuit workbench | Mainline: signal and circuit layer | Foundation |
| Repair tasks | Mainline: signal diagnosis training | Teaches signal paths and faults |
| Logic Lab | Mainline: logic and memory layer | Bridges circuit signals and machine state |
| CPU simulator | Mainline: machine layer | Main-app preview exists; next, wire Rust/WASM |
| Algorithm visualization | Mainline: algorithm layer | Future expansion |
| Tank Lab | Experiment zone | Keep visible, but secondary |
| 3D Rubik's Cube | Experiment zone | Keep visible, but secondary |

## Technical Direction

The main app should stay Web/PWA-first in the near term because that keeps first open, mobile access, and static deployment simple.

But the machine layer and future algorithm execution engines should not casually discard Rust's value. The stronger long-term direction is:

```text
Rust core -> WASM bridge -> Vue/TypeScript UI
```

This preserves:

- Rust's determinism, performance, and testing advantages
- Web/PWA accessibility
- A future Tauri desktop shell if the product needs one

## Prioritization Rules

- Work that strengthens the "signal -> circuit -> machine -> algorithm" path comes first.
- Experiments may remain, but they should be clearly labeled and should not blur the main entry points.
- New features should answer: which layer do they make clearer?
- Make the main path understandable, usable, and testable before expanding too widely.
- Durable direction changes should be written down so the project does not repeatedly rediscover its origin.

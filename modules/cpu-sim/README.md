# 8-bit Computer Teaching Simulator

A minimal desktop application that visualises the execution of an 8-bit teaching
CPU. Built with **Rust + Tauri v2** for the virtual machine kernel and
**Vue 3 + Vite + TypeScript + Tailwind** for the UI.

This module lives inside the `xshow` repository as an *independent* sub-project:
it has its own `package.json`, its own Rust workspace under `src-tauri/`, and
does not depend on the outer Vue application in any way — but it uses the
same tech stack (Vue 3 + Vite + Tailwind) so the two can be merged later if
the simulator becomes a chapter of the main site.

## First-run

```bash
# 1. Install JS deps (uses pnpm; npm/yarn also work)
cd modules/cpu-sim
pnpm install

# 2. Install the Tauri CLI once (globally or per project)
cargo install tauri-cli --version "^2.0" --locked
# or:  pnpm add -D @tauri-apps/cli

# 3. Launch the dev environment (Vite + Tauri window)
pnpm tauri dev

# 4. Produce a release bundle
pnpm tauri build
```

## Instruction set (v1)

| Mnemonic         | Encoding (bytes) | Semantics                               |
| ---------------- | ---------------- | --------------------------------------- |
| `MOV Rd, #imm`   | `01 Rd imm`      | `Rd ← imm`                              |
| `MOV Rd, Rs`     | `02 Rd Rs`       | `Rd ← Rs`                               |
| `ADD Rd, Rs`     | `03 Rd Rs`       | `Rd ← Rd + Rs` (updates FLAGS)          |
| `SUB Rd, Rs`     | `04 Rd Rs`       | `Rd ← Rd - Rs` (updates FLAGS)          |
| `LOAD Rd, addr`  | `05 Rd addr`     | `Rd ← MEM[addr]`                        |
| `STORE Rs, addr` | `06 Rs addr`     | `MEM[addr] ← Rs`                        |
| `JMP addr`       | `07 addr`        | `PC ← addr`                             |
| `CMP Ra, Rb`     | `08 Ra Rb`       | Update FLAGS from `Ra - Rb`             |
| `JZ addr`        | `09 addr`        | `if FLAGS.Z: PC ← addr`                 |
| `HALT`           | `FF`             | Stop execution                          |

- Registers: `A` (id 0), `B` (id 1), `PC`, `FLAGS`.
- Memory: 256 bytes (`0x00..=0xFF`), single flat address space (Von Neumann).
- Literals: decimal (`42`) or hex (`0x2A`).
- Labels: `label:` on its own line, referenced by name in jumps.
- Comments: `;` to end-of-line.

## Sample program

```asm
; Sum 1..5 into A
        MOV  A, 0
        MOV  B, 1
loop:   ADD  A, B
        MOV  B, B         ; noop: B stays as counter
        CMP  A, B
        JZ   done
        JMP  loop         ; (trivial demo; real loop uses INC — see roadmap)
done:   HALT
```

A more useful demo lives in the "Sample" button of the UI.

## Tauri commands

The Rust side exposes:

- `load_program(source: String) -> CpuState`
- `step() -> CpuState`
- `reset() -> CpuState`
- `get_state() -> CpuState`
- `run_until_halt(max_steps: u32) -> CpuState`

`CpuState` is `{ a, b, pc, flags, memory: number[], log: string[], halted }`.

## Layout

- `src-tauri/src/cpu.rs`   — the virtual machine (fetch/decode/execute).
- `src-tauri/src/assembler.rs` — two-pass assembler (source → bytecode).
- `src-tauri/src/main.rs`  — Tauri commands + shared state.
- `src/composables/useCpu.ts` — singleton `ref` shared by every panel.
- `src/App.vue` and `src/components/*` — the panels.

## Running the pure-Rust core tests

```bash
cd modules/cpu-sim/src-tauri
cargo test
```

This exercises `cpu.rs` and `assembler.rs` without needing a Tauri toolchain.

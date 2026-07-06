 /**
  * Type definitions mirroring the Rust `CpuState` struct.
 * Keep in lockstep with `src-tauri/core/src/cpu.rs::CpuState`.
  */

export interface Flags {
  z: boolean;
  n: boolean;
  c: boolean;
}

export interface CpuState {
  a: number;
  b: number;
  pc: number;
  flags: Flags;
  /** FLAGS packed into a single byte — for the register table. */
  flags_byte: number;
  /** 256 bytes of memory. */
  memory: number[];
  /** Human-readable execution log, most recent last. */
  log: string[];
  halted: boolean;
  /** Disassembly of the instruction at `pc`, ready to be highlighted. */
  current_instruction: string;
}

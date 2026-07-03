//! 8-bit teaching CPU.
//!
//! Fetch–decode–execute cycle over a 256-byte flat memory. Instructions are
//! variable length (1 to 3 bytes) — every opcode advances `PC` by exactly its
//! own encoding length so a HALT byte fetched with no argument stops the CPU
//! *before* PC is bumped past the end of memory.
//!
//! The state is small enough to serialise wholesale on every step; the UI
//! renders whatever we hand it and never needs to poll.

use serde::Serialize;

pub const MEMORY_SIZE: usize = 256;
pub const REG_A: u8 = 0;
pub const REG_B: u8 = 1;

// --- Opcodes -----------------------------------------------------------------
//
// Kept as bare `u8` constants (rather than an enum) so the assembler can emit
// them directly into memory without a conversion step.

pub const OP_MOV_IMM: u8 = 0x01; // MOV Rd, #imm         (3 bytes)
pub const OP_MOV_REG: u8 = 0x02; // MOV Rd, Rs           (3 bytes)
pub const OP_ADD: u8 = 0x03; //     ADD Rd, Rs           (3 bytes)
pub const OP_SUB: u8 = 0x04; //     SUB Rd, Rs           (3 bytes)
pub const OP_LOAD: u8 = 0x05; //    LOAD Rd, addr        (3 bytes)
pub const OP_STORE: u8 = 0x06; //   STORE Rs, addr       (3 bytes)
pub const OP_JMP: u8 = 0x07; //     JMP addr             (2 bytes)
pub const OP_CMP: u8 = 0x08; //     CMP Ra, Rb           (3 bytes)
pub const OP_JZ: u8 = 0x09; //      JZ addr              (2 bytes)
pub const OP_HALT: u8 = 0xFF; //    HALT                 (1 byte)

/// FLAGS bit layout — mirror of a real 8-bit ISA, minimal subset.
#[derive(Debug, Clone, Copy, Default, Serialize, PartialEq, Eq)]
pub struct Flags {
    /// Zero flag — result of the last ALU op was zero.
    pub z: bool,
    /// Negative flag — high bit of the last ALU result was set.
    pub n: bool,
    /// Carry flag — last ADD overflowed 8 bits, or last SUB borrowed.
    pub c: bool,
}

impl Flags {
    fn bits(self) -> u8 {
        (self.z as u8) | ((self.n as u8) << 1) | ((self.c as u8) << 2)
    }
}

/// Snapshot of the machine. Everything the UI ever needs to draw one frame.
#[derive(Debug, Clone, Serialize)]
pub struct CpuState {
    pub a: u8,
    pub b: u8,
    pub pc: u8,
    pub flags: Flags,
    /// FLAGS packed into a single byte for compact display in the register panel.
    pub flags_byte: u8,
    /// Whole memory image (0..=255) as a plain array so the UI can index it.
    pub memory: Vec<u8>,
    /// Human-readable execution trace. Bounded by [`Cpu::LOG_CAP`].
    pub log: Vec<String>,
    /// True once a HALT was executed or a fatal fault occurred.
    pub halted: bool,
    /// Disassembly of the instruction *about to be executed* at `pc`.
    /// Empty string when the CPU is halted.
    pub current_instruction: String,
}

/// The virtual machine itself.
pub struct Cpu {
    pub a: u8,
    pub b: u8,
    pub pc: u8,
    pub flags: Flags,
    pub memory: [u8; MEMORY_SIZE],
    pub log: Vec<String>,
    pub halted: bool,
}

impl Default for Cpu {
    fn default() -> Self {
        Self::new()
    }
}

impl Cpu {
    /// Cap the log so a long `run_until_halt` doesn't allocate forever.
    const LOG_CAP: usize = 500;

    pub fn new() -> Self {
        Self {
            a: 0,
            b: 0,
            pc: 0,
            flags: Flags::default(),
            memory: [0; MEMORY_SIZE],
            log: Vec::new(),
            halted: false,
        }
    }

    /// Load a fresh program image starting at address 0 and reset all
    /// runtime state. Any bytes beyond `program.len()` are zero-filled.
    pub fn load(&mut self, program: &[u8]) {
        self.reset();
        let n = program.len().min(MEMORY_SIZE);
        self.memory[..n].copy_from_slice(&program[..n]);
        self.log.push(format!("Loaded {n}-byte program at 0x00"));
    }

    /// Zero all state (registers, flags, log, halt latch). Memory is cleared
    /// too — a "reset" of a real teaching board wipes everything.
    pub fn reset(&mut self) {
        self.a = 0;
        self.b = 0;
        self.pc = 0;
        self.flags = Flags::default();
        self.memory = [0; MEMORY_SIZE];
        self.log.clear();
        self.halted = false;
    }

    /// Execute a single instruction. No-op if halted.
    pub fn step(&mut self) {
        if self.halted {
            return;
        }
        let pc = self.pc;
        let opcode = self.memory[pc as usize];
        // We fetch operands lazily; each arm asks for what it needs.
        match opcode {
            OP_MOV_IMM => {
                let rd = self.fetch(pc, 1);
                let imm = self.fetch(pc, 2);
                self.write_reg(rd, imm);
                self.log_line(pc, format!("MOV {}, #{}", reg_name(rd), imm));
                self.pc = pc.wrapping_add(3);
            }
            OP_MOV_REG => {
                let rd = self.fetch(pc, 1);
                let rs = self.fetch(pc, 2);
                let v = self.read_reg(rs);
                self.write_reg(rd, v);
                self.log_line(pc, format!("MOV {}, {}", reg_name(rd), reg_name(rs)));
                self.pc = pc.wrapping_add(3);
            }
            OP_ADD => {
                let rd = self.fetch(pc, 1);
                let rs = self.fetch(pc, 2);
                let (res, carry) = self.read_reg(rd).overflowing_add(self.read_reg(rs));
                self.write_reg(rd, res);
                self.set_alu_flags(res, carry);
                self.log_line(pc, format!("ADD {}, {}", reg_name(rd), reg_name(rs)));
                self.pc = pc.wrapping_add(3);
            }
            OP_SUB => {
                let rd = self.fetch(pc, 1);
                let rs = self.fetch(pc, 2);
                let (res, borrow) = self.read_reg(rd).overflowing_sub(self.read_reg(rs));
                self.write_reg(rd, res);
                self.set_alu_flags(res, borrow);
                self.log_line(pc, format!("SUB {}, {}", reg_name(rd), reg_name(rs)));
                self.pc = pc.wrapping_add(3);
            }
            OP_LOAD => {
                let rd = self.fetch(pc, 1);
                let addr = self.fetch(pc, 2);
                let v = self.memory[addr as usize];
                self.write_reg(rd, v);
                self.log_line(pc, format!("LOAD {}, 0x{:02X}", reg_name(rd), addr));
                self.pc = pc.wrapping_add(3);
            }
            OP_STORE => {
                let rs = self.fetch(pc, 1);
                let addr = self.fetch(pc, 2);
                self.memory[addr as usize] = self.read_reg(rs);
                self.log_line(pc, format!("STORE {}, 0x{:02X}", reg_name(rs), addr));
                self.pc = pc.wrapping_add(3);
            }
            OP_JMP => {
                let addr = self.fetch(pc, 1);
                self.log_line(pc, format!("JMP 0x{:02X}", addr));
                self.pc = addr;
            }
            OP_CMP => {
                let ra = self.fetch(pc, 1);
                let rb = self.fetch(pc, 2);
                let (res, borrow) = self.read_reg(ra).overflowing_sub(self.read_reg(rb));
                // CMP updates FLAGS but discards the result.
                self.set_alu_flags(res, borrow);
                self.log_line(pc, format!("CMP {}, {}", reg_name(ra), reg_name(rb)));
                self.pc = pc.wrapping_add(3);
            }
            OP_JZ => {
                let addr = self.fetch(pc, 1);
                if self.flags.z {
                    self.log_line(pc, format!("JZ 0x{:02X}  (taken)", addr));
                    self.pc = addr;
                } else {
                    self.log_line(pc, format!("JZ 0x{:02X}  (not taken)", addr));
                    self.pc = pc.wrapping_add(2);
                }
            }
            OP_HALT => {
                self.log_line(pc, "HALT".to_string());
                self.halted = true;
                // Do NOT advance PC: leaving it on the HALT is what the UI
                // uses to highlight the stop instruction.
            }
            other => {
                self.log_line(pc, format!("!! illegal opcode 0x{:02X} — halting", other));
                self.halted = true;
            }
        }
    }

    /// Run in a tight loop until HALT, an illegal instruction, or `max_steps`
    /// is reached. Returning early keeps the UI responsive on runaway code.
    pub fn run_until_halt(&mut self, max_steps: u32) {
        for _ in 0..max_steps {
            if self.halted {
                break;
            }
            self.step();
        }
        if !self.halted {
            self.log
                .push(format!("Stopped after {max_steps} steps (still running)"));
            self.trim_log();
        }
    }

    /// Best-effort disassembly of the instruction *about to be executed*.
    /// Reads at most 3 bytes starting at `pc`; wraps addresses at 256.
    pub fn disassemble_at(&self, pc: u8) -> String {
        if self.halted && self.memory[pc as usize] == OP_HALT {
            return "HALT".to_string();
        }
        let op = self.memory[pc as usize];
        let a1 = self.memory[pc.wrapping_add(1) as usize];
        let a2 = self.memory[pc.wrapping_add(2) as usize];
        match op {
            OP_MOV_IMM => format!("MOV {}, #{}", reg_name(a1), a2),
            OP_MOV_REG => format!("MOV {}, {}", reg_name(a1), reg_name(a2)),
            OP_ADD => format!("ADD {}, {}", reg_name(a1), reg_name(a2)),
            OP_SUB => format!("SUB {}, {}", reg_name(a1), reg_name(a2)),
            OP_LOAD => format!("LOAD {}, 0x{:02X}", reg_name(a1), a2),
            OP_STORE => format!("STORE {}, 0x{:02X}", reg_name(a1), a2),
            OP_JMP => format!("JMP 0x{:02X}", a1),
            OP_CMP => format!("CMP {}, {}", reg_name(a1), reg_name(a2)),
            OP_JZ => format!("JZ 0x{:02X}", a1),
            OP_HALT => "HALT".to_string(),
            other => format!(".byte 0x{:02X}", other),
        }
    }

    /// Serialisable snapshot — cheap; the UI reads this on every state change.
    pub fn snapshot(&self) -> CpuState {
        CpuState {
            a: self.a,
            b: self.b,
            pc: self.pc,
            flags: self.flags,
            flags_byte: self.flags.bits(),
            memory: self.memory.to_vec(),
            log: self.log.clone(),
            halted: self.halted,
            current_instruction: if self.halted && self.memory[self.pc as usize] != OP_HALT {
                String::new()
            } else {
                self.disassemble_at(self.pc)
            },
        }
    }

    // --- internals -----------------------------------------------------------

    /// Fetch the byte `offset` bytes after `pc`, wrapping on 256.
    fn fetch(&self, pc: u8, offset: u8) -> u8 {
        self.memory[pc.wrapping_add(offset) as usize]
    }

    fn read_reg(&self, id: u8) -> u8 {
        match id {
            REG_A => self.a,
            REG_B => self.b,
            _ => 0,
        }
    }

    fn write_reg(&mut self, id: u8, value: u8) {
        match id {
            REG_A => self.a = value,
            REG_B => self.b = value,
            _ => {}
        }
    }

    fn set_alu_flags(&mut self, result: u8, carry: bool) {
        self.flags.z = result == 0;
        self.flags.n = (result & 0x80) != 0;
        self.flags.c = carry;
    }

    fn log_line(&mut self, pc: u8, text: String) {
        self.log.push(format!("[{:>3}] 0x{:02X}: {}", self.log.len(), pc, text));
        self.trim_log();
    }

    fn trim_log(&mut self) {
        if self.log.len() > Self::LOG_CAP {
            let drop = self.log.len() - Self::LOG_CAP;
            self.log.drain(0..drop);
        }
    }
}

fn reg_name(id: u8) -> &'static str {
    match id {
        REG_A => "A",
        REG_B => "B",
        _ => "?",
    }
}

// ---- tests -----------------------------------------------------------------
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mov_imm_and_add_update_a() {
        let mut cpu = Cpu::new();
        // MOV A, #3 ; MOV B, #4 ; ADD A, B ; HALT
        cpu.load(&[
            OP_MOV_IMM, REG_A, 3,
            OP_MOV_IMM, REG_B, 4,
            OP_ADD, REG_A, REG_B,
            OP_HALT,
        ]);
        cpu.run_until_halt(100);
        assert!(cpu.halted);
        assert_eq!(cpu.a, 7);
        assert_eq!(cpu.b, 4);
        assert!(!cpu.flags.z);
    }

    #[test]
    fn sub_to_zero_sets_z_flag_and_jz_jumps() {
        let mut cpu = Cpu::new();
        // MOV A, #5 ; SUB A, A ; JZ 0x08 ; HALT (skipped) ; 0x08: HALT
        cpu.load(&[
            OP_MOV_IMM, REG_A, 5,
            OP_SUB, REG_A, REG_A,
            OP_JZ, 0x09,
            OP_HALT,
            OP_HALT, // 0x09
        ]);
        cpu.run_until_halt(100);
        assert!(cpu.halted);
        assert_eq!(cpu.pc, 0x09);
    }

    #[test]
    fn load_store_roundtrip() {
        let mut cpu = Cpu::new();
        // MOV A, #42 ; STORE A, 0x80 ; MOV A, #0 ; LOAD A, 0x80 ; HALT
        cpu.load(&[
            OP_MOV_IMM, REG_A, 42,
            OP_STORE, REG_A, 0x80,
            OP_MOV_IMM, REG_A, 0,
            OP_LOAD, REG_A, 0x80,
            OP_HALT,
        ]);
        cpu.run_until_halt(100);
        assert_eq!(cpu.a, 42);
        assert_eq!(cpu.memory[0x80], 42);
    }

    #[test]
    fn illegal_opcode_halts() {
        let mut cpu = Cpu::new();
        cpu.load(&[0xAA]);
        cpu.step();
        assert!(cpu.halted);
    }

    #[test]
    fn run_until_halt_respects_step_cap() {
        let mut cpu = Cpu::new();
        // JMP 0x00 — infinite loop
        cpu.load(&[OP_JMP, 0x00]);
        cpu.run_until_halt(10);
        assert!(!cpu.halted);
        // Log should mention the guard fired.
        assert!(cpu.log.iter().any(|l| l.contains("Stopped after")));
    }
}

export type CpuFlags = {
  c: boolean;
  n: boolean;
  z: boolean;
};

export type CpuSnapshot = {
  a: number;
  b: number;
  currentInstruction: string;
  flags: CpuFlags;
  flagsByte: number;
  halted: boolean;
  log: string[];
  memory: number[];
  pc: number;
};

export type ComputerCoreApi = {
  getState(): Promise<CpuSnapshot>;
  loadProgram(source: string): Promise<CpuSnapshot>;
  reset(): Promise<CpuSnapshot>;
  runUntilHalt(maxSteps: number): Promise<CpuSnapshot>;
  step(): Promise<CpuSnapshot>;
};

type MaybePromise<T> = T | Promise<T>;

export type ComputerCoreWasmModule = {
  getState(): MaybePromise<CpuSnapshot>;
  loadProgram(source: string): MaybePromise<CpuSnapshot>;
  reset(): MaybePromise<CpuSnapshot>;
  runUntilHalt(maxSteps: number): MaybePromise<CpuSnapshot>;
  step(): MaybePromise<CpuSnapshot>;
};

export type ComputerCoreBridgeStatus = {
  detail: string;
  mode: "preview" | "wasm";
  ready: boolean;
  title: string;
};

export type MachineStat = {
  label: string;
  value: string;
};

export type InstructionSummary = {
  mnemonic: string;
  note: string;
};

export type IntegrationStep = {
  detail: string;
  status: string;
  title: string;
};

export type RegisterRow = {
  label: string;
  value: number;
};

export type FlagChip = {
  label: string;
  set: boolean;
};

export type MemoryCell = {
  addr: number;
  byte: number;
};

export type MemoryRow = {
  base: number;
  cells: MemoryCell[];
};

export const machineStats: MachineStat[] = [
  { label: "寄存器", value: "A / B / PC / FLAGS" },
  { label: "内存", value: "256 B" },
  { label: "指令", value: "10 条" },
  { label: "核心", value: "Rust" },
];

export const instructionSetV1: InstructionSummary[] = [
  { mnemonic: "MOV", note: "立即数或寄存器移动" },
  { mnemonic: "ADD / SUB", note: "算术并更新 FLAGS" },
  { mnemonic: "LOAD / STORE", note: "寄存器与内存交换" },
  { mnemonic: "JMP / JZ", note: "改变 PC 执行位置" },
  { mnemonic: "CMP / HALT", note: "比较与停机" },
];

export const integrationSteps: IntegrationStep[] = [
  { title: "Rust core", status: "已起步", detail: "CPU 与 assembler 已在独立 core crate 中，不依赖 Tauri。" },
  { title: "WASM bridge", status: "下一步", detail: "为 load、step、reset、run 暴露浏览器可调用接口。" },
  { title: "Vue machine UI", status: "推进中", detail: "主站已提供汇编编辑、运行控制、寄存器、内存和日志面板。" },
];

export const computerCoreBridgeStatus: ComputerCoreBridgeStatus = {
  detail: "当前使用固定示例快照验证主站交互；真实执行仍等待 Rust core 的 WASM facade。",
  mode: "preview",
  ready: false,
  title: "WASM bridge pending",
};

export const sampleAssemblyProgram = ["MOV A, #1", "MOV B, #2", "ADD A, B", "STORE A, 0x40", "HALT"];

export const sampleAssemblySource = sampleAssemblyProgram.join("\n");

function previewMemory(storedResult = false): number[] {
  const memory = Array.from({ length: 256 }, () => 0);
  const program = [
    0x01, 0x00, 0x01,
    0x01, 0x01, 0x02,
    0x03, 0x00, 0x01,
    0x06, 0x00, 0x40,
    0xff,
  ];
  program.forEach((byte, index) => {
    memory[index] = byte;
  });
  if (storedResult) {
    memory[0x40] = 0x03;
  }
  return memory;
}

function emptyMemory(): number[] {
  return Array.from({ length: 256 }, () => 0);
}

function cloneSnapshot(snapshot: CpuSnapshot): CpuSnapshot {
  return {
    ...snapshot,
    flags: { ...snapshot.flags },
    log: [...snapshot.log],
    memory: [...snapshot.memory],
  };
}

function previewFrame(
  overrides: Pick<CpuSnapshot, "a" | "b" | "currentInstruction" | "halted" | "log" | "pc"> &
    Partial<Pick<CpuSnapshot, "flags" | "flagsByte" | "memory">>,
): CpuSnapshot {
  return {
    flags: { c: false, n: false, z: false },
    flagsByte: 0,
    memory: previewMemory(),
    ...overrides,
  };
}

const loadedLog = ["Loaded 13-byte program at 0x00"];

export const blankCpuSnapshot: CpuSnapshot = {
  a: 0,
  b: 0,
  currentInstruction: ".byte 0x00",
  flags: { c: false, n: false, z: false },
  flagsByte: 0,
  halted: false,
  log: [],
  memory: emptyMemory(),
  pc: 0,
};

export const unsupportedProgramSnapshot: CpuSnapshot = {
  ...blankCpuSnapshot,
  currentInstruction: "WASM bridge pending",
  halted: true,
  log: [
    "Preview adapter can only step through the bundled sample program.",
    "Custom assembly will run here after the Rust/WASM bridge is connected.",
  ],
};

export const previewCpuTimeline: CpuSnapshot[] = [
  previewFrame({
    a: 0,
    b: 0,
    currentInstruction: "MOV A, #1",
    halted: false,
    log: loadedLog,
    pc: 0x00,
  }),
  previewFrame({
    a: 1,
    b: 0,
    currentInstruction: "MOV B, #2",
    halted: false,
    log: [...loadedLog, "[  1] 0x00: MOV A, #1"],
    pc: 0x03,
  }),
  previewFrame({
    a: 1,
    b: 2,
    currentInstruction: "ADD A, B",
    halted: false,
    log: [...loadedLog, "[  1] 0x00: MOV A, #1", "[  2] 0x03: MOV B, #2"],
    pc: 0x06,
  }),
  previewFrame({
    a: 3,
    b: 2,
    currentInstruction: "STORE A, 0x40",
    halted: false,
    log: [...loadedLog, "[  1] 0x00: MOV A, #1", "[  2] 0x03: MOV B, #2", "[  3] 0x06: ADD A, B"],
    pc: 0x09,
  }),
  previewFrame({
    a: 3,
    b: 2,
    currentInstruction: "HALT",
    halted: false,
    log: [
      ...loadedLog,
      "[  1] 0x00: MOV A, #1",
      "[  2] 0x03: MOV B, #2",
      "[  3] 0x06: ADD A, B",
      "[  4] 0x09: STORE A, 0x40",
    ],
    memory: previewMemory(true),
    pc: 0x0c,
  }),
  previewFrame({
    a: 3,
    b: 2,
    currentInstruction: "HALT",
    halted: true,
    log: [
      ...loadedLog,
      "[  1] 0x00: MOV A, #1",
      "[  2] 0x03: MOV B, #2",
      "[  3] 0x06: ADD A, B",
      "[  4] 0x09: STORE A, 0x40",
      "[  5] 0x0C: HALT",
    ],
    memory: previewMemory(true),
    pc: 0x0c,
  }),
];

export const previewLoadedCpuSnapshot = previewCpuTimeline[0];
export const previewCpuSnapshot = previewCpuTimeline[previewCpuTimeline.length - 1];

export function formatHex(byte: number, pad = 2): string {
  return byte.toString(16).padStart(pad, "0").toUpperCase();
}

export function formatByte(byte: number): string {
  const bin = byte.toString(2).padStart(8, "0");
  return `0x${formatHex(byte)} · ${byte} · ${bin.slice(0, 4)}_${bin.slice(4)}`;
}

export function registerRows(snapshot: CpuSnapshot): RegisterRow[] {
  return [
    { label: "A", value: snapshot.a },
    { label: "B", value: snapshot.b },
    { label: "PC", value: snapshot.pc },
    { label: "FLAGS", value: snapshot.flagsByte },
  ];
}

export function flagChips(snapshot: CpuSnapshot): FlagChip[] {
  return [
    { label: "Z", set: snapshot.flags.z },
    { label: "N", set: snapshot.flags.n },
    { label: "C", set: snapshot.flags.c },
  ];
}

export function memoryRows(snapshot: CpuSnapshot): MemoryRow[] {
  const rows: MemoryRow[] = [];
  for (let base = 0; base < snapshot.memory.length; base += 16) {
    rows.push({
      base,
      cells: Array.from({ length: 16 }, (_, index) => ({
        addr: base + index,
        byte: snapshot.memory[base + index] ?? 0,
      })),
    });
  }
  return rows;
}

function normalizedSource(source: string): string {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .toUpperCase();
}

export function canPreviewSource(source: string): boolean {
  return normalizedSource(source) === normalizedSource(sampleAssemblySource);
}

export function createPreviewComputerCore(): ComputerCoreApi {
  let timelineIndex = 0;
  let programLoaded = true;
  let current = cloneSnapshot(previewLoadedCpuSnapshot);

  return {
    async getState() {
      return cloneSnapshot(current);
    },
    async loadProgram(source: string) {
      if (!canPreviewSource(source)) {
        programLoaded = false;
        current = cloneSnapshot(unsupportedProgramSnapshot);
        return cloneSnapshot(current);
      }

      programLoaded = true;
      timelineIndex = 0;
      current = cloneSnapshot(previewCpuTimeline[timelineIndex]);
      return cloneSnapshot(current);
    },
    async reset() {
      timelineIndex = 0;
      programLoaded = false;
      current = cloneSnapshot(blankCpuSnapshot);
      return cloneSnapshot(current);
    },
    async runUntilHalt() {
      if (!programLoaded) {
        return cloneSnapshot(current);
      }

      timelineIndex = previewCpuTimeline.length - 1;
      current = cloneSnapshot(previewCpuTimeline[timelineIndex]);
      return cloneSnapshot(current);
    },
    async step() {
      if (!programLoaded || current.halted) {
        return cloneSnapshot(current);
      }

      timelineIndex = Math.min(timelineIndex + 1, previewCpuTimeline.length - 1);
      current = cloneSnapshot(previewCpuTimeline[timelineIndex]);
      return cloneSnapshot(current);
    },
  };
}

async function snapshotFromWasm(result: MaybePromise<CpuSnapshot>): Promise<CpuSnapshot> {
  return cloneSnapshot(await result);
}

export function createWasmComputerCore(wasmModule: ComputerCoreWasmModule): ComputerCoreApi {
  return {
    getState() {
      return snapshotFromWasm(wasmModule.getState());
    },
    loadProgram(source: string) {
      return snapshotFromWasm(wasmModule.loadProgram(source));
    },
    reset() {
      return snapshotFromWasm(wasmModule.reset());
    },
    runUntilHalt(maxSteps: number) {
      return snapshotFromWasm(wasmModule.runUntilHalt(maxSteps));
    },
    step() {
      return snapshotFromWasm(wasmModule.step());
    },
  };
}

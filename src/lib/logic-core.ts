export type LogicBit = 0 | 1;

export type LogicGateKind = "AND" | "OR" | "XOR" | "NOT";

export type LogicGateSummary = {
  description: string;
  kind: LogicGateKind;
  symbol: string;
};

export type TruthTableRow = {
  a: LogicBit;
  b: LogicBit | null;
  out: LogicBit;
};

export type SrLatchInput = {
  reset: boolean;
  set: boolean;
};

export type SrLatchStep = SrLatchInput & {
  mode: "hold" | "invalid" | "reset" | "set";
  note: string;
  notQ: LogicBit;
  q: LogicBit;
};

export type RegisterSample = {
  clock: boolean;
  data: LogicBit;
  label: string;
};

export type RegisterTraceStep = RegisterSample & {
  captured: boolean;
  q: LogicBit;
};

export const logicGateSummaries: LogicGateSummary[] = [
  { kind: "AND", symbol: "&", description: "两个输入都为 1 时输出 1" },
  { kind: "OR", symbol: ">=1", description: "任一输入为 1 时输出 1" },
  { kind: "XOR", symbol: "=1", description: "两个输入不同时输出 1" },
  { kind: "NOT", symbol: "1", description: "反转单个输入" },
];

export const defaultLatchInputs: SrLatchInput[] = [
  { set: false, reset: false },
  { set: true, reset: false },
  { set: false, reset: false },
  { set: false, reset: true },
  { set: false, reset: false },
  { set: true, reset: true },
];

export const defaultRegisterSamples: RegisterSample[] = [
  { label: "t0", clock: false, data: 0 },
  { label: "t1", clock: true, data: 1 },
  { label: "t2", clock: false, data: 0 },
  { label: "t3", clock: true, data: 0 },
  { label: "t4", clock: false, data: 1 },
  { label: "t5", clock: true, data: 1 },
];

export function toBit(value: boolean): LogicBit {
  return value ? 1 : 0;
}

export function evaluateGate(kind: LogicGateKind, a: boolean, b = false): LogicBit {
  switch (kind) {
    case "AND":
      return toBit(a && b);
    case "OR":
      return toBit(a || b);
    case "XOR":
      return toBit(a !== b);
    case "NOT":
      return toBit(!a);
  }
}

export function truthTable(kind: LogicGateKind): TruthTableRow[] {
  if (kind === "NOT") {
    return [false, true].map((a) => ({
      a: toBit(a),
      b: null,
      out: evaluateGate(kind, a),
    }));
  }

  return [false, true].flatMap((a) =>
    [false, true].map((b) => ({
      a: toBit(a),
      b: toBit(b),
      out: evaluateGate(kind, a, b),
    })),
  );
}

export function srLatchStep(previousQ: LogicBit, input: SrLatchInput): SrLatchStep {
  if (input.set && input.reset) {
    return {
      ...input,
      mode: "invalid",
      note: "S/R 同时有效",
      notQ: 0,
      q: 0,
    };
  }

  if (input.set) {
    return {
      ...input,
      mode: "set",
      note: "写入 1",
      notQ: 0,
      q: 1,
    };
  }

  if (input.reset) {
    return {
      ...input,
      mode: "reset",
      note: "清除为 0",
      notQ: 1,
      q: 0,
    };
  }

  return {
    ...input,
    mode: "hold",
    note: "保持",
    notQ: previousQ === 1 ? 0 : 1,
    q: previousQ,
  };
}

export function buildSrLatchTrace(inputs = defaultLatchInputs, initialQ: LogicBit = 0): SrLatchStep[] {
  let q = initialQ;

  return inputs.map((input) => {
    const step = srLatchStep(q, input);
    if (step.mode !== "invalid") {
      q = step.q;
    }
    return step;
  });
}

export function buildRegisterTrace(samples = defaultRegisterSamples, initialQ: LogicBit = 0): RegisterTraceStep[] {
  let previousClock = false;
  let q = initialQ;

  return samples.map((sample) => {
    const captured = !previousClock && sample.clock;
    if (captured) {
      q = sample.data;
    }
    previousClock = sample.clock;

    return {
      ...sample,
      captured,
      q,
    };
  });
}

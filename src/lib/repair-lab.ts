import { batteryPositiveTerminal, type CircuitPart, type CircuitSimulation, type PartType, type Wire } from "@/lib/circuit";

export type RepairRange = {
  max?: number;
  min?: number;
};

export type RepairPartGoal = {
  closed?: boolean;
  polarity?: "normal" | "reversed";
  resistance?: RepairRange;
  type?: PartType;
};

export type RepairPartStateGoal = {
  brightnessPercent?: RepairRange;
  conducting?: boolean;
  forward?: boolean;
  overCurrent?: boolean;
  reversed?: boolean;
  speedPercent?: RepairRange;
  voltage?: RepairRange;
  volumePercent?: RepairRange;
};

export type RepairLevelGoal = {
  bulbs?: Record<string, { brightnessPercent?: RepairRange }>;
  buzzers?: Record<string, { volumePercent?: RepairRange }>;
  closed?: boolean;
  currentMilliAmps?: RepairRange;
  diodes?: Record<string, RepairPartStateGoal>;
  leds?: Record<string, RepairPartStateGoal>;
  motors?: Record<string, { speedPercent?: RepairRange }>;
  parts?: Record<string, RepairPartGoal>;
  voltmeters?: Record<string, { voltage?: RepairRange }>;
};

export type RepairLevel = {
  goal: RepairLevelGoal;
  id: string;
  repairPath: string[];
  failure: string;
  summary: string;
  tags: string[];
  title: string;
  workspace: {
    parts: CircuitPart[];
    wires: Wire[];
  };
};

export type RepairCheck = {
  detail: string;
  label: string;
  passed: boolean;
};

function part(
  id: string,
  type: CircuitPart["type"],
  x: number,
  y: number,
  overrides: Partial<CircuitPart> = {},
): CircuitPart {
  return {
    id,
    name: overrides.name ?? id,
    type,
    x,
    y,
    ...overrides,
  };
}

function terminal(partId: string, terminal: "a" | "b") {
  return { partId, terminal };
}

function wire(id: string, fromPartId: string, fromTerminal: "a" | "b", toPartId: string, toTerminal: "a" | "b"): Wire {
  return {
    id,
    from: terminal(fromPartId, fromTerminal),
    to: terminal(toPartId, toTerminal),
  };
}

function rangeText(range?: RepairRange) {
  if (!range) {
    return "未指定";
  }

  if (range.min !== undefined && range.max !== undefined) {
    return `${range.min} - ${range.max}`;
  }

  if (range.min !== undefined) {
    return `>= ${range.min}`;
  }

  if (range.max !== undefined) {
    return `<= ${range.max}`;
  }

  return "未指定";
}

function inRange(value: number, range?: RepairRange) {
  if (!range) {
    return true;
  }

  if (range.min !== undefined && value < range.min) {
    return false;
  }

  if (range.max !== undefined && value > range.max) {
    return false;
  }

  return true;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function findPart(level: RepairLevel, id: string) {
  return level.workspace.parts.find((candidate) => candidate.id === id);
}

function describeBoolean(value: boolean) {
  return value ? "是" : "否";
}

function describePartState(level: RepairLevel, partId: string, simulation: CircuitSimulation) {
  const part = findPart(level, partId);
  if (!part) {
    return "部件缺失";
  }

  if (part.type === "battery") {
    return batteryPositiveTerminal(part) === "b" ? "正向" : "反向";
  }

  if (part.type === "switch") {
    return part.closed ? "闭合" : "断开";
  }

  if (part.type === "resistor") {
    return `${Math.round(part.resistance ?? 0)} Ω`;
  }

  const bulb = simulation.bulbs[partId];
  if (bulb) {
    return `${bulb.brightnessPercent}%`;
  }

  const led = simulation.leds[partId];
  if (led) {
    return led.forward ? "正向" : led.reversed ? "反向" : "无偏置";
  }

  const diode = simulation.diodes[partId];
  if (diode) {
    return diode.forward ? "正向" : diode.reversed ? "反向" : "无偏置";
  }

  const buzzer = simulation.buzzers[partId];
  if (buzzer) {
    return `${buzzer.volumePercent}%`;
  }

  const motor = simulation.motors[partId];
  if (motor) {
    return `${motor.speedPercent}%`;
  }

  const voltmeter = simulation.voltmeters[partId];
  if (voltmeter) {
    return `${voltmeter.voltage} V`;
  }

  return "已加载";
}

function addPartCheck(checks: RepairCheck[], label: string, passed: boolean, detail: string) {
  checks.push({ detail, label, passed });
}

export function cloneRepairLevel(level: RepairLevel) {
  return clone(level);
}

export function repairLevelToJson(level: RepairLevel) {
  return `${JSON.stringify(level, null, 2)}\n`;
}

export function parseRepairLevelJson(json: string) {
  const parsed = JSON.parse(json) as RepairLevel;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("关卡 JSON 不是对象");
  }

  if (typeof parsed.id !== "string" || typeof parsed.title !== "string") {
    throw new Error("关卡缺少 id 或 title");
  }

  if (!parsed.workspace || !Array.isArray(parsed.workspace.parts) || !Array.isArray(parsed.workspace.wires)) {
    throw new Error("关卡 workspace 格式不正确");
  }

  return parsed;
}

export function evaluateRepairLevel(level: RepairLevel, simulation: CircuitSimulation) {
  const checks: RepairCheck[] = [];
  const goal = level.goal;

  if (goal.closed !== undefined) {
    addPartCheck(
      checks,
      "回路通断",
      simulation.closed === goal.closed,
      simulation.closed ? "回路已闭合" : "回路仍断开",
    );
  }

  if (goal.currentMilliAmps) {
    addPartCheck(
      checks,
      "总电流",
      inRange(simulation.currentMilliAmps, goal.currentMilliAmps),
      `${simulation.currentMilliAmps} mA，目标 ${rangeText(goal.currentMilliAmps)} mA`,
    );
  }

  for (const [partId, partGoal] of Object.entries(goal.parts ?? {})) {
    const currentPart = findPart(level, partId);
    if (!currentPart) {
      addPartCheck(checks, `部件 ${partId}`, false, "部件不存在");
      continue;
    }

    if (partGoal.type && currentPart.type !== partGoal.type) {
      addPartCheck(checks, `部件 ${partId}`, false, `类型应为 ${partGoal.type}`);
      continue;
    }

    if (partGoal.closed !== undefined && currentPart.type === "switch") {
      addPartCheck(
        checks,
        `开关 ${partId}`,
        currentPart.closed === partGoal.closed,
        `当前 ${describeBoolean(Boolean(currentPart.closed))}，目标 ${describeBoolean(partGoal.closed)}`,
      );
      continue;
    }

    if (partGoal.polarity && currentPart.type === "battery") {
      const currentPolarity = batteryPositiveTerminal(currentPart) === "b" ? "normal" : "reversed";
      addPartCheck(
        checks,
        `电池 ${partId}`,
        currentPolarity === partGoal.polarity,
        `当前 ${currentPolarity === "normal" ? "正向" : "反向"}，目标 ${partGoal.polarity === "normal" ? "正向" : "反向"}`,
      );
      continue;
    }

    if (partGoal.resistance && currentPart.type === "resistor") {
      const resistance = currentPart.resistance ?? 0;
      addPartCheck(
        checks,
        `电阻 ${partId}`,
        inRange(resistance, partGoal.resistance),
        `${Math.round(resistance)} Ω，目标 ${rangeText(partGoal.resistance)} Ω`,
      );
      continue;
    }

    addPartCheck(checks, `部件 ${partId}`, true, describePartState(level, partId, simulation));
  }

  for (const [partId, expected] of Object.entries(goal.bulbs ?? {})) {
    const actual = simulation.bulbs[partId];
    addPartCheck(
      checks,
      `灯泡 ${partId}`,
      Boolean(actual) && inRange(actual.brightnessPercent, expected.brightnessPercent),
      actual ? `${actual.brightnessPercent}% ，目标 ${rangeText(expected.brightnessPercent)}%` : "灯泡状态缺失",
    );
  }

  for (const [partId, expected] of Object.entries(goal.leds ?? {})) {
    const actual = simulation.leds[partId];
    if (!actual) {
      addPartCheck(checks, `LED ${partId}`, false, "LED 状态缺失");
      continue;
    }

    const passed =
      inRange(actual.brightnessPercent, expected.brightnessPercent) &&
      (expected.forward === undefined || actual.forward === expected.forward) &&
      (expected.reversed === undefined || actual.reversed === expected.reversed) &&
      (expected.overCurrent === undefined || actual.overCurrent === expected.overCurrent) &&
      (expected.conducting === undefined || actual.brightnessPercent > 0 === expected.conducting);

    addPartCheck(
      checks,
      `LED ${partId}`,
      passed,
      `${actual.brightnessPercent}% / 正向 ${describeBoolean(actual.forward)} / 反向 ${describeBoolean(actual.reversed)}`,
    );
  }

  for (const [partId, expected] of Object.entries(goal.diodes ?? {})) {
    const actual = simulation.diodes[partId];
    if (!actual) {
      addPartCheck(checks, `二极管 ${partId}`, false, "二极管状态缺失");
      continue;
    }

    const passed =
      (expected.forward === undefined || actual.forward === expected.forward) &&
      (expected.reversed === undefined || actual.reversed === expected.reversed) &&
      (expected.overCurrent === undefined || actual.overCurrent === expected.overCurrent) &&
      (expected.conducting === undefined || actual.conducting === expected.conducting);

    addPartCheck(
      checks,
      `二极管 ${partId}`,
      passed,
      `导通 ${describeBoolean(actual.conducting)} / 正向 ${describeBoolean(actual.forward)} / 反向 ${describeBoolean(actual.reversed)}`,
    );
  }

  for (const [partId, expected] of Object.entries(goal.buzzers ?? {})) {
    const actual = simulation.buzzers[partId];
    addPartCheck(
      checks,
      `蜂鸣器 ${partId}`,
      Boolean(actual) && inRange(actual.volumePercent, expected.volumePercent),
      actual ? `${actual.volumePercent}% ，目标 ${rangeText(expected.volumePercent)}%` : "蜂鸣器状态缺失",
    );
  }

  for (const [partId, expected] of Object.entries(goal.motors ?? {})) {
    const actual = simulation.motors[partId];
    addPartCheck(
      checks,
      `电机 ${partId}`,
      Boolean(actual) && inRange(actual.speedPercent, expected.speedPercent),
      actual ? `${actual.speedPercent}% ，目标 ${rangeText(expected.speedPercent)}%` : "电机状态缺失",
    );
  }

  for (const [partId, expected] of Object.entries(goal.voltmeters ?? {})) {
    const actual = simulation.voltmeters[partId];
    addPartCheck(
      checks,
      `电压表 ${partId}`,
      Boolean(actual) && inRange(actual.voltage, expected.voltage),
      actual ? `${actual.voltage} V，目标 ${rangeText(expected.voltage)} V` : "电压表状态缺失",
    );
  }

  return {
    checks,
    solved: checks.every((check) => check.passed),
  };
}

export function repairLevelSummary(level: RepairLevel, simulation: CircuitSimulation) {
  const evaluation = evaluateRepairLevel(level, simulation);
  const completed = evaluation.checks.filter((check) => check.passed).length;
  return {
    completed,
    evaluation,
    total: evaluation.checks.length,
  };
}

export const repairLevelPresets: RepairLevel[] = [
  {
    id: "lamp-outage",
    failure: "检修开关断开，限流电阻偏大，灯泡拿不到足够电流。",
    repairPath: ["先闭合检修开关。", "把限流电阻调回 35 - 70 Ω。", "确认灯泡稳定发亮且总电流留在安全区间。"],
    summary: "把灯泡从断电状态修回可用亮度，并把电流压在可控范围。",
    tags: ["入门", "灯泡"],
    title: "灯泡抢修",
    workspace: {
      parts: [
        part("battery-1", "battery", 80, 216, { name: "主电池" }),
        part("switch-1", "switch", 298, 224, { name: "检修开关", closed: false }),
        part("resistor-1", "resistor", 530, 214, { name: "限流电阻", resistance: 180 }),
        part("bulb-1", "bulb", 790, 182, { name: "故障灯泡" }),
      ],
      wires: [
        wire("wire-1", "battery-1", "b", "switch-1", "a"),
        wire("wire-2", "switch-1", "b", "resistor-1", "a"),
        wire("wire-3", "resistor-1", "b", "bulb-1", "a"),
        wire("wire-4", "bulb-1", "b", "battery-1", "a"),
      ],
    },
    goal: {
      bulbs: {
        "bulb-1": {
          brightnessPercent: {
            min: 20,
          },
        },
      },
      closed: true,
      currentMilliAmps: {
        max: 180,
        min: 120,
      },
      parts: {
        "resistor-1": {
          resistance: {
            max: 70,
            min: 35,
          },
        },
        "switch-1": {
          closed: true,
        },
      },
    },
  },
  {
    id: "led-polarity",
    failure: "电池极性反接，LED 没有正向导通，所以指示灯不亮。",
    repairPath: ["先把主电池切回正向。", "确认 LED 保持正向导通。", "让总电流落在安全阈值内。"],
    summary: "把反接的供电方向纠正，让 LED 正常点亮。",
    tags: ["中阶", "方向"],
    title: "LED 校准",
    workspace: {
      parts: [
        part("battery-1", "battery", 80, 220, { name: "主电池", polarity: "reversed" }),
        part("switch-1", "switch", 298, 224, { name: "维护开关", closed: true }),
        part("resistor-1", "resistor", 530, 214, { name: "保护电阻", resistance: 120 }),
        part("led-1", "led", 790, 198, { name: "指示灯" }),
      ],
      wires: [
        wire("wire-1", "battery-1", "b", "switch-1", "a"),
        wire("wire-2", "switch-1", "b", "resistor-1", "a"),
        wire("wire-3", "resistor-1", "b", "led-1", "b"),
        wire("wire-4", "led-1", "a", "battery-1", "a"),
      ],
    },
    goal: {
      closed: true,
      currentMilliAmps: {
        max: 90,
        min: 35,
      },
      leds: {
        "led-1": {
          brightnessPercent: {
            min: 8,
          },
          forward: true,
          reversed: false,
        },
      },
      parts: {
        "battery-1": {
          polarity: "normal",
        },
      },
    },
  },
  {
    id: "buzzer-comeback",
    failure: "回路虽然闭合，但限流太强，蜂鸣器达不到可听见的驱动强度。",
    repairPath: ["先确认回路闭合。", "下调限流电阻到合适区间。", "检查蜂鸣器音量是否回到可听见范围。"],
    summary: "恢复蜂鸣器的驱动电流，让声音重新出现。",
    tags: ["中阶", "声音"],
    title: "蜂鸣器复通",
    workspace: {
      parts: [
        part("battery-1", "battery", 80, 220, { name: "主电池" }),
        part("switch-1", "switch", 298, 224, { name: "主开关", closed: true }),
        part("resistor-1", "resistor", 530, 214, { name: "限流电阻", resistance: 220 }),
        part("buzzer-1", "buzzer", 790, 198, { name: "蜂鸣器" }),
      ],
      wires: [
        wire("wire-1", "battery-1", "b", "switch-1", "a"),
        wire("wire-2", "switch-1", "b", "resistor-1", "a"),
        wire("wire-3", "resistor-1", "b", "buzzer-1", "a"),
        wire("wire-4", "buzzer-1", "b", "battery-1", "a"),
      ],
    },
    goal: {
      buzzers: {
        "buzzer-1": {
          volumePercent: {
            min: 50,
          },
        },
      },
      closed: true,
      currentMilliAmps: {
        max: 150,
        min: 80,
      },
      parts: {
        "resistor-1": {
          resistance: {
            max: 80,
            min: 40,
          },
        },
      },
    },
  },
  {
    id: "motor-spoolup",
    failure: "电机能接通，但限流过强，转速起不来。",
    repairPath: ["确认主回路闭合。", "把限流电阻调到驱动区间。", "验证电机转速达到可用状态。"],
    summary: "让电机重新进入可用转速，同时别把电流压得太死。",
    tags: ["进阶", "电机"],
    title: "电机试运转",
    workspace: {
      parts: [
        part("battery-1", "battery", 80, 220, { name: "主电池" }),
        part("switch-1", "switch", 298, 224, { name: "调试开关", closed: true }),
        part("resistor-1", "resistor", 530, 214, { name: "保护电阻", resistance: 150 }),
        part("motor-1", "motor", 790, 198, { name: "驱动电机" }),
      ],
      wires: [
        wire("wire-1", "battery-1", "b", "switch-1", "a"),
        wire("wire-2", "switch-1", "b", "resistor-1", "a"),
        wire("wire-3", "resistor-1", "b", "motor-1", "a"),
        wire("wire-4", "motor-1", "b", "battery-1", "a"),
      ],
    },
    goal: {
      closed: true,
      currentMilliAmps: {
        max: 140,
        min: 70,
      },
      motors: {
        "motor-1": {
          speedPercent: {
            min: 40,
          },
        },
      },
      parts: {
        "resistor-1": {
          resistance: {
            max: 80,
            min: 40,
          },
        },
      },
    },
  },
];

export function repairLevelWirePath(level: RepairLevel, wireId: string) {
  const wire = level.workspace.wires.find((candidate) => candidate.id === wireId);
  if (!wire) {
    return "";
  }

  const fromPart = findPart(level, wire.from.partId);
  const toPart = findPart(level, wire.to.partId);
  if (!fromPart || !toPart) {
    return "";
  }

  const from = repairLevelTerminalPoint(fromPart, wire.from.terminal);
  const to = repairLevelTerminalPoint(toPart, wire.to.terminal);
  const bend = Math.max(72, Math.abs(to.x - from.x) * 0.35);
  const midX = from.x <= to.x ? from.x + bend : from.x - bend;

  return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
}

export function repairLevelTerminalPoint(part: CircuitPart, terminal: "a" | "b") {
  const spec = repairLevelSpec(part.type);
  const terminalSpec = spec.terminals[terminal];
  return {
    x: part.x + terminalSpec.x,
    y: part.y + terminalSpec.y,
  };
}

type RepairLevelPartSpec = {
  height: number;
  terminals: Record<"a" | "b", { x: number; y: number }>;
  width: number;
};

const repairLevelSpecs: Record<PartType, RepairLevelPartSpec> = {
  battery: {
    height: 104,
    terminals: {
      a: { x: 0, y: 52 },
      b: { x: 176, y: 52 },
    },
    width: 176,
  },
  ammeter: {
    height: 112,
    terminals: {
      a: { x: 0, y: 56 },
      b: { x: 156, y: 56 },
    },
    width: 156,
  },
  bulb: {
    height: 156,
    terminals: {
      a: { x: 0, y: 78 },
      b: { x: 156, y: 78 },
    },
    width: 156,
  },
  buzzer: {
    height: 128,
    terminals: {
      a: { x: 0, y: 64 },
      b: { x: 156, y: 64 },
    },
    width: 156,
  },
  capacitor: {
    height: 112,
    terminals: {
      a: { x: 0, y: 56 },
      b: { x: 156, y: 56 },
    },
    width: 156,
  },
  diode: {
    height: 112,
    terminals: {
      a: { x: 0, y: 56 },
      b: { x: 156, y: 56 },
    },
    width: 156,
  },
  led: {
    height: 128,
    terminals: {
      a: { x: 0, y: 64 },
      b: { x: 156, y: 64 },
    },
    width: 156,
  },
  motor: {
    height: 128,
    terminals: {
      a: { x: 0, y: 64 },
      b: { x: 156, y: 64 },
    },
    width: 156,
  },
  resistor: {
    height: 110,
    terminals: {
      a: { x: 0, y: 55 },
      b: { x: 216, y: 55 },
    },
    width: 216,
  },
  switch: {
    height: 96,
    terminals: {
      a: { x: 0, y: 48 },
      b: { x: 168, y: 48 },
    },
    width: 168,
  },
  voltmeter: {
    height: 112,
    terminals: {
      a: { x: 0, y: 56 },
      b: { x: 156, y: 56 },
    },
    width: 156,
  },
};

export function repairLevelSpec(type: PartType) {
  return repairLevelSpecs[type];
}

export function repairLevelPartSummary(level: RepairLevel, simulation: CircuitSimulation, partId: string) {
  return describePartState(level, partId, simulation);
}

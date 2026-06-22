import type { PartType } from "@/lib/circuit";

export type LessonCheckId =
  | "hasStarterParts"
  | "hasClosedCircuit"
  | "hasOpenCircuit"
  | "hasClosedSwitch"
  | "hasOpenSwitch"
  | "hasLitBulb"
  | "hasDarkBulb"
  | "hasBrightBulb"
  | "hasLowResistance"
  | "hasAdjustedResistor"
  | "hasLedParts"
  | "hasForwardLed"
  | "hasLitLed"
  | "hasSafeLedCurrent"
  | "hasDiodeParts"
  | "hasForwardDiodeWiring"
  | "hasReverseBlockingDiode"
  | "hasMeterParts"
  | "hasSeriesAmmeterWiring"
  | "hasActiveAmmeter"
  | "hasActiveVoltmeter"
  | "hasOutputParts"
  | "hasParallelOutputWiring"
  | "hasActiveBuzzer"
  | "hasActiveMotor"
  | "hasCapacitorParts"
  | "hasSwitchedCapacitorWiring"
  | "hasChargedCapacitor"
  | "hasCapacitorWithoutMainCurrent"
  | "hasTwoBulbs"
  | "hasTwoLitBulbs"
  | "hasSeriesBulbs"
  | "hasParallelBulbs"
  | "hasDimSeriesBulbs"
  | "hasBrightParallelBulbs";

export type LessonPartType = PartType;

export type LessonTerminalKey = "a" | "b";

export type LessonWorkspacePart = {
  closed?: boolean;
  id: string;
  name: string;
  polarity?: "normal" | "reversed";
  resistance?: number;
  rotation?: number;
  type: LessonPartType;
  x: number;
  y: number;
};

export type LessonWorkspaceWire = {
  from: {
    partId: string;
    terminal: LessonTerminalKey;
  };
  id: string;
  to: {
    partId: string;
    terminal: LessonTerminalKey;
  };
};

export type LessonWorkspace = {
  parts: LessonWorkspacePart[];
  selectedPartId: string;
  wires: LessonWorkspaceWire[];
  zoom: number;
};

export type LessonGuide = {
  partIds?: string[];
  terminalRefs?: Array<{
    partId: string;
    terminal: LessonTerminalKey;
  }>;
};

export type LessonStep = {
  checkId: LessonCheckId;
  description: string;
  guide?: LessonGuide;
  hint: string;
  id: string;
};

export type Lesson = {
  id: string;
  objective: string;
  starterWorkspace: LessonWorkspace;
  steps: LessonStep[];
  title: string;
};

const connectedLoopWires: LessonWorkspaceWire[] = [
  {
    id: "wire-1",
    from: { partId: "battery-1", terminal: "b" },
    to: { partId: "switch-1", terminal: "a" },
  },
  {
    id: "wire-2",
    from: { partId: "switch-1", terminal: "b" },
    to: { partId: "bulb-1", terminal: "a" },
  },
  {
    id: "wire-3",
    from: { partId: "bulb-1", terminal: "b" },
    to: { partId: "resistor-1", terminal: "b" },
  },
  {
    id: "wire-4",
    from: { partId: "resistor-1", terminal: "a" },
    to: { partId: "battery-1", terminal: "a" },
  },
];

const starterPartIds = ["battery-1", "switch-1", "bulb-1", "resistor-1"];
const twoBulbPartIds = ["battery-1", "switch-1", "bulb-1", "bulb-2", "resistor-1"];
const ledPartIds = ["battery-1", "switch-1", "resistor-1", "led-1"];
const diodePartIds = ["battery-1", "switch-1", "resistor-1", "diode-1"];
const meterPartIds = ["battery-1", "switch-1", "ammeter-1", "bulb-1", "resistor-1", "voltmeter-1"];
const outputPartIds = ["battery-1", "switch-1", "buzzer-1", "motor-1", "resistor-1"];
const capacitorPartIds = ["battery-1", "switch-1", "capacitor-1"];

const starterTerminalRefs: LessonGuide["terminalRefs"] = [
  { partId: "battery-1", terminal: "a" },
  { partId: "battery-1", terminal: "b" },
  { partId: "switch-1", terminal: "a" },
  { partId: "switch-1", terminal: "b" },
  { partId: "bulb-1", terminal: "a" },
  { partId: "bulb-1", terminal: "b" },
  { partId: "resistor-1", terminal: "a" },
  { partId: "resistor-1", terminal: "b" },
];

const ledTerminalRefs: LessonGuide["terminalRefs"] = [
  { partId: "battery-1", terminal: "a" },
  { partId: "battery-1", terminal: "b" },
  { partId: "switch-1", terminal: "a" },
  { partId: "switch-1", terminal: "b" },
  { partId: "resistor-1", terminal: "a" },
  { partId: "resistor-1", terminal: "b" },
  { partId: "led-1", terminal: "a" },
  { partId: "led-1", terminal: "b" },
];

const diodeTerminalRefs: LessonGuide["terminalRefs"] = [
  { partId: "battery-1", terminal: "a" },
  { partId: "battery-1", terminal: "b" },
  { partId: "switch-1", terminal: "a" },
  { partId: "switch-1", terminal: "b" },
  { partId: "resistor-1", terminal: "a" },
  { partId: "resistor-1", terminal: "b" },
  { partId: "diode-1", terminal: "a" },
  { partId: "diode-1", terminal: "b" },
];

const meterTerminalRefs: LessonGuide["terminalRefs"] = [
  { partId: "battery-1", terminal: "a" },
  { partId: "battery-1", terminal: "b" },
  { partId: "switch-1", terminal: "a" },
  { partId: "switch-1", terminal: "b" },
  { partId: "ammeter-1", terminal: "a" },
  { partId: "ammeter-1", terminal: "b" },
  { partId: "bulb-1", terminal: "a" },
  { partId: "bulb-1", terminal: "b" },
  { partId: "resistor-1", terminal: "a" },
  { partId: "resistor-1", terminal: "b" },
  { partId: "voltmeter-1", terminal: "a" },
  { partId: "voltmeter-1", terminal: "b" },
];

const outputTerminalRefs: LessonGuide["terminalRefs"] = [
  { partId: "battery-1", terminal: "a" },
  { partId: "battery-1", terminal: "b" },
  { partId: "switch-1", terminal: "a" },
  { partId: "switch-1", terminal: "b" },
  { partId: "buzzer-1", terminal: "a" },
  { partId: "buzzer-1", terminal: "b" },
  { partId: "motor-1", terminal: "a" },
  { partId: "motor-1", terminal: "b" },
  { partId: "resistor-1", terminal: "a" },
  { partId: "resistor-1", terminal: "b" },
];

const capacitorTerminalRefs: LessonGuide["terminalRefs"] = [
  { partId: "battery-1", terminal: "a" },
  { partId: "battery-1", terminal: "b" },
  { partId: "switch-1", terminal: "a" },
  { partId: "switch-1", terminal: "b" },
  { partId: "capacitor-1", terminal: "a" },
  { partId: "capacitor-1", terminal: "b" },
];

function starterParts({ resistance = 48, switchClosed = true } = {}): LessonWorkspacePart[] {
  return [
    { id: "battery-1", name: "9V 电池", type: "battery", x: 74, y: 280 },
    { id: "switch-1", name: "单刀开关", type: "switch", x: 326, y: 126, closed: switchClosed },
    { id: "bulb-1", name: "小灯泡", type: "bulb", x: 658, y: 240 },
    { id: "resistor-1", name: "可变电阻器", type: "resistor", x: 330, y: 472, resistance },
  ];
}

function twoBulbParts({ resistance = 36, switchClosed = true } = {}): LessonWorkspacePart[] {
  return [
    { id: "battery-1", name: "9V 电池", type: "battery", x: 72, y: 280 },
    { id: "switch-1", name: "单刀开关", type: "switch", x: 300, y: 118, closed: switchClosed },
    { id: "bulb-1", name: "灯泡 A", type: "bulb", x: 572, y: 130 },
    { id: "bulb-2", name: "灯泡 B", type: "bulb", x: 572, y: 386 },
    { id: "resistor-1", name: "可变电阻器", type: "resistor", x: 296, y: 474, resistance },
  ];
}

function ledParts({ resistance = 120, switchClosed = true } = {}): LessonWorkspacePart[] {
  return [
    { id: "battery-1", name: "9V 电池", type: "battery", x: 72, y: 282 },
    { id: "switch-1", name: "单刀开关", type: "switch", x: 292, y: 122, closed: switchClosed },
    { id: "resistor-1", name: "限流电阻", type: "resistor", x: 574, y: 118, resistance },
    { id: "led-1", name: "红色 LED", type: "led", x: 620, y: 396 },
  ];
}

function diodeLessonParts({ resistance = 120, switchClosed = true } = {}): LessonWorkspacePart[] {
  return [
    { id: "battery-1", name: "9V 电池", type: "battery", x: 72, y: 282 },
    { id: "switch-1", name: "单刀开关", type: "switch", x: 292, y: 122, closed: switchClosed },
    { id: "resistor-1", name: "限流电阻", type: "resistor", x: 574, y: 118, resistance },
    { id: "diode-1", name: "二极管", type: "diode", x: 620, y: 396 },
  ];
}

function meterLessonParts({ resistance = 48, switchClosed = false } = {}): LessonWorkspacePart[] {
  return [
    { id: "battery-1", name: "9V 电池", type: "battery", x: 58, y: 280 },
    { id: "switch-1", name: "单刀开关", type: "switch", x: 258, y: 116, closed: switchClosed },
    { id: "ammeter-1", name: "电流表", type: "ammeter", x: 508, y: 116 },
    { id: "bulb-1", name: "小灯泡", type: "bulb", x: 740, y: 222 },
    { id: "resistor-1", name: "可变电阻器", type: "resistor", x: 382, y: 472, resistance },
    { id: "voltmeter-1", name: "电压表", type: "voltmeter", x: 54, y: 438 },
  ];
}

function outputLessonParts({ resistance = 24, switchClosed = false } = {}): LessonWorkspacePart[] {
  return [
    { id: "battery-1", name: "9V 电池", type: "battery", x: 72, y: 280 },
    { id: "switch-1", name: "单刀开关", type: "switch", x: 300, y: 118, closed: switchClosed },
    { id: "buzzer-1", name: "蜂鸣器", type: "buzzer", x: 594, y: 130 },
    { id: "motor-1", name: "驱动电机", type: "motor", x: 594, y: 386 },
    { id: "resistor-1", name: "限流电阻", type: "resistor", x: 296, y: 474, resistance },
  ];
}

function capacitorLessonParts({ switchClosed = false } = {}): LessonWorkspacePart[] {
  return [
    { id: "battery-1", name: "9V 电池", type: "battery", x: 74, y: 280 },
    { id: "switch-1", name: "单刀开关", type: "switch", x: 326, y: 126, closed: switchClosed },
    { id: "capacitor-1", name: "电容", type: "capacitor", x: 658, y: 256 },
  ];
}

const seriesWires: LessonWorkspaceWire[] = [
  {
    id: "wire-series-1",
    from: { partId: "battery-1", terminal: "b" },
    to: { partId: "switch-1", terminal: "a" },
  },
  {
    id: "wire-series-2",
    from: { partId: "switch-1", terminal: "b" },
    to: { partId: "bulb-1", terminal: "a" },
  },
  {
    id: "wire-series-3",
    from: { partId: "bulb-1", terminal: "b" },
    to: { partId: "bulb-2", terminal: "a" },
  },
  {
    id: "wire-series-4",
    from: { partId: "bulb-2", terminal: "b" },
    to: { partId: "resistor-1", terminal: "b" },
  },
  {
    id: "wire-series-5",
    from: { partId: "resistor-1", terminal: "a" },
    to: { partId: "battery-1", terminal: "a" },
  },
];

const parallelWires: LessonWorkspaceWire[] = [
  {
    id: "wire-parallel-1",
    from: { partId: "battery-1", terminal: "b" },
    to: { partId: "switch-1", terminal: "a" },
  },
  {
    id: "wire-parallel-2",
    from: { partId: "switch-1", terminal: "b" },
    to: { partId: "bulb-1", terminal: "a" },
  },
  {
    id: "wire-parallel-3",
    from: { partId: "switch-1", terminal: "b" },
    to: { partId: "bulb-2", terminal: "a" },
  },
  {
    id: "wire-parallel-4",
    from: { partId: "bulb-1", terminal: "b" },
    to: { partId: "resistor-1", terminal: "b" },
  },
  {
    id: "wire-parallel-5",
    from: { partId: "bulb-2", terminal: "b" },
    to: { partId: "resistor-1", terminal: "b" },
  },
  {
    id: "wire-parallel-6",
    from: { partId: "resistor-1", terminal: "a" },
    to: { partId: "battery-1", terminal: "a" },
  },
];

export const lessonCatalog: Lesson[] = [
  {
    id: "light-the-bulb",
    title: "实验 1：点亮小灯泡",
    objective: "把电池、开关、灯泡和可变电阻连成闭合回路，并观察电阻变化如何影响亮度。",
    starterWorkspace: {
      parts: starterParts(),
      selectedPartId: "battery-1",
      wires: [],
      zoom: 86,
    },
    steps: [
      {
        id: "parts",
        description: "工作台上有电池、开关、灯泡和可变电阻。",
        guide: { partIds: starterPartIds },
        hint: "如果缺少元器件，可以从左侧元器件列表点击添加。",
        checkId: "hasStarterParts",
      },
      {
        id: "wires",
        description: "用导线把所有元器件连接成一个完整回路。",
        guide: { terminalRefs: starterTerminalRefs },
        hint: "选择连线工具，依次点击两个端子；从电池正极出发，经过开关、灯泡、可变电阻，再回到电池负极。",
        checkId: "hasClosedCircuit",
      },
      {
        id: "switch",
        description: "闭合开关，让电流可以通过灯泡。",
        guide: { partIds: ["switch-1"] },
        hint: "点击工作台上的开关，把状态切到闭合。",
        checkId: "hasClosedSwitch",
      },
      {
        id: "bulb",
        description: "确认灯泡被点亮。",
        guide: { partIds: ["bulb-1"] },
        hint: "如果灯泡没有亮，检查导线是否形成闭合回路，并确认开关已经闭合。",
        checkId: "hasLitBulb",
      },
      {
        id: "resistor",
        description: "调节可变电阻，观察灯泡亮度变化。",
        guide: { partIds: ["resistor-1"] },
        hint: "拖动可变电阻上的滑杆，或者选中它后在右侧属性面板调节阻值。",
        checkId: "hasAdjustedResistor",
      },
    ],
  },
  {
    id: "open-the-circuit",
    title: "实验 2：观察断路",
    objective: "通过开关断开回路，观察电流动画和灯泡亮度如何立即消失。",
    starterWorkspace: {
      parts: starterParts(),
      selectedPartId: "switch-1",
      wires: connectedLoopWires,
      zoom: 86,
    },
    steps: [
      {
        id: "parts",
        description: "工作台上有电池、开关、灯泡和可变电阻。",
        guide: { partIds: starterPartIds },
        hint: "点击“加载实验初始状态”可以直接获得完整回路。",
        checkId: "hasStarterParts",
      },
      {
        id: "open-switch",
        description: "断开开关。",
        guide: { partIds: ["switch-1"] },
        hint: "点击工作台上的开关，把状态切到断开。",
        checkId: "hasOpenSwitch",
      },
      {
        id: "open-circuit",
        description: "确认回路状态变为断开。",
        guide: { partIds: ["switch-1"] },
        hint: "断开开关后，顶部状态和右侧回路状态都会显示断开。",
        checkId: "hasOpenCircuit",
      },
      {
        id: "dark-bulb",
        description: "确认灯泡熄灭。",
        guide: { partIds: ["bulb-1"] },
        hint: "如果灯泡仍然亮着，检查是否还有其他导线绕过了开关。",
        checkId: "hasDarkBulb",
      },
    ],
  },
  {
    id: "dim-the-bulb",
    title: "实验 3：调亮小灯泡",
    objective: "保持回路闭合，降低可变电阻阻值，观察灯泡亮度随电流增强而变亮。",
    starterWorkspace: {
      parts: starterParts({ resistance: 96 }),
      selectedPartId: "resistor-1",
      wires: connectedLoopWires,
      zoom: 86,
    },
    steps: [
      {
        id: "closed-switch",
        description: "闭合开关，让回路保持通电。",
        guide: { partIds: ["switch-1"] },
        hint: "点击工作台上的开关，让它显示闭合状态。",
        checkId: "hasClosedSwitch",
      },
      {
        id: "closed-circuit",
        description: "确认回路处于闭合状态。",
        guide: { terminalRefs: starterTerminalRefs },
        hint: "如果回路没有闭合，先点击“加载实验初始状态”，再确认导线没有被删除。",
        checkId: "hasClosedCircuit",
      },
      {
        id: "low-resistance",
        description: "把可变电阻调到较低阻值。",
        guide: { partIds: ["resistor-1"] },
        hint: "把可变电阻滑杆向左拖动，目标是 24 Ω 或更低。",
        checkId: "hasLowResistance",
      },
      {
        id: "bright-bulb",
        description: "观察灯泡明显变亮。",
        guide: { partIds: ["bulb-1", "resistor-1"] },
        hint: "阻值降低后，电流会变大；观察灯泡亮度数值和光晕变化。",
        checkId: "hasBrightBulb",
      },
    ],
  },
  {
    id: "series-bulbs",
    title: "实验 4：串联两个灯泡",
    objective: "观察两个灯泡串在同一条电流路径上时，任意一处断开都会让整条回路停止工作。",
    starterWorkspace: {
      parts: twoBulbParts({ resistance: 36 }),
      selectedPartId: "bulb-1",
      wires: seriesWires,
      zoom: 78,
    },
    steps: [
      {
        id: "two-bulbs",
        description: "工作台上有两个灯泡。",
        guide: { partIds: ["bulb-1", "bulb-2"] },
        hint: "点击“加载实验初始状态”可以直接获得两个灯泡的串联实验台。",
        checkId: "hasTwoBulbs",
      },
      {
        id: "series-route",
        description: "两个灯泡串在同一条回路路径上。",
        guide: { partIds: twoBulbPartIds },
        hint: "串联时，电流会依次经过灯泡 A 和灯泡 B，再回到电池负极。",
        checkId: "hasSeriesBulbs",
      },
      {
        id: "both-lit",
        description: "闭合开关后，两个灯泡都被点亮。",
        guide: { partIds: ["switch-1", "bulb-1", "bulb-2"] },
        hint: "如果其中一个灯泡不亮，检查它是否真的接在同一条闭合回路上。",
        checkId: "hasTwoLitBulbs",
      },
      {
        id: "series-brightness",
        description: "观察两个串联灯泡都比较暗。",
        guide: { partIds: ["bulb-1", "bulb-2", "resistor-1"] },
        hint: "两个灯泡串在同一条路上，会一起分担电压；和单灯泡回路相比，亮度会低一些。",
        checkId: "hasDimSeriesBulbs",
      },
      {
        id: "series-switch",
        description: "断开开关，观察两个灯泡同时熄灭。",
        guide: { partIds: ["switch-1", "bulb-1", "bulb-2"] },
        hint: "串联电路只有一条路，开关断开后两个灯泡都会失去电流。",
        checkId: "hasOpenSwitch",
      },
    ],
  },
  {
    id: "parallel-bulbs",
    title: "实验 5：并联两个灯泡",
    objective: "观察两个灯泡分成两条支路时，每个灯泡都可以接在电池两端形成自己的通路。",
    starterWorkspace: {
      parts: twoBulbParts({ resistance: 28 }),
      selectedPartId: "bulb-2",
      wires: parallelWires,
      zoom: 78,
    },
    steps: [
      {
        id: "two-bulbs",
        description: "工作台上有两个灯泡。",
        guide: { partIds: ["bulb-1", "bulb-2"] },
        hint: "点击“加载实验初始状态”可以直接获得两个灯泡的并联实验台。",
        checkId: "hasTwoBulbs",
      },
      {
        id: "parallel-route",
        description: "两个灯泡分别处在不同支路上。",
        guide: { partIds: twoBulbPartIds },
        hint: "并联时，两个灯泡的左端接到同一侧，右端也接到同一侧，形成两条支路。",
        checkId: "hasParallelBulbs",
      },
      {
        id: "both-lit",
        description: "闭合开关后，两个灯泡都被点亮。",
        guide: { partIds: ["switch-1", "bulb-1", "bulb-2"] },
        hint: "如果一个灯泡不亮，检查它的两端是否分别接到了回路两侧。",
        checkId: "hasTwoLitBulbs",
      },
      {
        id: "parallel-brightness",
        description: "观察两个并联灯泡都保持可见亮度。",
        guide: { partIds: ["bulb-1", "bulb-2", "resistor-1"] },
        hint: "并联时，两个灯泡分在不同支路上；每个灯泡都能从电池两端获得自己的通路。",
        checkId: "hasBrightParallelBulbs",
      },
      {
        id: "open-switch",
        description: "断开总开关，观察两条支路同时停止工作。",
        guide: { partIds: ["switch-1"] },
        hint: "总开关断开后，两个并联支路都无法从电池获得电流。",
        checkId: "hasOpenSwitch",
      },
    ],
  },
  {
    id: "light-the-led",
    title: "实验 6：点亮 LED",
    objective: "用电池、开关和限流电阻点亮有正负极的 LED，并理解反接不亮、限流保护的效果。",
    starterWorkspace: {
      parts: ledParts(),
      selectedPartId: "led-1",
      wires: [],
      zoom: 82,
    },
    steps: [
      {
        id: "led-parts",
        description: "工作台上有电池、开关、限流电阻和 LED。",
        guide: { partIds: ledPartIds },
        hint: "LED 是有方向的元器件，+ 端需要接到电池正极一侧，- 端回到负极一侧。",
        checkId: "hasLedParts",
      },
      {
        id: "led-forward",
        description: "按正确方向连接 LED：电流从 + 端进入，从 - 端流出。",
        guide: { terminalRefs: ledTerminalRefs },
        hint: "推荐路径：电池 + → 开关 → 限流电阻 → LED +，再由 LED - 回到电池 -。",
        checkId: "hasForwardLed",
      },
      {
        id: "led-lit",
        description: "闭合开关，让 LED 发光。",
        guide: { partIds: ["switch-1", "led-1"] },
        hint: "如果 LED 不亮，先检查开关是否闭合，再检查 LED 是否反接。",
        checkId: "hasLitLed",
      },
      {
        id: "led-safe",
        description: "确认限流电阻让 LED 电流处于安全范围。",
        guide: { partIds: ["resistor-1", "led-1"] },
        hint: "如果出现电流偏大警告，把限流电阻调高一些。",
        checkId: "hasSafeLedCurrent",
      },
    ],
  },
  {
    id: "diode-direction",
    title: "实验 7：二极管单向导通",
    objective: "把二极管接入限流回路，先按正向接好，再切换电池极性观察反向截止。",
    starterWorkspace: {
      parts: diodeLessonParts({ switchClosed: false }),
      selectedPartId: "diode-1",
      wires: [],
      zoom: 82,
    },
    steps: [
      {
        id: "diode-parts",
        description: "工作台上有电池、开关、限流电阻和二极管。",
        guide: { partIds: diodePartIds },
        hint: "二极管和 LED 一样有方向，+ 端接到电池 + 一侧时才会正向导通。",
        checkId: "hasDiodeParts",
      },
      {
        id: "diode-forward-route",
        description: "按正向把二极管接进回路。",
        guide: { terminalRefs: diodeTerminalRefs },
        hint: "推荐路径：电池 + → 开关 → 限流电阻 → 二极管 +，再由二极管 - 回到电池 -。",
        checkId: "hasForwardDiodeWiring",
      },
      {
        id: "diode-switch",
        description: "闭合开关，让正向回路可以导通。",
        guide: { partIds: ["switch-1", "diode-1"] },
        hint: "如果没有电流动画，检查开关是否闭合、二极管方向是否接反。",
        checkId: "hasClosedSwitch",
      },
      {
        id: "diode-reverse",
        description: "把电池极性切到反向，观察二极管截止。",
        guide: { partIds: ["battery-1", "diode-1"] },
        hint: "选中电池，在属性面板切换极性；同一条线路会因为电源方向反过来而停止导通。",
        checkId: "hasReverseBlockingDiode",
      },
    ],
  },
  {
    id: "meter-readings",
    title: "实验 8：用电表测量回路",
    objective: "把电流表串进主回路，并把电压表并在电池两端，观察电流和电压读数。",
    starterWorkspace: {
      parts: meterLessonParts(),
      selectedPartId: "ammeter-1",
      wires: [],
      zoom: 78,
    },
    steps: [
      {
        id: "meter-parts",
        description: "工作台上有电池、开关、电流表、灯泡、可变电阻和电压表。",
        guide: { partIds: meterPartIds },
        hint: "电流表要串在主回路里；电压表要跨接在要测量的两端。",
        checkId: "hasMeterParts",
      },
      {
        id: "ammeter-series",
        description: "把电流表串进灯泡所在的主回路。",
        guide: { terminalRefs: meterTerminalRefs },
        hint: "推荐路径：电池 + → 开关 → 电流表 → 灯泡 → 可变电阻 → 电池 -。",
        checkId: "hasSeriesAmmeterWiring",
      },
      {
        id: "switch",
        description: "闭合开关，让主回路通电。",
        guide: { partIds: ["switch-1", "ammeter-1"] },
        hint: "开关闭合后，电流表会显示这条串联回路中的电流。",
        checkId: "hasClosedSwitch",
      },
      {
        id: "ammeter-reading",
        description: "确认电流表读到主回路电流。",
        guide: { partIds: ["ammeter-1", "bulb-1"] },
        hint: "如果电流表没有读数，检查它是否串在主回路中，而不是并在电池两端。",
        checkId: "hasActiveAmmeter",
      },
      {
        id: "voltmeter-reading",
        description: "把电压表接在电池两端，读取电池电压。",
        guide: { partIds: ["battery-1", "voltmeter-1"] },
        hint: "把电压表 B 端接电池 +，A 端接电池 -；电压表会并联测量，不需要串进主回路。",
        checkId: "hasActiveVoltmeter",
      },
    ],
  },
  {
    id: "sound-and-motion-output",
    title: "实验 9：声音和运动输出",
    objective: "把蜂鸣器和电机接成两条输出支路，观察同一个开关如何同时控制声音和运动。",
    starterWorkspace: {
      parts: outputLessonParts(),
      selectedPartId: "buzzer-1",
      wires: [],
      zoom: 78,
    },
    steps: [
      {
        id: "output-parts",
        description: "工作台上有电池、开关、蜂鸣器、电机和限流电阻。",
        guide: { partIds: outputPartIds },
        hint: "蜂鸣器会把电能变成声音，电机会把电能变成转动。",
        checkId: "hasOutputParts",
      },
      {
        id: "output-branches",
        description: "把蜂鸣器和电机接成两条并联输出支路。",
        guide: { terminalRefs: outputTerminalRefs },
        hint: "推荐路径：电池 + → 开关，然后分别接到蜂鸣器和电机；两条支路再汇回限流电阻并回到电池 -。",
        checkId: "hasParallelOutputWiring",
      },
      {
        id: "switch",
        description: "闭合开关，让两条输出支路同时通电。",
        guide: { partIds: ["switch-1", "buzzer-1", "motor-1"] },
        hint: "开关闭合后，蜂鸣器和电机会一起响应；断开后两条支路都会停止。",
        checkId: "hasClosedSwitch",
      },
      {
        id: "buzzer-active",
        description: "确认蜂鸣器已经响起。",
        guide: { partIds: ["buzzer-1", "resistor-1"] },
        hint: "如果蜂鸣器仍然静音，检查它是否接在完整输出支路上，并尝试降低限流电阻。",
        checkId: "hasActiveBuzzer",
      },
      {
        id: "motor-active",
        description: "确认电机已经转动。",
        guide: { partIds: ["motor-1", "resistor-1"] },
        hint: "如果电机仍然停止，检查电机两端是否分别接到了输出支路的两侧。",
        checkId: "hasActiveMotor",
      },
    ],
  },
  {
    id: "capacitor-charge",
    title: "实验 10：观察电容储能",
    objective: "用开关把电容接到电池两端，观察它显示电压和充电百分比，同时不形成持续输出电流。",
    starterWorkspace: {
      parts: capacitorLessonParts(),
      selectedPartId: "capacitor-1",
      wires: [],
      zoom: 86,
    },
    steps: [
      {
        id: "capacitor-parts",
        description: "工作台上有电池、开关和电容。",
        guide: { partIds: capacitorPartIds },
        hint: "电容可以跨接在电源两端观察电压和充电状态。",
        checkId: "hasCapacitorParts",
      },
      {
        id: "capacitor-wiring",
        description: "通过开关把电容接到电池两端。",
        guide: { terminalRefs: capacitorTerminalRefs },
        hint: "推荐路径：电池 + → 开关 → 电容 B 端，电容 A 端回到电池 -。",
        checkId: "hasSwitchedCapacitorWiring",
      },
      {
        id: "capacitor-switch",
        description: "闭合开关，让电容接到电池上。",
        guide: { partIds: ["switch-1", "capacitor-1"] },
        hint: "开关闭合后，电容卡片会显示电压和充电百分比。",
        checkId: "hasClosedSwitch",
      },
      {
        id: "capacitor-charge",
        description: "确认电容已经显示充电状态。",
        guide: { partIds: ["capacitor-1"] },
        hint: "如果电容仍显示未接入，检查它的两端是否分别接到了电池的 + 和 - 两侧。",
        checkId: "hasChargedCapacitor",
      },
      {
        id: "capacitor-current",
        description: "观察电容跨接后没有形成持续主回路电流。",
        guide: { partIds: ["battery-1", "capacitor-1"] },
        hint: "当前模型会显示电容两端电压，但顶部主回路电流保持 0 mA。",
        checkId: "hasCapacitorWithoutMainCurrent",
      },
    ],
  },
];

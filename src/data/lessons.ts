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
  | "hasTwoBulbs"
  | "hasTwoLitBulbs"
  | "hasSeriesBulbs"
  | "hasParallelBulbs"
  | "hasDimSeriesBulbs"
  | "hasBrightParallelBulbs";

export type LessonPartType = "battery" | "bulb" | "switch" | "resistor" | "led" | "buzzer" | "motor";

export type LessonTerminalKey = "a" | "b";

export type LessonWorkspacePart = {
  closed?: boolean;
  id: string;
  name: string;
  polarity?: "normal" | "reversed";
  resistance?: number;
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
];

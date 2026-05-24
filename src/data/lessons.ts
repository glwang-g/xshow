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
  | "hasAdjustedResistor";

export type LessonPartType = "battery" | "bulb" | "switch" | "resistor";

export type LessonTerminalKey = "a" | "b";

export type LessonWorkspacePart = {
  closed?: boolean;
  id: string;
  name: string;
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

function starterParts({ resistance = 48, switchClosed = true } = {}): LessonWorkspacePart[] {
  return [
    { id: "battery-1", name: "9V 电池", type: "battery", x: 74, y: 280 },
    { id: "switch-1", name: "单刀开关", type: "switch", x: 326, y: 126, closed: switchClosed },
    { id: "bulb-1", name: "小灯泡", type: "bulb", x: 658, y: 240 },
    { id: "resistor-1", name: "可变电阻器", type: "resistor", x: 330, y: 472, resistance },
  ];
}

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
];

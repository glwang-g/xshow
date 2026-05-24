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

export type LessonStep = {
  checkId: LessonCheckId;
  description: string;
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
        checkId: "hasStarterParts",
      },
      {
        id: "wires",
        description: "用导线把所有元器件连接成一个完整回路。",
        checkId: "hasClosedCircuit",
      },
      {
        id: "switch",
        description: "闭合开关，让电流可以通过灯泡。",
        checkId: "hasClosedSwitch",
      },
      {
        id: "bulb",
        description: "确认灯泡被点亮。",
        checkId: "hasLitBulb",
      },
      {
        id: "resistor",
        description: "调节可变电阻，观察灯泡亮度变化。",
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
        checkId: "hasStarterParts",
      },
      {
        id: "open-switch",
        description: "断开开关。",
        checkId: "hasOpenSwitch",
      },
      {
        id: "open-circuit",
        description: "确认回路状态变为断开。",
        checkId: "hasOpenCircuit",
      },
      {
        id: "dark-bulb",
        description: "确认灯泡熄灭。",
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
        checkId: "hasClosedSwitch",
      },
      {
        id: "closed-circuit",
        description: "确认回路处于闭合状态。",
        checkId: "hasClosedCircuit",
      },
      {
        id: "low-resistance",
        description: "把可变电阻调到较低阻值。",
        checkId: "hasLowResistance",
      },
      {
        id: "bright-bulb",
        description: "观察灯泡明显变亮。",
        checkId: "hasBrightBulb",
      },
    ],
  },
];

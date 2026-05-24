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

export type LessonStep = {
  checkId: LessonCheckId;
  description: string;
  id: string;
};

export type Lesson = {
  id: string;
  objective: string;
  steps: LessonStep[];
  title: string;
};

export const lessonCatalog: Lesson[] = [
  {
    id: "light-the-bulb",
    title: "实验 1：点亮小灯泡",
    objective: "把电池、开关、灯泡和可变电阻连成闭合回路，并观察电阻变化如何影响亮度。",
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

export type LessonCheckId =
  | "hasStarterParts"
  | "hasClosedCircuit"
  | "hasClosedSwitch"
  | "hasLitBulb"
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
];

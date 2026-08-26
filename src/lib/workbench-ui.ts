import {
  Activity,
  BatteryCharging,
  BatteryMedium,
  CircuitBoard,
  CircleDot,
  CloudSync,
  Cog,
  Waves,
  Gauge,
  Lightbulb,
  Save,
  SlidersHorizontal,
  ToggleRight,
  TriangleRight,
  Trophy,
  Volume2,
} from "@lucide/vue";
import type { BasicTerminalKey, CircuitPart, PartType, TerminalKey } from "@/lib/circuit";

export type PartSpec = {
  icon: unknown;
  label: string;
  width: number;
  height: number;
  terminals: Record<BasicTerminalKey, { x: number; y: number; label: string }> & Partial<Record<Exclude<TerminalKey, BasicTerminalKey>, { x: number; y: number; label: string }>>;
};

export type PaletteItem = {
  description: string;
  type: PartType;
};

export type StatusPanelTab = "circuit" | "cloud" | "kit" | "lesson" | "records" | "selection";

export type StatusPanelTabItem = {
  icon: unknown;
  id: StatusPanelTab;
  label: string;
};

export const workbench = {
  width: 1060,
  height: 640,
};

export const partSpecs: Record<PartType, PartSpec> = {
  battery: {
    icon: BatteryCharging,
    label: "电池",
    width: 160,
    height: 96,
    terminals: {
      a: { x: 0, y: 48, label: "-" },
      b: { x: 160, y: 48, label: "+" },
    },
  },
  switch: {
    icon: ToggleRight,
    label: "开关",
    width: 152,
    height: 88,
    terminals: {
      a: { x: 0, y: 44, label: "A" },
      b: { x: 152, y: 44, label: "B" },
    },
  },
  bulb: {
    icon: Lightbulb,
    label: "灯泡",
    width: 144,
    height: 140,
    terminals: {
      a: { x: 0, y: 70, label: "A" },
      b: { x: 144, y: 70, label: "B" },
    },
  },
  resistor: {
    icon: SlidersHorizontal,
    label: "可变电阻",
    width: 192,
    height: 100,
    terminals: {
      a: { x: 0, y: 50, label: "A" },
      b: { x: 192, y: 50, label: "B" },
    },
  },
  led: {
    icon: CircleDot,
    label: "LED",
    width: 144,
    height: 116,
    terminals: {
      a: { x: 0, y: 58, label: "-" },
      b: { x: 144, y: 58, label: "+" },
    },
  },
  diode: {
    icon: TriangleRight,
    label: "二极管",
    width: 144,
    height: 100,
    terminals: {
      a: { x: 0, y: 50, label: "-" },
      b: { x: 144, y: 50, label: "+" },
    },
  },
  capacitor: {
    icon: BatteryMedium,
    label: "电容",
    width: 144,
    height: 100,
    terminals: {
      a: { x: 0, y: 50, label: "A" },
      b: { x: 144, y: 50, label: "B" },
    },
  },
  spring: {
    icon: ToggleRight,
    label: "弹簧触点",
    width: 160,
    height: 100,
    terminals: {
      a: { x: 0, y: 50, label: "COM" },
      b: { x: 160, y: 50, label: "NO" },
    },
  },
  coil: {
    icon: Waves,
    label: "电感线圈",
    width: 160,
    height: 100,
    terminals: {
      a: { x: 0, y: 50, label: "A" },
      b: { x: 160, y: 50, label: "B" },
    },
  },
  ammeter: {
    icon: Activity,
    label: "电流表",
    width: 144,
    height: 100,
    terminals: {
      a: { x: 0, y: 50, label: "A" },
      b: { x: 144, y: 50, label: "B" },
    },
  },
  voltmeter: {
    icon: Gauge,
    label: "电压表",
    width: 144,
    height: 100,
    terminals: {
      a: { x: 0, y: 50, label: "A" },
      b: { x: 144, y: 50, label: "B" },
    },
  },
  buzzer: {
    icon: Volume2,
    label: "蜂鸣器",
    width: 144,
    height: 112,
    terminals: {
      a: { x: 0, y: 56, label: "A" },
      b: { x: 144, y: 56, label: "B" },
    },
  },
  motor: {
    icon: Cog,
    label: "电机",
    width: 144,
    height: 112,
    terminals: {
      a: { x: 0, y: 56, label: "A" },
      b: { x: 144, y: 56, label: "B" },
    },
  },
  module: {
    icon: CircuitBoard,
    label: "自定义模块",
    width: 144,
    height: 88,
    terminals: {
      a: { x: 0, y: 27, label: "A" },
      b: { x: 0, y: 61, label: "B" },
      com: { x: 144, y: 27, label: "COM" },
      out: { x: 144, y: 61, label: "NO" },
    },
  },
};

export const palette: PaletteItem[] = [
  { type: "battery", description: "9V 电源" },
  { type: "switch", description: "控制通断" },
  { type: "bulb", description: "显示亮度" },
  { type: "buzzer", description: "闭合后响" },
  { type: "motor", description: "闭合后转" },
  { type: "resistor", description: "调节电流" },
  { type: "led", description: "有正负极" },
  { type: "diode", description: "单向导通" },
  { type: "capacitor", description: "储存电荷" },
  { type: "coil", description: "线圈控制" },
  { type: "spring", description: "线圈吸合触点" },
  { type: "ammeter", description: "测量电流" },
  { type: "voltmeter", description: "测量电压" },
];

export const statusPanelTabs: StatusPanelTabItem[] = [
  { icon: Trophy, id: "lesson", label: "课程" },
  { icon: Gauge, id: "circuit", label: "回路" },
  { icon: SlidersHorizontal, id: "selection", label: "检查器" },
  { icon: Save, id: "records", label: "记录" },
  { icon: CloudSync, id: "cloud", label: "云端" },
];

export function getSpec(part: CircuitPart | PartType) {
  return partSpecs[typeof part === "string" ? part : part.type];
}

export function partIcon(type: PartType) {
  return partSpecs[type].icon;
}

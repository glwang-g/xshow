import {
  Activity,
  BatteryCharging,
  BatteryMedium,
  Cable,
  CircleDot,
  CloudSync,
  Cog,
  Gauge,
  Lightbulb,
  PackageCheck,
  Save,
  SlidersHorizontal,
  ToggleRight,
  TriangleRight,
  Trophy,
  Volume2,
} from "@lucide/vue";
import type { CircuitPart, PartType, TerminalKey } from "@/lib/circuit";

export type PartSpec = {
  icon: unknown;
  label: string;
  width: number;
  height: number;
  terminals: Record<TerminalKey, { x: number; y: number; label: string }>;
};

export type PaletteItem = {
  description: string;
  type: PartType;
};

export type StatusPanelTab = "circuit" | "cloud" | "kit" | "lesson" | "records" | "selection" | "wires";

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
    width: 176,
    height: 104,
    terminals: {
      a: { x: 0, y: 52, label: "-" },
      b: { x: 176, y: 52, label: "+" },
    },
  },
  switch: {
    icon: ToggleRight,
    label: "开关",
    width: 168,
    height: 96,
    terminals: {
      a: { x: 0, y: 48, label: "A" },
      b: { x: 168, y: 48, label: "B" },
    },
  },
  bulb: {
    icon: Lightbulb,
    label: "灯泡",
    width: 156,
    height: 156,
    terminals: {
      a: { x: 0, y: 78, label: "A" },
      b: { x: 156, y: 78, label: "B" },
    },
  },
  resistor: {
    icon: SlidersHorizontal,
    label: "可变电阻",
    width: 216,
    height: 110,
    terminals: {
      a: { x: 0, y: 55, label: "A" },
      b: { x: 216, y: 55, label: "B" },
    },
  },
  led: {
    icon: CircleDot,
    label: "LED",
    width: 156,
    height: 128,
    terminals: {
      a: { x: 0, y: 64, label: "-" },
      b: { x: 156, y: 64, label: "+" },
    },
  },
  diode: {
    icon: TriangleRight,
    label: "二极管",
    width: 156,
    height: 112,
    terminals: {
      a: { x: 0, y: 56, label: "-" },
      b: { x: 156, y: 56, label: "+" },
    },
  },
  capacitor: {
    icon: BatteryMedium,
    label: "电容",
    width: 156,
    height: 112,
    terminals: {
      a: { x: 0, y: 56, label: "A" },
      b: { x: 156, y: 56, label: "B" },
    },
  },
  ammeter: {
    icon: Activity,
    label: "电流表",
    width: 156,
    height: 112,
    terminals: {
      a: { x: 0, y: 56, label: "A" },
      b: { x: 156, y: 56, label: "B" },
    },
  },
  voltmeter: {
    icon: Gauge,
    label: "电压表",
    width: 156,
    height: 112,
    terminals: {
      a: { x: 0, y: 56, label: "A" },
      b: { x: 156, y: 56, label: "B" },
    },
  },
  buzzer: {
    icon: Volume2,
    label: "蜂鸣器",
    width: 156,
    height: 128,
    terminals: {
      a: { x: 0, y: 64, label: "A" },
      b: { x: 156, y: 64, label: "B" },
    },
  },
  motor: {
    icon: Cog,
    label: "电机",
    width: 156,
    height: 128,
    terminals: {
      a: { x: 0, y: 64, label: "A" },
      b: { x: 156, y: 64, label: "B" },
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
  { type: "ammeter", description: "测量电流" },
  { type: "voltmeter", description: "测量电压" },
];

export const statusPanelTabs: StatusPanelTabItem[] = [
  { icon: Trophy, id: "lesson", label: "课程" },
  { icon: Gauge, id: "circuit", label: "回路" },
  { icon: SlidersHorizontal, id: "selection", label: "属性" },
  { icon: PackageCheck, id: "kit", label: "实体" },
  { icon: Save, id: "records", label: "记录" },
  { icon: CloudSync, id: "cloud", label: "云端" },
  { icon: Cable, id: "wires", label: "导线" },
];

export function getSpec(part: CircuitPart | PartType) {
  return partSpecs[typeof part === "string" ? part : part.type];
}

export function partIcon(type: PartType) {
  return partSpecs[type].icon;
}

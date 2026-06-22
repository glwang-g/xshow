import {
  batteryPositiveTerminal,
  type CircuitPart,
  type CircuitSimulation,
  type PartType,
  type TerminalKey,
  type TerminalRef,
  type Wire,
} from "@/lib/circuit";
import type { PhysicalBuildPlan } from "@/lib/physical-build";

export type ExperimentReportStep = {
  complete: boolean;
  description: string;
};

export type ExperimentReportOptions = {
  generatedAt: string;
  lessonObjective: string;
  lessonSteps: ExperimentReportStep[];
  lessonTitle: string;
  physicalBuildPlan: PhysicalBuildPlan;
  parts: CircuitPart[];
  simulation: CircuitSimulation;
  title?: string;
  wires: Wire[];
};

const partTypeLabels: Record<PartType, string> = {
  ammeter: "电流表",
  battery: "电池",
  bulb: "灯泡",
  buzzer: "蜂鸣器",
  capacitor: "电容",
  diode: "二极管",
  led: "LED",
  motor: "电机",
  resistor: "电阻",
  switch: "开关",
  voltmeter: "电压表",
};

function terminalLabel(part: CircuitPart | undefined, terminal: TerminalKey) {
  if (!part) {
    return terminal.toUpperCase();
  }

  if (part.type === "battery") {
    return batteryPositiveTerminal(part) === terminal ? "+" : "-";
  }

  if (part.type === "led" || part.type === "diode") {
    return terminal === "b" ? "+" : "-";
  }

  return terminal.toUpperCase();
}

function terminalName(partsById: ReadonlyMap<string, CircuitPart>, ref: TerminalRef) {
  const part = partsById.get(ref.partId);
  if (!part) {
    return `缺失元件 ${ref.partId}:${ref.terminal}`;
  }

  return `${part.name} ${terminalLabel(part, ref.terminal)}端`;
}

function partState(part: CircuitPart) {
  if (part.type === "battery") {
    return `正极在 ${batteryPositiveTerminal(part) === "a" ? "A" : "B"} 端`;
  }

  if (part.type === "switch") {
    return part.closed ? "闭合" : "断开";
  }

  if (part.type === "resistor") {
    return `${part.resistance ?? 0} Ω`;
  }

  if (part.type === "led" || part.type === "diode") {
    return "注意极性";
  }

  return "常规元件";
}

function checklistLine(complete: boolean, text: string) {
  return `- [${complete ? "x" : " "}] ${text}`;
}

export function formatExperimentReportMarkdown(options: ExperimentReportOptions) {
  const partsById = new Map(options.parts.map((part) => [part.id, part]));
  const completedSteps = options.lessonSteps.filter((step) => step.complete).length;
  const title = options.title?.trim() || `${options.lessonTitle} 实验报告`;
  const partLines = options.parts.map((part) => {
    return `- ${part.name}（${partTypeLabels[part.type]}）：${partState(part)}`;
  });
  const wireLines = options.wires.length
    ? options.wires.map((wire, index) => {
        return `- ${index + 1}. ${terminalName(partsById, wire.from)} -> ${terminalName(partsById, wire.to)}`;
      })
    : ["- 暂无导线连接。"];
  const warningLines = options.physicalBuildPlan.warnings.length
    ? options.physicalBuildPlan.warnings.map((warning) => `- ${warning.message}`)
    : ["- 暂无额外提醒。"];

  return [
    `# ${title}`,
    "",
    `生成时间：${options.generatedAt}`,
    "",
    "## 实验目标",
    "",
    `- 实验：${options.lessonTitle}`,
    `- 目标：${options.lessonObjective}`,
    `- 任务进度：${completedSteps}/${options.lessonSteps.length}`,
    "",
    "## 当前结论",
    "",
    `- 回路状态：${options.simulation.closed ? "闭合" : "断开"}`,
    `- 电流：${options.simulation.currentMilliAmps} mA`,
    `- 等效电阻：${options.simulation.equivalentResistance} Ω`,
    "",
    "## 任务检查",
    "",
    ...(options.lessonSteps.length
      ? options.lessonSteps.map((step) => checklistLine(step.complete, step.description))
      : ["- 暂无任务检查。"]),
    "",
    "## 元器件",
    "",
    ...(partLines.length ? partLines : ["- 暂无元器件。"]),
    "",
    "## 接线记录",
    "",
    ...wireLines,
    "",
    "## 实体搭建建议",
    "",
    options.physicalBuildPlan.summary,
    "",
    ...warningLines,
    "",
    "## 观察记录",
    "",
    "- 现象：",
    "- 调整：",
    "- 结论：",
    "",
  ].join("\n");
}

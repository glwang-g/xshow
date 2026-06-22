import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const circuitModuleUrl = await compiledModuleUrl("../src/lib/circuit.ts", import.meta.url);
const report = await import(
  await compiledModuleUrl("../src/lib/experiment-report.ts", import.meta.url, [["@/lib/circuit", circuitModuleUrl]])
);

test("experiment report markdown summarizes lesson progress, circuit state, and wiring", () => {
  const markdown = report.formatExperimentReportMarkdown({
    generatedAt: "2026-06-22T00:00:00.000Z",
    lessonObjective: "观察开关闭合后灯泡点亮。",
    lessonSteps: [
      { complete: true, description: "连接电池和开关" },
      { complete: false, description: "观察灯泡亮度" },
    ],
    lessonTitle: "点亮小灯泡",
    physicalBuildPlan: {
      connections: [],
      items: [],
      ready: true,
      summary: "已生成 3 类物料和 2 条接线步骤。",
      warnings: [{ id: "current-limit", message: "实体搭建时注意限流。", tone: "warning" }],
    },
    parts: [
      { id: "battery-1", name: "9V 电池", type: "battery", x: 0, y: 0 },
      { id: "switch-1", name: "开关", type: "switch", x: 0, y: 0, closed: true },
      { id: "bulb-1", name: "小灯泡", type: "bulb", x: 0, y: 0 },
      { id: "resistor-1", name: "电阻", type: "resistor", x: 0, y: 0, resistance: 48 },
    ],
    simulation: {
      bulbs: {},
      buzzers: {},
      capacitors: {},
      closed: true,
      currentMilliAmps: 136,
      diodes: {},
      equivalentResistance: 66,
      leds: {},
      motors: {},
      nodes: {},
      voltmeters: {},
      wires: {},
    },
    wires: [
      { id: "wire-1", from: { partId: "battery-1", terminal: "b" }, to: { partId: "switch-1", terminal: "a" } },
      { id: "wire-2", from: { partId: "switch-1", terminal: "b" }, to: { partId: "bulb-1", terminal: "a" } },
    ],
  });

  assert.match(markdown, /^# 点亮小灯泡 实验报告/);
  assert.match(markdown, /任务进度：1\/2/);
  assert.match(markdown, /- \[x\] 连接电池和开关/);
  assert.match(markdown, /- \[ \] 观察灯泡亮度/);
  assert.match(markdown, /回路状态：闭合/);
  assert.match(markdown, /电流：136 mA/);
  assert.match(markdown, /9V 电池（电池）：正极在 B 端/);
  assert.match(markdown, /1\. 9V 电池 \+端 -> 开关 A端/);
  assert.match(markdown, /实体搭建时注意限流。/);
  assert.match(markdown, /## 观察记录/);
});

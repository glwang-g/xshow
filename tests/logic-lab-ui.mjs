import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const logicLabSource = await readFile(new URL("../src/views/LogicLab.vue", import.meta.url), "utf8");

test("logic lab exposes a source-expandable half adder composed from published gates", () => {
  assert.match(logicLabSource, /composeHalfAdder/);
  assert.match(logicLabSource, /SUM = \(A OR B\) AND NOT\(A AND B\)/);
  assert.match(logicLabSource, /query: \{ module: module\.id \}/);
  assert.match(logicLabSource, /缺少 \$\{halfAdder\.missing\.join/);
  assert.match(logicLabSource, /composeFullAdder/);
  assert.match(logicLabSource, /两个半加器接力，再用 OR 合并两个进位。/);
});

test("logic lab keeps the rising-edge Rule Mission acknowledgement visible after clock reset", () => {
  assert.match(logicLabSource, /DigitalWorkbench/);
  assert.match(logicLabSource, /统一的时钟周期写入寄存器/);
  assert.ok(logicLabSource.indexOf("<DigitalWorkbench v-show") < logicLabSource.indexOf("我的电路模块"));
});

test("logic lab keeps the workbench as the default task and moves legacy material behind an explicit reference mode", () => {
  assert.match(logicLabSource, /activeLogicView = ref<"workspace" \| "reference">\("workspace"\)/);
  assert.match(logicLabSource, /数字工作台/);
  assert.match(logicLabSource, /模块与原理资料/);
  assert.match(logicLabSource, /<DigitalWorkbench v-show="activeLogicView === 'workspace'"/);
  assert.match(logicLabSource, /<div v-show="activeLogicView === 'reference'"/);
  assert.match(logicLabSource, /<aside v-show="activeLogicView === 'reference'"/);
});

test("digital workbench exposes modules, signals, and a full clock-cycle operation instead of analogue circuit parts", async () => {
  const source = await readFile(new URL("../src/components/logic/DigitalWorkbench.vue", import.meta.url), "utf8");
  assert.match(source, /数字模块库/);
  assert.match(source, /画布 · Register starter/);
  assert.match(source, /当前模块/);
  assert.match(source, /执行 1 个时钟周期/);
  assert.match(source, /低 → 高（Q ← D）→ 低/);
  assert.match(source, /逻辑层不放电池、灯泡、电阻等自由电路件/);
  assert.match(source, /拖动画布中的模块调整布局/);
  assert.match(source, /portPosition/);
  assert.match(source, /wirePath\('data', 'out', 'register', 'd'\)/);
  assert.doesNotMatch(source, /viewBox=/);
  assert.match(source, />OUT<\/span>/);
  assert.match(source, />IN<\/span>/);
  assert.match(source, />D<\/span>/);
  assert.match(source, />CLK<\/span>/);
  assert.match(source, />Q<\/span>/);
  assert.match(source, /Rule Mission 回执/);
  assert.match(source, /全屏工作台/);
  assert.match(source, /fixed inset-0 z-50/);
  assert.match(source, /设为 \{\{ board\.data === 1 \? 0 : 1 \}\}/);
  assert.match(source, /执行 1 周期/);
  assert.match(source, /@click\.stop="toggleData"/);
  assert.match(source, /@click\.stop="advanceCycle"/);
  assert.match(source, /const canvasSize = ref\(\{ height: 500, width: 900 \}\)/);
  assert.doesNotMatch(source, /Math\.min\(790/);
  assert.doesNotMatch(source, /Math\.min\(420/);
  assert.match(source, /--digital-canvas-width/);
  assert.match(source, /overflow: auto/);
});

test("published modules present a four-terminal custom component before the behavior table", () => {
  assert.match(logicLabSource, /自定义元器件/);
  assert.match(logicLabSource, />COM<\/span>/);
  assert.match(logicLabSource, /moduleContactLabel\(module\)/);
  assert.match(logicLabSource, /行为验证 \/ 原理探究/);
});

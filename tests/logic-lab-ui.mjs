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

test("published modules present a four-terminal custom component before the behavior table", () => {
  assert.match(logicLabSource, /自定义元器件/);
  assert.match(logicLabSource, />COM<\/span>/);
  assert.match(logicLabSource, /moduleContactLabel\(module\)/);
  assert.match(logicLabSource, /行为验证 \/ 原理探究/);
});

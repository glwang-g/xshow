import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const logicLabSource = await readFile(new URL("../src/views/LogicLab.vue", import.meta.url), "utf8");

test("logic lab exposes a source-expandable half adder composed from published gates", () => {
  assert.match(logicLabSource, /composeHalfAdder/);
  assert.match(logicLabSource, /SUM = \(A OR B\) AND NOT\(A AND B\)/);
  assert.match(logicLabSource, /query: \{ module: module\.id \}/);
  assert.match(logicLabSource, /缺少 \$\{halfAdder\.missing\.join/);
});

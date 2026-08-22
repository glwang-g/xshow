import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const machineLabSource = await readFile(new URL("../src/views/ComputerLab.vue", import.meta.url), "utf8");

test("machine logic foundation keeps each consumed module expandable in the workshop", () => {
  assert.match(machineLabSource, /query: \{ module: slot\.module\.id \}/);
  assert.match(machineLabSource, /在器件工坊展开 \$\{slot\.module\.name\}/);
});

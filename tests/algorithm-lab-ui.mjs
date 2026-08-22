import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const algorithmLabSource = await readFile(new URL("../src/views/AlgorithmLab.vue", import.meta.url), "utf8");

test("algorithm lab starts in an observable idle state instead of auto-running the program", () => {
  assert.match(algorithmLabSource, /点击单步，从第一条指令开始观察。/);
  assert.doesNotMatch(algorithmLabSource, /onMounted[\s\S]*await loadAndRun\(\)/);
});

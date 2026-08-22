import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const computerLabSource = await readFile(new URL("../src/views/ComputerLab.vue", import.meta.url), "utf8");

test("machine lab presents the runtime bridge mode instead of a fixed WASM claim", () => {
  assert.match(computerLabSource, /const bridgeMessage = ref/);
  assert.match(computerLabSource, /\{\{ bridgeMode \}\}/);
  assert.match(computerLabSource, /Preview adapter active/);
  assert.doesNotMatch(computerLabSource, /computerCoreBridgeStatus/);
  assert.match(computerLabSource, /若本机 WASM 加载失败/);
});

test("machine actions preserve the visible state and explain a failed operation", () => {
  assert.match(computerLabSource, /当前状态已保留，可以重试。/);
  assert.match(computerLabSource, /机器核心暂时不可用，请刷新后重试。/);
});

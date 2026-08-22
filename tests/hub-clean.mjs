import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const hubSource = await readFile(new URL("../src/views/HubClean.vue", import.meta.url), "utf8");

test("hub explains the build-verify-use loop without presenting a fake full progress bar", () => {
  assert.match(hubSource, /学习方式/);
  assert.match(hubSource, /搭建/);
  assert.match(hubSource, /验证/);
  assert.match(hubSource, /使用/);
  assert.doesNotMatch(hubSource, /h-full w-full rounded-full bg-cyan-500/);
});

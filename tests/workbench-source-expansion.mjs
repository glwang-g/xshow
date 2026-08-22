import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const homeSource = await readFile(new URL("../src/views/Home.vue", import.meta.url), "utf8");

test("opening a published module from a mainline layer restores its full verification workspace when available", () => {
  assert.match(homeSource, /const sourceWorkspace = module\.implementation\.sourceWorkspace;/);
  assert.match(homeSource, /Expanding a module is a navigation action[\s\S]*pushEditorHistory\(\);/);
  assert.match(homeSource, /parts: sourceWorkspace\?\.parts \?\? module\.implementation\.parts/);
  assert.match(homeSource, /wires: sourceWorkspace\?\.wires \?\? module\.implementation\.wires/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const navigationSource = await readFile(new URL("../src/composables/useWorkbenchNavigation.ts", import.meta.url), "utf8");

test("opening a published module from a mainline layer restores its full verification workspace when available", () => {
  assert.match(navigationSource, /const sourceWorkspace = module\.implementation\.sourceWorkspace;/);
  assert.match(navigationSource, /options\.pushHistory\(\);/);
  assert.match(navigationSource, /parts: sourceWorkspace\?\.parts \?\? module\.implementation\.parts/);
  assert.match(navigationSource, /wires: sourceWorkspace\?\.wires \?\? module\.implementation\.wires/);
});

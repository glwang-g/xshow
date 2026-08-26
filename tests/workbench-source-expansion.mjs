import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const navigationSource = await readFile(new URL("../src/composables/useWorkbenchNavigation.ts", import.meta.url), "utf8");
const lessonChecksSource = await readFile(new URL("../src/composables/useCircuitLessonChecks.ts", import.meta.url), "utf8");

test("opening a published module from a mainline layer restores its full verification workspace when available", () => {
  assert.match(navigationSource, /function loadPublishedModuleFromRoute\(moduleId: string, view: "core" \| "verification" = "core"\)/);
  assert.match(navigationSource, /const sourceWorkspace = module\.implementation\.sourceWorkspace;/);
  assert.match(navigationSource, /const workspace = view === "verification" \? sourceWorkspace : undefined;/);
  assert.match(navigationSource, /options\.pushHistory\(\);/);
  assert.match(navigationSource, /parts: workspace\?\.parts \?\? module\.implementation\.parts/);
  assert.match(navigationSource, /wires: workspace\?\.wires \?\? module\.implementation\.wires/);
  assert.match(navigationSource, /function loadWorkbenchMode\(mode: "free" \| "workshop", moduleId = "", view: "core" \| "verification" = "core"\)/);
});

test("NOT lesson records both sequential truth-table states instead of requiring both at once", () => {
  assert.match(lessonChecksSource, /const notValidation = ref\(\{ outputOff: false, outputOn: false \}\)/);
  assert.match(lessonChecksSource, /if \(hasNotOutputOnState\(\)\) notValidation\.value\.outputOn = true/);
  assert.match(lessonChecksSource, /if \(hasNotOutputOffState\(\)\) notValidation\.value\.outputOff = true/);
  assert.match(lessonChecksSource, /const hasNotOutputOn = \(\) => notValidation\.value\.outputOn/);
  assert.match(lessonChecksSource, /const hasNotOutputOff = \(\) => notValidation\.value\.outputOff/);
});

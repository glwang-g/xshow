import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const canvasSource = await readFile(new URL("../src/components/workbench/WorkbenchCanvas.vue", import.meta.url), "utf8");

test("terminal pointer events keep endpoint rewiring on the shared drag lifecycle", () => {
  assert.match(canvasSource, /@pointermove\.stop="handleWorkbenchPointerMove"/);
  assert.match(canvasSource, /@pointerup\.stop="finishTerminalDrag"/);
  assert.match(canvasSource, /@pointercancel\.stop="endDrag"/);
  assert.doesNotMatch(canvasSource, /@pointerup\.stop="finishNewWireDrag"/);
  assert.doesNotMatch(canvasSource, /@pointermove\.stop="updateNewWireDrag"/);
});

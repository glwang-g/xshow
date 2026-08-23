import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const canvasSource = await readFile(new URL("../src/components/workbench/WorkbenchCanvas.vue", import.meta.url), "utf8");
const homeSource = await readFile(new URL("../src/views/Home.vue", import.meta.url), "utf8");

test("terminal pointer events keep endpoint rewiring on the shared drag lifecycle", () => {
  assert.match(canvasSource, /@pointermove\.stop="handleWorkbenchPointerMove"/);
  assert.match(canvasSource, /@pointerup\.stop="finishTerminalDrag"/);
  assert.match(canvasSource, /@pointercancel\.stop="endDrag"/);
  assert.doesNotMatch(canvasSource, /@pointerup\.stop="finishNewWireDrag"/);
  assert.doesNotMatch(canvasSource, /@pointermove\.stop="updateNewWireDrag"/);
});

test("workbench defers closed palette and status panel code while keeping the canvas eager", () => {
  assert.match(homeSource, /defineAsyncComponent\(\(\) => import\("@\/components\/workbench\/ComponentPalette\.vue"\)\)/);
  assert.match(homeSource, /defineAsyncComponent\(\(\) => import\("@\/components\/workbench\/StatusPanel\.vue"\)\)/);
  assert.match(homeSource, /import WorkbenchCanvas from "@\/components\/workbench\/WorkbenchCanvas\.vue"/);
  assert.match(homeSource, /<div v-if="desktopViewport \|\| palettePanelOpen"[\s\S]*?<ComponentPalette/);
  assert.match(homeSource, /<div v-if="desktopViewport \|\| statusPanelOpen"[\s\S]*?<StatusPanel/);
});

test("desktop workbench regions stay in one explicit grid row after deferred panels mount", () => {
  assert.match(homeSource, /const desktopViewport = ref\(isDesktopViewport\(\)\)/);
  assert.match(homeSource, /desktopViewport\.value = isDesktopViewport\(\)/);
  assert.match(homeSource, /<div v-if="desktopViewport \|\| palettePanelOpen" class="contents xl:col-start-1 xl:row-start-1 xl:block xl:min-h-0"/);
  assert.match(homeSource, /<WorkbenchCanvas\s+class="xl:col-start-2 xl:row-start-1"/);
  assert.match(homeSource, /<div v-if="desktopViewport \|\| statusPanelOpen" class="contents xl:col-start-3 xl:row-start-1 xl:block xl:min-h-0"/);
  assert.match(homeSource, /<ComponentPalette\s+class="xl:h-full"/);
  assert.match(homeSource, /<StatusPanel\s+class="xl:h-full"/);
});

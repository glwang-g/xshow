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

test("clicking blank workbench space clears selection without clearing interactive controls", () => {
  assert.match(canvasSource, /function handleWorkbenchSurfacePointerDown\(event: PointerEvent\)/);
  assert.match(canvasSource, /function handleCanvasViewportPointerDown\(event: PointerEvent\)/);
  assert.match(canvasSource, /target\.closest\("\[data-circuit-interactive='true'\], button, a, input, select, textarea"\)/);
  assert.match(canvasSource, /@pointerdown="handleWorkbenchSurfacePointerDown"/);
  assert.match(canvasSource, /@pointerdown="handleCanvasViewportPointerDown"/);
  assert.doesNotMatch(canvasSource, /@pointerdown\.self="clearCanvasSelection"/);
});

test("workbench canvas receives the full selection clear handler", () => {
  assert.match(homeSource, /:clear-canvas-selection="clearCanvasSelectionFromSelection"/);
  assert.doesNotMatch(homeSource, /<WorkbenchCanvas[\s\S]*?:clear-canvas-selection="clearCanvasSelection"/);
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

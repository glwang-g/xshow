import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const workbenchUiSource = await readFile(new URL("../src/lib/workbench-ui.ts", import.meta.url), "utf8");
const viteConfigSource = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");
const homeSource = await readFile(new URL("../src/views/Home.vue", import.meta.url), "utf8");
const reportSource = await readFile(new URL("../src/lib/experiment-report.ts", import.meta.url), "utf8");

test("the unfinished physical build checklist remains absent from public workbench tabs", () => {
  const tabsSource = workbenchUiSource.match(/export const statusPanelTabs[\s\S]*?\n\];/)?.[0] ?? "";
  assert.equal(tabsSource.includes('id: "kit"'), false);
  assert.equal(tabsSource.includes("实体搭建"), false);
  assert.match(tabsSource, /id: "lesson"/);
  assert.match(tabsSource, /id: "records"/);
});

test("the isolated optional renderer keeps a narrow build-size warning ceiling", () => {
  assert.match(viteConfigSource, /chunkSizeWarningLimit: 550/);
  assert.match(viteConfigSource, /optional Three\.js renderer is intentionally isolated/);
});

test("the deferred physical build capability stays out of public workbench and reports", () => {
  assert.doesNotMatch(homeSource, /createPhysicalBuildPlan|formatPhysicalBuildPlanMarkdown|formatPhysicalBuildSheetHtml/);
  assert.doesNotMatch(reportSource, /实体搭建建议|physicalBuildPlan/);
});

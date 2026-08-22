import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const workbenchUiSource = await readFile(new URL("../src/lib/workbench-ui.ts", import.meta.url), "utf8");

test("the unfinished physical build checklist remains absent from public workbench tabs", () => {
  const tabsSource = workbenchUiSource.match(/export const statusPanelTabs[\s\S]*?\n\];/)?.[0] ?? "";
  assert.equal(tabsSource.includes('id: "kit"'), false);
  assert.equal(tabsSource.includes("实体搭建"), false);
  assert.match(tabsSource, /id: "lesson"/);
  assert.match(tabsSource, /id: "records"/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const homeSource = await readFile(new URL("../src/views/Home.vue", import.meta.url), "utf8");
const panelSource = await readFile(new URL("../src/components/workbench/StatusPanel.vue", import.meta.url), "utf8");

test("invalid share and autosave recovery has a visible records-panel explanation", () => {
  assert.match(homeSource, /分享链接中的工作台数据无效，已忽略该链接。/);
  assert.match(homeSource, /上次自动保存的数据不完整，已安全回退到默认工作台。/);
  assert.match(homeSource, /:workspace-recovery-message="workspaceRecoveryMessage"/);
  assert.match(panelSource, /v-if="workspaceRecoveryMessage"/);
  assert.match(panelSource, /原文件没有被上传或覆盖；你仍可导入正确的 JSON 继续使用。/);
});

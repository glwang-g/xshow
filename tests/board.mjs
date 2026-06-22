import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const piniaStubUrl = `data:text/javascript;base64,${Buffer.from(
  "export function defineStore(){ return function useStore(){ return {}; }; }",
).toString("base64")}`;
const board = await import(await compiledModuleUrl("../src/stores/board.ts", import.meta.url, [["pinia", piniaStubUrl]]));

test("board zoom clamp keeps values finite and within bounds", () => {
  assert.equal(board.clampBoardZoom(10), board.minBoardZoom);
  assert.equal(board.clampBoardZoom(200), board.maxBoardZoom);
  assert.equal(board.clampBoardZoom(86.4), 86);
  assert.equal(board.clampBoardZoom(Number.NaN, 72), 72);
});

/* @ts-self-types="./cpu_sim_wasm.d.ts" */
import * as wasm from "./cpu_sim_wasm_bg.wasm";
import { __wbg_set_wasm } from "./cpu_sim_wasm_bg.js";

__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    getState, loadProgram, reset, runUntilHalt, start, step
} from "./cpu_sim_wasm_bg.js";

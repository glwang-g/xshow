//! Browser-facing WASM facade for the 8-bit teaching CPU.
//!
//! This crate deliberately stays thin: the assembler and CPU behavior remain
//! in `cpu-sim-core`; this layer owns one browser VM instance and translates
//! snapshots into the camelCase contract used by the main Vue app.

use std::cell::RefCell;

use cpu_sim_core::{
    assembler::assemble,
    cpu::{Cpu, CpuState, Flags},
};
use serde::Serialize;
use wasm_bindgen::prelude::*;

thread_local! {
    static CPU: RefCell<Cpu> = RefCell::new(Cpu::new());
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WebCpuState {
    a: u8,
    b: u8,
    pc: u8,
    flags: Flags,
    flags_byte: u8,
    memory: Vec<u8>,
    log: Vec<String>,
    halted: bool,
    current_instruction: String,
}

impl From<CpuState> for WebCpuState {
    fn from(state: CpuState) -> Self {
        Self {
            a: state.a,
            b: state.b,
            pc: state.pc,
            flags: state.flags,
            flags_byte: state.flags_byte,
            memory: state.memory,
            log: state.log,
            halted: state.halted,
            current_instruction: state.current_instruction,
        }
    }
}

#[wasm_bindgen(start)]
pub fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen(js_name = loadProgram)]
pub fn load_program(source: &str) -> Result<JsValue, JsValue> {
    let program = assemble(source).map_err(js_error)?;
    with_cpu(|cpu| {
        cpu.load(&program);
        cpu.snapshot()
    })
}

#[wasm_bindgen(js_name = step)]
pub fn step() -> Result<JsValue, JsValue> {
    with_cpu(|cpu| {
        cpu.step();
        cpu.snapshot()
    })
}

#[wasm_bindgen(js_name = reset)]
pub fn reset() -> Result<JsValue, JsValue> {
    with_cpu(|cpu| {
        cpu.reset();
        cpu.snapshot()
    })
}

#[wasm_bindgen(js_name = getState)]
pub fn get_state() -> Result<JsValue, JsValue> {
    with_cpu(|cpu| cpu.snapshot())
}

#[wasm_bindgen(js_name = runUntilHalt)]
pub fn run_until_halt(max_steps: u32) -> Result<JsValue, JsValue> {
    with_cpu(|cpu| {
        cpu.run_until_halt(max_steps);
        cpu.snapshot()
    })
}

fn with_cpu(action: impl FnOnce(&mut Cpu) -> CpuState) -> Result<JsValue, JsValue> {
    CPU.with(|cell| {
        let mut cpu = cell.borrow_mut();
        to_js(action(&mut cpu))
    })
}

fn to_js(state: CpuState) -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(&WebCpuState::from(state)).map_err(js_error)
}

fn js_error(error: impl ToString) -> JsValue {
    JsValue::from_str(&error.to_string())
}

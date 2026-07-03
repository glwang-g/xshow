// Prevent additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

//! Tauri entry point. Owns the `Cpu` inside a `Mutex` and exposes five
//! commands to the front-end.

use std::sync::Mutex;

use cpu_sim_core::{assembler::assemble, cpu::{Cpu, CpuState}};
use tauri::State;

/// Wrapper around the VM so `#[tauri::command]` can borrow it.
struct AppState {
    cpu: Mutex<Cpu>,
}

impl AppState {
    fn new() -> Self {
        Self { cpu: Mutex::new(Cpu::new()) }
    }
}

/// Lock helper: turns a poisoned lock into a user-visible error string
/// instead of crashing the whole app.
fn lock_cpu<'a>(state: &'a State<'a, AppState>) -> Result<std::sync::MutexGuard<'a, Cpu>, String> {
    state.cpu.lock().map_err(|e| format!("cpu mutex poisoned: {e}"))
}

#[tauri::command]
fn load_program(source: String, state: State<'_, AppState>) -> Result<CpuState, String> {
    let bytes = assemble(&source).map_err(|e| e.to_string())?;
    let mut cpu = lock_cpu(&state)?;
    cpu.load(&bytes);
    Ok(cpu.snapshot())
}

#[tauri::command]
fn step(state: State<'_, AppState>) -> Result<CpuState, String> {
    let mut cpu = lock_cpu(&state)?;
    cpu.step();
    Ok(cpu.snapshot())
}

#[tauri::command]
fn reset(state: State<'_, AppState>) -> Result<CpuState, String> {
    let mut cpu = lock_cpu(&state)?;
    cpu.reset();
    Ok(cpu.snapshot())
}

#[tauri::command]
fn get_state(state: State<'_, AppState>) -> Result<CpuState, String> {
    let cpu = lock_cpu(&state)?;
    Ok(cpu.snapshot())
}

#[tauri::command]
fn run_until_halt(max_steps: u32, state: State<'_, AppState>) -> Result<CpuState, String> {
    let mut cpu = lock_cpu(&state)?;
    cpu.run_until_halt(max_steps);
    Ok(cpu.snapshot())
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            load_program,
            step,
            reset,
            get_state,
            run_until_halt
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}

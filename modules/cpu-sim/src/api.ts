/**
 * Thin typed wrapper around the Tauri command bridge. The Rust side is the
 * source of truth for everything the UI shows; every call returns a fresh
 * `CpuState` snapshot which we hand straight to the composable.
 */

import { invoke } from "@tauri-apps/api/core";
import type { CpuState } from "./types";

export function loadProgram(source: string): Promise<CpuState> {
  return invoke<CpuState>("load_program", { source });
}

export function step(): Promise<CpuState> {
  return invoke<CpuState>("step");
}

export function reset(): Promise<CpuState> {
  return invoke<CpuState>("reset");
}

export function getState(): Promise<CpuState> {
  return invoke<CpuState>("get_state");
}

export function runUntilHalt(maxSteps = 10_000): Promise<CpuState> {
  return invoke<CpuState>("run_until_halt", { maxSteps });
}

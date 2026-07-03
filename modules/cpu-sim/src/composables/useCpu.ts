/**
 * Module-singleton composable that owns the entire UI state. Every panel
 * imports `useCpu()` and shares the same `ref` — Vue re-renders on write.
 *
 * The Rust side is authoritative: we never mutate `state.value.memory`
 * locally. Each action calls a Tauri command and replaces the snapshot.
 */

import { ref } from "vue";
import * as api from "@/api";
import type { CpuState } from "@/types";

// --- singleton state --------------------------------------------------------

const state = ref<CpuState | null>(null);
const error = ref<string | null>(null);
const running = ref(false);

/** Whether a Run loop is currently walking the CPU one step at a time. */
const stepping = ref(false);

// A module-scoped handle so Pause can cancel the loop from any component.
let runTimer: number | null = null;

function stopRunLoop() {
  if (runTimer !== null) {
    window.clearInterval(runTimer);
    runTimer = null;
  }
  running.value = false;
}

// --- guarded command helpers -----------------------------------------------

async function guarded<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    const result = await fn();
    error.value = null;
    return result;
  } catch (e) {
    // Rust returns `Result<_, String>`; Tauri surfaces the string as `e`.
    error.value = typeof e === "string" ? e : String(e);
    return null;
  }
}

// --- exposed api ------------------------------------------------------------

export function useCpu() {
  async function load(source: string) {
    stopRunLoop();
    const s = await guarded(() => api.loadProgram(source));
    if (s) state.value = s;
  }

  async function stepOnce() {
    if (state.value?.halted) return;
    stepping.value = true;
    try {
      const s = await guarded(api.step);
      if (s) state.value = s;
    } finally {
      stepping.value = false;
    }
  }

  /**
   * Continuous run: fire a `step` command on a fixed cadence so the UI can
   * animate. `intervalMs` of 0 falls back to `run_until_halt`, which is
   * dramatically faster but jumps straight to the result.
   */
  function run(intervalMs = 60) {
    if (running.value || !state.value || state.value.halted) return;
    if (intervalMs <= 0) {
      void guarded(api.runUntilHalt).then((s) => {
        if (s) state.value = s;
      });
      return;
    }
    running.value = true;
    runTimer = window.setInterval(async () => {
      const s = await guarded(api.step);
      if (!s) {
        stopRunLoop();
        return;
      }
      state.value = s;
      if (s.halted) stopRunLoop();
    }, intervalMs);
  }

  function pause() {
    stopRunLoop();
  }

  async function resetCpu() {
    stopRunLoop();
    const s = await guarded(api.reset);
    if (s) state.value = s;
  }

  async function refresh() {
    const s = await guarded(api.getState);
    if (s) state.value = s;
  }

  return {
    // reactive state (all readonly-by-convention on the outside)
    state,
    error,
    running,
    stepping,

    // actions
    load,
    step: stepOnce,
    run,
    pause,
    reset: resetCpu,
    refresh,
  };
}

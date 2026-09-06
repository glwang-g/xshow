import type { LogicBit } from "@/lib/logic-core";
import {
  createClockedRegisterMissionState,
  projectRegisterMissionEvent,
  tickClockedRegisterMission,
  type RegisterMissionState,
} from "@/lib/clocked-register-mission";
import type { RuleMissionEvent } from "@/lib/simulation-contract";

/**
 * The common, discrete operation boundary for the logic, machine, and
 * algorithm layers.  Unlike the circuit workbench this model advances in
 * explicit clock cycles; it intentionally has no batteries, bulbs, or
 * analogue switches as editable parts.
 */
export type DigitalWorkbenchState = {
  data: LogicBit;
  lastMission: RuleMissionEvent | null;
  register: RegisterMissionState;
};

export function createRegisterWorkbenchState(): DigitalWorkbenchState {
  return { data: 0, lastMission: null, register: createClockedRegisterMissionState() };
}

export function setWorkbenchData(state: DigitalWorkbenchState, data: LogicBit): DigitalWorkbenchState {
  return { ...state, data };
}

/** One learner operation is a complete low → high → low clock cycle.
 * The rising tick is preserved as the acknowledgement because it is where
 * the register actually writes Q ← D. */
export function advanceRegisterWorkbenchCycle(state: DigitalWorkbenchState): DigitalWorkbenchState {
  const rising = tickClockedRegisterMission(state.register, {
    source: "user",
    type: "clock-cycle",
    payload: { clock: 1, data: state.data },
  });
  const capture = rising.events?.at(-1);
  const lowered = tickClockedRegisterMission(rising, {
    source: "system",
    type: "clock-low",
    payload: { clock: 0 },
  });
  return { ...state, lastMission: capture ? projectRegisterMissionEvent(capture) : null, register: lowered };
}

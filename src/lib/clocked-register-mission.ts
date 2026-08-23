import type { LogicBit } from "@/lib/logic-core";
import type { SimulationAction, SimulationEvent, SimulationState } from "@/lib/simulation-contract";

export type RegisterMissionAction = SimulationAction<{ clock?: LogicBit; data?: LogicBit }>;
export type RegisterMissionEvent = SimulationEvent<{ clock: LogicBit; data: LogicBit; q: LogicBit; captured: boolean }>;
export type RegisterMissionState = SimulationState<{ clock: LogicBit; data: LogicBit; q: LogicBit }, never, RegisterMissionEvent>;

export function createClockedRegisterMissionState(): RegisterMissionState {
  return { data: { clock: 0, data: 0, q: 0 }, entities: [], events: [], status: "ready", tick: 0 };
}

export function tickClockedRegisterMission(
  state: RegisterMissionState,
  action: RegisterMissionAction,
): RegisterMissionState {
  const clock = action.payload?.clock ?? state.data.clock;
  const data = action.payload?.data ?? state.data.data;
  const captured = state.data.clock === 0 && clock === 1;
  const q = captured ? data : state.data.q;
  const tick = state.tick + 1;
  const event: RegisterMissionEvent = {
    tick,
    type: captured ? "register.captured" : "register.held",
    message: captured ? `上升沿捕获 D=${data}，Q 写入 ${q}` : `没有上升沿，Q 保持 ${q}`,
    payload: { captured, clock, data, q },
  };

  return { ...state, data: { clock, data, q }, events: [...(state.events ?? []), event], status: "paused", tick };
}

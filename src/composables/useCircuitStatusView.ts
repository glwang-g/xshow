import { computed, type ComputedRef, type Ref } from "vue";
import type {
  AmmeterState,
  BuzzerState,
  CapacitorState,
  CircuitPart,
  CircuitSimulation,
  DiodeState,
  LedState,
  MotorState,
  VoltmeterState,
} from "@/lib/circuit";

export function useCircuitStatusView(
  parts: Ref<CircuitPart[]>,
  simulation: ComputedRef<CircuitSimulation>,
) {
  const bulbParts = () => parts.value.filter((part) => part.type === "bulb");
  const ledParts = () => parts.value.filter((part) => part.type === "led");
  const diodeParts = () => parts.value.filter((part) => part.type === "diode");
  const ammeterParts = () => parts.value.filter((part) => part.type === "ammeter");
  const voltmeterParts = () => parts.value.filter((part) => part.type === "voltmeter");
  const buzzerParts = () => parts.value.filter((part) => part.type === "buzzer");
  const motorParts = () => parts.value.filter((part) => part.type === "motor");
  const capacitorParts = () => parts.value.filter((part) => part.type === "capacitor");

  const litBulbParts = () => bulbParts().filter((part) => (simulation.value.bulbs[part.id]?.brightness ?? 0) > 0);
  const litLedParts = () => ledParts().filter((part) => (simulation.value.leds[part.id]?.brightness ?? 0) > 0);
  const bulbBrightness = (part: CircuitPart) => simulation.value.bulbs[part.id]?.brightness ?? 0;
  const twoBulbBrightnessValues = () => bulbParts().slice(0, 2).map(bulbBrightness);

  function ledStatus(part: CircuitPart): LedState {
    return simulation.value.leds[part.id] ?? { brightness: 0, brightnessPercent: 0, forward: false, overCurrent: false, reversed: false };
  }
  function diodeStatus(part: CircuitPart): DiodeState {
    return simulation.value.diodes[part.id] ?? { conducting: false, forward: false, overCurrent: false, reversed: false };
  }
  function capacitorStatus(part: CircuitPart): CapacitorState {
    return simulation.value.capacitors[part.id] ?? { chargePercent: 0, charging: false, connected: false, voltage: 0 };
  }
  function ammeterStatus(part: CircuitPart): AmmeterState {
    return simulation.value.ammeters[part.id] ?? { active: false, currentMilliAmps: 0 };
  }
  function voltmeterStatus(part: CircuitPart): VoltmeterState {
    return simulation.value.voltmeters[part.id] ?? { active: false, voltage: 0 };
  }
  function buzzerStatus(part: CircuitPart): BuzzerState {
    return simulation.value.buzzers[part.id] ?? { active: false, volume: 0, volumePercent: 0 };
  }
  function motorStatus(part: CircuitPart): MotorState {
    return simulation.value.motors[part.id] ?? { active: false, speed: 0, speedPercent: 0 };
  }

  const currentAnimationDuration = computed(() => {
    if (!simulation.value.closed || simulation.value.currentMilliAmps <= 0) return "1.6s";
    const duration = Math.max(0.45, Math.min(1.8, 1.8 - simulation.value.currentMilliAmps / 160));
    return `${duration.toFixed(2)}s`;
  });

  return {
    ammeterParts, ammeterStatus, bulbBrightness, bulbParts, buzzerParts, buzzerStatus,
    capacitorParts, capacitorStatus, currentAnimationDuration, diodeParts, diodeStatus,
    ledParts, ledStatus, litBulbParts, litLedParts, motorParts, motorStatus,
    twoBulbBrightnessValues, voltmeterParts, voltmeterStatus,
  };
}

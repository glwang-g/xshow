import { computed, ref, watch, type ComputedRef, type Ref } from "vue";
import type { CircuitPart, CircuitSimulation, TerminalRef, Wire } from "@/lib/circuit";
import { hasPath, sameTerminal, terminalId } from "@/lib/circuit";
import type { LessonCheckId } from "@/data/lessons";
import type { useCircuitStatusView } from "@/composables/useCircuitStatusView";

type StatusView = ReturnType<typeof useCircuitStatusView>;

type Options = {
  mainBulbBrightness: ComputedRef<number>;
  parts: Ref<CircuitPart[]>;
  simulation: ComputedRef<CircuitSimulation>;
  status: StatusView;
  wires: Ref<Wire[]>;
};

export function useCircuitLessonChecks(options: Options) {
  const { parts, simulation, status, wires } = options;
  const { ammeterParts, ammeterStatus, bulbParts, buzzerParts, buzzerStatus, capacitorParts, capacitorStatus,
    diodeParts, diodeStatus, ledParts, ledStatus, litBulbParts, litLedParts, motorParts, motorStatus,
    twoBulbBrightnessValues, voltmeterParts, voltmeterStatus } = status;

  function hasWireBetween(left: TerminalRef, right: TerminalRef) {
    return wires.value.some((wire) =>
      (sameTerminal(wire.from, left) && sameTerminal(wire.to, right)) ||
      (sameTerminal(wire.from, right) && sameTerminal(wire.to, left)));
  }

  function hasWirePathBetween(left: TerminalRef, right: TerminalRef) {
    const graph = new Map<string, string[]>();
    for (const wire of wires.value) {
      const from = terminalId(wire.from); const to = terminalId(wire.to);
      graph.set(from, [...(graph.get(from) ?? []), to]);
      graph.set(to, [...(graph.get(to) ?? []), from]);
    }
    return hasPath(terminalId(left), terminalId(right), Array.from(graph.entries()).flatMap(([from, targets]) =>
      targets.map((to) => ({ from, to }))));
  }

  function hasSeriesBulbRoute() {
    const bulbs = bulbParts();
    return bulbs.length >= 2 && bulbs.some((left) => bulbs.some((right) => left.id !== right.id &&
      (hasWireBetween({ partId: left.id, terminal: "b" }, { partId: right.id, terminal: "a" }) ||
        hasWireBetween({ partId: left.id, terminal: "a" }, { partId: right.id, terminal: "b" }))));
  }

  function hasParallelBulbRoute() {
    const bulbs = bulbParts();
    return bulbs.length >= 2 && bulbs.some((left) => bulbs.some((right) => left.id !== right.id &&
      ((hasWirePathBetween({ partId: left.id, terminal: "a" }, { partId: right.id, terminal: "a" }) &&
        hasWirePathBetween({ partId: left.id, terminal: "b" }, { partId: right.id, terminal: "b" })) ||
        (hasWirePathBetween({ partId: left.id, terminal: "a" }, { partId: right.id, terminal: "b" }) &&
          hasWirePathBetween({ partId: left.id, terminal: "b" }, { partId: right.id, terminal: "a" })))));
  }

  const hasSeriesAmmeterWiring = () =>
    hasWireBetween({ partId: "battery-1", terminal: "b" }, { partId: "switch-1", terminal: "a" }) &&
    hasWireBetween({ partId: "switch-1", terminal: "b" }, { partId: "ammeter-1", terminal: "a" }) &&
    hasWireBetween({ partId: "ammeter-1", terminal: "b" }, { partId: "bulb-1", terminal: "a" }) &&
    hasWireBetween({ partId: "bulb-1", terminal: "b" }, { partId: "resistor-1", terminal: "b" }) &&
    hasWireBetween({ partId: "resistor-1", terminal: "a" }, { partId: "battery-1", terminal: "a" });
  const hasParallelOutputWiring = () =>
    hasWireBetween({ partId: "battery-1", terminal: "b" }, { partId: "switch-1", terminal: "a" }) &&
    hasWireBetween({ partId: "switch-1", terminal: "b" }, { partId: "buzzer-1", terminal: "a" }) &&
    hasWireBetween({ partId: "switch-1", terminal: "b" }, { partId: "motor-1", terminal: "a" }) &&
    hasWireBetween({ partId: "buzzer-1", terminal: "b" }, { partId: "resistor-1", terminal: "b" }) &&
    hasWireBetween({ partId: "motor-1", terminal: "b" }, { partId: "resistor-1", terminal: "b" }) &&
    hasWireBetween({ partId: "resistor-1", terminal: "a" }, { partId: "battery-1", terminal: "a" });
  const hasSwitchedCapacitorWiring = () =>
    hasWireBetween({ partId: "battery-1", terminal: "b" }, { partId: "switch-1", terminal: "a" }) &&
    hasWireBetween({ partId: "switch-1", terminal: "b" }, { partId: "capacitor-1", terminal: "b" }) &&
    hasWireBetween({ partId: "capacitor-1", terminal: "a" }, { partId: "battery-1", terminal: "a" });
  const hasForwardDiodeWiring = () =>
    hasWireBetween({ partId: "battery-1", terminal: "b" }, { partId: "switch-1", terminal: "a" }) &&
    hasWireBetween({ partId: "switch-1", terminal: "b" }, { partId: "resistor-1", terminal: "a" }) &&
    hasWireBetween({ partId: "resistor-1", terminal: "b" }, { partId: "diode-1", terminal: "b" }) &&
    hasWireBetween({ partId: "diode-1", terminal: "a" }, { partId: "battery-1", terminal: "a" });

  const hasRelayParts = () => ["battery", "switch", "coil", "spring", "bulb", "resistor"].every((type) => parts.value.some((part) => part.type === type));
  const hasRelayLink = () => parts.value.some((part) => part.type === "spring" && part.controlledBy === "coil-1");
  const hasEnergizedRelay = () => hasRelayLink() && Boolean(simulation.value.coils["coil-1"]?.energized);
  const hasRelayOutput = () => hasEnergizedRelay() && (simulation.value.bulbs["bulb-1"]?.brightness ?? 0) > 0;
  const hasNormallyClosedContact = () => parts.value.some((part) => part.type === "spring" && part.contactMode === "normally-closed" && part.controlledBy === "coil-1");
  const hasNotOutputOnState = () => hasNormallyClosedContact() && parts.value.some((part) => part.id === "switch-1" && !part.closed) && (simulation.value.bulbs["bulb-1"]?.brightness ?? 0) > 0;
  const hasNotOutputOffState = () => hasNormallyClosedContact() && parts.value.some((part) => part.id === "switch-1" && part.closed) && Boolean(simulation.value.coils["coil-1"]?.energized) && (simulation.value.bulbs["bulb-1"]?.brightness ?? 0) === 0;
  const notValidation = ref({ outputOff: false, outputOn: false });
  const notWorkspaceKey = computed(() => JSON.stringify({
    parts: parts.value.map((part) => ({ contactMode: part.contactMode, controlledBy: part.controlledBy, id: part.id, type: part.type })),
    wires: wires.value.map((wire) => ({ from: wire.from, id: wire.id, to: wire.to })),
  }));
  let observedNotWorkspaceKey = "";
  watch([simulation, notWorkspaceKey], ([, workspaceKey]) => {
    if (workspaceKey !== observedNotWorkspaceKey) {
      observedNotWorkspaceKey = workspaceKey;
      notValidation.value = { outputOff: false, outputOn: false };
    }
    if (hasNotOutputOnState()) notValidation.value.outputOn = true;
    if (hasNotOutputOffState()) notValidation.value.outputOff = true;
  }, { immediate: true });
  const hasNotOutputOn = () => notValidation.value.outputOn;
  const hasNotOutputOff = () => notValidation.value.outputOff;
  const hasTwoInputSwitches = () => parts.value.filter((part) => part.type === "switch").length >= 2 && hasRelayParts();
  const hasSeriesRelayInputs = () => hasTwoInputSwitches() && hasWireBetween({ partId: "switch-1", terminal: "b" }, { partId: "switch-2", terminal: "a" }) && hasWireBetween({ partId: "switch-2", terminal: "b" }, { partId: "coil-1", terminal: "a" });
  const hasParallelRelayInputs = () => hasTwoInputSwitches() && hasWireBetween({ partId: "switch-1", terminal: "b" }, { partId: "coil-1", terminal: "a" }) && hasWireBetween({ partId: "switch-2", terminal: "b" }, { partId: "coil-1", terminal: "a" });

  const lessonCheckers: Record<LessonCheckId, () => boolean> = {
    hasActiveAmmeter: () => ammeterParts().some((part) => ammeterStatus(part).active && ammeterStatus(part).currentMilliAmps > 0),
    hasActiveBuzzer: () => buzzerParts().some((part) => buzzerStatus(part).active && buzzerStatus(part).volumePercent > 0),
    hasActiveMotor: () => motorParts().some((part) => motorStatus(part).active && motorStatus(part).speedPercent > 0),
    hasActiveVoltmeter: () => voltmeterParts().some((part) => voltmeterStatus(part).active && voltmeterStatus(part).voltage > 0),
    hasAdjustedResistor: () => parts.value.some((part) => part.type === "resistor" && (part.resistance ?? 0) !== 48),
    hasBrightBulb: () => options.mainBulbBrightness.value >= 0.4,
    hasBrightParallelBulbs: () => hasParallelBulbRoute() && twoBulbBrightnessValues().length >= 2 && twoBulbBrightnessValues().every((brightness) => brightness >= 0.24),
    hasCapacitorParts: () => ["battery", "switch", "capacitor"].every((type) => parts.value.some((part) => part.type === type)),
    hasCapacitorWithoutMainCurrent: () => capacitorParts().some((part) => capacitorStatus(part).connected) && simulation.value.currentMilliAmps === 0,
    hasChargedCapacitor: () => capacitorParts().some((part) => capacitorStatus(part).connected && capacitorStatus(part).chargePercent >= 80),
    hasClosedCircuit: () => simulation.value.closed,
    hasClosedSwitch: () => parts.value.some((part) => part.type === "switch" && part.closed),
    hasDarkBulb: () => options.mainBulbBrightness.value === 0,
    hasDiodeParts: () => ["battery", "switch", "resistor", "diode"].every((type) => parts.value.some((part) => part.type === type)),
    hasDimSeriesBulbs: () => hasSeriesBulbRoute() && twoBulbBrightnessValues().length >= 2 && twoBulbBrightnessValues().every((brightness) => brightness > 0 && brightness <= 0.32),
    hasEnergizedRelay,
    hasForwardDiodeWiring,
    hasForwardLed: () => ledParts().some((part) => ledStatus(part).forward),
    hasLedParts: () => ["battery", "switch", "resistor", "led"].every((type) => parts.value.some((part) => part.type === type)),
    hasLitBulb: () => options.mainBulbBrightness.value > 0,
    hasLitLed: () => litLedParts().length > 0,
    hasLowResistance: () => parts.value.some((part) => part.type === "resistor" && (part.resistance ?? 0) <= 24),
    hasMeterParts: () => ["battery", "switch", "ammeter", "bulb", "resistor", "voltmeter"].every((type) => parts.value.some((part) => part.type === type)),
    hasNormallyClosedContact, hasNotOutputOff, hasNotOutputOn,
    hasOpenCircuit: () => !simulation.value.closed,
    hasOpenSwitch: () => parts.value.some((part) => part.type === "switch" && !part.closed),
    hasOutputParts: () => ["battery", "switch", "buzzer", "motor", "resistor"].every((type) => parts.value.some((part) => part.type === type)),
    hasParallelBulbs: () => simulation.value.closed && hasParallelBulbRoute(),
    hasParallelOutputWiring, hasParallelRelayInputs,
    hasRelayLink, hasRelayOutput, hasRelayParts,
    hasReverseBlockingDiode: () => diodeParts().some((part) => diodeStatus(part).reversed && !diodeStatus(part).conducting),
    hasSafeLedCurrent: () => ledParts().some((part) => ledStatus(part).brightness > 0 && !ledStatus(part).overCurrent),
    hasSeriesAmmeterWiring, hasSeriesBulbs: () => simulation.value.closed && hasSeriesBulbRoute(), hasSeriesRelayInputs,
    hasStarterParts: () => ["battery", "switch", "bulb", "resistor"].every((type) => parts.value.some((part) => part.type === type)),
    hasSwitchedCapacitorWiring, hasTwoBulbs: () => bulbParts().length >= 2, hasTwoInputSwitches,
    hasTwoLitBulbs: () => litBulbParts().length >= 2,
  };

  return { lessonCheckers };
}

export type PartType = "battery" | "bulb" | "switch" | "resistor" | "led" | "buzzer" | "motor";
export type TerminalKey = "a" | "b";

export type TerminalRef = {
  partId: string;
  terminal: TerminalKey;
};

export type CircuitPart = {
  closed?: boolean;
  id: string;
  name: string;
  polarity?: "normal" | "reversed";
  resistance?: number;
  type: PartType;
  x: number;
  y: number;
};

export type Wire = {
  from: TerminalRef;
  id: string;
  to: TerminalRef;
};

export type WireEnd = "from" | "to";

export type LedState = {
  brightness: number;
  brightnessPercent: number;
  forward: boolean;
  overCurrent: boolean;
  reversed: boolean;
};

export type BuzzerState = {
  active: boolean;
  volume: number;
  volumePercent: number;
};

export type MotorState = {
  active: boolean;
  speed: number;
  speedPercent: number;
};

type Edge = {
  from: string;
  partId?: string;
  to: string;
  wireId?: string;
};

const bulbOhms = 18;
const ledOhms = 28;
const buzzerOhms = 32;
const motorOhms = 44;
const ledSafeCurrentMilliAmps = 65;
const buzzerLoudCurrentMilliAmps = 160;
const motorFastCurrentMilliAmps = 180;

export function terminalId(ref: TerminalRef) {
  return `${ref.partId}:${ref.terminal}`;
}

export function sameTerminal(left: TerminalRef, right: TerminalRef) {
  return left.partId === right.partId && left.terminal === right.terminal;
}

export function batteryPolarity(part: CircuitPart) {
  return part.type === "battery" && part.polarity === "reversed" ? "reversed" : "normal";
}

export function batteryPositiveTerminal(part: CircuitPart): TerminalKey {
  return batteryPolarity(part) === "reversed" ? "a" : "b";
}

export function batteryNegativeTerminal(part: CircuitPart): TerminalKey {
  return batteryPolarity(part) === "reversed" ? "b" : "a";
}

function buildEdges(
  sourceParts: CircuitPart[],
  sourceWires: Wire[],
  excludedPartId?: string,
  conductiveLedIds = new Set<string>(),
) {
  const edges: Edge[] = sourceWires.map((wire) => ({
    from: terminalId(wire.from),
    to: terminalId(wire.to),
    wireId: wire.id,
  }));

  for (const part of sourceParts) {
    if (part.id === excludedPartId || part.type === "battery") {
      continue;
    }

    if (part.type === "switch" && !part.closed) {
      continue;
    }

    if (part.type === "led" && !conductiveLedIds.has(part.id)) {
      continue;
    }

    edges.push({
      from: `${part.id}:a`,
      to: `${part.id}:b`,
      partId: part.id,
    });
  }

  return edges;
}

export function hasPath(from: string, to: string, edges: Array<{ from: string; to: string }>) {
  const graph = new Map<string, string[]>();

  for (const edge of edges) {
    graph.set(edge.from, [...(graph.get(edge.from) ?? []), edge.to]);
    graph.set(edge.to, [...(graph.get(edge.to) ?? []), edge.from]);
  }

  const queue = [from];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const node = queue.shift() as string;
    if (node === to) {
      return true;
    }

    if (visited.has(node)) {
      continue;
    }

    visited.add(node);
    queue.push(...(graph.get(node) ?? []).filter((next) => !visited.has(next)));
  }

  return false;
}

function partBatteryBridgeDirection(part: CircuitPart, battery: CircuitPart, edges: Edge[]) {
  const positive = terminalId({ partId: battery.id, terminal: batteryPositiveTerminal(battery) });
  const negative = terminalId({ partId: battery.id, terminal: batteryNegativeTerminal(battery) });
  const a = `${part.id}:a`;
  const b = `${part.id}:b`;
  const edgesWithoutPart = edges.filter((edge) => edge.partId !== part.id);

  if (hasPath(positive, b, edgesWithoutPart) && hasPath(a, negative, edgesWithoutPart)) {
    return "forward";
  }

  if (hasPath(positive, a, edgesWithoutPart) && hasPath(b, negative, edgesWithoutPart)) {
    return "reverse";
  }

  return null;
}

function partBridgesBattery(part: CircuitPart, battery: CircuitPart, edges: Edge[]) {
  return Boolean(partBatteryBridgeDirection(part, battery, edges));
}

function wireDirectionThroughBattery(wire: Wire, battery: CircuitPart, edges: Edge[]) {
  const positive = terminalId({ partId: battery.id, terminal: batteryPositiveTerminal(battery) });
  const negative = terminalId({ partId: battery.id, terminal: batteryNegativeTerminal(battery) });
  const from = terminalId(wire.from);
  const to = terminalId(wire.to);
  const edgesWithoutWire = edges.filter((edge) => edge.wireId !== wire.id);

  if (hasPath(positive, from, edgesWithoutWire) && hasPath(to, negative, edgesWithoutWire)) {
    return "forward";
  }

  if (hasPath(positive, to, edgesWithoutWire) && hasPath(from, negative, edgesWithoutWire)) {
    return "reverse";
  }

  return null;
}

export function evaluateCircuit(sourceParts: CircuitPart[], sourceWires: Wire[]) {
  const battery = sourceParts.find((part) => part.type === "battery");
  const bulbs = sourceParts.filter((part) => part.type === "bulb");
  const leds = sourceParts.filter((part) => part.type === "led");
  const buzzers = sourceParts.filter((part) => part.type === "buzzer");
  const motors = sourceParts.filter((part) => part.type === "motor");
  const bulbStates: Record<string, { brightness: number; brightnessPercent: number }> = {};
  const ledStates: Record<string, LedState> = {};
  const buzzerStates: Record<string, BuzzerState> = {};
  const motorStates: Record<string, MotorState> = {};
  const wireStates: Record<string, { active: boolean; reverse: boolean }> = {};

  if (!battery) {
    return {
      bulbs: bulbStates,
      buzzers: buzzerStates,
      closed: false,
      currentMilliAmps: 0,
      equivalentResistance: 0,
      leds: ledStates,
      motors: motorStates,
      wires: wireStates,
    };
  }

  const allLedIds = new Set(leds.map((part) => part.id));
  const orientationEdges = buildEdges(sourceParts, sourceWires, undefined, allLedIds);
  const conductiveLedIds = new Set(
    leds
      .filter((part) => partBatteryBridgeDirection(part, battery, orientationEdges) === "forward")
      .map((part) => part.id),
  );
  const edges = buildEdges(sourceParts, sourceWires, undefined, conductiveLedIds);

  const positive = terminalId({ partId: battery.id, terminal: batteryPositiveTerminal(battery) });
  const negative = terminalId({ partId: battery.id, terminal: batteryNegativeTerminal(battery) });
  const closed = hasPath(positive, negative, edges);
  const seriesResistors = sourceParts.filter(
    (part) => part.type === "resistor" && partBridgesBattery(part, battery, edges),
  );
  const conductingBulbs = bulbs.filter((part) => closed && partBridgesBattery(part, battery, edges));
  const conductingLeds = leds.filter((part) => closed && conductiveLedIds.has(part.id));
  const conductingBuzzers = buzzers.filter((part) => closed && partBridgesBattery(part, battery, edges));
  const conductingMotors = motors.filter((part) => closed && partBridgesBattery(part, battery, edges));
  const resistorOhms = seriesResistors.reduce((total, part) => total + (part.resistance ?? 0), 0);
  const loadOhms = Math.max(
    bulbOhms,
    conductingBulbs.length * bulbOhms +
      conductingLeds.length * ledOhms +
      conductingBuzzers.length * buzzerOhms +
      conductingMotors.length * motorOhms,
  );
  const equivalentResistance = closed ? loadOhms + resistorOhms : 0;
  const current = equivalentResistance > 0 ? 9 / equivalentResistance : 0;
  const currentMilliAmps = Math.round(current * 1000);

  for (const wire of sourceWires) {
    const direction = closed ? wireDirectionThroughBattery(wire, battery, edges) : null;
    wireStates[wire.id] = {
      active: Boolean(direction),
      reverse: direction === "reverse",
    };
  }

  for (const bulb of bulbs) {
    const conducting = conductingBulbs.some((part) => part.id === bulb.id);
    const normalized = conducting && equivalentResistance > 0 ? bulbOhms / equivalentResistance : 0;
    const brightness = conducting ? Math.min(1, Math.max(0.1, normalized)) : 0;

    bulbStates[bulb.id] = {
      brightness,
      brightnessPercent: Math.round(brightness * 100),
    };
  }

  for (const led of leds) {
    const direction = partBatteryBridgeDirection(led, battery, orientationEdges);
    const conducting = closed && conductiveLedIds.has(led.id);
    const brightness = conducting ? Math.min(1, Math.max(0.18, currentMilliAmps / ledSafeCurrentMilliAmps)) : 0;

    ledStates[led.id] = {
      brightness,
      brightnessPercent: Math.round(brightness * 100),
      forward: direction === "forward",
      overCurrent: conducting && currentMilliAmps > ledSafeCurrentMilliAmps,
      reversed: direction === "reverse",
    };
  }

  for (const buzzer of buzzers) {
    const conducting = conductingBuzzers.some((part) => part.id === buzzer.id);
    const volume = conducting ? Math.min(1, Math.max(0.14, currentMilliAmps / buzzerLoudCurrentMilliAmps)) : 0;

    buzzerStates[buzzer.id] = {
      active: volume > 0,
      volume,
      volumePercent: Math.round(volume * 100),
    };
  }

  for (const motor of motors) {
    const conducting = conductingMotors.some((part) => part.id === motor.id);
    const speed = conducting ? Math.min(1, Math.max(0.12, currentMilliAmps / motorFastCurrentMilliAmps)) : 0;

    motorStates[motor.id] = {
      active: speed > 0,
      speed,
      speedPercent: Math.round(speed * 100),
    };
  }

  return {
    bulbs: bulbStates,
    buzzers: buzzerStates,
    closed,
    currentMilliAmps,
    equivalentResistance,
    leds: ledStates,
    motors: motorStates,
    wires: wireStates,
  };
}

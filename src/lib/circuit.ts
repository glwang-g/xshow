export type PartType =
  | "ammeter"
  | "battery"
  | "bulb"
  | "capacitor"
  | "diode"
  | "led"
  | "motor"
  | "resistor"
  | "switch"
  | "voltmeter"
  | "buzzer";
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

export type DiodeState = {
  conducting: boolean;
  forward: boolean;
  overCurrent: boolean;
  reversed: boolean;
};

export type CapacitorState = {
  chargePercent: number;
  charging: boolean;
  connected: boolean;
  voltage: number;
};

export type AmmeterState = {
  active: boolean;
  currentMilliAmps: number;
};

export type VoltmeterState = {
  active: boolean;
  voltage: number;
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

type Branch = {
  fromNode: string;
  part: CircuitPart;
  resistance: number;
  toNode: string;
};

const bulbOhms = 18;
const diodeOhms = 10;
const ledOhms = 28;
const ammeterOhms = 1;
const buzzerOhms = 32;
const motorOhms = 44;
const minConductiveOhms = 0.5;
const bulbBrightCurrentAmps = 0.5;
const diodeSafeCurrentMilliAmps = 140;
const ledSafeCurrentMilliAmps = 65;
const buzzerLoudCurrentMilliAmps = 160;
const motorFastCurrentMilliAmps = 180;
const voltageEpsilon = 0.01;
const currentEpsilon = 0.0005;

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

class UnionFind {
  private parents = new Map<string, string>();

  add(value: string) {
    if (!this.parents.has(value)) {
      this.parents.set(value, value);
    }
  }

  find(value: string): string {
    this.add(value);
    const parent = this.parents.get(value) as string;
    if (parent === value) {
      return value;
    }

    const root = this.find(parent);
    this.parents.set(value, root);
    return root;
  }

  union(left: string, right: string) {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot !== rightRoot) {
      this.parents.set(rightRoot, leftRoot);
    }
  }
}

function buildTopologyEdges(
  sourceParts: CircuitPart[],
  sourceWires: Wire[],
  conductiveLedIds = new Set<string>(),
  conductiveDiodeIds = new Set<string>(),
) {
  const edges: Edge[] = sourceWires.map((wire) => ({
    from: terminalId(wire.from),
    to: terminalId(wire.to),
    wireId: wire.id,
  }));

  for (const part of sourceParts) {
    if (part.type === "battery") {
      continue;
    }

    if (part.type === "switch" && !part.closed) {
      continue;
    }

    if (part.type === "led" && !conductiveLedIds.has(part.id)) {
      continue;
    }

    if (part.type === "diode" && !conductiveDiodeIds.has(part.id)) {
      continue;
    }

    if (part.type === "capacitor" || part.type === "voltmeter") {
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

function terminalNode(nodeFinder: UnionFind, part: CircuitPart, terminal: TerminalKey) {
  return nodeFinder.find(`${part.id}:${terminal}`);
}

function buildNodeFinder(sourceParts: CircuitPart[], sourceWires: Wire[]) {
  const nodes = new UnionFind();

  for (const part of sourceParts) {
    nodes.add(`${part.id}:a`);
    nodes.add(`${part.id}:b`);
  }

  for (const wire of sourceWires) {
    nodes.union(terminalId(wire.from), terminalId(wire.to));
  }

  for (const part of sourceParts) {
    if (part.type === "switch" && part.closed) {
      nodes.union(`${part.id}:a`, `${part.id}:b`);
    }
  }

  return nodes;
}

function branchResistance(part: CircuitPart, conductiveLedIds: Set<string>, conductiveDiodeIds: Set<string>) {
  if (part.type === "bulb") {
    return bulbOhms;
  }

  if (part.type === "resistor") {
    return Math.max(minConductiveOhms, part.resistance ?? 60);
  }

  if (part.type === "led") {
    return conductiveLedIds.has(part.id) ? ledOhms : null;
  }

  if (part.type === "diode") {
    return conductiveDiodeIds.has(part.id) ? diodeOhms : null;
  }

  if (part.type === "ammeter") {
    return ammeterOhms;
  }

  if (part.type === "buzzer") {
    return buzzerOhms;
  }

  if (part.type === "motor") {
    return motorOhms;
  }

  return null;
}

function buildBranches(
  sourceParts: CircuitPart[],
  nodes: UnionFind,
  conductiveLedIds: Set<string>,
  conductiveDiodeIds: Set<string>,
) {
  const branches: Branch[] = [];

  for (const part of sourceParts) {
    const resistance = branchResistance(part, conductiveLedIds, conductiveDiodeIds);
    if (resistance === null) {
      continue;
    }

    const fromNode = terminalNode(nodes, part, "a");
    const toNode = terminalNode(nodes, part, "b");
    if (fromNode === toNode) {
      continue;
    }

    branches.push({
      fromNode,
      part,
      resistance,
      toNode,
    });
  }

  return branches;
}

function reachableFromRails(positiveNode: string, negativeNode: string, branches: Branch[]) {
  const graph = new Map<string, string[]>();

  for (const branch of branches) {
    graph.set(branch.fromNode, [...(graph.get(branch.fromNode) ?? []), branch.toNode]);
    graph.set(branch.toNode, [...(graph.get(branch.toNode) ?? []), branch.fromNode]);
  }

  const reachable = new Set<string>();
  const queue = [positiveNode, negativeNode];

  while (queue.length > 0) {
    const node = queue.shift() as string;
    if (reachable.has(node)) {
      continue;
    }

    reachable.add(node);
    queue.push(...(graph.get(node) ?? []).filter((next) => !reachable.has(next)));
  }

  return reachable;
}

function solveLinearSystem(matrix: number[][], vector: number[]) {
  const size = vector.length;
  const augmented = matrix.map((row, index) => [...row, vector[index]]);

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) {
        pivot = row;
      }
    }

    if (Math.abs(augmented[pivot][column]) < 1e-9) {
      continue;
    }

    if (pivot !== column) {
      [augmented[pivot], augmented[column]] = [augmented[column], augmented[pivot]];
    }

    const pivotValue = augmented[column][column];
    for (let item = column; item <= size; item += 1) {
      augmented[column][item] /= pivotValue;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === column) {
        continue;
      }

      const factor = augmented[row][column];
      for (let item = column; item <= size; item += 1) {
        augmented[row][item] -= factor * augmented[column][item];
      }
    }
  }

  return augmented.map((row, index) => (Number.isFinite(row[size]) ? row[size] : vector[index] ?? 0));
}

function solveResistiveNetwork(battery: CircuitPart, sourceParts: CircuitPart[], sourceWires: Wire[], conductiveLedIds: Set<string>, conductiveDiodeIds: Set<string>) {
  const nodes = buildNodeFinder(sourceParts, sourceWires);
  const positiveNode = terminalNode(nodes, battery, batteryPositiveTerminal(battery));
  const negativeNode = terminalNode(nodes, battery, batteryNegativeTerminal(battery));
  const branches = buildBranches(sourceParts, nodes, conductiveLedIds, conductiveDiodeIds);
  const voltages = new Map<string, number>();
  const branchCurrents = new Map<string, number>();

  voltages.set(positiveNode, 9);
  voltages.set(negativeNode, positiveNode === negativeNode ? 9 : 0);

  if (positiveNode !== negativeNode) {
    const reachableNodes = reachableFromRails(positiveNode, negativeNode, branches);
    const knownVoltages = new Map<string, number>([
      [positiveNode, 9],
      [negativeNode, 0],
    ]);
    const unknownNodes = Array.from(reachableNodes).filter((node) => !knownVoltages.has(node));
    const unknownIndex = new Map(unknownNodes.map((node, index) => [node, index]));
    const matrix = unknownNodes.map(() => Array.from({ length: unknownNodes.length }, () => 0));
    const vector = Array.from({ length: unknownNodes.length }, () => 0);

    for (const branch of branches) {
      const conductance = 1 / branch.resistance;
      const endpoints = [
        [branch.fromNode, branch.toNode],
        [branch.toNode, branch.fromNode],
      ] as const;

      for (const [node, otherNode] of endpoints) {
        const row = unknownIndex.get(node);
        if (row === undefined) {
          continue;
        }

        matrix[row][row] += conductance;
        const otherColumn = unknownIndex.get(otherNode);
        if (otherColumn !== undefined) {
          matrix[row][otherColumn] -= conductance;
        } else {
          vector[row] += conductance * (knownVoltages.get(otherNode) ?? 0);
        }
      }
    }

    const solved = solveLinearSystem(matrix, vector);
    for (const [node, index] of unknownIndex) {
      voltages.set(node, solved[index]);
    }
  }

  for (const branch of branches) {
    const current = ((voltages.get(branch.fromNode) ?? 0) - (voltages.get(branch.toNode) ?? 0)) / branch.resistance;
    branchCurrents.set(branch.part.id, current);
  }

  const totalCurrent = branches.reduce((total, branch) => {
    const fromVoltage = voltages.get(branch.fromNode) ?? 0;
    const toVoltage = voltages.get(branch.toNode) ?? 0;

    if (branch.fromNode === positiveNode) {
      return total + (fromVoltage - toVoltage) / branch.resistance;
    }

    if (branch.toNode === positiveNode) {
      return total + (toVoltage - fromVoltage) / branch.resistance;
    }

    return total;
  }, 0);

  return {
    branchCurrents,
    branches,
    nodes,
    positiveNode,
    negativeNode,
    totalCurrent: Math.max(0, totalCurrent),
    voltages,
  };
}

function partVoltage(network: ReturnType<typeof solveResistiveNetwork>, part: CircuitPart) {
  const aNode = terminalNode(network.nodes, part, "a");
  const bNode = terminalNode(network.nodes, part, "b");

  return {
    a: network.voltages.get(aNode) ?? 0,
    b: network.voltages.get(bNode) ?? 0,
  };
}

function partCurrentMagnitude(network: ReturnType<typeof solveResistiveNetwork>, part: CircuitPart) {
  return Math.abs(network.branchCurrents.get(part.id) ?? 0);
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
  const diodes = sourceParts.filter((part) => part.type === "diode");
  const capacitors = sourceParts.filter((part) => part.type === "capacitor");
  const ammeters = sourceParts.filter((part) => part.type === "ammeter");
  const voltmeters = sourceParts.filter((part) => part.type === "voltmeter");
  const buzzers = sourceParts.filter((part) => part.type === "buzzer");
  const motors = sourceParts.filter((part) => part.type === "motor");
  const bulbStates: Record<string, { brightness: number; brightnessPercent: number }> = {};
  const ledStates: Record<string, LedState> = {};
  const diodeStates: Record<string, DiodeState> = {};
  const capacitorStates: Record<string, CapacitorState> = {};
  const ammeterStates: Record<string, AmmeterState> = {};
  const voltmeterStates: Record<string, VoltmeterState> = {};
  const buzzerStates: Record<string, BuzzerState> = {};
  const motorStates: Record<string, MotorState> = {};
  const wireStates: Record<string, { active: boolean; reverse: boolean }> = {};

  if (!battery) {
    return {
      ammeters: ammeterStates,
      bulbs: bulbStates,
      buzzers: buzzerStates,
      capacitors: capacitorStates,
      closed: false,
      currentMilliAmps: 0,
      diodes: diodeStates,
      equivalentResistance: 0,
      leds: ledStates,
      motors: motorStates,
      voltmeters: voltmeterStates,
      wires: wireStates,
    };
  }

  let conductiveLedIds = new Set(leds.map((part) => part.id));
  let conductiveDiodeIds = new Set(diodes.map((part) => part.id));
  let network = solveResistiveNetwork(battery, sourceParts, sourceWires, conductiveLedIds, conductiveDiodeIds);

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const nextLedIds = new Set(
      leds.filter((part) => {
        const voltage = partVoltage(network, part);
        return voltage.b - voltage.a > voltageEpsilon;
      }).map((part) => part.id),
    );
    const nextDiodeIds = new Set(
      diodes.filter((part) => {
        const voltage = partVoltage(network, part);
        return voltage.b - voltage.a > voltageEpsilon;
      }).map((part) => part.id),
    );
    const stable =
      nextLedIds.size === conductiveLedIds.size &&
      nextDiodeIds.size === conductiveDiodeIds.size &&
      [...nextLedIds].every((id) => conductiveLedIds.has(id)) &&
      [...nextDiodeIds].every((id) => conductiveDiodeIds.has(id));

    conductiveLedIds = nextLedIds;
    conductiveDiodeIds = nextDiodeIds;
    network = solveResistiveNetwork(battery, sourceParts, sourceWires, conductiveLedIds, conductiveDiodeIds);

    if (stable) {
      break;
    }
  }

  const closed = network.totalCurrent > currentEpsilon;
  const currentMilliAmps = Math.round(network.totalCurrent * 1000);
  const equivalentResistance =
    closed && network.totalCurrent > 0 ? Math.round((9 / network.totalCurrent) * 10) / 10 : 0;
  const edges = buildTopologyEdges(sourceParts, sourceWires, conductiveLedIds, conductiveDiodeIds);

  for (const wire of sourceWires) {
    const direction = closed ? wireDirectionThroughBattery(wire, battery, edges) : null;
    wireStates[wire.id] = {
      active: Boolean(direction),
      reverse: direction === "reverse",
    };
  }

  for (const bulb of bulbs) {
    const current = partCurrentMagnitude(network, bulb);
    const brightness = current > currentEpsilon ? Math.min(1, Math.max(0.08, current / bulbBrightCurrentAmps)) : 0;

    bulbStates[bulb.id] = {
      brightness,
      brightnessPercent: Math.round(brightness * 100),
    };
  }

  for (const led of leds) {
    const voltage = partVoltage(network, led);
    const current = partCurrentMagnitude(network, led);
    const currentMilliAmpsForPart = Math.round(current * 1000);
    const conducting = current > currentEpsilon && conductiveLedIds.has(led.id);
    const brightness = conducting ? Math.min(1, Math.max(0.18, currentMilliAmpsForPart / ledSafeCurrentMilliAmps)) : 0;

    ledStates[led.id] = {
      brightness,
      brightnessPercent: Math.round(brightness * 100),
      forward: voltage.b - voltage.a > voltageEpsilon,
      overCurrent: conducting && currentMilliAmpsForPart > ledSafeCurrentMilliAmps,
      reversed: voltage.a - voltage.b > voltageEpsilon,
    };
  }

  for (const diode of diodes) {
    const voltage = partVoltage(network, diode);
    const current = partCurrentMagnitude(network, diode);
    const currentMilliAmpsForPart = Math.round(current * 1000);
    const conducting = current > currentEpsilon && conductiveDiodeIds.has(diode.id);

    diodeStates[diode.id] = {
      conducting,
      forward: voltage.b - voltage.a > voltageEpsilon,
      overCurrent: conducting && currentMilliAmpsForPart > diodeSafeCurrentMilliAmps,
      reversed: voltage.a - voltage.b > voltageEpsilon,
    };
  }

  for (const capacitor of capacitors) {
    const voltage = partVoltage(network, capacitor);
    const voltageDiff = Math.abs(voltage.b - voltage.a);
    const connected = voltageDiff > voltageEpsilon;

    capacitorStates[capacitor.id] = {
      chargePercent: Math.round(Math.min(100, (voltageDiff / 9) * 100)),
      charging: connected && !closed,
      connected,
      voltage: Math.round(voltageDiff * 10) / 10,
    };
  }

  for (const ammeter of ammeters) {
    const current = partCurrentMagnitude(network, ammeter);

    ammeterStates[ammeter.id] = {
      active: current > currentEpsilon,
      currentMilliAmps: Math.round(current * 1000),
    };
  }

  for (const voltmeter of voltmeters) {
    const voltage = partVoltage(network, voltmeter);
    const voltageDiff = Math.abs(voltage.b - voltage.a);

    voltmeterStates[voltmeter.id] = {
      active: voltageDiff > voltageEpsilon,
      voltage: Math.round(voltageDiff * 10) / 10,
    };
  }

  for (const buzzer of buzzers) {
    const current = partCurrentMagnitude(network, buzzer);
    const currentMilliAmpsForPart = Math.round(current * 1000);
    const volume = current > currentEpsilon ? Math.min(1, Math.max(0.14, currentMilliAmpsForPart / buzzerLoudCurrentMilliAmps)) : 0;

    buzzerStates[buzzer.id] = {
      active: volume > 0,
      volume,
      volumePercent: Math.round(volume * 100),
    };
  }

  for (const motor of motors) {
    const current = partCurrentMagnitude(network, motor);
    const currentMilliAmpsForPart = Math.round(current * 1000);
    const speed = current > currentEpsilon ? Math.min(1, Math.max(0.12, currentMilliAmpsForPart / motorFastCurrentMilliAmps)) : 0;

    motorStates[motor.id] = {
      active: speed > 0,
      speed,
      speedPercent: Math.round(speed * 100),
    };
  }

  return {
    ammeters: ammeterStates,
    bulbs: bulbStates,
    buzzers: buzzerStates,
    capacitors: capacitorStates,
    closed,
    currentMilliAmps,
    diodes: diodeStates,
    equivalentResistance,
    leds: ledStates,
    motors: motorStates,
    voltmeters: voltmeterStates,
    wires: wireStates,
  };
}

export type CircuitSimulation = ReturnType<typeof evaluateCircuit>;

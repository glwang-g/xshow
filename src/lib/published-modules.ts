import { evaluateCircuit, partTypes, type CircuitPart, type TerminalKey, type Wire } from "@/lib/circuit";

export const publishedModulesStorageKey = "xshow:published-circuit-modules:v1";

export type PublishedModulePort = {
  direction: "input" | "output";
  id: string;
  label: string;
  source: { partId: string; terminal: TerminalKey };
};

export type ModuleTruthTableRow = {
  inputs: boolean[];
  output: boolean;
};

export type PublishedRelayModule = {
  behavior: {
    contactMode: "normally-open" | "normally-closed";
    gate: "AND" | "NOT" | "OR" | "RELAY";
    pullInCurrentMilliAmps: number;
  };
  createdAt: string;
  id: string;
  implementation: {
    coilId: string;
    parts: CircuitPart[];
    springId: string;
    /** Complete lesson circuit retained for source expansion, not module evaluation. */
    sourceWorkspace?: { parts: CircuitPart[]; wires: Wire[] };
    wires: Wire[];
  };
  kind: "logic-gate" | "relay";
  name: string;
  ports: PublishedModulePort[];
  verification?: {
    /** The workshop lesson whose structural and observable checks were completed. */
    lessonId: string;
    truthTable: ModuleTruthTableRow[];
    verifiedAt: string;
  };
  version: 1;
};

export type CreateRelayModuleOptions = {
  createdAt?: string;
  id?: string;
  kind?: "logic-gate" | "relay";
  name?: string;
  parts: CircuitPart[];
  springId: string;
  verification?: PublishedRelayModule["verification"];
  wires: Wire[];
};

function cloneParts(parts: CircuitPart[]) {
  return parts.map((part) => ({ ...part }));
}

function cloneWires(wires: Wire[]) {
  return wires.map((wire) => ({ ...wire, from: { ...wire.from }, to: { ...wire.to } }));
}

function isSafeSourceWorkspace(value: unknown): value is { parts: CircuitPart[]; wires: Wire[] } {
  if (!value || typeof value !== "object") return false;
  const workspace = value as { parts?: unknown; wires?: unknown };
  if (!Array.isArray(workspace.parts) || workspace.parts.length === 0 || !Array.isArray(workspace.wires)) return false;
  const partIds = new Set<string>();
  const safeParts = workspace.parts.every((part) => {
    if (!part || typeof part !== "object") return false;
    const candidate = part as Partial<CircuitPart>;
    const valid = typeof candidate.id === "string"
      && candidate.id.trim().length > 0
      && typeof candidate.name === "string"
      && candidate.name.trim().length > 0
      && typeof candidate.type === "string"
      && partTypes.includes(candidate.type as CircuitPart["type"])
      && Number.isFinite(candidate.x)
      && Number.isFinite(candidate.y)
      && (candidate.closed === undefined || typeof candidate.closed === "boolean")
      && (candidate.contactMode === undefined || candidate.contactMode === "normally-open" || candidate.contactMode === "normally-closed")
      && (candidate.controlledBy === undefined || typeof candidate.controlledBy === "string")
      && (candidate.polarity === undefined || candidate.polarity === "normal" || candidate.polarity === "reversed")
      && (candidate.resistance === undefined || Number.isFinite(candidate.resistance))
      && (candidate.rotation === undefined || Number.isFinite(candidate.rotation));
    if (valid) partIds.add(candidate.id as string);
    return valid;
  });
  if (!safeParts || partIds.size !== workspace.parts.length) return false;
  const partsById = new Map(workspace.parts.map((part) => [(part as CircuitPart).id, part as CircuitPart]));
  if (!workspace.parts.every((part) => !part.controlledBy || (part.type === "spring" && partsById.get(part.controlledBy)?.type === "coil"))) return false;

  const wireIds = new Set<string>();
  const connections = new Set<string>();
  return workspace.wires.every((wire) => {
    if (!wire || typeof wire !== "object") return false;
    const candidate = wire as Partial<Wire>;
    const validEnd = (end: unknown): end is Wire["from"] => Boolean(
      end && typeof end === "object"
      && typeof (end as Partial<Wire>["from"])?.partId === "string"
      && ((end as Partial<Wire>["from"])?.terminal === "a" || (end as Partial<Wire>["from"])?.terminal === "b")
      && partIds.has((end as Partial<Wire>["from"])?.partId as string),
    );
    if (!candidate.id?.trim() || !validEnd(candidate.from) || !validEnd(candidate.to) || wireIds.has(candidate.id)) return false;
    const from = `${candidate.from.partId}:${candidate.from.terminal}`;
    const to = `${candidate.to.partId}:${candidate.to.terminal}`;
    const connection = from < to ? `${from}|${to}` : `${to}|${from}`;
    if (from === to || connections.has(connection)) return false;
    wireIds.add(candidate.id);
    connections.add(connection);
    return true;
  });
}

function createId() {
  return `relay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function gateForName(name?: string): PublishedRelayModule["behavior"]["gate"] {
  if (name === "RelayNot") return "NOT";
  if (name === "RelayAnd") return "AND";
  if (name === "RelayOr") return "OR";
  return "RELAY";
}

function expectedOutput(gate: PublishedRelayModule["behavior"]["gate"], inputs: boolean[]) {
  if (gate === "AND") return Boolean(inputs[0]) && Boolean(inputs[1]);
  if (gate === "OR") return Boolean(inputs[0]) || Boolean(inputs[1]);
  if (gate === "NOT") return !Boolean(inputs[0]);
  return Boolean(inputs[0]);
}

/**
 * Runs the current teaching circuit through every input combination before it
 * can become a named logic module. This deliberately validates the whole
 * lesson circuit, while the published artifact still stores only the relay
 * core below.
 */
export function verifyRelayPublication(parts: CircuitPart[], wires: Wire[], name?: string) {
  const gate = gateForName(name);
  const inputCount = gate === "AND" || gate === "OR" ? 2 : 1;
  const switches = parts.filter((part) => part.type === "switch").sort((left, right) => left.id.localeCompare(right.id));
  const output = parts.find((part) => part.type === "bulb");

  if (switches.length < inputCount || !output) {
    return { passed: false, reason: "需要保留输入开关和输出灯泡，才能验证模块行为。", rows: [] as ModuleTruthTableRow[] };
  }

  const rows: ModuleTruthTableRow[] = [];
  for (let state = 0; state < 2 ** inputCount; state += 1) {
    const inputs = Array.from({ length: inputCount }, (_, index) => Boolean(state & (1 << (inputCount - index - 1))));
    const simulation = evaluateCircuit(
      parts.map((part) => {
        const index = switches.findIndex((candidate) => candidate.id === part.id);
        return index >= 0 && index < inputCount ? { ...part, closed: inputs[index] } : { ...part };
      }),
      wires,
    );
    rows.push({ inputs, output: (simulation.bulbs[output.id]?.brightness ?? 0) > 0 });
  }

  const passed = rows.every((row) => row.output === expectedOutput(gate, row.inputs));
  return {
    passed,
    reason: passed ? "" : `当前接线没有通过 ${gate} 的全部输入组合验证。`,
    rows,
  };
}

export function createPublishedRelayModule(options: CreateRelayModuleOptions): PublishedRelayModule | null {
  const spring = options.parts.find((part) => part.id === options.springId && part.type === "spring");
  const coil = spring?.controlledBy
    ? options.parts.find((part) => part.id === spring.controlledBy && part.type === "coil")
    : undefined;

  if (!spring || !coil) {
    return null;
  }

  const contactMode = spring.contactMode === "normally-closed" ? "normally-closed" : "normally-open";
  const kind = options.kind ?? "relay";
  const gate = gateForName(options.name);
  const createdAt = options.createdAt ?? new Date().toISOString();
  // A published relay is the relay itself, not the surrounding lesson circuit
  // used to verify it. Its public interface is the coil's A/B and the contact's
  // COM/NO (or NC) terminals: two parts, four terminals, no internal wires.
  const relayParts = cloneParts([coil, spring]);
  return {
    behavior: { contactMode, gate, pullInCurrentMilliAmps: 30 },
    createdAt,
    id: options.id ?? createId(),
    implementation: {
      coilId: coil.id,
      parts: relayParts,
      springId: spring.id,
      sourceWorkspace: { parts: cloneParts(options.parts), wires: cloneWires(options.wires) },
      wires: [],
    },
    kind,
    name: options.name?.trim() || "RelaySwitch",
    ports: [
      { direction: "input", id: "coil-a", label: "线圈 A", source: { partId: coil.id, terminal: "a" } },
      { direction: "input", id: "coil-b", label: "线圈 B", source: { partId: coil.id, terminal: "b" } },
      { direction: "output", id: "contact-com", label: "COM", source: { partId: spring.id, terminal: "a" } },
      {
        direction: "output",
        id: contactMode === "normally-closed" ? "contact-nc" : "contact-no",
        label: contactMode === "normally-closed" ? "NC" : "NO",
        source: { partId: spring.id, terminal: "b" },
      },
    ],
    verification: options.verification,
    version: 1,
  };
}

export function relayOutputForInput(module: PublishedRelayModule, input: boolean) {
  return evaluatePublishedModule(module, [input]);
}

export function evaluatePublishedModule(module: PublishedRelayModule, inputs: boolean[]) {
  const gate = module.behavior.gate ?? "RELAY";
  if (gate === "AND") return Boolean(inputs[0]) && Boolean(inputs[1]);
  if (gate === "OR") return Boolean(inputs[0]) || Boolean(inputs[1]);
  if (gate === "NOT") return !Boolean(inputs[0]);
  return module.behavior.contactMode === "normally-closed" ? !Boolean(inputs[0]) : Boolean(inputs[0]);
}

function browserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isStoredPublishedModule(value: unknown): value is PublishedRelayModule {
  if (!value || typeof value !== "object") {
    return false;
  }

  const module = value as Partial<PublishedRelayModule>;
  const implementation = module.implementation;
  const implementationParts = implementation?.parts;
  const coil = implementationParts?.find((part) => part.id === implementation?.coilId && part.type === "coil");
  const spring = implementationParts?.find((part) => part.id === implementation?.springId && part.type === "spring");
  const gate = module.behavior?.gate;
  return (
    (module.kind === "relay" || module.kind === "logic-gate") &&
    typeof module.id === "string" &&
    typeof module.name === "string" &&
    Array.isArray(module.ports) &&
    Boolean(module.behavior && typeof module.behavior === "object") &&
    (module.behavior?.contactMode === "normally-open" || module.behavior?.contactMode === "normally-closed") &&
    (gate === undefined || gate === "AND" || gate === "NOT" || gate === "OR" || gate === "RELAY") &&
    Boolean(implementation && Array.isArray(implementation.parts) && Array.isArray(implementation.wires)) &&
    typeof implementation?.coilId === "string" &&
    typeof implementation?.springId === "string" &&
    Boolean(coil && spring && spring.controlledBy === coil.id)
  );
}

export function loadPublishedRelayModules(storage: Storage | null = browserStorage()) {
  if (!storage) {
    return [] as PublishedRelayModule[];
  }

  try {
    const value = JSON.parse(storage.getItem(publishedModulesStorageKey) ?? "[]") as unknown;
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter(isStoredPublishedModule)
      .map((module) => {
        const spring = module.implementation.parts.find((part) => part.id === module.implementation.springId && part.type === "spring");
        const coil = module.implementation.parts.find((part) => part.id === module.implementation.coilId && part.type === "coil");
        if (!spring || !coil) {
          return module;
        }
        const sourceWorkspace = isSafeSourceWorkspace(module.implementation.sourceWorkspace)
          ? {
              parts: cloneParts(module.implementation.sourceWorkspace.parts),
              wires: cloneWires(module.implementation.sourceWorkspace.wires),
            }
          : undefined;
        return {
          ...module,
          behavior: { ...module.behavior, gate: module.behavior.gate ?? "RELAY" },
          implementation: { ...module.implementation, parts: cloneParts([coil, spring]), sourceWorkspace, wires: [] },
          verification: module.verification && typeof module.verification.lessonId === "string" && typeof module.verification.verifiedAt === "string"
            ? { ...module.verification, truthTable: Array.isArray(module.verification.truthTable) ? module.verification.truthTable : [] }
            : undefined,
        };
      });
  } catch {
    return [];
  }
}

export function savePublishedRelayModule(module: PublishedRelayModule, storage: Storage | null = browserStorage()) {
  if (!storage) {
    return false;
  }

  try {
    const modules = loadPublishedRelayModules(storage).filter((item) => item.id !== module.id);
    storage.setItem(publishedModulesStorageKey, JSON.stringify([...modules, module]));
    return true;
  } catch {
    return false;
  }
}

export function removePublishedRelayModule(moduleId: string, storage: Storage | null = browserStorage()) {
  if (!storage) {
    return false;
  }

  try {
    const modules = loadPublishedRelayModules(storage);
    const nextModules = modules.filter((module) => module.id !== moduleId);
    if (nextModules.length === modules.length) {
      return false;
    }
    storage.setItem(publishedModulesStorageKey, JSON.stringify(nextModules));
    return true;
  } catch {
    return false;
  }
}

export function renamePublishedRelayModule(moduleId: string, name: string, storage: Storage | null = browserStorage()) {
  if (!storage) {
    return false;
  }

  const nextName = name.trim().slice(0, 80);
  if (!nextName) {
    return false;
  }

  try {
    const modules = loadPublishedRelayModules(storage);
    let renamed = false;
    const nextModules = modules.map((module) => {
      if (module.id !== moduleId) {
        return module;
      }
      renamed = true;
      return { ...module, name: nextName };
    });
    if (!renamed) {
      return false;
    }
    storage.setItem(publishedModulesStorageKey, JSON.stringify(nextModules));
    return true;
  } catch {
    return false;
  }
}

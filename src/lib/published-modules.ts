import { evaluateCircuit, type CircuitPart, type TerminalKey, type Wire } from "@/lib/circuit";

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
        return {
          ...module,
          behavior: { ...module.behavior, gate: module.behavior.gate ?? "RELAY" },
          implementation: { ...module.implementation, parts: cloneParts([coil, spring]), wires: [] },
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

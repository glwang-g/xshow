import type { CircuitPart, TerminalKey, Wire } from "@/lib/circuit";

export const publishedModulesStorageKey = "xshow:published-circuit-modules:v1";

export type PublishedModulePort = {
  direction: "input" | "output";
  id: string;
  label: string;
  source: { partId: string; terminal: TerminalKey };
};

export type PublishedRelayModule = {
  behavior: {
    contactMode: "normally-open" | "normally-closed";
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
  kind: "relay";
  name: string;
  ports: PublishedModulePort[];
  version: 1;
};

export type CreateRelayModuleOptions = {
  createdAt?: string;
  id?: string;
  name?: string;
  parts: CircuitPart[];
  springId: string;
  wires: Wire[];
};

function cloneParts(parts: CircuitPart[]) {
  return parts.map((part) => ({ ...part }));
}

function cloneWires(wires: Wire[]) {
  return wires.map((wire) => ({ ...wire, from: { ...wire.from }, to: { ...wire.to } }));
}

function createId() {
  return `relay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  const createdAt = options.createdAt ?? new Date().toISOString();
  return {
    behavior: { contactMode, pullInCurrentMilliAmps: 30 },
    createdAt,
    id: options.id ?? createId(),
    implementation: {
      coilId: coil.id,
      parts: cloneParts(options.parts),
      springId: spring.id,
      wires: cloneWires(options.wires),
    },
    kind: "relay",
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
    version: 1,
  };
}

export function relayOutputForInput(module: PublishedRelayModule, input: boolean) {
  return module.behavior.contactMode === "normally-closed" ? !input : input;
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

export function loadPublishedRelayModules(storage: Storage | null = browserStorage()) {
  if (!storage) {
    return [] as PublishedRelayModule[];
  }

  try {
    const value = JSON.parse(storage.getItem(publishedModulesStorageKey) ?? "[]") as unknown;
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((module): module is PublishedRelayModule =>
      Boolean(module && typeof module === "object" && (module as PublishedRelayModule).kind === "relay" && Array.isArray((module as PublishedRelayModule).ports)),
    );
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

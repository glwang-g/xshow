export type WorldLayer =
  | "signal-circuit"
  | "logic-memory"
  | "machine"
  | "algorithm-battle"
  | "experiment";

export type WorldId = string;
export type EntityId = string;
export type ComponentId = string;
export type RuleId = string;
export type ScenarioId = string;
export type TickIndex = number;

export type WorldStatus = "ready" | "running" | "paused" | "halted" | "failed";

export type WorldEntity<TComponent extends WorldComponent = WorldComponent> = {
  components: TComponent[];
  id: EntityId;
  label?: string;
  layer?: WorldLayer;
  type: string;
};

export type WorldComponent<TValue = unknown> = {
  id?: ComponentId;
  kind: string;
  value: TValue;
};

export type WorldEvent<TPayload = unknown> = {
  entityId?: EntityId;
  message?: string;
  payload?: TPayload;
  tick: TickIndex;
  type: string;
};

export type WorldState<
  TData = unknown,
  TEntity extends WorldEntity = WorldEntity,
  TEvent extends WorldEvent = WorldEvent,
> = {
  data: TData;
  entities: TEntity[];
  events?: TEvent[];
  status: WorldStatus;
  tick: TickIndex;
};

export type WorldAction<TPayload = unknown> = {
  entityId?: EntityId;
  payload?: TPayload;
  source: "user" | "bot" | "scenario" | "system";
  tick?: TickIndex;
  type: string;
};

export type WorldTickRequest<TState extends WorldState, TAction extends WorldAction> = {
  actions?: TAction[];
  deltaTimeMs?: number;
  state: TState;
};

export type WorldTickResult<TState extends WorldState, TEvent extends WorldEvent = WorldEvent> = {
  events?: TEvent[];
  state: TState;
};

export type WorldRuleContext<TState extends WorldState, TAction extends WorldAction> = {
  actions: TAction[];
  deltaTimeMs: number;
  tick: TickIndex;
  worldId: WorldId;
};

export type WorldRule<
  TState extends WorldState = WorldState,
  TAction extends WorldAction = WorldAction,
  TEvent extends WorldEvent = WorldEvent,
> = {
  apply(state: TState, context: WorldRuleContext<TState, TAction>): WorldTickResult<TState, TEvent>;
  id: RuleId;
  layer?: WorldLayer;
  order?: number;
};

export type WorldScenario<
  TState extends WorldState = WorldState,
  TAction extends WorldAction = WorldAction,
> = {
  description?: string;
  id: ScenarioId;
  initialActions?: TAction[];
  initialState: TState;
  layer: WorldLayer;
  maxTicks?: number;
  rules?: RuleId[];
  title: string;
};

export type WorldReplayFrame<
  TState extends WorldState = WorldState,
  TAction extends WorldAction = WorldAction,
  TEvent extends WorldEvent = WorldEvent,
> = {
  actions: TAction[];
  events?: TEvent[];
  state: TState;
  tick: TickIndex;
};

export type WorldReplay<
  TState extends WorldState = WorldState,
  TAction extends WorldAction = WorldAction,
  TEvent extends WorldEvent = WorldEvent,
> = {
  createdAt: string;
  frames: WorldReplayFrame<TState, TAction, TEvent>[];
  initialState: TState;
  scenarioId?: ScenarioId;
  version: string;
  worldId: WorldId;
};

export type WorldVisualization<TState extends WorldState = WorldState, TViewModel = unknown> = {
  id: string;
  layer?: WorldLayer;
  project(state: TState): TViewModel;
};

export type World<
  TState extends WorldState = WorldState,
  TAction extends WorldAction = WorldAction,
  TEvent extends WorldEvent = WorldEvent,
> = {
  createInitialState(scenario?: WorldScenario<TState, TAction>): TState;
  id: WorldId;
  layer: WorldLayer;
  rules: WorldRule<TState, TAction, TEvent>[];
  tick(request: WorldTickRequest<TState, TAction>): WorldTickResult<TState, TEvent>;
  title: string;
};

export type WorldRuleModule<
  TState extends WorldState = WorldState,
  TAction extends WorldAction = WorldAction,
  TEvent extends WorldEvent = WorldEvent,
> = {
  createWorld?: () => World<TState, TAction, TEvent>;
  id: string;
  layer: WorldLayer;
  rules: WorldRule<TState, TAction, TEvent>[];
  scenarios?: WorldScenario<TState, TAction>[];
  visualizations?: WorldVisualization<TState>[];
};

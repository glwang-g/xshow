export type SimulationLayer =
  | "signal-circuit"
  | "logic-memory"
  | "machine"
  | "algorithm-battle"
  | "experiment";

export type SimulationId = string;
export type EntityId = string;
export type ComponentId = string;
export type RuleId = string;
export type ScenarioId = string;
export type TickIndex = number;

export type SimulationStatus = "ready" | "running" | "paused" | "halted" | "failed";

export type SimulationEntity<TComponent extends SimulationComponent = SimulationComponent> = {
  components: TComponent[];
  id: EntityId;
  label?: string;
  layer?: SimulationLayer;
  type: string;
};

export type SimulationComponent<TValue = unknown> = {
  id?: ComponentId;
  kind: string;
  value: TValue;
};

export type SimulationEvent<TPayload = unknown> = {
  entityId?: EntityId;
  message?: string;
  payload?: TPayload;
  tick: TickIndex;
  type: string;
};

export type SimulationState<
  TData = unknown,
  TEntity extends SimulationEntity = SimulationEntity,
  TEvent extends SimulationEvent = SimulationEvent,
> = {
  data: TData;
  entities: TEntity[];
  events?: TEvent[];
  status: SimulationStatus;
  tick: TickIndex;
};

export type SimulationAction<TPayload = unknown> = {
  entityId?: EntityId;
  payload?: TPayload;
  source: "user" | "bot" | "scenario" | "system";
  tick?: TickIndex;
  type: string;
};

export type SimulationTickRequest<TState extends SimulationState, TAction extends SimulationAction> = {
  actions?: TAction[];
  deltaTimeMs?: number;
  state: TState;
};

export type SimulationTickResult<TState extends SimulationState, TEvent extends SimulationEvent = SimulationEvent> = {
  events?: TEvent[];
  state: TState;
};

export type SimulationRuleContext<TState extends SimulationState, TAction extends SimulationAction> = {
  actions: TAction[];
  deltaTimeMs: number;
  tick: TickIndex;
  simulationId: SimulationId;
};

export type SimulationRule<
  TState extends SimulationState = SimulationState,
  TAction extends SimulationAction = SimulationAction,
  TEvent extends SimulationEvent = SimulationEvent,
> = {
  apply(state: TState, context: SimulationRuleContext<TState, TAction>): SimulationTickResult<TState, TEvent>;
  id: RuleId;
  layer?: SimulationLayer;
  order?: number;
};

export type SimulationScenario<
  TState extends SimulationState = SimulationState,
  TAction extends SimulationAction = SimulationAction,
> = {
  description?: string;
  id: ScenarioId;
  initialActions?: TAction[];
  initialState: TState;
  layer: SimulationLayer;
  maxTicks?: number;
  rules?: RuleId[];
  title: string;
};

export type SimulationReplayFrame<
  TState extends SimulationState = SimulationState,
  TAction extends SimulationAction = SimulationAction,
  TEvent extends SimulationEvent = SimulationEvent,
> = {
  actions: TAction[];
  events?: TEvent[];
  state: TState;
  tick: TickIndex;
};

export type SimulationReplay<
  TState extends SimulationState = SimulationState,
  TAction extends SimulationAction = SimulationAction,
  TEvent extends SimulationEvent = SimulationEvent,
> = {
  createdAt: string;
  frames: SimulationReplayFrame<TState, TAction, TEvent>[];
  initialState: TState;
  scenarioId?: ScenarioId;
  version: string;
  simulationId: SimulationId;
};

export type SimulationVisualization<TState extends SimulationState = SimulationState, TViewModel = unknown> = {
  id: string;
  layer?: SimulationLayer;
  project(state: TState): TViewModel;
};

export type Simulation<
  TState extends SimulationState = SimulationState,
  TAction extends SimulationAction = SimulationAction,
  TEvent extends SimulationEvent = SimulationEvent,
> = {
  createInitialState(scenario?: SimulationScenario<TState, TAction>): TState;
  id: SimulationId;
  layer: SimulationLayer;
  rules: SimulationRule<TState, TAction, TEvent>[];
  tick(request: SimulationTickRequest<TState, TAction>): SimulationTickResult<TState, TEvent>;
  title: string;
};

export type SimulationRuleModule<
  TState extends SimulationState = SimulationState,
  TAction extends SimulationAction = SimulationAction,
  TEvent extends SimulationEvent = SimulationEvent,
> = {
  createSimulation?: () => Simulation<TState, TAction, TEvent>;
  id: string;
  layer: SimulationLayer;
  rules: SimulationRule<TState, TAction, TEvent>[];
  scenarios?: SimulationScenario<TState, TAction>[];
  visualizations?: SimulationVisualization<TState>[];
};

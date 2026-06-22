export type TankAction = {
  fire?: number;
  gunTurn?: number;
  message?: string;
  scan?: number;
  thrust?: number;
  turn?: number;
};

export type TankSnapshot = {
  angle: number;
  distance?: number;
  energy: number;
  gunAngle: number;
  heat: number;
  hp: number;
  id: string;
  visible?: boolean;
  x: number;
  y: number;
};

export type TankLabContext = {
  angleTo: (from: Pick<TankSnapshot, "x" | "y">, to: Pick<TankSnapshot, "x" | "y">) => number;
  bullets: BulletState[];
  clamp: (value: number, min?: number, max?: number) => number;
  enemy: TankSnapshot;
  normalizeAngle: (angle: number) => number;
  self: TankSnapshot;
  tick: number;
  turnToward: (current: number, target: number) => number;
  world: TankWorld;
};

export type TankStrategy = (context: TankLabContext) => TankAction;

export type TankWorld = {
  height: number;
  width: number;
};

export type TankState = {
  angle: number;
  color: string;
  energy: number;
  gunAngle: number;
  heat: number;
  hits: number;
  hp: number;
  id: string;
  label: string;
  lastAction: TankAction;
  lastMessage: string;
  shots: number;
  x: number;
  y: number;
};

export type BulletState = {
  damage: number;
  id: string;
  ownerId: string;
  speed: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type TankLabBattle = {
  bullets: BulletState[];
  events: string[];
  tanks: TankState[];
  tick: number;
  winnerId: string | null;
  world: TankWorld;
};

const tankRadius = 18;
const bulletRadius = 3.5;
const maxTankSpeed = 2.6;
const maxTankTurn = 0.065;
const maxGunTurn = 0.105;
const bulletSpeed = 7.8;
const fireHeat = 20;
const fireDamage = 12;
const maxEvents = 7;

export function createInitialTankBattle(): TankLabBattle {
  return {
    bullets: [],
    events: ["战场已就绪"],
    tanks: [
      {
        angle: 0,
        color: "#0f766e",
        energy: 100,
        gunAngle: 0,
        heat: 0,
        hits: 0,
        hp: 100,
        id: "player",
        label: "你的战车",
        lastAction: {},
        lastMessage: "等待策略",
        shots: 0,
        x: 210,
        y: 280,
      },
      {
        angle: Math.PI,
        color: "#c2410c",
        energy: 100,
        gunAngle: Math.PI,
        heat: 0,
        hits: 0,
        hp: 100,
        id: "rival",
        label: "训练对手",
        lastAction: {},
        lastMessage: "巡航",
        shots: 0,
        x: 690,
        y: 280,
      },
    ],
    tick: 0,
    winnerId: null,
    world: {
      height: 560,
      width: 900,
    },
  };
}

export function stepTankBattle(
  battle: TankLabBattle,
  playerStrategy: TankStrategy,
  rivalStrategy: TankStrategy = orbitRivalStrategy,
): TankLabBattle {
  if (battle.winnerId) {
    return battle;
  }

  const player = battle.tanks[0];
  const rival = battle.tanks[1];
  const actions = new Map<string, TankAction>();

  actions.set(player.id, runStrategy(playerStrategy, createContext(battle, player, rival)));
  actions.set(rival.id, runStrategy(rivalStrategy, createContext(battle, rival, player)));

  for (const tank of battle.tanks) {
    const opponent = tank.id === player.id ? rival : player;
    if (tank.hp <= 0) {
      continue;
    }

    applyTankAction(battle, tank, opponent, actions.get(tank.id) ?? {});
  }

  advanceBullets(battle);
  battle.tick += 1;

  const defeated = battle.tanks.find((tank) => tank.hp <= 0);
  if (defeated) {
    const winner = battle.tanks.find((tank) => tank.id !== defeated.id);
    battle.winnerId = winner?.id ?? null;
    pushEvent(battle, `${winner?.label ?? "战车"}获胜`);
  }

  return battle;
}

export function cloneTankBattle(battle: TankLabBattle): TankLabBattle {
  return {
    ...battle,
    bullets: battle.bullets.map((bullet) => ({ ...bullet })),
    events: [...battle.events],
    tanks: battle.tanks.map((tank) => ({ ...tank })),
    world: { ...battle.world },
  };
}

export function buildTankContext(
  battle: TankLabBattle,
  tankId: string,
): TankLabContext {
  const self = battle.tanks.find((tank) => tank.id === tankId) ?? battle.tanks[0];
  const enemy = battle.tanks.find((tank) => tank.id !== self.id) ?? battle.tanks[1];
  return createContext(battle, self, enemy);
}

export function orbitRivalStrategy(context: TankLabContext): TankAction {
  const aim = context.angleTo(context.self, context.enemy);
  const distance = context.enemy.distance ?? 0;
  const sideStep = distance < 250 ? 0.35 : 1;

  return {
    fire: distance < 520 && Math.abs(context.turnToward(context.self.gunAngle, aim)) < 0.14 ? 0.8 : 0,
    gunTurn: context.turnToward(context.self.gunAngle, aim),
    message: distance < 260 ? "拉开距离" : "环绕锁定",
    thrust: sideStep,
    turn: context.turnToward(context.self.angle, aim + 0.85),
  };
}

export function sentryRivalStrategy(context: TankLabContext): TankAction {
  const aim = context.angleTo(context.self, context.enemy);
  const aimError = context.turnToward(context.self.gunAngle, aim);
  const tooClose = (context.enemy.distance ?? 0) < 210;

  return {
    fire: Math.abs(aimError) < 0.11 ? 0.95 : 0,
    gunTurn: aimError,
    message: tooClose ? "后撤架枪" : "定点瞄准",
    thrust: tooClose ? -0.55 : 0.08,
    turn: context.turnToward(context.self.angle, tooClose ? aim + Math.PI : aim),
  };
}

export function rushRivalStrategy(context: TankLabContext): TankAction {
  const aim = context.angleTo(context.self, context.enemy);
  const aimError = context.turnToward(context.self.gunAngle, aim);
  const distance = context.enemy.distance ?? 0;

  return {
    fire: distance < 360 && Math.abs(aimError) < 0.2 ? 0.65 : 0,
    gunTurn: aimError,
    message: distance < 180 ? "贴身扰动" : "快速逼近",
    thrust: distance < 170 ? -0.25 : 1,
    turn: context.turnToward(context.self.angle, aim + (distance < 260 ? 0.35 : 0)),
  };
}

function applyTankAction(
  battle: TankLabBattle,
  tank: TankState,
  opponent: TankState,
  action: TankAction,
) {
  tank.angle = normalizeAngle(tank.angle + clamp(action.turn ?? 0) * maxTankTurn);
  tank.gunAngle = normalizeAngle(tank.gunAngle + clamp(action.gunTurn ?? 0) * maxGunTurn);
  tank.heat = Math.max(0, tank.heat - 1);
  tank.energy = Math.max(0, Math.min(100, tank.energy + 0.045));
  tank.lastAction = {
    fire: action.fire ?? 0,
    gunTurn: action.gunTurn ?? 0,
    message: action.message,
    scan: action.scan ?? 0,
    thrust: action.thrust ?? 0,
    turn: action.turn ?? 0,
  };

  const speed = clamp(action.thrust ?? 0) * maxTankSpeed;
  tank.x = clamp(tank.x + Math.cos(tank.angle) * speed, tankRadius, battle.world.width - tankRadius);
  tank.y = clamp(tank.y + Math.sin(tank.angle) * speed, tankRadius, battle.world.height - tankRadius);

  if (distanceBetween(tank, opponent) < tankRadius * 2) {
    tank.x = clamp(tank.x - Math.cos(tank.angle) * maxTankSpeed, tankRadius, battle.world.width - tankRadius);
    tank.y = clamp(tank.y - Math.sin(tank.angle) * maxTankSpeed, tankRadius, battle.world.height - tankRadius);
  }

  if (action.message) {
    tank.lastMessage = action.message.slice(0, 18);
  }

  if ((action.fire ?? 0) > 0 && tank.heat <= 0 && tank.energy >= 6) {
    fireBullet(battle, tank, clamp(action.fire ?? 1, 0.15, 1));
  }
}

function advanceBullets(battle: TankLabBattle) {
  const activeBullets: BulletState[] = [];

  for (const bullet of battle.bullets) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;

    const outside =
      bullet.x < -20 ||
      bullet.x > battle.world.width + 20 ||
      bullet.y < -20 ||
      bullet.y > battle.world.height + 20;

    if (outside) {
      continue;
    }

    const target = battle.tanks.find(
      (tank) => tank.id !== bullet.ownerId && tank.hp > 0 && distanceBetween(tank, bullet) < tankRadius + bulletRadius,
    );

    if (target) {
      target.hp = Math.max(0, target.hp - bullet.damage);
      const owner = battle.tanks.find((tank) => tank.id === bullet.ownerId);
      if (owner) {
        owner.hits += 1;
      }
      pushEvent(battle, `${target.label}被击中 -${bullet.damage}`);
      continue;
    }

    activeBullets.push(bullet);
  }

  battle.bullets = activeBullets;
}

function fireBullet(battle: TankLabBattle, tank: TankState, power: number) {
  const damage = Math.round(fireDamage * power);
  const muzzle = tankRadius + 8;

  battle.bullets.push({
    damage,
    id: `${tank.id}-${battle.tick}-${battle.bullets.length}`,
    ownerId: tank.id,
    speed: bulletSpeed,
    vx: Math.cos(tank.gunAngle) * bulletSpeed,
    vy: Math.sin(tank.gunAngle) * bulletSpeed,
    x: tank.x + Math.cos(tank.gunAngle) * muzzle,
    y: tank.y + Math.sin(tank.gunAngle) * muzzle,
  });

  tank.energy = Math.max(0, tank.energy - 6 - power * 4);
  tank.heat = fireHeat;
  tank.shots += 1;
  pushEvent(battle, `${tank.label}开火`);
}

function createContext(
  battle: TankLabBattle,
  self: TankState,
  enemy: TankState,
): TankLabContext {
  const selfSnapshot = toSnapshot(self);
  const enemySnapshot = {
    ...toSnapshot(enemy),
    distance: distanceBetween(self, enemy),
    visible: enemy.hp > 0,
  };

  return {
    angleTo,
    bullets: battle.bullets.map((bullet) => ({ ...bullet })),
    clamp,
    enemy: enemySnapshot,
    normalizeAngle,
    self: selfSnapshot,
    tick: battle.tick,
    turnToward,
    world: { ...battle.world },
  };
}

function runStrategy(strategy: TankStrategy, context: TankLabContext): TankAction {
  try {
    return sanitizeTankAction(strategy(context));
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "策略异常",
      thrust: 0,
    };
  }
}

function actionNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function sanitizeTankAction(action: unknown): TankAction {
  if (!action || typeof action !== "object" || Array.isArray(action)) {
    return {};
  }

  const candidate = action as Record<string, unknown>;
  return {
    fire: actionNumber(candidate.fire),
    gunTurn: actionNumber(candidate.gunTurn),
    message: typeof candidate.message === "string" ? candidate.message : undefined,
    scan: actionNumber(candidate.scan),
    thrust: actionNumber(candidate.thrust),
    turn: actionNumber(candidate.turn),
  };
}

function toSnapshot(tank: TankState): TankSnapshot {
  return {
    angle: tank.angle,
    energy: Math.round(tank.energy),
    gunAngle: tank.gunAngle,
    heat: tank.heat,
    hp: tank.hp,
    id: tank.id,
    x: tank.x,
    y: tank.y,
  };
}

function pushEvent(battle: TankLabBattle, event: string) {
  battle.events = [event, ...battle.events].slice(0, maxEvents);
}

export function clamp(value: number, min = -1, max = 1): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(min, Math.min(max, value));
}

export function angleTo(
  from: Pick<TankSnapshot, "x" | "y">,
  to: Pick<TankSnapshot, "x" | "y">,
): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function normalizeAngle(angle: number): number {
  let result = angle;

  while (result > Math.PI) {
    result -= Math.PI * 2;
  }

  while (result < -Math.PI) {
    result += Math.PI * 2;
  }

  return result;
}

export function turnToward(current: number, target: number): number {
  return clamp(normalizeAngle(target - current) / maxTankTurn);
}

function distanceBetween(
  a: Pick<TankSnapshot | TankState | BulletState, "x" | "y">,
  b: Pick<TankSnapshot | TankState | BulletState, "x" | "y">,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

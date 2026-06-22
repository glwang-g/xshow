import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const tankLab = await import(await compiledModuleUrl("../src/lib/tank-lab.ts", import.meta.url));
const idleStrategy = () => ({ message: "idle" });
const fireStrategy = () => ({ fire: 1, message: "fire" });

test("tank battle starts with two ready tanks", () => {
  const battle = tankLab.createInitialTankBattle();

  assert.equal(battle.tanks.length, 2);
  assert.equal(battle.tanks[0].id, "player");
  assert.equal(battle.tanks[1].id, "rival");
  assert.equal(battle.winnerId, null);
  assert.deepEqual(battle.events, ["战场已就绪"]);
});

test("tank firing consumes energy, adds heat, and cannot fire while cooling", () => {
  const battle = tankLab.createInitialTankBattle();

  tankLab.stepTankBattle(battle, fireStrategy, idleStrategy);

  assert.equal(battle.tanks[0].shots, 1);
  assert.equal(battle.tanks[0].heat, 20);
  assert.ok(battle.tanks[0].energy < 100);
  assert.equal(battle.bullets.length, 1);

  tankLab.stepTankBattle(battle, fireStrategy, idleStrategy);

  assert.equal(battle.tanks[0].shots, 1);
  assert.equal(battle.tanks[0].heat, 19);
});

test("tank bullets damage opponents and set a winner", () => {
  const battle = tankLab.createInitialTankBattle();
  const rival = battle.tanks[1];
  rival.hp = 10;
  battle.bullets.push({
    damage: 12,
    id: "test-shot",
    ownerId: "player",
    speed: 0,
    vx: 0,
    vy: 0,
    x: rival.x - 20,
    y: rival.y,
  });

  tankLab.stepTankBattle(battle, idleStrategy, idleStrategy);

  assert.equal(rival.hp, 0);
  assert.equal(battle.tanks[0].hits, 1);
  assert.equal(battle.winnerId, "player");
  assert.match(battle.events[0], /获胜/);
});

test("tank strategy actions are sanitized before simulation", () => {
  const battle = tankLab.createInitialTankBattle();
  const badStrategy = () => ({
    fire: "yes",
    gunTurn: Number.POSITIVE_INFINITY,
    message: 123,
    thrust: Number.NaN,
    turn: "left",
  });

  tankLab.stepTankBattle(battle, badStrategy, idleStrategy);

  assert.equal(battle.tanks[0].shots, 0);
  assert.equal(battle.tanks[0].lastAction.fire, 0);
  assert.equal(battle.tanks[0].lastAction.thrust, 0);
  assert.equal(battle.tanks[0].lastMessage, "等待策略");
});

test("tank angle helpers normalize and turn toward targets", () => {
  assert.ok(tankLab.normalizeAngle(Math.PI * 3) <= Math.PI);
  assert.ok(tankLab.normalizeAngle(-Math.PI * 3) >= -Math.PI);
  assert.equal(tankLab.clamp(Number.NaN), 0);
  assert.equal(tankLab.clamp(5, -2, 2), 2);
  assert.equal(tankLab.angleTo({ x: 0, y: 0 }, { x: 1, y: 0 }), 0);
  assert.ok(tankLab.turnToward(0, Math.PI) > 0);
});

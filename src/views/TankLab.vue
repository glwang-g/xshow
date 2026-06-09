<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import {
  Activity,
  Bot,
  Code2,
  Crosshair,
  Gauge,
  Home,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  StepForward,
  Swords,
  Target,
} from "@lucide/vue";
import Button from "@/components/ui/Button.vue";
import {
  buildTankContext,
  cloneTankBattle,
  createInitialTankBattle,
  orbitRivalStrategy,
  rushRivalStrategy,
  sentryRivalStrategy,
  stepTankBattle,
  type TankAction,
  type TankLabBattle,
  type TankLabContext,
  type TankState,
  type TankStrategy,
} from "@/lib/tank-lab";

type StrategyPreset = {
  code: string;
  description: string;
  id: string;
  name: string;
};

type OpponentPreset = {
  description: string;
  id: string;
  name: string;
  strategy: TankStrategy;
};

const strategyPresets: StrategyPreset[] = [
  {
    id: "starter",
    name: "锁定开火",
    description: "稳定追踪目标，适合第一场。",
    code: `function update(ctx) {
  const aim = ctx.angleTo(ctx.self, ctx.enemy);
  const aimError = ctx.turnToward(ctx.self.gunAngle, aim);
  const farAway = ctx.enemy.distance > 260;

  return {
    thrust: farAway ? 1 : 0.2,
    turn: ctx.turnToward(ctx.self.angle, aim),
    gunTurn: aimError,
    fire: Math.abs(aimError) < 0.18 ? 1 : 0,
    message: "锁定开火"
  };
}`,
  },
  {
    id: "orbit",
    name: "绕圈压制",
    description: "一边侧向移动，一边持续校准炮口。",
    code: `function update(ctx) {
  const aim = ctx.angleTo(ctx.self, ctx.enemy);
  const orbit = aim + 1.05;
  const aimError = ctx.turnToward(ctx.self.gunAngle, aim);

  return {
    thrust: ctx.enemy.distance < 180 ? -0.4 : 0.9,
    turn: ctx.turnToward(ctx.self.angle, orbit),
    gunTurn: aimError,
    fire: Math.abs(aimError) < 0.13 ? 0.75 : 0,
    message: "绕圈压制"
  };
}`,
  },
  {
    id: "evade",
    name: "保守闪避",
    description: "保持距离，炮口命中率优先。",
    code: `function update(ctx) {
  const aim = ctx.angleTo(ctx.self, ctx.enemy);
  const danger = ctx.bullets.some((bullet) => bullet.ownerId !== ctx.self.id);
  const aimError = ctx.turnToward(ctx.self.gunAngle, aim);

  return {
    thrust: danger ? 1 : (ctx.enemy.distance < 250 ? -0.65 : 0.45),
    turn: ctx.turnToward(ctx.self.angle, danger ? aim + 1.5 : aim),
    gunTurn: aimError,
    fire: Math.abs(aimError) < 0.1 ? 0.55 : 0,
    message: danger ? "规避弹道" : "稳住距离"
  };
}`,
  },
];

const opponentPresets: OpponentPreset[] = [
  {
    description: "持续侧向移动，适合测试追踪能力。",
    id: "orbit",
    name: "环绕型",
    strategy: orbitRivalStrategy,
  },
  {
    description: "站位更稳，适合测试瞄准精度。",
    id: "sentry",
    name: "炮台型",
    strategy: sentryRivalStrategy,
  },
  {
    description: "快速靠近，适合测试规避能力。",
    id: "rush",
    name: "突进型",
    strategy: rushRivalStrategy,
  },
];

const canvasRef = ref<HTMLCanvasElement | null>(null);
const battle = ref<TankLabBattle>(createInitialTankBattle());
const compileError = ref("");
const running = ref(false);
const selectedOpponentId = ref(opponentPresets[0].id);
const selectedPresetId = ref(strategyPresets[0].id);
const simulationSpeed = ref(2);
const strategyCode = ref(strategyPresets[0].code);
const strategy = ref<TankStrategy>(() => ({ message: "等待策略" }));
const frameId = ref<number | null>(null);

const activeOpponent = computed(
  () => opponentPresets.find((preset) => preset.id === selectedOpponentId.value) ?? opponentPresets[0],
);
const player = computed(() => battle.value.tanks[0]);
const rival = computed(() => battle.value.tanks[1]);
const distanceToRival = computed(() => Math.round(Math.hypot(player.value.x - rival.value.x, player.value.y - rival.value.y)));
const incomingBullets = computed(() => battle.value.bullets.filter((bullet) => bullet.ownerId !== player.value.id).length);
const winner = computed(() =>
  battle.value.winnerId ? battle.value.tanks.find((tank) => tank.id === battle.value.winnerId) : null,
);
const actionReadout = computed(() => [
  {
    label: "移动",
    value: formatThrust(player.value.lastAction.thrust ?? 0),
  },
  {
    label: "车身",
    value: formatTurn(player.value.lastAction.turn ?? 0),
  },
  {
    label: "炮口",
    value: formatTurn(player.value.lastAction.gunTurn ?? 0),
  },
  {
    label: "开火",
    value: (player.value.lastAction.fire ?? 0) > 0 ? `火力 ${Math.round((player.value.lastAction.fire ?? 0) * 100)}%` : "等待",
  },
]);
const battleStatus = computed(() => {
  if (winner.value) {
    return `${winner.value.label}获胜`;
  }

  return running.value ? "模拟中" : "已暂停";
});
const resultInsight = computed(() => {
  const playerHitRate = hitRate(player.value);
  const rivalHitRate = hitRate(rival.value);

  if (winner.value) {
    return winner.value.id === player.value.id
      ? `赢了。你的命中率 ${playerHitRate}%，对手 ${rivalHitRate}%。下一步可以试着降低开火频率，看能不能保持胜率。`
      : `输了。你的命中率 ${playerHitRate}%，对手 ${rivalHitRate}%。先观察炮口读数，再调整移动和开火阈值。`;
  }

  if (incomingBullets.value > 0) {
    return "当前有敌方弹道在场，适合观察规避逻辑是否真的改变了车身方向。";
  }

  return "先运行一小段，再暂停看动作读数：移动、车身、炮口、开火会告诉你策略正在做什么。";
});

watch(selectedOpponentId, () => {
  resetBattle();
});

watch(strategyCode, () => {
  compileStrategy();
});

watch(battle, () => {
  drawBattle();
});

onMounted(() => {
  compileStrategy();
  drawBattle();
});

onBeforeUnmount(() => {
  stopLoop();
});

function selectPreset(preset: StrategyPreset) {
  selectedPresetId.value = preset.id;
  strategyCode.value = preset.code;
  resetBattle();
}

function compileStrategy() {
  try {
    const factory = new Function(
      "ctx",
      `"use strict";
${strategyCode.value}
if (typeof update !== "function") {
  throw new Error("需要定义 update(ctx)");
}
return update(ctx);`,
    ) as (context: TankLabContext) => TankAction;

    strategy.value = (context) => sanitizeAction(factory(context));
    compileError.value = "";
  } catch (error) {
    compileError.value = error instanceof Error ? error.message : "策略编译失败";
  }
}

function sanitizeAction(action: TankAction | null | undefined): TankAction {
  if (!action || typeof action !== "object") {
    return {};
  }

  return action;
}

function toggleRunning() {
  if (running.value) {
    running.value = false;
    stopLoop();
    return;
  }

  compileStrategy();
  if (compileError.value) {
    return;
  }

  running.value = true;
  loop();
}

function stepOnce() {
  compileStrategy();
  if (compileError.value) {
    return;
  }

  advanceBattle();
}

function resetBattle() {
  running.value = false;
  stopLoop();
  battle.value = createInitialTankBattle();
  nextTick(drawBattle);
}

function loop() {
  stopLoop();

  const animate = () => {
    if (!running.value) {
      return;
    }

    for (let step = 0; step < simulationSpeed.value; step += 1) {
      advanceBattle();
      if (battle.value.winnerId) {
        break;
      }
    }

    if (battle.value.winnerId) {
      running.value = false;
      return;
    }

    frameId.value = window.requestAnimationFrame(animate);
  };

  frameId.value = window.requestAnimationFrame(animate);
}

function stopLoop() {
  if (frameId.value !== null) {
    window.cancelAnimationFrame(frameId.value);
    frameId.value = null;
  }
}

function advanceBattle() {
  const nextBattle = cloneTankBattle(battle.value);
  stepTankBattle(nextBattle, strategy.value, activeOpponent.value.strategy);
  battle.value = nextBattle;
}

function drawBattle() {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const { width, height } = battle.value.world;
  context.clearRect(0, 0, width, height);
  drawArena(context, width, height);
  drawSensorCone(context, player.value);

  for (const bullet of battle.value.bullets) {
    context.beginPath();
    context.fillStyle = bullet.ownerId === "player" ? "#14b8a6" : "#fb923c";
    context.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    context.fill();
  }

  for (const tank of battle.value.tanks) {
    drawTank(context, tank);
  }

  drawAimLine(context, player.value, rival.value);
}

function drawArena(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = "#f7f7ef";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(63, 63, 70, 0.12)";
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let y = 0; y <= height; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.strokeStyle = "#334155";
  context.lineWidth = 3;
  context.strokeRect(1.5, 1.5, width - 3, height - 3);
}

function drawTank(context: CanvasRenderingContext2D, tank: TankState) {
  context.save();
  context.translate(tank.x, tank.y);
  context.rotate(tank.angle);

  context.fillStyle = tank.color;
  context.strokeStyle = "rgba(15, 23, 42, 0.34)";
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(-22, -15, 44, 30, 7);
  context.fill();
  context.stroke();

  context.fillStyle = "rgba(255, 255, 255, 0.72)";
  context.fillRect(-16, -19, 11, 4);
  context.fillRect(-16, 15, 11, 4);
  context.fillRect(5, -19, 11, 4);
  context.fillRect(5, 15, 11, 4);
  context.restore();

  context.save();
  context.translate(tank.x, tank.y);
  context.rotate(tank.gunAngle);
  context.strokeStyle = "#111827";
  context.lineCap = "round";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(34, 0);
  context.stroke();
  context.restore();

  context.fillStyle = "#111827";
  context.font = "12px ui-sans-serif, system-ui";
  context.textAlign = "center";
  context.fillText(`${tank.hp}`, tank.x, tank.y - 29);
}

function drawAimLine(
  context: CanvasRenderingContext2D,
  source: TankState,
  target: TankState,
) {
  const preview = buildTankContext(battle.value, source.id);
  if (!preview.enemy.visible) {
    return;
  }

  context.save();
  context.strokeStyle = "rgba(20, 184, 166, 0.35)";
  context.setLineDash([6, 9]);
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(source.x, source.y);
  context.lineTo(target.x, target.y);
  context.stroke();
  context.restore();
}

function drawSensorCone(context: CanvasRenderingContext2D, tank: TankState) {
  context.save();
  context.translate(tank.x, tank.y);
  context.rotate(tank.gunAngle);
  context.fillStyle = "rgba(20, 184, 166, 0.08)";
  context.beginPath();
  context.moveTo(0, 0);
  context.arc(0, 0, 170, -0.28, 0.28);
  context.closePath();
  context.fill();
  context.restore();
}

function hitRate(tank: TankState): number {
  if (tank.shots === 0) {
    return 0;
  }

  return Math.round((tank.hits / tank.shots) * 100);
}

function formatThrust(value: number): string {
  if (value > 0.1) {
    return `前进 ${Math.round(value * 100)}%`;
  }

  if (value < -0.1) {
    return `后退 ${Math.round(Math.abs(value) * 100)}%`;
  }

  return "停稳";
}

function formatTurn(value: number): string {
  if (value > 0.08) {
    return `右转 ${Math.round(value * 100)}%`;
  }

  if (value < -0.08) {
    return `左转 ${Math.round(Math.abs(value) * 100)}%`;
  }

  return "对准";
}
</script>

<template>
  <main class="min-h-screen overflow-x-hidden bg-[#f8faf5] text-slate-950">
    <header class="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
          <Swords class="h-5 w-5" />
        </div>
        <div>
          <h1 class="text-base font-semibold leading-tight">算法战车</h1>
          <p class="text-xs text-slate-500">tank-lab</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2">
        <RouterLink
          to="/"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium transition-colors hover:bg-slate-100"
        >
          <Home class="h-4 w-4" />
          电子积木
        </RouterLink>
        <Button :variant="running ? 'secondary' : 'default'" @click="toggleRunning">
          <Pause v-if="running" class="h-4 w-4" />
          <Play v-else class="h-4 w-4" />
          {{ running ? "暂停" : "运行" }}
        </Button>
        <Button variant="outline" size="icon" title="单步" @click="stepOnce">
          <StepForward class="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" title="重置" @click="resetBattle">
          <RotateCcw class="h-4 w-4" />
        </Button>
      </div>
    </header>

    <section class="grid min-h-[calc(100vh-4rem)] grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)_300px]">
      <aside class="border-b bg-white p-3 xl:border-b-0 xl:border-r">
        <div class="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Code2 class="h-4 w-4 text-teal-700" />
          策略
        </div>

        <div class="mb-3 grid grid-cols-1 gap-2">
          <button
            v-for="preset in strategyPresets"
            :key="preset.id"
            class="rounded-md border px-3 py-2 text-left text-xs transition-colors"
            :class="
              selectedPresetId === preset.id
                ? 'border-teal-700 bg-teal-50 text-teal-950'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            "
            type="button"
            @click="selectPreset(preset)"
          >
            <span class="block font-medium">{{ preset.name }}</span>
            <span class="mt-1 block text-slate-500">{{ preset.description }}</span>
          </button>
        </div>

        <textarea
          v-model="strategyCode"
          class="h-[410px] w-full resize-none rounded-md border border-slate-200 bg-slate-950 p-3 font-mono text-xs leading-5 text-emerald-100 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 xl:h-[calc(100vh-16rem)]"
          spellcheck="false"
        />

        <div
          class="mt-3 rounded-md border px-3 py-2 text-sm"
          :class="compileError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'"
        >
          {{ compileError || "策略可运行" }}
        </div>
      </aside>

      <section class="flex min-h-[430px] flex-col bg-[#eef3e5] p-3">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
            <Activity class="h-4 w-4 text-teal-700" />
            <span class="font-medium">{{ battleStatus }}</span>
            <span class="text-slate-500">tick {{ battle.tick }}</span>
          </div>
          <div class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
            <Crosshair class="h-4 w-4 text-orange-600" />
            <span>{{ battle.bullets.length }} 发弹道</span>
          </div>
        </div>

        <div class="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md border border-slate-300 bg-[#f7f7ef] p-2 shadow-panel">
          <canvas
            ref="canvasRef"
            :height="battle.world.height"
            :width="battle.world.width"
            class="aspect-[900/560] max-h-full w-full max-w-full rounded-sm"
          />
        </div>
      </section>

      <aside class="border-t bg-white p-3 xl:border-l xl:border-t-0">
        <div class="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Gauge class="h-4 w-4 text-orange-600" />
          遥测
        </div>

        <div class="space-y-3">
          <div
            v-for="tank in battle.tanks"
            :key="tank.id"
            class="rounded-md border border-slate-200 bg-white p-3"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: tank.color }" />
                <span class="text-sm font-medium">{{ tank.label }}</span>
              </div>
              <span class="text-xs text-slate-500">{{ tank.lastMessage }}</span>
            </div>

            <div class="space-y-2 text-xs">
              <div>
                <div class="mb-1 flex justify-between">
                  <span>HP</span>
                  <span>{{ tank.hp }}</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full bg-teal-600"
                    :style="{ width: `${tank.hp}%` }"
                  />
                </div>
              </div>

              <div>
                <div class="mb-1 flex justify-between">
                  <span>能量</span>
                  <span>{{ Math.round(tank.energy) }}</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full bg-orange-500"
                    :style="{ width: `${Math.round(tank.energy)}%` }"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div class="mb-2 text-sm font-medium">事件</div>
            <div class="space-y-2 text-sm text-slate-600">
              <div v-for="(event, index) in battle.events" :key="`${index}-${event}`" class="flex items-start gap-2">
                <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                <span>{{ event }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </section>
  </main>
</template>

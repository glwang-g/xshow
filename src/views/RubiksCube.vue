<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { Home, RotateCcw, Shuffle, Sparkles, Wand2 } from "@lucide/vue";
import Button from "@/components/ui/Button.vue";
import { RubiksCubeEngine } from "@/lib/rubiks-cube";

const containerRef = ref<HTMLDivElement | null>(null);
const statusText = ref("正在加载求解器…");
const movesText = ref("");
const moveInput = ref("");
const isBusy = ref(true);
const solverReady = ref(false);

let engine: RubiksCubeEngine | null = null;

onMounted(() => {
  if (!containerRef.value) return;
  engine = new RubiksCubeEngine(containerRef.value);
  engine.onBusyChange = (busy) => {
    isBusy.value = busy;
    if (!busy) updateStatus();
  };

  // 初始化求解器(约2-3秒)
  statusText.value = "正在初始化求解器(约2-3秒)…";
  setTimeout(async () => {
    try {
      await engine!.initSolver();
      solverReady.value = true;
      isBusy.value = false;
      updateStatus();
    } catch (e) {
      statusText.value = "❌ 求解器初始化失败: " + (e as Error).message;
    }
  }, 100);
});

onBeforeUnmount(() => {
  engine?.dispose();
  engine = null;
});

function updateStatus() {
  if (!engine || !solverReady.value) return;
  if (engine.isSolved()) {
    statusText.value = "已还原 · 拖拽可旋转视角";
  } else {
    statusText.value = '已打乱 · 点击"还原"开始求解';
  }
}

async function handleScramble() {
  if (!engine || isBusy.value || !solverReady.value) return;
  movesText.value = "";
  const moves = await engine.scramble((i, total) => {
    statusText.value = `打乱中… (${i}/${total})`;
  });
  movesText.value = "";
  updateStatus();
}

async function handleSolve() {
  if (!engine || isBusy.value || !solverReady.value) return;
  try {
    statusText.value = "正在求解…";
    const solution = await engine.solveAndAnimate((i, total) => {
      statusText.value = `还原中… (${i}/${total})`;
    });
    const moves = solution.split(" ").filter((m) => m.length > 0);
    movesText.value = `解法(${moves.length}步): ${solution}`;
    updateStatus();
  } catch (e) {
    statusText.value = "❌ 求解失败: " + (e as Error).message;
  }
}

async function handleApply() {
  if (!engine || isBusy.value || !solverReady.value) return;
  const input = moveInput.value.trim().toUpperCase();
  if (!input) return;
  const moves = input.split(/\s+/).filter((m) => m.length > 0);
  const validFaces = ["U", "R", "F", "D", "L", "B"];
  for (const m of moves) {
    if (!validFaces.includes(m[0])) {
      statusText.value = "❌ 无效移动: " + m;
      return;
    }
  }
  movesText.value = "应用: " + moves.join(" ");
  await engine.applyMoves(moves, 200, (i, total) => {
    statusText.value = `应用中… (${i}/${total})`;
  });
  movesText.value = "";
  updateStatus();
}

function handleReset() {
  if (!engine || isBusy.value) return;
  engine.reset();
  movesText.value = "";
  updateStatus();
}

function onInputKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") handleApply();
}
</script>

<template>
  <main class="min-h-screen overflow-x-hidden bg-[#050510] text-white">
    <header class="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <Sparkles class="h-5 w-5" />
        </div>
        <div>
          <h1 class="text-base font-semibold leading-tight">3D 魔方求解</h1>
          <p class="text-xs text-white/50">rubiks-cube · Kociemba 算法</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2">
        <RouterLink
          to="/"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-medium transition-colors hover:bg-white/10"
        >
          <Home class="h-4 w-4" />
          任务大厅
        </RouterLink>
      </div>
    </header>

    <section class="grid min-h-[calc(100vh-4rem)] grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)]">
      <!-- 控制面板 -->
      <aside class="flex flex-col gap-4 border-b border-white/10 bg-black/30 p-4 xl:border-b-0 xl:border-r">
        <div>
          <div class="mb-2 text-sm font-semibold text-white/80">状态</div>
          <div class="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
            {{ statusText }}
          </div>
        </div>

        <div>
          <div class="mb-2 text-sm font-semibold text-white/80">操作</div>
          <div class="grid grid-cols-3 gap-2">
            <Button :disabled="isBusy || !solverReady" class="bg-gradient-to-br from-rose-500 to-red-600" @click="handleScramble">
              <Shuffle class="h-4 w-4" />
              打乱
            </Button>
            <Button :disabled="isBusy || !solverReady" class="bg-gradient-to-br from-emerald-500 to-green-600" @click="handleSolve">
              <Wand2 class="h-4 w-4" />
              还原
            </Button>
            <Button :disabled="isBusy" class="bg-gradient-to-br from-[#7f8c8d] to-[#5a6a6a]" @click="handleReset">
              <RotateCcw class="h-4 w-4" />
              重置
            </Button>
          </div>
        </div>

        <div>
          <div class="mb-2 text-sm font-semibold text-white/80">移动序列</div>
          <div class="flex gap-2">
            <input
              v-model="moveInput"
              type="text"
              placeholder="如: R U R' F2"
              class="h-9 flex-1 rounded-md border border-white/15 bg-white/5 px-3 font-mono text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-400"
              @keydown="onInputKeydown"
            />
            <Button :disabled="isBusy || !solverReady" variant="secondary" @click="handleApply">
              应用
            </Button>
          </div>
          <p class="mt-2 text-xs text-white/40">
            输入移动序列将魔方转到指定状态,之后可点击"还原"独立求解
          </p>
        </div>

        <div v-if="movesText" class="mt-2">
          <div class="mb-2 text-sm font-semibold text-white/80">解法</div>
          <div class="max-h-32 overflow-y-auto rounded-md border border-white/10 bg-white/5 p-3 font-mono text-xs leading-5 text-white/60">
            {{ movesText }}
          </div>
        </div>

        <div class="mt-auto rounded-md border border-white/10 bg-white/5 p-3 text-xs leading-5 text-white/40">
          <p class="mb-1 font-medium text-white/60">说明</p>
          <p>· 打乱:随机生成 25 步</p>
          <p>· 还原:Kociemba 两阶段算法,独立求解(非逆序回放)</p>
          <p>· 拖拽旋转视角,滚轮缩放</p>
        </div>
      </aside>

      <!-- 3D 画布 -->
      <section class="relative min-h-[400px] bg-[radial-gradient(circle_at_50%_25%,#1a1a2e_0%,#050510_100%)]">
        <div ref="containerRef" class="absolute inset-0" />
      </section>
    </section>
  </main>
</template>
# 主线层级地图

[English version](layers.md)

`xshow` 应该围绕一条主线收束：

```text
信号/电路 -> 逻辑/存储 -> 机器 -> 算法/对战
```

World Engine 契约服务这条路径，同时允许实验区继续存在，但实验区应保持次级位置。

## 层级归属

| 层级 | 当前模块 | 当前 UI | World Engine 角色 |
| --- | --- | --- | --- |
| 信号/电路 | `src/lib/circuit.ts`、`src/lib/workbench-ui.ts`、lesson data、physical-build helpers | Workbench route 和 workbench components | 基础信号传播规则模块。把 workspace 求值为 circuit state。 |
| 逻辑/存储 | `src/lib/logic-core.ts` | `src/views/LogicLab.vue` | 布尔与存储规则模块。把电路信号桥接到可保持状态。 |
| 机器 | `modules/cpu-sim/src-tauri/core`、`modules/cpu-sim/wasm`、`src/lib/computer-core.ts` | `src/views/ComputerLab.vue` | CPU 规则模块与 typed core API。Rust 继续作为权威核心，TypeScript 包装 snapshot/action。 |
| 算法/对战 | 未来 algorithm modules，`src/lib/tank-lab.ts` 作为原型 | `src/views/TankLab.vue` | 可编程 action loop、bot strategy、replay、比赛/任务原型。 |
| 实验区 | 当前 Tank Lab、3D 魔方、独立 prototype | 次级 routes | 保持可见但次级；只有服务主线时才提升入口权重。 |

## 当前落点

### 信号/电路层

`src/lib/circuit.ts` 拥有当前信号模型：

- `CircuitPart`、`Wire`、`TerminalRef` 是当前 entity。
- `evaluateCircuit()` 是规则入口。
- 求解输出 `CircuitSimulation` 是当前 state projection。
- Workbench lessons 和 starter workspaces 是 scenario-like content。
- Workbench canvas/status rendering 是 visualization 层。

这一层应继续保持 framework-agnostic 和可测试。等共享接口稳定后，再做 `CircuitWorld` adapter。

### 逻辑/存储层

`src/lib/logic-core.ts` 拥有纯逻辑规则：

- `evaluateGate()` 和 `truthTable()` 覆盖组合逻辑。
- `srLatchStep()` 覆盖一步状态保持。
- `buildSrLatchTrace()` 和 `buildRegisterTrace()` 是 trace/replay-like helper。

`src/views/LogicLab.vue` 目前拥有交互 refs 和 UI controls。第一步有价值的迁移，是把 latch/register 按钮操作表达成 action，而不是重写页面。

### 机器层

机器行为是有意拆分的：

- `modules/cpu-sim/src-tauri/core` 的 Rust core 拥有 CPU 与 assembler 规则。
- `modules/cpu-sim/wasm` 是 browser facade scaffold。
- `src/lib/computer-core.ts` 拥有 TypeScript API contract、snapshot、preview adapter 和 view-model helper。
- `src/views/ComputerLab.vue` 拥有 assembly editor 与机器可视化。

迁移路径仍然是 Rust core -> WASM bridge -> Vue/TypeScript UI。

### 算法/对战层

`src/lib/tank-lab.ts` 当前属于实验区，但它也是最接近“可编程世界”的工作原型：

- `TankLabBattle` 是 world state。
- `TankAction` 是 action。
- `TankStrategy` 是 bot/program interface。
- `stepTankBattle()` 是 tick rule。
- `events` 和 `tick` 是 replay 基础。

产品导航上保持次级，但架构经验可以复用到未来 algorithm worlds。

## 第一阶段最小边界

- 保留所有现有模块位置。
- 新增 `src/lib/world-engine.ts` 作为纯类型契约。
- 用 `docs/world-engine.md` 记录迁移规则，用 `docs/layers.md` 记录归属。
- 优先 adapter，不做 rewrite。
- 在 shared runner 真正需要统一外壳之前，各层继续保留自己的领域状态形状。


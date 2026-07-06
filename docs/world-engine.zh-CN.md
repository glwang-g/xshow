# Programmable World Engine 迁移评估

[English version](world-engine.md)

本文记录第一次迁移评估：如何把 `xshow` 从多个相对独立的 Lab，逐步收束为统一的可编程世界引擎。

目标不是重写。第一步只建立共享契约：`World`、`Entity`、`Component`、`State`、`Tick`、`Action`、`Rule`、`Scenario`、`Replay`、`Visualization`。

## 现有抽象映射

| World Engine 抽象 | 当前对应 | 备注 |
| --- | --- | --- |
| `World` | `TankLabBattle`、`ComputerCoreApi`、电路工作台状态、Logic Lab 预览状态 | Tank Lab 最接近完整 World。Computer Lab 已经有 core API 边界。Circuit 与 Logic 目前更像规则/求值模块。 |
| `Entity` | `CircuitPart`、`Wire`、`TankState`、`BulletState`、隐含在 `CpuSnapshot` 里的寄存器/内存格 | 电路部件和战车对象已有稳定 id。CPU 目前还没有拆成 entity 记录。 |
| `Component` | 电路部件的 `type`、`x`、`y`、`closed`、`resistance`；战车位置/能量/HP/炮口；CPU flags/register/memory 字段 | Component 仍嵌在各自领域对象里。第一阶段不要强行归一化。 |
| `State` | `CircuitSimulation`、`TankLabBattle`、`CpuSnapshot`、`LogicLab.vue` 中的 latch/register refs | 每个 Lab 都有状态形状，但还没有统一的 tick/status/events 外壳。 |
| `Tick` | `stepTankBattle()`、`ComputerCoreApi.step()`、`runUntilHalt()`、`buildSrLatchTrace()`、`buildRegisterTrace()` | Tank 和 CPU 有显式 step 语义。电路目前是从工作台输入重新求解静态状态。 |
| `Action` | `TankAction`、Computer Lab 的 load/step/run/reset、Logic Lab 的 latch/register 按钮操作、workbench 交互 | Tank action 已经是领域动作。其他 action 仍主要是 UI handler。 |
| `Rule` | `evaluateCircuit()`、`srLatchStep()`、`buildRegisterTrace()`、Rust CPU fetch/decode/execute、`stepTankBattle()` | 这些是最适合保留为 Rule Module 的代码。 |
| `Scenario` | 电路 lesson 与 starter workspace、CPU sample assembly、Tank strategy/opponent presets、Logic default traces | Scenario 数据已存在，但分散在 data、lib 和 Vue 文件中。 |
| `Replay` | CPU execution log、Tank `events` 和潜在 tick history、Logic trace arrays、workspace records | Replay 已有局部形态，但还不是共享结构。 |
| `Visualization` | workbench canvas/components、`memoryRows()`、`registerRows()`、`flagChips()`、`drawBattle()`、Logic Lab truth/trace tables | 状态到视图的映射常和 Vue/canvas 混在一起。迁移应先抽 view-model projection，再考虑渲染。 |

## 可保留为 Rule Module 的代码

- `src/lib/circuit.ts`：保留拓扑构建、节点合并、支路电阻、网络求解、LED/二极管迭代、仪表和执行器状态推导，作为信号/电路规则模块。
- `src/lib/logic-core.ts`：保留 `evaluateGate()`、`truthTable()`、`srLatchStep()`、`buildSrLatchTrace()`、`buildRegisterTrace()`，作为逻辑/存储规则模块。
- `src/lib/computer-core.ts`：保留 `ComputerCoreApi`、`CpuSnapshot`、`createWasmComputerCore()` 和视图模型辅助函数。`createPreviewComputerCore()` 只作为临时 scenario/replay 适配层，不是真正机器规则。
- `modules/cpu-sim/src-tauri/core`：保留 Rust `cpu.rs` 和 `assembler.rs`，作为机器层权威规则模块。
- `src/lib/tank-lab.ts`：保留 `createInitialTankBattle()`、`stepTankBattle()`、`TankAction`、`TankStrategy`、context 构建、碰撞、子弹和对手策略规则，作为算法/对战规则模块。

## 已出现的重复模式

| 模式 | 当前重复点 | 迁移方向 |
| --- | --- | --- |
| run/step/reset 循环 | `ComputerLab.vue` 包装 core action；`TankLab.vue` 自己维护运行/暂停/单步/重置和动画循环；Logic Lab 有 apply/reset | 至少两个 adapter 接入 `World.tick()` 后，再抽共享 world-controller/composable。 |
| Scenario 数据 | Tank preset 在 `TankLab.vue`；CPU sample program 在 `computer-core.ts`；Logic default trace 在 `logic-core.ts`；电路 lesson 在 lesson data | 未来新增 scenario 统一走 `WorldScenario`。既有内容逐步迁移。 |
| Replay/trace/event | CPU `log`、Tank `events`、Logic trace arrays、workspace records | 先定义 `WorldReplay` 类型。之后从 adapter 记录 frame。 |
| Visualization projection | `memoryRows()`、`registerRows()`、`flagChips()`、`drawBattle()`、Logic 表格映射、电路状态映射 | 先抽 projection helper，不急着改组件布局。 |
| Action sanitization | `tank-lab.ts` 清洗策略输出；`TankLab.vue` 也对编译结果做轻量清洗 | 领域清洗应留在 rule module，UI 只负责编译/收集 action。 |
| 状态与 tick 文案 | `actionMessage`、`battleStatus`、`resultInsight`、电路状态面板、lesson hints | 以后从 world state/events 暴露状态，但第一阶段保留现有 UI 文案。 |

## 最小迁移路线

1. **只建契约：** 新增 `src/lib/world-engine.ts`，只放 TypeScript 接口，不接入运行时。
2. **沉淀边界：** 保留本文和 `docs/layers.md` 作为迁移地图。
3. **逐个薄适配：**
   - `CircuitWorld`：输入 parts/wires；rule 调用 `evaluateCircuit()`。
   - `LogicWorld`：action 切换输入或脉冲存储；rule 调用 `evaluateGate()` 和 `srLatchStep()`。
   - `ComputerWorld`：包装 `ComputerCoreApi`；先 preview，后 WASM。
   - `TankBattleWorld`：包装 `stepTankBattle()` 并记录 replay frame。
4. **等 adapter 成型后再抽 controller：** `useWorldRunner()` 可以统一 run/pause/step/reset/replay capture。
5. **Scenario registry：** 新 lesson、对战、sample program、算法 demo 逐步改成 typed scenario records。
6. **Replay capture：** 先给 Tank 和 Computer 记录 `{ tick, actions, state, events }`，因为它们已有 step 语义。
7. **Visualization adapter：** 先把 state project 成现有 Vue/canvas 可用的 view model，再谈 UI 重写。

## 第一阶段只允许的代码改动

- 新增纯类型文件 `src/lib/world-engine.ts`。
- 新增 engine model 和 layer map 文档。
- 更新 `.codex/memory.md`、`.codex/decisions.md` 和 context index。
- 之后可以新增小型 adapter stub，但必须未接入或有测试保护。

第一阶段不要做：

- 重写现有 Lab；
- 删除实验路由；
- 替换 Rust CPU core；
- 追求完整 WASM 沙箱；
- 批量搬 lesson 内容或 UI 布局；
- 强行把所有领域对象归一化为 ECS component。

## 建议新增的类型定义

第一版类型已放在 `src/lib/world-engine.ts`：

- `WorldLayer`
- `WorldEntity`
- `WorldComponent`
- `WorldState`
- `WorldAction`
- `WorldRule`
- `WorldScenario`
- `WorldReplay`
- `WorldVisualization`
- `WorldRuleModule`

这些类型故意保持宽松。它们用于指导 adapter，而不是要求现有领域模型立刻改形状。


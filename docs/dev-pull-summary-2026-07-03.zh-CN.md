# dev 拉取摘要：2026-07-03

这份文档记录 `2026-07-03 21:35:53 +0800` 从 `origin/dev` 拉下来的主要变化，供后续快速恢复上下文，避免反复阅读完整 diff。

## 提交范围

- 拉取方式：`pull origin dev`，fast-forward
- 起点：`712270b fx: merge`
- 终点：`2d5fb95 fx: push`
- 新增提交：
  - `0f95477 fx: push`
  - `2d5fb95 fx: push`
- 规模：49 个文件，约 3237 行新增，9 行删除

## 主要变化

### 1. 主应用新增 3D 魔方实验

新增 `/rubiks-cube` 页面，作为大厅里的探索实验。

关键文件：

- `src/views/RubiksCube.vue`
- `src/lib/rubiks-cube.ts`
- `src/router/index.ts`
- `src/views/Hub.vue`
- `package.json`
- `pnpm-lock.yaml`

功能点：

- 使用 Three.js 渲染 3D 魔方。
- 使用 `cubejs` 初始化求解器并计算解法。
- 支持随机打乱、输入移动序列、自动还原。
- 支持拖拽旋转视角、滚轮缩放。
- 大厅页“探索实验区”新增“3D 魔方”入口。

新增依赖：

- `three`
- `@types/three`
- `cubejs`

注意：

- 当前本地 `node_modules` 里还没有这几个新依赖，需要先跑 `pnpm install`。
- 未安装依赖时，`pnpm typecheck` 会报找不到 `three` 相关模块。

### 2. 大厅页强化为维修任务大厅

`src/views/Hub.vue` 不再只是入口集合，而是展示更完整的维修任务状态。

新增/强化内容：

- 当前或推荐维修任务。
- 维修完成进度。
- 最近维修活动。
- 每个任务的状态标签。
- 主线维修任务和探索实验区分区更明显。

### 3. 维修进度持久化抽出 codec

把维修进度 localStorage 数据处理集中到 `src/lib/repair-progress-codec.ts`，`src/composables/useRepairProgress.ts` 改为调用这些纯函数。

关键能力：

- 清洗 localStorage 中的维修进度状态。
- 丢弃未知任务和畸形记录。
- 支持开始、重开、完成、重置维修任务。
- 避免重复完成时重复增加完成次数。

测试：

- 新增 `tests/repair-progress-codec.mjs`
- 覆盖状态清洗、重置、重开、完成计数、非法 payload 等路径。

### 4. 新增独立 CPU 模拟器子工程

新增 `modules/cpu-sim`，是独立于主 Vue 应用的 Tauri + Rust + Vue 子项目。

关键文件：

- `modules/cpu-sim/README.md`
- `modules/cpu-sim/package.json`
- `modules/cpu-sim/src/App.vue`
- `modules/cpu-sim/src/composables/useCpu.ts`
- `modules/cpu-sim/src-tauri/core/src/cpu.rs`
- `modules/cpu-sim/src-tauri/core/src/assembler.rs`
- `modules/cpu-sim/src-tauri/src/main.rs`

Rust 核心：

- 8-bit 教学 CPU。
- 256 字节内存。
- 寄存器：`A`、`B`、`PC`、`FLAGS`。
- 指令：`MOV`、`ADD`、`SUB`、`LOAD`、`STORE`、`JMP`、`CMP`、`JZ`、`HALT`。
- 支持 step、run until halt、非法 opcode 停机、日志上限。

汇编器：

- 两遍汇编。
- 支持标签。
- 支持十进制和 `0x` 十六进制字面量。
- 支持 `;` 注释。
- 错误信息带源码行号。

Tauri 命令：

- `load_program`
- `step`
- `reset`
- `get_state`
- `run_until_halt`

前端面板：

- Assembly editor
- Step / Run / Pause / Reset controls
- Register panel
- 16x16 memory table
- Execution log

注意：

- 这个模块目前没有接入主站路由，是独立子工程。
- 当前环境找不到 `cargo`，所以没有跑成 Rust 测试。

### 5. 新增产品规划文档

新增中英文产品 backlog 和执行计划：

- `docs/product-backlog.md`
- `docs/product-backlog.zh-CN.md`
- `docs/execution-plan.md`
- `docs/execution-plan.zh-CN.md`

同时在路线图和 release backlog 里加了链接：

- `docs/ROADMAP.md`
- `docs/ROADMAP.zh-CN.md`
- `docs/release-backlog.md`
- `docs/release-backlog.zh-CN.md`

文档主旨：

- 主线产品是电路工作台、维修任务、教学流程。
- 战车试验场、3D 魔方等属于探索实验区。
- 近期优先顺序是核心稳定、公开测试版收口、产品一致性、受控扩展。

## 验证结果

已执行：

```bash
pnpm test
```

结果：

- 通过。
- 51 个 Node 测试全绿。

已执行：

```bash
pnpm typecheck
```

结果：

- 未通过。
- 主要原因是本地还没有安装新依赖 `three` / `cubejs`，导致 TypeScript 找不到 Three.js 模块。

已尝试：

```bash
cargo test
```

结果：

- 未执行成功。
- 当前环境没有 `cargo` 命令。

## 后续建议

1. 先运行 `pnpm install` 安装新依赖。
2. 再跑 `pnpm typecheck` 和 `pnpm build`。
3. 如果要验证 CPU 子工程，需要安装 Rust/Cargo 后在 `modules/cpu-sim/src-tauri` 下跑 `cargo test`。
4. 如果魔方页要进入正式体验，需要额外做一次浏览器视觉和交互验证，重点看求解器初始化、画布尺寸、拖拽/滚轮事件和移动端布局。


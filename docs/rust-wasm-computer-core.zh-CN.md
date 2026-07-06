# Rust/WASM 计算机核心融合方案

这份文档记录 `modules/cpu-sim` 如何从独立 Tauri 原型，逐步融合进主 Web/PWA 应用。

目标不是把 Rust 重写成 TypeScript，而是保留 Rust 作为机器模型核心，通过 WASM 暴露给 Vue/TypeScript 前端。

## 背景

当前状态：

- 主应用：Vue + Vite + TypeScript，Web/PWA 优先。
- CPU 模拟器：`modules/cpu-sim`，Tauri + Rust + Vue。
- CPU 前端通过 `@tauri-apps/api` 的 `invoke()` 调 Rust 命令。

问题：

- 普通浏览器里没有 Tauri runtime，所以现有 CPU 前端不能直接挂进主站路由。
- 如果直接用 TypeScript 重写 CPU 核心，短期最快，但会丢掉 Rust 核心的长期价值。

推荐方向：

```text
cpu-sim Rust core -> wasm package -> main Vue app -> /computer-lab
```

## 目标架构

```text
modules/cpu-sim/src-tauri/core
  assembler.rs
  cpu.rs
        |
        v
modules/cpu-sim/wasm 或 packages/computer-core
  wasm-bindgen facade
        |
        v
src/lib/computer-core.ts
  typed wrapper
        |
        v
src/views/ComputerLab.vue
  Vue UI
```

## 分阶段计划

### 阶段 1：抽清 Rust core 边界

目标：让 Rust 核心不依赖 Tauri。

已有基础：

- `modules/cpu-sim/src-tauri/core/src/cpu.rs`
- `modules/cpu-sim/src-tauri/core/src/assembler.rs`

需要确认：

- core crate 可以单独 `cargo test`。
- `CpuState`、assembler 输出和错误结构适合被 WASM facade 包装。
- Tauri command 层只做调用转发，不承载业务逻辑。

### 阶段 2：增加 WASM facade

目标：让 Web 主应用可以调用 CPU 核心。

当前状态：

- `modules/cpu-sim/wasm` 已新增 wasm-bindgen facade scaffold。
- facade 复用 `cpu-sim-core` 的 `assembler` 和 `Cpu`，并把快照序列化成主站需要的 camelCase 字段。
- `src/lib/computer-core.ts` 已新增 `createWasmComputerCore()`，可以包装 wasm-bindgen 输出的同名函数。
- 当前环境没有 `cargo`，所以 Rust scaffold 尚未在本机编译验证。

候选 API：

```ts
type CpuSnapshot = {
  a: number;
  b: number;
  pc: number;
  flags: { z: boolean; n: boolean; c: boolean };
  flagsByte: number;
  memory: number[];
  log: string[];
  halted: boolean;
  currentInstruction: string;
};

loadProgram(source: string): CpuSnapshot;
step(): CpuSnapshot;
reset(): CpuSnapshot;
getState(): CpuSnapshot;
runUntilHalt(maxSteps: number): CpuSnapshot;
```

Rust facade 可以先保持单实例 VM，后续再决定是否支持多个机器实例。

### 阶段 3：主站接入 Computer Lab

目标：把模拟计算机作为主线“机器层”入口放进大厅。

产出：

- `src/views/ComputerLab.vue`
- `/computer-lab` 或 `/cpu-sim` 路由
- 大厅“机器层”入口
- `src/lib/computer-core.ts` typed wrapper

当前 `/computer-lab` 已经接入可操作的 Assembly Console：

- 汇编编辑区
- load / step / run / reset 控制
- 寄存器、FLAGS、PC、内存、执行日志联动刷新
- `src/lib/computer-core.ts` 中的 `ComputerCoreApi` 合同
- `createPreviewComputerCore()` 固定示例适配层

这层预览适配只用于验证主站 UI 和状态合同，不承担真实 CPU 解释器职责。后续第一版执行 UI 需要把 `createPreviewComputerCore()` 替换为 WASM bridge，而不是 Tauri `invoke()`，也不是 TypeScript 重写核心。

### 阶段 4：测试和发布链路

目标：让 Rust core 和 Web bridge 都可验证。

需要覆盖：

- Rust core 单元测试
- WASM wrapper smoke test
- 主应用 typecheck/build
- 浏览器中 load/step/run/reset 的最小交互验证

## 保留 Tauri 的方式

短期不要删除 `modules/cpu-sim`。

它可以继续作为：

- Rust core 原型
- 桌面版实验入口
- 后续 Tauri 壳参考实现

等主站 WASM 版本稳定后，再决定：

- 保留独立桌面版
- 把 Tauri 壳改成复用同一个 WASM/Rust core
- 或把 `modules/cpu-sim` 归档为历史原型

## 不做的事

- 不把 CPU 模拟器直接塞进 `src/lib/circuit.ts`。
- 不让浏览器主站依赖 Tauri runtime。
- 不急着把电路仿真和 CPU VM 合成一个超大模型。
- 不先追求完整真实 CPU，而是先做可教学、可观察、可测试的小机器。

## 最近下一步

1. 安装或确认本机 Rust/Cargo 环境，并跑通 `modules/cpu-sim/src-tauri` 的 `cargo test`。
2. 编译验证 `modules/cpu-sim/wasm`，必要时补 `wasm-pack` 构建脚本。
3. 为 `/computer-lab` 接入 WASM 版 load/step/reset/run 最小闭环，替换当前预览适配层。
4. 增加 WASM wrapper smoke test 和浏览器最小交互验证。

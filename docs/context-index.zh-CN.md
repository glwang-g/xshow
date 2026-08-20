# 上下文索引

这份索引用来帮助后续协作者和 Codex 快速找到已经沉淀好的约定。开始大范围读代码前，先看这里，再按任务选择最小的一组文档。

## 默认阅读顺序

1. 先读本文件。
2. 根据任务类型读下面对应文档。
3. 再进入源码、测试或 git diff。

## 任务路由

| 你要了解的问题 | 优先阅读 |
| --- | --- |
| 项目初心、北极星和主线边界 | `docs/product-north-star.zh-CN.md`、`docs/product-backlog.zh-CN.md`、`docs/execution-plan.zh-CN.md` |
| 从手搓电路逐层生成逻辑、硬件与算法 | `docs/buildable-computing-stack.zh-CN.md` |
| 游戏化方向、任务世界和主线闯关结构 | `docs/gamified-evolution-plan.zh-CN.md`、`docs/product-north-star.zh-CN.md` |
| 路线图和阶段性能力 | `docs/ROADMAP.zh-CN.md` |
| 近期发布收口、公开测试版状态 | `docs/release-backlog.zh-CN.md`、`docs/releases/public-beta-candidate.zh-CN.md` |
| 架构拆分、代码应该放哪里 | `docs/architecture.zh-CN.md` |
| Simulation Contract 迁移与层级归属 | `docs/simulation-contract.zh-CN.md`、`docs/layers.zh-CN.md`、`src/lib/simulation-contract.ts` |
| 云端记录、Supabase、跨设备同步 | `docs/cloud-sync-plan.zh-CN.md`、`docs/supabase-schema.sql` |
| 部署、服务器和发布流程 | `docs/DEPLOYMENT.zh-CN.md` |
| 跨项目 Freexlib 世界契约 | 同级 `freexlib-portal` 仓库 -> `docs/world-contract.zh-CN.md` |
| 移动端、PWA、QA 记录 | `docs/mobile-qa.zh-CN.md`、`docs/v0.2-qa-report.zh-CN.md` |
| 最近一次 dev 拉取做了什么 | `docs/dev-pull-summary-2026-07-03.zh-CN.md` |
| CPU 模拟器与 Rust/WASM 融合 | `docs/rust-wasm-computer-core.zh-CN.md`、`modules/cpu-sim/README.md` |
| 具体 issue 想法或待拆任务 | `docs/issue-drafts/*.zh-CN.md` |

## 已有约定

- 产品北极星是：从信号、电路、机器到算法的交互式计算机科学可视化平台。
- 主线层次是：信号与电路层、逻辑与存储层、机器层、算法层。
- 电路工作台和维修任务属于信号与电路层；工作台分为“自由实验”和“器件工坊”两种共享同一仿真模型的入口。
- 主线的跨层方式是“发布可展开模块”：电路作品成为逻辑输入，逻辑作品成为硬件输入，再到可执行机器与算法。细节见 `docs/buildable-computing-stack.zh-CN.md`。
- Logic Lab 已进入逻辑与存储层主线预览，连接电路信号和机器状态。
- CPU 模拟器已进入机器层主线预览，不再按普通探索实验处理。
- 战车试验场、3D 魔方这类内容属于探索实验区，不应模糊主入口。
- 大的产品方向先进入 `docs/product-backlog.zh-CN.md`，近期执行顺序看 `docs/execution-plan.zh-CN.md`。
- 游戏化方向优先走“任务、调试、构建、世界地图”，不走“刷题游戏平台”。
- 版本收口看 `docs/release-backlog.zh-CN.md`。
- 架构位置和拆分方向先查 `docs/architecture.zh-CN.md`。
- Simulation Contract 先作为渐进契约层：优先围绕现有 Rule Module 做 adapter，不要先重写 Lab。
- 跨项目术语（World、Entity、Observation、Intent、Rule、Event、Replay、Snapshot）统一遵循同级 `freexlib-portal` 仓库的 `docs/world-contract.zh-CN.md`。
- Simulation/Entity/State/Tick/Rule/Scenario/Replay 相关迁移地图看 `docs/simulation-contract.zh-CN.md` 和 `docs/layers.zh-CN.md`。
- 机器层融合优先考虑 Rust core -> WASM bridge -> Vue/TypeScript UI。
- 更新正式文档时，尽量同步维护英文和中文版本。
- 临时但有复用价值的上下文，可以整理成短文档后从本索引链接。

## 常用验证

主项目：

```bash
pnpm test
pnpm typecheck
pnpm build
```

CPU 模拟器核心：

```bash
cd modules/cpu-sim/src-tauri
cargo test
```

注意：如果刚拉下包含新依赖的代码，先运行 `pnpm install`，否则 typecheck/build 可能因为本地 `node_modules` 缺依赖而失败。

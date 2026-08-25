# 架构说明

`Home.vue` 最初是为了快速做出可玩的原型，所以承担了很多页面、交互和业务逻辑。现在项目进入 v0.4，后续新增元器件和仿真规则会越来越多，需要逐步把稳定的逻辑拆出去。

## 当前拆分

| 方向 | 位置 | 说明 |
| --- | --- | --- |
| 页面外壳和编排层 | `src/views/Home.vue` | 负责两块工作台 UI 的编排、路由监听、少量页面级动作和资源生命周期；稳定的领域逻辑已由 composable 和 lib 承担。 |
| 工作台 UI 区域 | `src/components/workbench` | 顶部栏、元器件库、工作台画布、状态面板已经从页面中拆出。 |
| 电路领域模型和仿真 | `src/lib/circuit.ts` | 负责元器件类型、导线类型、极性辅助函数、导线节点合并、支路求解和电路求值。 |
| 工作台 UI 配置 | `src/lib/workbench-ui.ts` | 负责元器件规格、元器件库配置、状态面板标签和桌面尺寸。 |
| 工作台导出 | `src/lib/workbench-export.ts` | 负责把当前电路绘制成 PNG，不再放在页面组件里。 |
| 实体搭建清单 | `src/lib/physical-build.ts` | 负责把当前工作台转换成第一版物料清单、采购关键词、接线步骤和实体搭建注意事项。 |
| 工作台记录类型和编码 | `src/lib/workspace-records.ts`、`src/lib/workspace-codec.ts` | 负责工作台快照类型、记录类型、校验、分享链接编码和时间格式化。 |
| 编辑历史 | `src/composables/useWorkbenchHistory.ts` | 负责工作台快照的撤销/重做栈。 |
| 导线交互 | `src/composables/useWireInteraction.ts` | 负责连线、改线、分支线、端点拖拽、导线选择和删除；页面保留画布坐标与编排。 |
| 画布视口与触控 | `src/composables/useCanvasViewportGesture.ts` | 负责移动端画布尺寸、单指平移、双指缩放和指针生命周期。 |
| 本地工作台记录 | `src/composables/useWorkspaceRecords.ts` | 负责自动保存、本地记录、分享链接、JSON 导入导出和恢复失败提示；页面保留快照内容和云端编排。 |
| 云端工作台同步 | `src/composables/useCloudWorkspaceSync.ts` | 负责 Supabase 登录、账号状态、云端记录加载/保存/重命名/删除、冲突处理和退出登录。 |
| 元件编辑 | `src/composables/useWorkbenchParts.ts` | 负责元件新增、复制、删除、开关/电池属性切换、阻值/旋转/位置/弹簧触点属性编辑，以及连续编辑的历史合并。 |
| 元件移动与继电器联动 | `src/composables/useWorkbenchPartMovement.ts` | 负责拖拽、方向键微移、继电器线圈/弹簧成组移动、绑定、吸附和移动历史边界。 |
| 电路状态展示适配 | `src/composables/useCircuitStatusView.ts` | 负责按元件读取仿真状态、状态缺省值、元件分类和导线动画速度；页面只负责课程编排和展示组合。 |
| 课程电路检查 | `src/composables/useCircuitLessonChecks.ts` | 负责课程步骤使用的拓扑、元件状态和继电器条件判断；页面只负责选择当前课程和呈现进度。 |
| 工作台选择与键盘命令 | `src/composables/useWorkbenchSelection.ts`、`src/composables/useWorkbenchKeyboard.ts` | 负责选择/瞬态交互清理、当前项删除和撤销重做、复制、移动、缩放、元件快捷操作；页面只负责注册事件和传递命令。 |
| 移动端 starter 布局 | `src/composables/useMobileWorkbenchStarter.ts` | 负责竖屏判断、课程初始元件分行布局和移动端 starter workspace 适配。 |
| 移动端工作台尺寸 | `src/composables/useMobileWorkbenchSizing.ts` | 负责内容边界、可视工作区、适配缩放和默认工作台尺寸计算。 |
| 移动端视口副作用 | `src/composables/useMobileWorkbenchViewport.ts` | 负责扩展工作台、fit/滚动居中、渲染帧调度、视图重置和卸载清理。 |
| 实验报告 | `src/composables/useExperimentReport.ts` | 负责报告 Markdown 生成、复制反馈、剪贴板降级和文件导出。 |
| 工作台图片导出 | `src/composables/useWorkbenchImageExport.ts` | 负责把当前工作台、仿真状态和导线样式导出为图片。 |
| 继电器模块发布 | `src/composables/useRelayPublication.ts` | 负责发布前校验、模块构建、真值表记录和本地保存。 |
| 元件与端点几何展示 | `src/composables/useWorkbenchPartPresentation.ts` | 负责旋转、端子坐标、元件样式、鼠标坐标换算和导线端点位置。 |
| 云端状态视图 | `src/composables/useCloudWorkspaceView.ts` | 负责云端同步状态、认证文案、同步提示样式和保存按钮文案的派生。 |
| 课程引导 | `src/composables/useBeginnerGuide.ts` | 负责新手引导状态、步骤推进、诊断、引导动作和引导助手的本地关闭状态；页面只负责接入工作台动作和展示。 |
| 工作区状态 | `src/composables/useWorkbenchWorkspaceState.ts` | 负责工作区载入、快照复制、历史键和快照恢复；页面保留课程/路由层的导航编排。 |
| 工作区导航 | `src/composables/useWorkbenchNavigation.ts` | 负责课程载入、工作坊模式、已发布模块展开、下一课和演示重置；页面保留路由监听和完成面板展示。 |
| 工作区自动保存生命周期 | `src/composables/useWorkbenchAutosave.ts` | 负责工作区变更监听、自动保存防抖、启动恢复和卸载清理；页面只提供默认工作区与云端脏状态回调。 |
| 工作台几何与命中 | `src/composables/useWorkbenchGeometry.ts` | 负责端子集合、最近端子命中和元件位置约束；页面只连接坐标展示与移动端工作台尺寸。 |
| 工作台指针交互 | `src/composables/useWorkbenchPointerInteraction.ts` | 负责元件按下、导线/端点拖动优先级、拖动结束和端点高亮判断；页面只连接画布事件和状态。 |
| 电路工作台视图模型 | `src/composables/useWorkbenchCircuitView.ts` | 负责器件计数、警告、课程步骤状态、进度和当前课程的派生；页面只组合这些视图数据。 |
| 导线走线与跨线展示 | `src/lib/wire-routing.ts`、`src/composables/useWorkbenchWirePresentation.ts` | `wire-routing` 只负责正交路由、共线点清理和外侧绕行；展示 composable 负责端子侧向判断、导线样式、预览路径和不改变拓扑的跨线桥。 |
| PWA 更新提示 | `src/composables/usePwaUpdate.ts` | 负责更新事件监听、刷新提示状态、应用更新和卸载清理；页面只把状态接到画布。 |
| 工作台窗口生命周期 | `src/composables/useWorkbenchWindowLifecycle.ts` | 负责窗口/视口事件、键盘监听、首次移动端适配、引导恢复和云端会话延迟启动；页面只提供业务回调。 |
| 安全本地存储 | `src/composables/useSafeLocalStorage.ts` | 负责浏览器存储的 SSR 安全访问和异常兜底；页面与记录/同步 composable 共享统一接口。 |
| 工作台面板状态 | `src/composables/useWorkbenchPanels.ts` | 负责元件/状态面板开关、状态页签、课程完成提示和相关 watch；页面只把面板状态接到组件。 |
| 课程高亮目标 | `src/composables/useWorkbenchLessonTargets.ts` | 负责从当前课程步骤派生元件和端子高亮目标；页面只把结果传给画布。 |
| 课程内容 | `src/data/lessons.ts` | 保存课程文案、初始工作台和检查项，避免写死在组件里。 |
| 云端记录 | `src/lib/cloud.ts` | 封装 Supabase 登录和工作台记录接口。 |
| 机器逻辑基座 | `src/lib/machine-build.ts` | 将已发布、真值表完整验证的 AND / OR / NOT 模块转换为机器层可检查的逻辑清单；不把 CPU 预览误作门级执行。 |
| 工作台共享状态 | `src/stores/board.ts` | 管理缩放和视口相关的工作台状态。 |
| 小型 UI 基础组件 | `src/components/ui` | 本地 shadcn-vue 风格组件。 |
| 领域回归测试 | `tests/simulation.mjs` | 覆盖单灯、串联、并联、LED/二极管方向、电表读数、电池反转和实体搭建清单输出。 |

## 后续重构方向

- 保持 `src/lib/circuit.ts` 不依赖 Vue，后续可以直接做单元测试。
- 只在边界稳定时继续拆大 UI 区域：记录/云端/账号流程、属性面板和导线列表。
- 课程内容继续放在数据文件中，不回到组件里硬编码。
- 本地存储和云端 API 继续放在模块里，避免到处直接调用浏览器存储或 Supabase。
- 用小步拆分配合构建验证，不做一次性大重写。

## 建议的下一批拆分

- 将 `StatusPanel.vue` 继续拆成课程、回路、记录、云端、属性、导线等专门标签组件。
- 元件属性编辑、移动与继电器联动、导线交互、画布视口、指针生命周期、本地记录、云端同步、课程派生和窗口生命周期已分别由对应 composable 承担；后续新增边界继续遵循小步迁移和验证。
- 随着新增元器件、实体搭建规则和课程电路继续扩展领域测试。

# 云端同步计划

`xshow circuits` 应该保持免登录可玩。账号只用于保存云端记录、跨设备继续实验、分享副本和未来课堂模板。

## 产品原则

- 登录不能挡住第一屏；未登录用户仍可完成所有本地实验。
- 本地记录、JSON 存档和 URL 分享继续保留，云同步只是增强层。
- 同步状态要可见：未登录、本地修改、同步中、已同步、同步失败。
- 学生和老师的基础路径要简单，不把教学工具变成账号表单。

## 推荐阶段

### 阶段 1：云端记录最小版

- 使用邮箱和密码登录/注册；邮箱只用于确认账号和忘记密码重置。
- 云端保存当前工作台快照。
- 云端记录列表支持创建、重命名、加载、删除。
- 最近一次工作台自动同步，但失败时不覆盖本地记录。

当前已实现的切片：邮箱密码登录、注册、密码重置，以及对 `workspace_records` 的显式保存、更新、列表、加载、重命名、删除、可见同步状态、“覆盖/另存”冲突处理、分享链接复制和首次登录上传提示。

### 阶段 2：分享副本

- 分享链接支持只读打开。
- 打开分享链接后可以复制为自己的记录。
- 分享链接不要暴露编辑权限。

### 阶段 3：课堂模板

- 老师可以创建实验模板。
- 学生从模板复制自己的工作台。
- 后续再考虑班级空间、作业提交和批量查看。

## 数据契约草案

云端记录可以直接复用当前 `PersistedWorkspace` 的主体结构：

```ts
type CloudWorkspaceRecord = {
  id: string;
  owner_id: string;
  title: string;
  workspace: {
    activeLessonId: string;
    parts: Array<{
      closed?: boolean;
      id: string;
      name: string;
      resistance?: number;
      type: "battery" | "bulb" | "switch" | "resistor" | "led" | "buzzer" | "motor";
      x: number;
      y: number;
    }>;
    selectedPartId: string;
    version: 1;
    wires: Array<{
      from: { partId: string; terminal: "a" | "b" };
      id: string;
      to: { partId: string; terminal: "a" | "b" };
    }>;
    zoom: number;
  };
  created_at: string;
  updated_at: string;
};
```

## 表结构草案

| 表 | 用途 |
| --- | --- |
| `profiles` | 用户展示信息，最小只需要 `id` 和 `email`。 |
| `workspace_records` | 用户的云端工作台记录。 |
| `shared_workspaces` | 只读分享副本或可复制模板。 |

第一版 Supabase 表结构、Row Level Security 策略和 `updated_at` 触发器见 [supabase-schema.sql](supabase-schema.sql)。

## 同步冲突策略

- 记录有 `updated_at`，保存时比较云端版本。
- 如果云端更新晚于本地编辑，提示用户选择“覆盖云端”或“另存为副本”。
- 本地 autosave 不因云端失败而丢失。

## 后端选择

第一版已选择 Supabase：

- Auth 使用 Supabase 邮箱密码会话并持久化本地 session，同时支持邮箱找回密码。
- Postgres 表结构适合保存工作台 JSON。
- Row Level Security 可以控制记录所有权。
- 后续分享链接和课堂模板容易扩展。

暂不建议一开始自建完整账号系统；它会把 v0.2 的产品节奏拖进后端工程。

## 实现说明

应用会从 Vite 环境变量读取 Supabase 配置：

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

如果没有配置这些值，云端同步面板会显示“未配置”，本地实验、本地记录、JSON 存档和分享链接仍然照常可用。

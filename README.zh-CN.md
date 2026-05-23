# xshow circuits

一个用 Vue 3、Vite、TypeScript 和 Tailwind CSS 构建的交互式电子积木电路实验台。

`xshow circuits` 是一个早期教育原型，目标是让用户像拼电子积木一样搭建简单电路。你可以把电池、开关、灯泡、导线、可变电阻器连接起来，切换开关，调节电阻，并立即看到灯泡亮灭和亮度变化。

![xshow circuits 截图](docs/screenshot.png)

## 功能

- 在工作台上拖动电子元器件
- 点击端子连接导线
- 选中导线后拖动端点重新连接
- 点击开关控制电路通断
- 拖动可变电阻滑杆改变灯泡亮度
- 在通电导线上显示电流流动动画
- 显示回路状态、电流、等效电阻和灯泡亮度
- 一键清空导线或恢复默认演示电路

## 当前范围

这个项目目前是一个偏教学演示的交互原型，不是完整的 SPICE 级电路仿真器。

当前模型主要关注简单闭合回路：

- 电池提供固定 9V 电源
- 开关可以断开或闭合电路
- 可变电阻会改变等效电阻
- 灯泡亮度根据模拟电流路径计算得出

## 技术栈

- Vue 3
- Vite
- TypeScript
- Tailwind CSS
- Pinia
- Vue Router
- lucide-vue 图标
- shadcn-vue 风格的本地组件

## 本地运行

```bash
pnpm install
pnpm dev
```

然后打开 Vite 输出的本地地址，通常是：

```text
http://localhost:5173
```

## 脚本

```bash
pnpm dev
pnpm build
pnpm preview
```

## 怎么使用

1. 使用 **选择** 工具拖动元器件。
2. 使用 **连线** 工具，依次点击两个端子来连接导线。
3. 点击导线可以选中它，拖动两端的小圆点可以重新连接到其他端子。
4. 点击开关控制电路断开或闭合。
5. 拖动可变电阻器滑杆，观察灯泡亮度变化。
6. 使用 **清线** 删除所有导线。
7. 使用 **复位** 恢复默认演示电路。

## 路线图

当前项目方向见 [docs/ROADMAP.zh-CN.md](docs/ROADMAP.zh-CN.md)。

## 贡献说明

见 [CONTRIBUTING.md](CONTRIBUTING.md)。更新文档时，请同步维护英文和中文版本。

近期优先级：

- 更好的导线吸附和走线
- 电流方向动画
- 引导式实验课程模式

## 许可证

Apache-2.0

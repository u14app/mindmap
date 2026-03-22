<div align="center">

# Open MindMap

[![npm version](https://img.shields.io/npm/v/@xiangfa/mindmap)](https://www.npmjs.com/package/@xiangfa/mindmap)
[![npm downloads](https://img.shields.io/npm/dm/@xiangfa/mindmap)](https://www.npmjs.com/package/@xiangfa/mindmap)
[![license](https://img.shields.io/npm/l/@xiangfa/mindmap)](./LICENSE)
[![react](https://img.shields.io/badge/react-%E2%89%A518-blue)](https://react.dev)

一个精美的 React 交互式思维导图组件。

**原生支持 AI 流式输出**，使用 Markdown 列表语法，搭配 **iOS 风格 UI**。

零依赖。基于 SVG。键盘优先。支持暗色模式。

[English](README.md) | 中文

</div>

---

![Open MindMap](/public/screenshot.png)

## 特性

- **AI 流式输出** — 原生支持 AI 流式输出；输入 Markdown 列表，实时生成思维导图
- **内置 AI 生成** — 连接任意 OpenAI 兼容 API，通过自然语言生成思维导图；支持文本、图片和 PDF 附件上传
- **纯 SVG 渲染** — 无 Canvas、无外部布局引擎，任意缩放级别下都清晰锐利
- **iOS 风格 UI** — 毛玻璃控件、圆角设计、流畅动画，简洁精致
- **插件系统** — 7 个内置插件扩展语法（虚线、折叠、多行、标签、跨链接、LaTeX、frontmatter）；完全可扩展
- **行内格式化** — 节点内支持 **加粗**、_斜体_、`代码`、~~删除线~~、==高亮== 和 [链接](url)
- **任务状态** — `[x]` 已完成、`[ ]` 待办、`[-]` 进行中复选框
- **备注** — 通过 `>` 语法为节点附加多行备注
- **文本编辑模式** — 在可视化思维导图与纯文本 Markdown 编辑之间切换
- **全屏模式** — 将组件扩展为全屏显示
- **LaTeX 数学公式** — 渲染 `$...$` 行内公式和 `$$...$$` 块级公式（需安装 KaTeX）
- **跨链接** — 通过 `{#anchor}` / `-> {#target}` 在任意节点间绘制连线
- **只读模式** — 仅显示，支持平移/缩放/选择但不可编辑；适合演示和嵌入
- **多根节点** — 在同一画布上构建多棵独立的树
- **拖拽排序** — 拖拽重新排列兄弟节点；拖拽根节点的子节点跨越中线以重新平衡两侧
- **键盘快捷键** — Enter 创建、Delete 删除、Cmd+C/V 复制粘贴、Shift+ 快捷键控制缩放和布局
- **Markdown 输入输出** — 输入 Markdown 列表，输出思维导图（非常适合 AI 流式输出）
- **国际化** — 自动检测浏览器语言；内置中文和英文，支持通过 props 完全自定义
- **暗色模式** — 自动检测 `prefers-color-scheme`，也可显式设置 `light` / `dark`
- **导出** — 开箱即用的 SVG、高 DPI PNG 和 Markdown 导出
- **导入** — 通过右键菜单导入对话框粘贴 JSON 或 Markdown 数据
- **右键菜单** — 右键添加根节点、导入数据、导出或更改布局
- **布局模式** — 左侧、右侧或两侧均衡布局
- **移动端优化** — 完整的触控支持，单指平移/拖拽，双指捏合缩放，以内容为中心
- **工具栏控制** — 通过 `toolbar` prop 显示/隐藏缩放控件
- **极小体积** — 除 React 外零运行时依赖

## 安装

```bash
# npm
npm install @xiangfa/mindmap

# pnpm
pnpm add @xiangfa/mindmap

# yarn
yarn add @xiangfa/mindmap
```

如需 LaTeX 数学公式渲染，还需安装 KaTeX（可选）：

```bash
npm install katex
```

## 快速开始

```tsx
import { MindMap } from "@xiangfa/mindmap";
import "@xiangfa/mindmap/style.css";

const data = `
我的思维导图
  - 第一个主题
    - 子主题 A
    - 子主题 B
  - 第二个主题
`;

function App() {
  return <MindMap markdown={data} />;
}
```

> **注意：** 组件会填充其父容器。请确保父容器有明确的尺寸。

## 使用方法

### 多根节点

传入数组以在同一画布上渲染多棵独立的树：

```tsx
<MindMap data={[tree1, tree2, tree3]} />
```

### Markdown 输入

直接输入 Markdown 列表 — 非常适合流式 AI 响应：

```tsx
const markdown = `
机器学习
  - 监督学习
    - 分类
    - 回归
  - 无监督学习

应用领域
  - 自然语言处理
  - 计算机视觉
`;

<MindMap markdown={markdown} />;
```

在 Markdown 中用空行分隔不同的根节点树。

### 只读模式

仅显示思维导图而不允许编辑 — 适合演示、文档或嵌入场景：

```tsx
<MindMap data={data} readonly />
```

在只读模式下，用户仍可平移、缩放和选择节点，但不能创建、编辑或删除节点。右键菜单会隐藏编辑操作（新建根节点、导入），保留仅查看操作（导出、布局）。

### 暗色模式

```tsx
<MindMap data={data} theme="auto" />  {/* 跟随系统（默认） */}
<MindMap data={data} theme="dark" />  {/* 始终暗色 */}
<MindMap data={data} theme="light" /> {/* 始终亮色 */}
```

### 自定义样式

通过覆盖容器上的 CSS 自定义属性来定制颜色、字体等：

```css
/* 覆盖主题变量 */
.mindmap-container {
  --mindmap-root-bg: #1a73e8;
  --mindmap-canvas-bg: #f0f4f8;
  --mindmap-node-text: #1a1a2e;
}
```

通过语义化 CSS 类选择器定制特定元素：

```css
/* 定制所有连线 */
.mindmap-edge { stroke-width: 3; }

/* 定制根节点背景 */
.mindmap-node-root .mindmap-node-bg { fill: #6c5ce7; }
```

通过 `data-branch-index` 定制各分支颜色：

```css
.mindmap-edge[data-branch-index="0"] { stroke: #e74c3c; }
.mindmap-edge[data-branch-index="1"] { stroke: #2ecc71; }
```

> 完整的 30+ CSS 变量、class 选择器和示例请参阅 [自定义样式指南](docs/Custom%20Styling.md)。

### 布局方向

```tsx
<MindMap data={data} defaultDirection="both" />  {/* 两侧均衡（默认） */}
<MindMap data={data} defaultDirection="right" /> {/* 所有子节点在右侧 */}
<MindMap data={data} defaultDirection="left" />  {/* 所有子节点在左侧 */}
```

### 国际化 / 本地化

UI 语言会自动从浏览器的语言设置检测。内置支持中文（`zh-CN`）和英文（`en-US`），默认回退为英文。你也可以覆盖语言或任何文本字符串：

```tsx
{
  /* 自动检测（默认）- 使用浏览器语言 */
}
<MindMap data={data} />;

{
  /* 强制指定语言 */
}
<MindMap data={data} locale="zh-CN" />;

{
  /* 覆盖特定字符串 */
}
<MindMap data={data} locale="zh-CN" messages={{ newNode: "新节点" }} />;

{
  /* 完全自定义语言 */
}
<MindMap
  data={data}
  messages={{
    newNode: "Nuevo nodo",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    // ... 覆盖 MindMapMessages 中的任意键
  }}
/>;
```

### 插件

插件系统为思维导图扩展了额外的语法和渲染能力。所有 7 个内置插件默认启用，你也可以按需选择：

```tsx
import {
  MindMap,
  allPlugins, // 全部 7 个插件
  frontMatterPlugin, // YAML frontmatter
  dottedLinePlugin, // 虚线边
  foldingPlugin, // 可折叠节点
  multiLinePlugin, // 多行内容
  tagsPlugin, // 标签支持
  crossLinkPlugin, // 跨节点引用
  latexPlugin, // LaTeX 数学公式（需安装 KaTeX）
} from "@xiangfa/mindmap";

{
  /* 使用全部插件（默认行为） */
}
<MindMap data={data} plugins={allPlugins} />;

{
  /* 仅选择需要的插件 */
}
<MindMap data={data} plugins={[foldingPlugin, tagsPlugin]} />;

{
  /* 禁用所有插件 */
}
<MindMap data={data} plugins={[]} />;
```

### Ref API

通过 ref 访问命令式方法：

```tsx
import { useRef } from "react";
import { MindMap, type MindMapRef } from "@xiangfa/mindmap";

function App() {
  const ref = useRef<MindMapRef>(null);

  const handleExportPNG = async () => {
    const blob = await ref.current!.exportToPNG();
    // ... 下载 blob
  };

  const handleExportSVG = () => {
    const svgString = ref.current!.exportToSVG();
    // ... 下载 svg
  };

  return <MindMap ref={ref} data={data} />;
}
```

### AI 生成

添加内置 AI 输入栏，通过自然语言生成思维导图。支持连接任意 OpenAI 兼容 API 并流式输出：

```tsx
<MindMap
  ai={{
    apiUrl: "https://api.openai.com/v1/chat/completions",
    apiKey: "sk-...",
    model: "gpt-5",
  }}
/>
```

启用附件上传（文本、图片、PDF）：

```tsx
<MindMap
  ai={{
    apiUrl: "https://api.openai.com/v1/chat/completions",
    apiKey: "sk-...",
    model: "gpt-5",
    attachments: ["text", "image", "pdf"],
  }}
/>
```

自定义系统提示词：

```tsx
<MindMap
  ai={{
    apiUrl: "https://api.openai.com/v1/chat/completions",
    apiKey: "sk-...",
    model: "gpt-5",
    systemPrompt: "根据给定的主题生成思维导图...",
  }}
/>
```

> **安全提示：** API 密钥会从浏览器发送。生产环境中建议使用代理端点来保护密钥安全。

### 监听变更

```tsx
<MindMap
  data={data}
  onDataChange={(newData) => {
    console.log("思维导图已更新:", newData);
  }}
/>
```

### 工具栏可见性

通过 `toolbar` prop 控制工具栏：

```tsx
{
  /* 隐藏所有工具栏按钮 */
}
<MindMap data={data} toolbar={false} />;

{
  /* 隐藏缩放控件（文本模式和全屏按钮保持可见） */
}
<MindMap data={data} toolbar={{ zoom: false }} />;
```

工具栏包括缩放控件（左下角）和文本模式/全屏切换按钮（右下角）。`toolbar` prop 控制缩放控件的可见性；文本模式和全屏按钮始终可用。

### 移动端 / 触控支持

思维导图开箱即用地支持完整的触控操作：

- **单指在画布上** — 平移视图
- **单指在节点上** — 拖拽以重新排列兄弟节点
- **双指捏合** — 缩放（始终以思维导图内容为中心）

无需配置 — 触控支持始终与鼠标事件同时激活。

## 扩展语法

思维导图支持丰富的类 Markdown 语法。标记为 _(插件)_ 的功能需要启用对应插件（默认全部启用）。

### 行内格式化

在任意节点中格式化文本：

```
**加粗文本**
*斜体文本*
`行内代码`
~~删除线~~
==高亮==
[链接文本](https://example.com)
```

### 任务状态

添加复选框以跟踪任务状态：

```
- [x] 已完成的任务
- [ ] 待办任务
- [-] 进行中的任务
```

### 备注

使用 `>` 为节点附加多行备注：

```
- 带有备注的节点
  > 这是一行备注
  > 可以跨越多行
```

### Frontmatter _（插件）_

在 Markdown 顶部设置默认选项：

```
---
direction: left
theme: dark
---
- 根节点
  - 子节点
```

支持的字段：`direction`（`left` | `right` | `both`）、`theme`（`light` | `dark` | `auto`）。

### 虚线 _（插件）_

使用 `-.` 代替 `-` 以渲染带虚线边的节点：

```
- 实线边节点
  -. 虚线边子节点
```

### 折叠 / 可折叠节点 _（插件）_

使用 `+` 代替 `-` 使节点初始为折叠状态：

```
- 可见节点
  + 此节点初始折叠
    - 隐藏的子节点
```

### 多行内容 _（插件）_

使用 `|` 为节点添加续行内容：

```
- 节点的第一行
  | 第二行
  | 第三行
```

### 标签 _（插件）_

为节点添加标签以进行可视化标注：

```
- React #框架 #前端
- PostgreSQL #数据库
```

### 跨链接 _（插件）_

在任意节点间绘制连线：

```
- 节点 A {#a}
  - 子节点
- 节点 B {#b}
  -> {#a} "引用"
```

- `{#id}` — 在节点上定义锚点
- `-> {#id}` — 实线跨链接到锚点
- `-> {#id} "标签"` — 带标签的跨链接
- `-.> {#id}` — 虚线跨链接

### LaTeX 数学公式 _（插件）_

渲染数学公式（需安装 [KaTeX](https://katex.org/)）：

```
- 行内公式：$E = mc^2$
- 块级公式：$$\sum_{i=1}^{n} x_i$$
```

## API 参考

### Props

| Prop               | 类型                            | 默认值       | 说明                                                 |
| ------------------ | ------------------------------- | ------------ | ---------------------------------------------------- |
| `data`             | `MindMapData \| MindMapData[]`  | _必填_       | 树数据（单根或根数组）                               |
| `markdown`         | `string`                        | -            | Markdown 列表源（设置时覆盖 `data`）                 |
| `defaultDirection` | `'left' \| 'right' \| 'both'`   | `'both'`     | 初始布局方向                                         |
| `theme`            | `'light' \| 'dark' \| 'auto'`   | `'auto'`     | 颜色主题                                             |
| `locale`           | `string`                        | _自动_       | UI 语言（自动检测，或 `'zh-CN'`、`'en-US'`、自定义） |
| `messages`         | `Partial<MindMapMessages>`      | -            | 覆盖任意 UI 文本字符串                               |
| `readonly`         | `boolean`                       | `false`      | 仅显示模式（不可编辑、不可创建）                     |
| `toolbar`          | `boolean \| ToolbarConfig`      | `true`       | 显示/隐藏缩放控件                                    |
| `ai`               | `MindMapAIConfig`               | -            | AI 生成配置（API 地址、密钥、模型、附件类型）        |
| `plugins`          | `MindMapPlugin[]`               | `allPlugins` | 启用的扩展语法插件                                   |
| `onDataChange`     | `(data: MindMapData[]) => void` | -            | 用户交互修改树时调用                                 |

### ToolbarConfig

```ts
interface ToolbarConfig {
  zoom?: boolean; // 显示缩放控件（默认：true）
}
```

### MindMapAIConfig

```ts
type AIAttachmentType = "text" | "image" | "pdf";

interface MindMapAIConfig {
  apiUrl: string; // OpenAI 兼容 API 端点
  apiKey: string; // API 密钥（Bearer token）
  model: string; // 模型名称（如 "gpt-5"）
  systemPrompt?: string; // 自定义系统提示词（内置默认值）
  attachments?: AIAttachmentType[]; // 允许的附件类型（默认：[]）
}
```

| 字段           | 类型                 | 必填 | 说明                                                                                 |
| -------------- | -------------------- | ---- | ------------------------------------------------------------------------------------ |
| `apiUrl`       | `string`             | 是   | OpenAI 兼容的 chat completions 端点                                                  |
| `apiKey`       | `string`             | 是   | API 密钥，作为 `Bearer` token 发送                                                   |
| `model`        | `string`             | 是   | 模型标识符（如 `gpt-5`、`deepseek-chat`）                                            |
| `systemPrompt` | `string`             | 否   | 覆盖内置的思维导图生成提示词                                                         |
| `attachments`  | `AIAttachmentType[]` | 否   | 启用文件上传：`"text"`（text/\*）、`"image"`（image/\*）、`"pdf"`（application/pdf） |

### Ref 方法

| 方法                | 返回值          | 说明                         |
| ------------------- | --------------- | ---------------------------- |
| `exportToSVG()`     | `string`        | 将思维导图导出为 SVG 字符串  |
| `exportToPNG()`     | `Promise<Blob>` | 渲染高 DPI PNG Blob          |
| `exportToOutline()` | `string`        | 将树序列化为 Markdown 列表   |
| `getData()`         | `MindMapData[]` | 返回当前树数据               |
| `setData(data)`     | `void`          | 替换树数据                   |
| `setMarkdown(md)`   | `void`          | 解析 Markdown 并替换树       |
| `fitView()`         | `void`          | 重置缩放和平移以适应所有节点 |
| `setDirection(dir)` | `void`          | 更改布局方向                 |

### 数据结构

```ts
interface MindMapData {
  id: string;
  text: string;
  children?: MindMapData[];
  remark?: string; // 多行备注
  taskStatus?: "todo" | "doing" | "done";
  // 插件扩展字段（由对应插件填充）
  dottedLine?: boolean; // 虚线插件
  multiLineContent?: string[]; // 多行插件
  tags?: string[]; // 标签插件
  anchorId?: string; // 跨链接插件
  crossLinks?: CrossLink[]; // 跨链接插件
  collapsed?: boolean; // 折叠插件
}

interface CrossLink {
  targetAnchorId: string;
  label?: string;
  dotted?: boolean;
}
```

## 键盘快捷键

| 快捷键                 | 操作                     |
| ---------------------- | ------------------------ |
| `Enter`                | 在选中节点下创建子节点   |
| `Delete` / `Backspace` | 删除选中的节点           |
| `双击`                 | 编辑节点文本             |
| `Cmd/Ctrl + C`         | 复制子树                 |
| `Cmd/Ctrl + X`         | 剪切子树                 |
| `Cmd/Ctrl + V`         | 粘贴子树作为子节点       |
| `Escape`               | 关闭右键菜单 / 对话框    |
| `Shift + +`            | 放大                     |
| `Shift + -`            | 缩小                     |
| `Shift + 0`            | 重置视图（适应所有节点） |
| `Shift + L`            | 左侧布局                 |
| `Shift + R`            | 右侧布局                 |
| `Shift + M`            | 两侧均衡布局             |
| 滚轮                   | 放大 / 缩小              |
| 在画布上点击拖拽       | 平移                     |
| 在节点上点击拖拽       | 在兄弟节点间重新排列     |
| 右键                   | 打开右键菜单             |

## 工具函数

以下函数也对外导出，适用于高级用例：

```ts
import {
  // Markdown 解析
  parseMarkdownList, // md 字符串 → 单个 MindMapData
  toMarkdownList, // 单个 MindMapData → md 字符串
  parseMarkdownMultiRoot, // md 字符串 → MindMapData[]
  toMarkdownMultiRoot, // MindMapData[] → md 字符串
  parseMarkdownWithFrontMatter, // md 字符串 → MindMapData[]（支持插件）

  // 行内 Markdown
  parseInlineMarkdown, // 文本 → 行内标记
  stripInlineMarkdown, // 移除文本中的 Markdown 格式

  // 导出
  buildExportSVG, // 程序化 SVG 生成
  exportToPNG, // SVG 字符串 → PNG Blob

  // 国际化
  resolveMessages, // 构建完整的 MindMapMessages 对象
  detectLocale, // 检测浏览器语言

  // 插件
  allPlugins, // 全部 7 个内置插件
  frontMatterPlugin,
  dottedLinePlugin,
  foldingPlugin,
  multiLinePlugin,
  tagsPlugin,
  crossLinkPlugin,
  latexPlugin,
} from "@xiangfa/mindmap";
```

## 开发

```bash
git clone https://github.com/u14app/mindmap.git
cd mindmap
pnpm install
pnpm dev        # 启动开发服务器
pnpm build      # 类型检查并构建
pnpm build:lib  # 构建为库
pnpm lint       # 运行代码检查
```

## 贡献

欢迎贡献！请在提交 Pull Request 之前阅读我们的[贡献指南](CONTRIBUTING.md)。

## 许可证

[Apache-2.0](LICENSE)

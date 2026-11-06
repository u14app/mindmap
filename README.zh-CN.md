# Open MindMap

[![许可证](https://img.shields.io/npm/l/@xiangfa/mindmap)](./LICENSE)
[![React](https://img.shields.io/badge/react-%E2%89%A518-149eca)](https://react.dev)

Open MindMap 是一个模块化的 React 与 TypeScript 思维导图运行时，用于渲染可交互的 SVG 思维导图。0.9.0 将无头文档运行时、静态渲染、只读查看、编辑、可选功能和语法扩展拆分为明确的包入口。

v0.9.0 是一次破坏性接口升级。实现和验证记录见[重构需求文档](docs/refactor-v0.9.0-requirements.md)。本文不发布尚未在当前仓库重新执行的性能数字或验证结论。

[English](README.md) | 中文

## 安装

```bash
pnpm add @xiangfa/mindmap
```

React 和 ReactDOM 是 peer dependency。只有使用 LaTeX 扩展时才需要额外安装可选依赖 KaTeX。

## 选择入口

| 使用场景 | 导入路径 | 样式表 |
| --- | --- | --- |
| 无头解析、布局、Patch、流式处理和 SVG 工具 | `@xiangfa/mindmap/core` | 无 |
| 静态 SVG 界面 | `@xiangfa/mindmap/static` | `@xiangfa/mindmap/styles/static.css` |
| 只读平移、缩放、选择和适配视图 | `@xiangfa/mindmap/viewer` | `@xiangfa/mindmap/styles/viewer.css` |
| 编辑界面 | `@xiangfa/mindmap/editor` | `@xiangfa/mindmap/styles/editor.css` |
| 可选编辑能力 | `@xiangfa/mindmap/features/*` | 对应功能样式表 |
| 语法或渲染扩展 | `@xiangfa/mindmap/extensions/*` | 有提供时导入对应样式表 |

根入口 `@xiangfa/mindmap` 暴露 v0.9 编辑器契约。需要更小或无头依赖图时，使用明确的子路径。`legacy-viewer`、`cognitive`、`cognitive/react` 以及 cognitive fallback 样式不是 v0.9 公共入口。

## 快速开始

```tsx
import { MindMapEditor } from '@xiangfa/mindmap/editor'
import '@xiangfa/mindmap/styles/editor.css'

const markdown = `产品策略
- 研究
  - 访谈
  - 定位
- 交付
  - 原型`

export function StrategyMap() {
  return <MindMapEditor markdown={markdown} />
}
```

组件会填充父容器，请为父容器设置明确的宽度和高度。

只读界面：

```tsx
import { MindMapViewer } from '@xiangfa/mindmap/viewer'
import '@xiangfa/mindmap/styles/viewer.css'

export function ReadOnlyMap({ markdown }: { markdown: string }) {
  return <MindMapViewer markdown={markdown} autoFit="initial" />
}
```

静态界面：

```tsx
import { StaticMindMap } from '@xiangfa/mindmap/static'
import '@xiangfa/mindmap/styles/static.css'

<StaticMindMap markdown={markdown} />
```

## 核心运行时

`core` 入口不依赖 React 和浏览器渲染。它提供公开的 Document、Node、Patch、布局、解析器、序列化器、Controller、Stream、Extension 和 SVG 类型与函数。

```tsx
import {
  createMarkdownStream,
  createMindMapController,
  parseMindMap,
  renderMindMapToSvg,
  serializeMindMap,
} from '@xiangfa/mindmap/core'

const document = parseMindMap('根节点\n- 分支')
const controller = createMindMapController(document)
const stream = createMarkdownStream({ initialMarkdown: '根节点' })

stream.subscribe(({ document: next, patches }) => {
  console.log(next, patches)
})
stream.append('\n- 生成的分支')

const markdownAgain = serializeMindMap(controller.getSnapshot().document)
const svg = renderMindMapToSvg(document)
```

Controller 发布带有结构共享的冻结快照和变更事件。公开的 Document 和快照应视为只读；请使用 Controller 命令发布变更。文档变更、选择状态和视口状态彼此分离。功能模块或宿主应用应使用 Controller 契约，而不是维护第二份树数据。

## 编辑功能

功能模块按需导入，并消费共享 Controller。入口包括：

- `features/history`
- `features/search`
- `features/import`
- `features/export`
- `features/markdown-editor`
- `features/ai`

```tsx
import { MindMapEditor } from '@xiangfa/mindmap/editor'
import { historyFeature } from '@xiangfa/mindmap/features/history'
import { searchFeature } from '@xiangfa/mindmap/features/search'
import '@xiangfa/mindmap/styles/editor.css'
import '@xiangfa/mindmap/styles/features/history.css'
import '@xiangfa/mindmap/styles/features/search.css'

const features = [historyFeature(), searchFeature()]

<MindMapEditor
  markdown={markdown}
  features={features}
/>
```

请在模块作用域创建 Feature 和 Extension 数组，或使用 `useMemo` 记忆它们，保证每次渲染时引用稳定。重新创建数组会被视为新配置，可能重新挂载功能会话。

AI 功能接收宿主提供的生成器。生成器可以返回完整 Markdown，也可以返回 Markdown 分片的异步迭代器。它会收到当前提示词、Markdown、Document 和 `AbortSignal`。生产环境请通过服务端代理保护凭据。

```tsx
import { aiFeature } from '@xiangfa/mindmap/features/ai'

const ai = aiFeature({
  generate: async ({ prompt, signal }) => generateMarkdownOnYourServer(prompt, signal),
})

const features = [ai]

<MindMapEditor markdown={markdown} features={features} />
```

一次成功的 AI 生成、拖拽或分组编辑会形成一条已提交的历史记录。取消和失败会恢复操作前的 Document。流式帧仍是实时预览；如果持久化必须只发生在事务提交后，请使用 `phase === 'commit'` 的 Controller 事件。

使用内置 OpenAI 兼容适配器时，请显式配置完成状态校验：

```tsx
import { aiFeature, MindMapAIError } from '@xiangfa/mindmap/features/ai'

const features = [aiFeature({
  config: {
    apiUrl: '/api/chat/completions', // 自己的服务端代理
    model: 'your-model',
    completionPolicy: 'strict',
    onCompletion({ status, finishReason, responseType }) {
      // 可选的元数据诊断，不要记录生成内容或凭据。
    },
  },
  onError(error) {
    if (error instanceof MindMapAIError) {
      // 将 error.code 映射为安全提示；error.cause 仅供受控处理。
    }
  },
})]
```

| 完成策略 | EOF / `[DONE]` 时缺少 `finish_reason` 或为 null | 明确的结束原因 |
| --- | --- | --- |
| `strict`（新接入推荐） | 以 `invalid_response` 拒绝 | 仅 `stop` 成功 |
| `legacy`（默认，兼容既有接入） | 沿用非空输出可完成的行为，通过 `onCompletion` 报告 `unknown` | 仅 `stop` 成功 |

JSON 和 SSE 均拒绝 `length`（`incomplete`）、`content_filter`（`content_filter`）和 `tool_calls` 等不支持的结束原因（`invalid_response`）。HTTP、提供方及传输失败使用 `provider_error`；格式错误、空响应或无法验证的响应使用 `invalid_response`。`MindMapAIError` 提供 `code`、`finishReason` 和可选的 `cause`。它的消息和内置多语言界面均不直接显示提供方原始详情。

`onCompletion` 报告提供方元数据，不代表文档已成功提交：状态为 `normal`、`incomplete`、`blocked` 或 `unknown`，响应类型为 `responseType: 'sse' | 'json'`。legacy 下的 `unknown` **不代表已确认完整**。回调不包含生成文本、提示词、附件或凭据；不支持的原始 `finishReason` 仍是不可信输入，记录日志时应只保留允许列表内的值。持久化请依据 Controller 提交事件。只有当前会话成功提交后才清空提示词和附件；失败、停止或外部编辑接管均保留输入，供用户手动重试。适配器不会自动重试或续写。

既有接入可在升级前显式配置 `completionPolicy: 'legacy'`，记录不含敏感载荷的完成状态元数据，确认代理会转发所选 choice 的终止原因后再切换为 `strict`。本次保持 `legacy` 默认值，尚未安排弃用日期，无需迁移导图数据。自定义生成器的返回签名不变，宿主必须在自己的提供方输出不完整时抛错；内置适配器无法验证自定义生成器的协议。

## 语法和扩展

解析器接受类 Markdown 的树形输入，多个根节点之间使用空行分隔。现有项目语法包括：

```text
路线图
- [x] 已完成任务
- [ ] 待办任务
  > 备注可以跨越多行
  | 一行续写内容
  + 初始折叠的分支
```

任务状态、备注、注释、frontmatter、折叠、多行内容、标签、虚线连接、链接和图片、跨链接以及可选 LaTeX 都由 v0.9 解析器和 Extension 契约表示。扩展使用命名空间属性，因此核心 Node 结构保持稳定。需求矩阵逐项记录语法的解析、渲染、导出和往返验证。

## 输入边界和远程图片

运行时会在克隆、遍历、布局、渲染、应用 Patch 或调用图片解析回调之前验证每个公开 Document 边界。Markdown 和 Document 聚合内容最多为 1,000,000 个 UTF-16 代码单元，节点最多 20,000 个，嵌套最多 256 层。公开的 `MAX_MINDMAP_*` 常量定义 ID、元数据、注释、属性集合、标签、多行内容、跨链接、行内 token、图片、渲染图元和 Patch 批次的其余硬限制。导出功能还会在 URI 编码或图片解码前拒绝超过 16 MiB 的原始 SVG。

远程 HTTP(S) 图片默认拒绝，并以替代文本呈现。符合共享输入限制的栅格 `data:` 图片仍可使用。请使用 predicate 只授权应用确实需要访问的来源；只有在全部已清洗的远程图片 URL 都可信时才使用 `"allow"`：

```tsx
const allowProductCdn = (url: string) =>
  new URL(url).hostname === 'images.example.com'

<MindMapViewer
  markdown={markdown}
  remoteImagePolicy={allowProductCdn}
/>
```

通过 `createMindMapController` 设置的策略会被使用该 Controller 的界面继承，界面 Prop 可以覆盖它。浏览器中获授权的图片使用匿名 CORS 且不发送 referrer。导出 SVG 或 PNG 时，请向 `prepareMindMapSvg` 传入明确授权的 `imageResolver`；未解析的远程图片仍遵守 `remoteImagePolicy`，PNG 转换要求将它们嵌入。

当界面接收外部 `controller` 时，内容所有权是互斥的：不要再传入 `document`、`data`、`markdown`、`defaultMarkdown` 或 `documentRevision`。冲突的内容 Prop 会同步失败，避免服务端渲染在替换等待期间暴露 Controller 中的旧内容。

## 视口和选择

`autoFit` 支持 `initial`、`always` 和 `never`：

- `initial` 在第一次可用布局时适配，并保留后续用户的平移和缩放。
- `always` 在符合条件的布局变化后重新适配。
- `never` 将视口控制交给宿主。

Viewer 和 Editor 的 ref 提供 `getDocument`、`getController`、`fitView`、`focusNode`、`selectNode` 和 `setDirection`。Editor ref 还提供 `getMarkdown`、`startEditing`、`addChild`、`addSibling` 和 `removeNode`。

## 可访问性和输入

渲染界面将 SVG 展示与语义树结合。应为指针操作保留键盘替代方式、可见焦点，并遵循减少动态效果偏好。历史和移动快捷键作用于当前获得焦点的编辑器界面，文本输入保留原生编辑行为。

## 键盘和事件

编辑器界面获得焦点时处理以下命令：

| 按键 | 操作 |
| --- | --- |
| 方向键 | 在父节点、子节点和兄弟节点之间移动选择 |
| `Tab` | 为选中节点添加子节点 |
| `Shift + Enter` | 在选中节点后添加兄弟节点 |
| `Enter` 或 `F2` | 编辑选中节点 |
| `Delete` 或 `Backspace` | 删除选中节点 |
| `Escape` | 清除选择或关闭当前编辑路径 |
| `Cmd/Ctrl + Z` | 撤销 |
| `Cmd/Ctrl + Shift + Z` 或 `Cmd/Ctrl + Y` | 重做 |

Viewer 和 Editor 提供 `onSelectedNodeChange`、`onEvent` 和 `onViewportChange`。Editor 还提供 `onDocumentChange`、`onChange` 和 `onMarkdownChange`。文档回调是实时通知，事务预览期间也可能触发。需要只在提交后持久化时，使用 `onEvent` 并筛选 `phase === 'commit'`；不要将视口变化作为 Document 历史保存。

Controller 事件有四个阶段：事务实时帧使用 `preview`，最终历史记录使用 `commit`，取消或失败恢复基线使用 `rollback`，选择或仅布局变化使用 `change`。`documentRevision` 是宿主明确控制的重置令牌：改变它会替换 Document、清空历史、取消活动操作，并允许恢复较旧或内容相同的权威值。普通受控回显应保持相同 revision。

## 样式和主题

导入与运行时匹配的样式表。使用 `theme="light"`、`theme="dark"` 或 `theme="auto"`，并通过 `themeTokens` 覆盖运行时令牌。令牌和运行时样式是独立的包入口，因此静态界面不会将编辑控件的 CSS 带入依赖图。

```tsx
<MindMapViewer
  markdown={markdown}
  theme="dark"
  themeTokens={{ selection: '#55d9ff' }}
/>
```

旧的 `.mindmap-*` 聚合选择器和 `style.css` 导入不属于 v0.9 契约。迁移自定义选择器前请阅读 [MIGRATION-v0.9.md](MIGRATION-v0.9.md)。

## 详细语法

v0.9 解析器和 Extension 契约已记录在仓库文档和迁移后的 Astro 站点中：

- [思维导图语法规范](docs/Mindmap%20Syntax%20Specification.md)
- [扩展语法支持](docs/Extended%20Mindmap%20Syntax%20Support.md)
- [自定义样式参考](docs/Custom%20Styling.md)

Frontmatter、任务标记、备注、注释、折叠、多行内容、标签、虚线、链接/图片、跨链接、行内格式化和 LaTeX 都属于 v0.9 语法契约。解析、渲染、导出和往返结果会在[需求矩阵](docs/refactor-v0.9.0-requirements.md)中逐项记录。

## 开发

```bash
pnpm install
pnpm test:unit
pnpm build:lib
pnpm check:site
pnpm build:site
pnpm lint
```

包含 E2E 和视觉检查的完整验证矩阵见[重构需求文档](docs/refactor-v0.9.0-requirements.md)。记录发布证据时请填写其中的命令、版本、fixture、结果和限制字段。

## 许可证

Apache-2.0，见 [LICENSE](LICENSE)。

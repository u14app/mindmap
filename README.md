<div align="center">

# Open MindMap

[![npm version](https://img.shields.io/npm/v/@xiangfa/mindmap)](https://www.npmjs.com/package/@xiangfa/mindmap)
[![npm downloads](https://img.shields.io/npm/dm/@xiangfa/mindmap)](https://www.npmjs.com/package/@xiangfa/mindmap)
[![npm gzip size](https://deno.bundlejs.com/badge?q=@xiangfa/mindmap@0.6.5/viewer)](https://bundlejs.com/?q=%40xiangfa%2Fmindmap%400.6.5%2Fviewer)
[![license](https://img.shields.io/npm/l/@xiangfa/mindmap)](./LICENSE)
[![react](https://img.shields.io/badge/react-%E2%89%A518-blue)](https://react.dev)

A beautiful, interactive mind map component for React.

**Natively supports AI stream output** with Markdown list syntax and **iOS-style UI**.

Zero dependencies. SVG-based. Keyboard-first. Dark mode ready.

English | [中文](README.zh-CN.md)

</div>

---

![Open MindMap](https://github.com/u14app/mindmap/blob/main/public/screenshot.png)

## Features

- **AI stream ready** — natively supports AI streaming output; feed a markdown list in, get a real-time mind map out
- **Built-in AI generation** — connect any OpenAI-compatible API to generate mind maps from natural language; supports text, image, and PDF attachments
- **Pure SVG rendering** — no canvas, no external layout engines, razor-sharp at any zoom level
- **iOS-style UI** — frosted glass controls, rounded corners, smooth animations, clean and polished design
- **Plugin system** — 7 built-in plugins for extended syntax (dotted lines, folding, multi-line, tags, cross-links, LaTeX, frontmatter); fully extensible
- **Inline formatting** — **bold**, _italic_, `code`, ~~strikethrough~~, ==highlight==, and [links](url) inside nodes
- **Task status** — `[x]` done, `[ ]` todo, `[-]` in-progress checkboxes
- **Remarks** — multi-line remarks attached to nodes via `>` syntax
- **Text editing mode** — toggle between visual mind map and plain-text markdown editing
- **Full-screen mode** — expand the component to fill the viewport
- **LaTeX math** — render `$...$` inline and `$$...$$` display formulas (requires KaTeX)
- **Cross-links** — draw edges between arbitrary nodes via `{#anchor}` / `-> {#target}`
- **Lightweight Viewer** — a standalone read-only component (`MindMapViewer`) with ~48% smaller bundle; import via `@xiangfa/mindmap/viewer` for minimal footprint
- **Readonly mode** — display-only with pan/zoom/select but no editing; ideal for presentations and embeds
- **Multiple root nodes** — build separate trees on the same canvas
- **Drag & drop** — reorder siblings by dragging; drag root's children across the center line to rebalance sides
- **Keyboard shortcuts** — Enter to create, Delete to remove, Cmd+C/V to copy/paste, Shift+ shortcuts for zoom & layout
- **Markdown I/O** — feed a markdown list in, get a mind map out (great for AI streaming)
- **i18n** — auto-detects browser language; built-in Chinese and English, fully customizable via props
- **Dark mode** — auto-detects `prefers-color-scheme`, or set `light` / `dark` explicitly
- **Export** — SVG, high-DPI PNG, and Markdown export out of the box
- **Import** — paste JSON or markdown data via the context menu import dialog
- **Context menu** — right-click to add root nodes, import data, export, or change layout
- **Layout modes** — left, right, or balanced (both) layout directions
- **Mobile optimized** — full touch support with single-finger pan/drag and two-finger pinch-to-zoom centered on content
- **Toolbar control** — show/hide zoom controls via the `toolbar` prop
- **Tiny footprint** — zero runtime dependencies beyond React

## Installation

```bash
# npm
npm install @xiangfa/mindmap

# pnpm
pnpm add @xiangfa/mindmap

# yarn
yarn add @xiangfa/mindmap
```

For LaTeX math rendering, also install KaTeX (optional):

```bash
npm install katex
```

## Quick Start

```tsx
import { MindMap } from "@xiangfa/mindmap";
import "@xiangfa/mindmap/style.css";

const data = `
My Mind Map
  - First Topic
    - Subtopic A
    - Subtopic B
  - Second Topic
`;

function App() {
  return <MindMap markdown={data} />;
}
```

> **Note:** The component fills its parent container. Make sure the parent has explicit dimensions.

## Usage

### Multiple Root Nodes

Pass an array to render independent trees on the same canvas:

```tsx
<MindMap data={[tree1, tree2, tree3]} />
```

### Markdown Input

Feed a markdown list directly — perfect for streaming AI responses:

```tsx
const markdown = `
Machine Learning
  - Supervised Learning
    - Classification
    - Regression
  - Unsupervised Learning

Application Areas
  - NLP
  - Computer Vision
`;

<MindMap markdown={markdown} />;
```

Separate root trees with a blank line in the markdown.

### Readonly Mode

Display a mind map without allowing edits — perfect for presentations, documentation, or embedding:

```tsx
<MindMap data={data} readonly />
```

In readonly mode, users can still pan, zoom, and select nodes, but cannot create, edit, or delete nodes. The context menu hides editing actions (new root node, import) while keeping view-only actions (export, layout).

### Lightweight Viewer

For read-only use cases where bundle size matters (dashboards, documentation, embeds), use `MindMapViewer` — a standalone component that excludes editing hooks, AI input, context menu, export utils, and more, resulting in a ~48% smaller bundle.

```tsx
// Minimal bundle via sub-path import:
import { MindMapViewer } from "@xiangfa/mindmap/viewer";
import "@xiangfa/mindmap/style.css";

<MindMapViewer markdown={markdown} />;
```

Or import from the main entry (tree-shakeable):

```tsx
import { MindMapViewer } from "@xiangfa/mindmap";
```

`MindMapViewer` supports all rendering features: themes, plugins, pan/zoom, fold toggle, remark tooltips, and keyboard shortcuts for zoom and layout. It does **not** include editing, drag-drop, AI generation, context menu, export, or text editor.

### Text Editor Mode

Pass the `MindMapTextEditor` component to enable a built-in text editing mode with syntax highlighting. Users can toggle between the visual mind map and a markdown text editor via a button in the bottom-right corner.

```tsx
import { MindMap, MindMapTextEditor } from "@xiangfa/mindmap";

<MindMap markdown={markdown} textEditor={MindMapTextEditor} />;
```

The text editor is opt-in and tree-shakeable — it is only bundled when you import and pass it. If omitted, the text mode toggle button is hidden.

### Dark Mode

```tsx
<MindMap data={data} theme="auto" />  {/* follow system (default) */}
<MindMap data={data} theme="dark" />  {/* always dark */}
<MindMap data={data} theme="light" /> {/* always light */}
```

### Custom Styling

Override CSS custom properties on the container to customize colors, fonts, and more:

```css
/* Override theme variables */
.mindmap-container {
  --mindmap-root-bg: #1a73e8;
  --mindmap-canvas-bg: #f0f4f8;
  --mindmap-node-text: #1a1a2e;
}
```

Target specific elements with semantic CSS classes:

```css
/* Style all edges */
.mindmap-edge {
  stroke-width: 3;
}

/* Style root node background */
.mindmap-node-root .mindmap-node-bg {
  fill: #6c5ce7;
}
```

Customize individual branch colors via `data-branch-index`:

```css
.mindmap-edge[data-branch-index="0"] {
  stroke: #e74c3c;
}
.mindmap-edge[data-branch-index="1"] {
  stroke: #2ecc71;
}
```

#### CSS Variable Groups

| Group         | Variables                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Canvas        | `--mindmap-canvas-bg`                                                                                                              |
| Root Node     | `--mindmap-root-bg`, `--mindmap-root-text`, `--mindmap-root-font-size`, `--mindmap-root-font-weight`, `--mindmap-root-font-family` |
| Child Nodes   | `--mindmap-node-text`, `--mindmap-node-font-size`, `--mindmap-node-font-weight`, `--mindmap-node-font-family`                      |
| Level 1       | `--mindmap-level1-font-size`, `--mindmap-level1-font-weight`                                                                       |
| Edges         | `--mindmap-edge-width`                                                                                                             |
| Selection     | `--mindmap-selection-stroke`, `--mindmap-selection-fill`                                                                           |
| Highlight     | `--mindmap-highlight-text`, `--mindmap-highlight-bg`                                                                               |
| Add Button    | `--mindmap-addbtn-fill`, `--mindmap-addbtn-hover`, `--mindmap-addbtn-icon`                                                         |
| Controls      | `--mindmap-controls-bg`, `--mindmap-controls-text`, `--mindmap-controls-hover`                                                     |
| Context Menu  | `--mindmap-ctx-bg`, `--mindmap-ctx-text`, `--mindmap-ctx-hover`, `--mindmap-ctx-border`, `--mindmap-ctx-shadow`                    |
| Branch Colors | `--mindmap-branch-0` through `--mindmap-branch-9`                                                                                  |

#### CSS Class Selectors

| Class                     | Target               |
| ------------------------- | -------------------- |
| `.mindmap-node-root`      | Root node group      |
| `.mindmap-node-child`     | Child node group     |
| `.mindmap-node-bg`        | Node background rect |
| `.mindmap-node-text`      | Node text element    |
| `.mindmap-node-underline` | Child node underline |
| `.mindmap-edge`           | Connection line      |
| `.mindmap-edge-label`     | Edge label text      |
| `.mindmap-add-btn`        | Add child button     |
| `.mindmap-fold-btn`       | Fold/unfold toggle   |
| `.mindmap-tag`            | Tag badge            |

Exported SVGs embed a `<style>` block with resolved CSS values and include the same semantic classes and `data-branch-index` attributes, so standalone SVGs render correctly without external CSS.

> See [Custom Styling Guide](docs/Custom%20Styling.md) for the full list of 30+ CSS variables, class selectors, and examples.

### Layout Direction

```tsx
<MindMap data={data} defaultDirection="both" />  {/* balanced (default) */}
<MindMap data={data} defaultDirection="right" /> {/* all children right */}
<MindMap data={data} defaultDirection="left" />  {/* all children left */}
```

### i18n / Localization

The UI language is auto-detected from the browser's language setting. Built-in support for Chinese (`zh-CN`) and English (`en-US`), with English as the default fallback. You can also override the locale or any text string:

```tsx
{
  /* Auto-detect (default) - uses browser language */
}
<MindMap data={data} />;

{
  /* Force a specific locale */
}
<MindMap data={data} locale="en-US" />;

{
  /* Override specific strings */
}
<MindMap data={data} locale="en-US" messages={{ newNode: "New Topic" }} />;

{
  /* Fully custom locale */
}
<MindMap
  data={data}
  messages={{
    newNode: "Nuevo nodo",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    // ... override any key from MindMapMessages
  }}
/>;
```

### Plugins

The plugin system extends the mind map with additional syntax and rendering capabilities. All 7 built-in plugins are enabled by default. You can also select specific plugins:

```tsx
import {
  MindMap,
  allPlugins, // all 7 plugins
  frontMatterPlugin, // YAML frontmatter
  dottedLinePlugin, // dotted line edges
  foldingPlugin, // collapsible nodes
  multiLinePlugin, // multi-line content
  tagsPlugin, // hashtag support
  crossLinkPlugin, // cross-references
  latexPlugin, // LaTeX math (requires KaTeX)
} from "@xiangfa/mindmap";

{
  /* Use all plugins (default behavior) */
}
<MindMap data={data} plugins={allPlugins} />;

{
  /* Pick only the plugins you need */
}
<MindMap data={data} plugins={[foldingPlugin, tagsPlugin]} />;

{
  /* Disable all plugins */
}
<MindMap data={data} plugins={[]} />;
```

### Ref API

Access imperative methods via a ref:

```tsx
import { useRef } from "react";
import { MindMap, type MindMapRef } from "@xiangfa/mindmap";

function App() {
  const ref = useRef<MindMapRef>(null);

  const handleExportPNG = async () => {
    const blob = await ref.current!.exportToPNG();
    // ... download blob
  };

  const handleExportSVG = () => {
    const svgString = ref.current!.exportToSVG();
    // ... download svg
  };

  return <MindMap ref={ref} data={data} />;
}
```

### AI Generation

Add a built-in AI input bar to generate mind maps from natural language. Connects to any OpenAI-compatible API with streaming support:

```tsx
<MindMap
  ai={{
    apiUrl: "https://api.openai.com/v1/chat/completions",
    apiKey: "sk-...",
    model: "gpt-5",
  }}
/>
```

Enable file attachments (text, image, PDF):

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

Customize the system prompt:

```tsx
<MindMap
  ai={{
    apiUrl: "https://api.openai.com/v1/chat/completions",
    apiKey: "sk-...",
    model: "gpt-5",
    systemPrompt: "Generate a mind map about the given topic...",
  }}
/>
```

> **Security Note:** The API key is sent from the browser. For production, use a proxy endpoint to keep your key server-side.

### Listening for Changes

```tsx
<MindMap
  data={data}
  onDataChange={(newData) => {
    console.log("Mind map updated:", newData);
  }}
/>
```

### Toolbar Visibility

Control the toolbar via the `toolbar` prop:

```tsx
{
  /* Hide all toolbar buttons */
}
<MindMap data={data} toolbar={false} />;

{
  /* Hide zoom controls (text mode and fullscreen buttons remain) */
}
<MindMap data={data} toolbar={{ zoom: false }} />;
```

The toolbar includes zoom controls (bottom-left) and text mode / fullscreen toggle buttons (bottom-right). The `toolbar` prop controls zoom visibility; the text mode and fullscreen buttons are always available.

### Mobile / Touch Support

The mind map has full touch support out of the box:

- **Single finger on canvas** — pan the view
- **Single finger on node** — drag to reorder siblings
- **Two-finger pinch** — zoom in/out (always centers on mind map content)

No configuration needed — touch support is always active alongside mouse events.

## Extended Syntax

The mind map supports rich markdown-like syntax. Features marked with _(plugin)_ require the corresponding plugin to be enabled (all are enabled by default).

### Inline Formatting

Format text inside any node:

```
**bold text**
*italic text*
`inline code`
~~strikethrough~~
==highlight==
[link text](https://example.com)
```

### Links & Images

Embed clickable hyperlinks and images within nodes:

```
Machine Learning
- [Wikipedia](https://en.wikipedia.org/wiki/ML)
- Architecture Overview ![](./arch.png)
- Resources
  - [Paper](https://arxiv.org/xxx)
  - ![diagram](./flow.png)
```

- `[text](url)` — Node text becomes a clickable hyperlink.
- `![alt](path)` — Embeds an image within a node.

### Task Status

Add checkboxes to track task state:

```
- [x] Completed task
- [ ] Pending task
- [-] In-progress task
```

### Remarks

Attach multi-line remarks to a node using `>`:

```
- Node with a remark
  > This is a remark line
  > It can span multiple lines
```

### Comments

Use `%%` to add comments that are only visible in the text editor and will not be rendered in the mind map:

```
%% This is a comment, it won't appear in the mind map
Machine Learning
%% Core learning paradigms
- Supervised Learning
  - Classification
  - Regression
- Unsupervised Learning
  %% TODO: add more examples
  - Clustering
```

A line is treated as a comment only when `%%` appears at the beginning of the line (optionally preceded by whitespace). Inline occurrences like `test%%demo` are not treated as comments.

### Frontmatter _(plugin)_

Set default options at the top of your markdown:

```
---
direction: left
theme: dark
---
- Root Node
  - Child
```

Supported fields: `direction` (`left` | `right` | `both`), `theme` (`light` | `dark` | `auto`).

### Dotted Line _(plugin)_

Use `-.` instead of `-` to render a node with a dotted edge:

```
- Solid edge node
  -. Dotted edge child
```

### Folding / Collapsible Nodes _(plugin)_

Use `+` instead of `-` to make a node initially collapsed:

```
- Visible node
  + This node starts collapsed
    - Hidden child
```

### Multi-line Content _(plugin)_

Use `|` to add continuation lines to a node:

```
- First line of the node
  | Second line
  | Third line
```

### Tags _(plugin)_

Add hashtags to nodes for visual labeling:

```
- React #framework #frontend
- PostgreSQL #database
```

### Cross-links _(plugin)_

Draw edges between arbitrary nodes:

```
- Node A {#a}
  - Child
- Node B {#b}
  -> {#a} "references"
```

- `{#id}` — define an anchor on a node
- `-> {#id}` — solid cross-link to the anchor
- `-> {#id} "label"` — cross-link with a label
- `-.> {#id}` — dotted cross-link

### LaTeX Math _(plugin)_

Render mathematical formulas (requires [KaTeX](https://katex.org/)):

```
- Inline math: $E = mc^2$
- Display math: $$\sum_{i=1}^{n} x_i$$
```

## API Reference

### Props

| Prop               | Type                            | Default      | Description                                                                    |
| ------------------ | ------------------------------- | ------------ | ------------------------------------------------------------------------------ |
| `data`             | `MindMapData \| MindMapData[]`  | _required_   | Tree data (single root or array of roots)                                      |
| `markdown`         | `string`                        | -            | Markdown list source (overrides `data` when set)                               |
| `defaultDirection` | `'left' \| 'right' \| 'both'`   | `'both'`     | Initial layout direction                                                       |
| `theme`            | `'light' \| 'dark' \| 'auto'`   | `'auto'`     | Color theme                                                                    |
| `locale`           | `string`                        | _auto_       | UI language (auto-detected from browser, or `'zh-CN'`, `'en-US'`, custom)      |
| `messages`         | `Partial<MindMapMessages>`      | -            | Override any UI text string                                                    |
| `readonly`         | `boolean`                       | `false`      | Display-only mode (no editing, no creating)                                    |
| `toolbar`          | `boolean \| ToolbarConfig`      | `true`       | Show/hide zoom controls                                                        |
| `ai`               | `MindMapAIConfig`               | -            | AI generation configuration (API endpoint, key, model, attachments)            |
| `plugins`          | `MindMapPlugin[]`               | `allPlugins` | Plugins to enable for extended syntax                                          |
| `textEditor`       | `ComponentType`                 | -            | Pass `MindMapTextEditor` to enable text editing mode. Opt-in for tree-shaking. |
| `onDataChange`     | `(data: MindMapData[]) => void` | -            | Called when the tree is modified by user interaction                           |

### ToolbarConfig

```ts
interface ToolbarConfig {
  zoom?: boolean; // show zoom controls (default: true)
}
```

### MindMapAIConfig

```ts
type AIAttachmentType = "text" | "image" | "pdf";

interface MindMapAIConfig {
  apiUrl: string; // OpenAI-compatible API endpoint
  apiKey: string; // API key (Bearer token)
  model: string; // Model name (e.g., "gpt-5")
  systemPrompt?: string; // Custom system prompt (has a built-in default)
  attachments?: AIAttachmentType[]; // Allowed attachment types (default: [])
}
```

| Field          | Type                 | Required | Description                                                                              |
| -------------- | -------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `apiUrl`       | `string`             | Yes      | OpenAI-compatible chat completions endpoint                                              |
| `apiKey`       | `string`             | Yes      | API key sent as `Bearer` token                                                           |
| `model`        | `string`             | Yes      | Model identifier (e.g., `gpt-5`, `deepseek-chat`)                                        |
| `systemPrompt` | `string`             | No       | Override the built-in mind map generation prompt                                         |
| `attachments`  | `AIAttachmentType[]` | No       | Enable file uploads: `"text"` (text/\*), `"image"` (image/\*), `"pdf"` (application/pdf) |

### Ref Methods

| Method              | Returns         | Description                            |
| ------------------- | --------------- | -------------------------------------- |
| `exportToSVG()`     | `string`        | Returns the mind map as an SVG string  |
| `exportToPNG()`     | `Promise<Blob>` | Renders a high-DPI PNG blob            |
| `exportToOutline()` | `string`        | Serializes the tree as a markdown list |
| `getData()`         | `MindMapData[]` | Returns the current tree data          |
| `setData(data)`     | `void`          | Replaces the tree data                 |
| `setMarkdown(md)`   | `void`          | Parses markdown and replaces the tree  |
| `fitView()`         | `void`          | Resets zoom and pan to fit all nodes   |
| `setDirection(dir)` | `void`          | Changes the layout direction           |

### MindMapViewer

A lightweight read-only alternative to `MindMap`. Import from `@xiangfa/mindmap/viewer` for the smallest bundle, or from the main entry.

#### MindMapViewerProps

| Prop               | Type                            | Default  | Description                                                               |
| ------------------ | ------------------------------- | -------- | ------------------------------------------------------------------------- |
| `data`             | `MindMapData \| MindMapData[]`  | -        | Tree data (single root or array of roots)                                 |
| `markdown`         | `string`                        | -        | Markdown list source (overrides `data` when set)                          |
| `defaultDirection` | `'left' \| 'right' \| 'both'`   | `'both'` | Initial layout direction                                                  |
| `theme`            | `'light' \| 'dark' \| 'auto'`   | `'auto'` | Color theme                                                               |
| `locale`           | `string`                        | _auto_   | UI language (auto-detected from browser, or `'zh-CN'`, `'en-US'`, custom) |
| `messages`         | `Partial<MindMapMessages>`      | -        | Override any UI text string                                               |
| `toolbar`          | `boolean \| ToolbarConfig`      | `true`   | Show/hide zoom controls                                                   |
| `plugins`          | `MindMapPlugin[]`               | -        | Plugins to enable for extended syntax                                     |
| `onEvent`          | `(event: MindMapEvent) => void` | -        | Called on zoom, direction change, or node select events                   |

#### MindMapViewerRef Methods

| Method              | Returns         | Description                          |
| ------------------- | --------------- | ------------------------------------ |
| `getData()`         | `MindMapData[]` | Returns the current tree data        |
| `fitView()`         | `void`          | Resets zoom and pan to fit all nodes |
| `setDirection(dir)` | `void`          | Changes the layout direction         |

### Data Structure

```ts
interface MindMapData {
  id: string;
  text: string;
  children?: MindMapData[];
  remark?: string; // multi-line remark
  taskStatus?: "todo" | "doing" | "done";
  // Plugin extension fields (populated by corresponding plugins)
  dottedLine?: boolean; // dotted-line plugin
  multiLineContent?: string[]; // multi-line plugin
  tags?: string[]; // tags plugin
  anchorId?: string; // cross-link plugin
  crossLinks?: CrossLink[]; // cross-link plugin
  collapsed?: boolean; // folding plugin
}

interface CrossLink {
  targetAnchorId: string;
  label?: string;
  dotted?: boolean;
}
```

## Keyboard Shortcuts

| Shortcut               | Action                                      |
| ---------------------- | ------------------------------------------- |
| `Enter`                | Create a child node under the selected node |
| `Delete` / `Backspace` | Delete the selected node                    |
| `Double-click`         | Edit node text                              |
| `Cmd/Ctrl + C`         | Copy subtree                                |
| `Cmd/Ctrl + X`         | Cut subtree                                 |
| `Cmd/Ctrl + V`         | Paste subtree as child                      |
| `Escape`               | Close context menu / dialog                 |
| `Shift + +`            | Zoom in                                     |
| `Shift + -`            | Zoom out                                    |
| `Shift + 0`            | Reset view (fit all nodes)                  |
| `Shift + L`            | Left layout                                 |
| `Shift + R`            | Right layout                                |
| `Shift + M`            | Both layout (balanced)                      |
| Scroll wheel           | Zoom in / out                               |
| Click + drag on canvas | Pan                                         |
| Click + drag on node   | Reorder among siblings                      |
| Right-click            | Open context menu                           |

## Utility Functions

These are also exported for advanced use cases:

```ts
import {
  // Markdown parsing
  parseMarkdownList, // md string → single MindMapData
  toMarkdownList, // single MindMapData → md string
  parseMarkdownMultiRoot, // md string → MindMapData[]
  toMarkdownMultiRoot, // MindMapData[] → md string
  parseMarkdownWithFrontMatter, // md string → MindMapData[] (with plugin support)

  // Inline markdown
  parseInlineMarkdown, // text → inline tokens
  stripInlineMarkdown, // remove markdown formatting from text

  // Export
  buildExportSVG, // programmatic SVG generation
  exportToPNG, // SVG string → PNG Blob

  // i18n
  resolveMessages, // build a full MindMapMessages object
  detectLocale, // detect browser locale

  // Plugins
  allPlugins, // all 7 built-in plugins
  frontMatterPlugin,
  dottedLinePlugin,
  foldingPlugin,
  multiLinePlugin,
  tagsPlugin,
  crossLinkPlugin,
  latexPlugin,

  // Text Editor
  MindMapTextEditor, // opt-in text editor component

  // Lightweight Viewer
  MindMapViewer, // read-only viewer component (also available via @xiangfa/mindmap/viewer)
} from "@xiangfa/mindmap";
```

## Development

```bash
git clone https://github.com/u14app/mindmap.git
cd mindmap
pnpm install
pnpm dev        # start dev server
pnpm build      # type-check and build
pnpm build:lib  # build as library
pnpm lint       # run linter
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a pull request.

## Community Support

You can ask questions or share your thoughts and needs regarding Open MindMap in these communities.

[LinuxDo](https://linux.do)

[V2EX](https://www.v2ex.com)

## License

[Apache-2.0](LICENSE)

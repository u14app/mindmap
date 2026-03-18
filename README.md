<div align="center">

# Open MindMap

A beautiful, interactive mind map component for React.

**Natively supports AI stream output** with Markdown list syntax and **iOS-style UI**.

Zero dependencies. SVG-based. Keyboard-first. Dark mode ready.

[![npm version](https://img.shields.io/npm/v/@xiangfa/mindmap.svg?style=flat-square)](https://www.npmjs.com/package/@xiangfa/mindmap)
[![npm downloads](https://img.shields.io/npm/dm/@xiangfa/mindmap.svg?style=flat-square)](https://www.npmjs.com/package/@xiangfa/mindmap)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@xiangfa/mindmap?style=flat-square)](https://bundlephobia.com/package/@xiangfa/mindmap)
[![license](https://img.shields.io/github/license/u14app/mindmap?style=flat-square)](https://github.com/u14app/mindmap/blob/main/LICENSE)

</div>

---

## Features

- **AI stream ready** - natively supports AI streaming output; feed a markdown list in, get a real-time mind map out
- **Pure SVG rendering** - no canvas, no external layout engines, razor-sharp at any zoom level
- **iOS-style UI** - frosted glass controls, rounded corners, smooth animations, clean and polished design
- **Readonly mode** - display-only mode with pan/zoom/select but no editing; ideal for presentations and embeds
- **Multiple root nodes** - build separate trees on the same canvas
- **Drag & drop** - reorder siblings by dragging; drag root's children across the center line to rebalance sides; ghost placeholder shows target position while dragged node follows cursor
- **Keyboard shortcuts** - Enter to create, Delete to remove, Cmd+C/V to copy/paste, Shift+ shortcuts for zoom & layout
- **Markdown I/O** - feed a markdown list in, get a mind map out (great for AI streaming)
- **i18n** - auto-detects browser language; built-in Chinese and English, fully customizable via props
- **Dark mode** - auto-detects `prefers-color-scheme`, or set `light` / `dark` explicitly
- **Export** - SVG, high-DPI PNG, and Markdown export out of the box
- **Import** - paste JSON or markdown data via the context menu import dialog
- **Context menu** - right-click to add root nodes, import data, export, or change layout
- **Layout modes** - left, right, or balanced (both) layout directions
- **Help overlay** - built-in keyboard shortcut reference and project info (separate dialogs)
- **Mobile optimized** - full touch support with single-finger pan/drag and two-finger pinch-to-zoom centered on content
- **Toolbar control** - show/hide individual toolbar buttons via the `toolbar` prop
- **Tiny footprint** - zero runtime dependencies beyond React

## Installation

```bash
# npm
npm install @xiangfa/mindmap

# pnpm
pnpm add @xiangfa/mindmap

# yarn
yarn add @xiangfa/mindmap
```

## Quick Start

```tsx
import { MindMap } from "@xiangfa/mindmap";
import "@xiangfa/mindmap/style.css";

const data = {
  id: "root",
  text: "My Mind Map",
  children: [
    {
      id: "1",
      text: "First Topic",
      children: [
        { id: "1-1", text: "Subtopic A" },
        { id: "1-2", text: "Subtopic B" },
      ],
    },
    { id: "2", text: "Second Topic" },
  ],
};

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <MindMap data={data} />
    </div>
  );
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

Feed a markdown list directly - perfect for streaming AI responses:

```tsx
const markdown = `
- Machine Learning
  - Supervised Learning
    - Classification
    - Regression
  - Unsupervised Learning

- Application Areas
  - NLP
  - Computer Vision
`

<MindMap markdown={markdown} />
```

Separate root trees with a blank line in the markdown.

### Readonly Mode

Display a mind map without allowing edits - perfect for presentations, documentation, or embedding:

```tsx
<MindMap data={data} readonly />
```

In readonly mode, users can still pan, zoom, and select nodes, but cannot create, edit, or delete nodes. The context menu hides editing actions (new root node, import) while keeping view-only actions (export, layout).

### Dark Mode

```tsx
<MindMap data={data} theme="auto" />  {/* follow system (default) */}
<MindMap data={data} theme="dark" />  {/* always dark */}
<MindMap data={data} theme="light" /> {/* always light */}
```

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

Control which toolbar buttons are visible:

```tsx
{
  /* Hide all toolbar buttons */
}
<MindMap data={data} toolbar={false} />;

{
  /* Hide only zoom controls */
}
<MindMap data={data} toolbar={{ zoom: false }} />;

{
  /* Hide help and shortcuts buttons */
}
<MindMap data={data} toolbar={{ help: false, shortcuts: false }} />;
```

```ts
interface ToolbarConfig {
  zoom?: boolean; // zoom controls (default: true)
  direction?: boolean; // layout direction controls (default: true)
  help?: boolean; // help button (default: true)
  shortcuts?: boolean; // shortcuts button (default: true)
}
```

### Mobile / Touch Support

The mind map has full touch support out of the box:

- **Single finger on canvas** - pan the view
- **Single finger on node** - drag to reorder siblings
- **Two-finger pinch** - zoom in/out (always centers on mind map content)

No configuration needed — touch support is always active alongside mouse events.

## API Reference

### Props

| Prop               | Type                            | Default    | Description                                                               |
| ------------------ | ------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `data`             | `MindMapData \| MindMapData[]`  | _required_ | Tree data (single root or array of roots)                                 |
| `markdown`         | `string`                        | -          | Markdown list source (overrides `data` when set)                          |
| `defaultDirection` | `'left' \| 'right' \| 'both'`   | `'both'`   | Initial layout direction                                                  |
| `theme`            | `'light' \| 'dark' \| 'auto'`   | `'auto'`   | Color theme                                                               |
| `locale`           | `string`                        | _auto_     | UI language (auto-detected from browser, or `'zh-CN'`, `'en-US'`, custom) |
| `messages`         | `Partial<MindMapMessages>`      | -          | Override any UI text string                                               |
| `readonly`         | `boolean`                       | `false`    | Display-only mode (no editing, no creating)                               |
| `toolbar`          | `boolean \| ToolbarConfig`      | `true`     | Show/hide toolbar buttons (zoom, direction, help, shortcuts)              |
| `onDataChange`     | `(data: MindMapData[]) => void` | -          | Called when the tree is modified by user interaction                      |

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

### Data Structure

```ts
interface MindMapData {
  id: string;
  text: string;
  children?: MindMapData[];
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
  parseMarkdownList, // md string -> single MindMapData
  toMarkdownList, // single MindMapData -> md string
  parseMarkdownMultiRoot, // md string -> MindMapData[]
  toMarkdownMultiRoot, // MindMapData[] -> md string
  buildExportSVG, // programmatic SVG generation
  exportToPNG, // SVG string -> PNG Blob
  resolveMessages, // build a full MindMapMessages object
  detectLocale, // detect browser locale
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

## License

[MIT](LICENSE)

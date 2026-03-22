# Custom Styling Guide

Open MindMap provides a comprehensive CSS customization system. You can control the appearance of every element using **CSS custom properties**, **semantic class selectors**, and **data attributes** — all without writing any JavaScript.

## Overview

The styling system works in three layers:

1. **CSS Custom Properties** — Set on `.mindmap-container`, these control theme-level values (colors, fonts, sizes). Override them to change the entire look.
2. **CSS Class Selectors** — Semantic classes on every SVG element (`.mindmap-edge`, `.mindmap-node-root`, etc.) allow targeted styling. SVG presentation attributes have lower specificity than CSS rules, so your styles always win.
3. **Data Attributes** — `data-branch-index="0"` through `"9"` on nodes and edges enable per-branch customization.

## CSS Custom Properties

Override these on `.mindmap-container` (or any ancestor) to change theme values:

```css
.mindmap-container {
  --mindmap-canvas-bg: #f0f4f8;
  --mindmap-root-bg: #1a73e8;
  --mindmap-node-text: #1a1a2e;
}
```

### Canvas

| Variable | Description | Light Default | Dark Default |
|----------|-------------|---------------|--------------|
| `--mindmap-canvas-bg` | Canvas background color | `#fafafa` | `#1a1a2e` |

### Root Node

| Variable | Description | Light Default | Dark Default |
|----------|-------------|---------------|--------------|
| `--mindmap-root-bg` | Root node background | `#2C3E50` | `#4A6FA5` |
| `--mindmap-root-text` | Root node text color | `#FFFFFF` | `#FFFFFF` |
| `--mindmap-root-font-size` | Root node font size | `20px` | `20px` |
| `--mindmap-root-font-weight` | Root node font weight | `600` | `600` |
| `--mindmap-root-font-family` | Root node font family | `system-ui, 'Segoe UI', Roboto, sans-serif` | _(same)_ |

### Child Nodes

| Variable | Description | Light Default | Dark Default |
|----------|-------------|---------------|--------------|
| `--mindmap-node-text` | Child node text color | `#333333` | `#E0E0E0` |
| `--mindmap-node-font-size` | Child node font size | `15px` | `15px` |
| `--mindmap-node-font-weight` | Child node font weight | `400` | `400` |
| `--mindmap-node-font-family` | Child node font family | `system-ui, 'Segoe UI', Roboto, sans-serif` | _(same)_ |

### Level 1 (Direct Children of Root)

| Variable | Description | Default |
|----------|-------------|---------|
| `--mindmap-level1-font-size` | Level 1 font size | `16px` |
| `--mindmap-level1-font-weight` | Level 1 font weight | `500` |

### Edges / Connections

| Variable | Description | Default |
|----------|-------------|---------|
| `--mindmap-edge-width` | Edge stroke width | `2.5` |

### Selection

| Variable | Description | Light Default | Dark Default |
|----------|-------------|---------------|--------------|
| `--mindmap-selection-stroke` | Selected node stroke | `#4A90D9` | `#5B9BD5` |
| `--mindmap-selection-fill` | Selected node fill | `rgba(74, 144, 217, 0.08)` | `rgba(91, 155, 213, 0.15)` |

### Highlight

| Variable | Description | Light Default | Dark Default |
|----------|-------------|---------------|--------------|
| `--mindmap-highlight-text` | `==highlight==` text color | `#fac800` | `#fcd34d` |
| `--mindmap-highlight-bg` | `==highlight==` background | `rgba(252, 211, 77, 0.2)` | `rgba(251, 191, 36, 0.2)` |

### Add Button

| Variable | Description | Light Default | Dark Default |
|----------|-------------|---------------|--------------|
| `--mindmap-addbtn-fill` | Button fill | `rgba(200, 200, 220, 0.6)` | `rgba(100, 100, 130, 0.6)` |
| `--mindmap-addbtn-hover` | Button hover fill | `rgba(180, 180, 200, 0.8)` | `rgba(120, 120, 150, 0.8)` |
| `--mindmap-addbtn-icon` | Button icon color | `#666` | `#aaa` |

### Controls (Toolbar)

| Variable | Description | Light Default | Dark Default |
|----------|-------------|---------------|--------------|
| `--mindmap-controls-bg` | Toolbar background | `rgba(255, 255, 255, 0.9)` | `rgba(30, 30, 45, 0.9)` |
| `--mindmap-controls-text` | Toolbar text color | `#555` | `#ccc` |
| `--mindmap-controls-hover` | Button hover background | `rgba(0, 0, 0, 0.08)` | `rgba(255, 255, 255, 0.1)` |

### Context Menu

| Variable | Description | Light Default | Dark Default |
|----------|-------------|---------------|--------------|
| `--mindmap-ctx-bg` | Menu background | `rgba(255, 255, 255, 0.95)` | `rgba(35, 35, 50, 0.95)` |
| `--mindmap-ctx-text` | Menu text color | `#333` | `#ddd` |
| `--mindmap-ctx-hover` | Item hover background | `rgba(0, 0, 0, 0.06)` | `rgba(255, 255, 255, 0.08)` |
| `--mindmap-ctx-border` | Menu border color | `rgba(0, 0, 0, 0.08)` | `rgba(255, 255, 255, 0.1)` |
| `--mindmap-ctx-shadow` | Menu shadow color | `rgba(0, 0, 0, 0.15)` | `rgba(0, 0, 0, 0.4)` |

### Branch Colors

| Variable | Default Color |
|----------|---------------|
| `--mindmap-branch-0` | `#FF6B6B` (coral) |
| `--mindmap-branch-1` | `#4ECDC4` (mint) |
| `--mindmap-branch-2` | `#45B7D1` (sky blue) |
| `--mindmap-branch-3` | `#96CEB4` (sage) |
| `--mindmap-branch-4` | `#FFEAA7` (lemon) |
| `--mindmap-branch-5` | `#DDA0DD` (plum) |
| `--mindmap-branch-6` | `#98D8C8` (aqua) |
| `--mindmap-branch-7` | `#F7DC6F` (gold) |
| `--mindmap-branch-8` | `#BB8FCE` (purple) |
| `--mindmap-branch-9` | `#F0B27A` (orange) |

## CSS Class Selectors

All SVG elements have semantic CSS classes. Since SVG presentation attributes (e.g., `fill="red"`) have **lower specificity** than CSS rules, your class-based styles always take precedence.

### Container & Canvas

| Class | Element |
|-------|---------|
| `.mindmap-container` | Outer wrapper div (CSS variables are set here) |
| `.mindmap-svg` | Main SVG element |
| `.mindmap-canvas` | Inner `<g>` group (pan/zoom transform) |

### Nodes

| Class | Element |
|-------|---------|
| `.mindmap-node-g` | Any node group (root or child) |
| `.mindmap-node-root` | Root node group (depth = 0) |
| `.mindmap-node-child` | Child node group (depth > 0) |
| `.mindmap-node-bg` | Node background `<rect>` |
| `.mindmap-node-text` | Node text `<text>` element |
| `.mindmap-node-content` | Node content wrapper `<g>` |
| `.mindmap-node-underline` | Child node underline `<line>` |
| `.mindmap-node-ghost` | Applied when a node is being dragged |

### Edges

| Class | Element |
|-------|---------|
| `.mindmap-edge` | Regular connection line `<path>` |
| `.mindmap-edge-cross-link` | Cross-link edge |
| `.mindmap-edge-label` | Edge label text |

### Inline Formatting (inside SVG `<text>`)

| Class | Element |
|-------|---------|
| `.mindmap-text-bold` | Bold `<tspan>` |
| `.mindmap-text-italic` | Italic `<tspan>` |
| `.mindmap-text-strikethrough` | Strikethrough `<tspan>` |
| `.mindmap-text-code` | Inline code `<tspan>` |
| `.mindmap-text-highlight` | Highlight `<tspan>` |
| `.mindmap-text-link` | Link `<a>` wrapping `<tspan>` |
| `.mindmap-text-plain` | Plain text `<tspan>` |
| `.mindmap-code-bg` | Code background `<rect>` |
| `.mindmap-highlight-bg` | Highlight background `<rect>` |

### Tags

| Class | Element |
|-------|---------|
| `.mindmap-tag` | Tag group `<g>` |
| `.mindmap-tag-bg` | Tag background `<rect>` |
| `.mindmap-tag-text` | Tag text `<text>` |

### UI Controls

| Class | Element |
|-------|---------|
| `.mindmap-add-btn` | Add child button group |
| `.mindmap-fold-btn` | Fold/unfold toggle button |
| `.mindmap-zoom-controls` | Zoom toolbar container |
| `.mindmap-extra-controls` | Mode/fullscreen toolbar |
| `.mindmap-context-menu` | Right-click context menu |
| `.mindmap-remark-tooltip` | Remark hover tooltip |
| `.mindmap-edit-input` | Inline edit input |
| `.mindmap-text-editor` | Text mode editor `<textarea>` |

## Data Attributes

### `data-branch-index`

Every node and edge has a `data-branch-index` attribute (0–9) indicating which branch of the root it belongs to. Descendants inherit their ancestor's branch index.

```css
/* Target specific branches */
.mindmap-edge[data-branch-index="0"] { stroke: #e74c3c; }
.mindmap-node-g[data-branch-index="1"] .mindmap-node-underline { stroke: #27ae60; }
```

## Customization Examples

### Example 1: Custom Theme Colors

```css
.mindmap-container {
  --mindmap-canvas-bg: #1e1e2e;
  --mindmap-root-bg: #cba6f7;
  --mindmap-root-text: #1e1e2e;
  --mindmap-node-text: #cdd6f4;
  --mindmap-controls-bg: rgba(30, 30, 46, 0.9);
  --mindmap-controls-text: #cdd6f4;
  --mindmap-ctx-bg: rgba(30, 30, 46, 0.95);
  --mindmap-ctx-text: #cdd6f4;
  --mindmap-ctx-border: rgba(205, 214, 244, 0.1);
  --mindmap-ctx-shadow: rgba(0, 0, 0, 0.4);
}
```

### Example 2: Custom Branch Colors

```css
.mindmap-container {
  --mindmap-branch-0: #264653;
  --mindmap-branch-1: #2a9d8f;
  --mindmap-branch-2: #e9c46a;
  --mindmap-branch-3: #f4a261;
  --mindmap-branch-4: #e76f51;
}
```

### Example 3: Custom Font

```css
.mindmap-container {
  --mindmap-root-font-family: 'Inter', sans-serif;
  --mindmap-node-font-family: 'Inter', sans-serif;
  --mindmap-root-font-size: 24px;
  --mindmap-node-font-size: 14px;
}
```

### Example 4: Targeted Node Styling

```css
/* Make root nodes square instead of rounded */
.mindmap-node-root .mindmap-node-bg {
  rx: 8;
  ry: 8;
}

/* Thicker edges */
.mindmap-edge {
  stroke-width: 3.5;
}

/* Hide add buttons */
.mindmap-add-btn {
  display: none;
}
```

## SVG Export

When exporting to SVG or PNG, Open MindMap:

1. Embeds a `<style>` block inside the SVG with **resolved** CSS values (not variables) — ensuring the SVG renders correctly as a standalone file.
2. Applies the same semantic class names (`.mindmap-edge`, `.mindmap-node-root`, etc.) and `data-branch-index` attributes to all elements.

This means:
- **Standalone SVG**: Renders correctly without external CSS.
- **Embedded in HTML**: You can use the same CSS selectors to further customize the exported SVG.

## ThemeColors Interface

For programmatic theming via the `theme` prop, the full TypeScript interface:

```typescript
interface ThemeColors {
  root: {
    fontSize: number;
    fontWeight: number;
    fontFamily: string;
    paddingH: number;
    paddingV: number;
    bgColor: string;
    textColor: string;
  };
  node: {
    fontSize: number;
    fontWeight: number;
    fontFamily: string;
    paddingH: number;
    paddingV: number;
    textColor: string;
  };
  level1: {
    fontSize: number;
    fontWeight: number;
  };
  connection: {
    strokeWidth: number;
  };
  layout: {
    horizontalGap: number;
    verticalGap: number;
  };
  canvas: {
    bgColor: string;
  };
  controls: {
    bgColor: string;
    textColor: string;
    hoverBg: string;
    activeBg: string;
  };
  contextMenu: {
    bgColor: string;
    textColor: string;
    hoverBg: string;
    borderColor: string;
    shadowColor: string;
  };
  addBtn: {
    fill: string;
    hoverFill: string;
    iconColor: string;
  };
  selection: {
    strokeColor: string;
    fillColor: string;
  };
  highlight: {
    textColor: string;
    bgColor: string;
  };
}
```

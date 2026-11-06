# Custom Styling Guide

Open MindMap v0.9 exposes typed theme tokens for colors, typography, spacing, and layout, plus stable `mm-` class selectors for mounted React surfaces. Choose the stylesheet that matches the surface you render, use `themeTokens` for values that affect measurement, and use CSS selectors for presentation-only adjustments.

## Import the matching stylesheet

Each public surface has its own style entry. Feature styles are separate as well:

```tsx
import { MindMapEditor } from '@xiangfa/mindmap/editor'
import { historyFeature } from '@xiangfa/mindmap/features/history'
import '@xiangfa/mindmap/styles/editor.css'
import '@xiangfa/mindmap/styles/features/history.css'

const features = [historyFeature()]

<MindMapEditor markdown={markdown} features={features} />
```

Use `@xiangfa/mindmap/styles/static.css` with `StaticMindMap`, `styles/viewer.css` with `MindMapViewer`, and `styles/editor.css` with `MindMapEditor`. The runtime style files import their shared `styles/tokens.css` dependency. Import the feature stylesheet for every Feature you mount:

| Style entry | Covers |
| --- | --- |
| `@xiangfa/mindmap/styles/tokens.css` | Shared `--mm-*` variables and surface defaults |
| `@xiangfa/mindmap/styles/static.css` | Static wrapper, SVG scene, nodes, edges, and inline content |
| `@xiangfa/mindmap/styles/viewer.css` | Interactive viewport, focus, semantic-tree utility, and viewport controls |
| `@xiangfa/mindmap/styles/editor.css` | Editor toolbar, context menu, text mode, editing input, and overlays |
| `@xiangfa/mindmap/styles/features/history.css` | History controls |
| `@xiangfa/mindmap/styles/features/search.css` | Search control |
| `@xiangfa/mindmap/styles/features/import.css` | Import dialog |
| `@xiangfa/mindmap/styles/features/export.css` | Export menu |
| `@xiangfa/mindmap/styles/features/markdown-editor.css` | Markdown source panel |
| `@xiangfa/mindmap/styles/features/ai.css` | AI composer and attachment list |

The v0.9 package does not use the old aggregate stylesheet entry. Import only public `styles/*` paths that match the runtime and Features in use.

## Theme modes and tokens

Set `theme` to `light`, `dark`, or `auto`. `auto` follows `prefers-color-scheme` after hydration; the initial projection is light so server and client markup remain deterministic. Pass a partial `themeTokens` object for semantic values that also affect layout measurement:

```tsx
import { MindMapViewer } from '@xiangfa/mindmap/viewer'
import '@xiangfa/mindmap/styles/viewer.css'

<MindMapViewer
  markdown={markdown}
  theme="dark"
  themeTokens={{
    background: '#101621',
    text: '#e9eef8',
    mutedText: '#9ba8bd',
    rootFill: '#8f83ff',
    rootText: '#ffffff',
    selection: '#55d9ff',
    branches: ['#8f83ff', '#55d9ff', '#72e4b8', '#ffc36a'],
  }}
/>
```

The complete `MindMapThemeTokens` shape is:

```ts
interface MindMapThemeTokens {
  background: string
  text: string
  mutedText: string
  rootFill: string
  rootText: string
  selection: string
  branches: readonly string[]
  fontFamily: string
  rootFontSize: number
  levelOneFontSize: number
  nodeFontSize: number
  horizontalGap: number
  verticalGap: number
  rootPaddingX: number
  rootPaddingY: number
  nodePaddingX: number
  nodePaddingY: number
}
```

Numeric values are used as pixels by the layout engine. Changing a font or padding token can change node dimensions and therefore the projected layout. `branches` is the repeating palette for first-level branches and their descendants.

### Default values

The light `DEFAULT_THEME` is:

| Token | Default | Token | Default |
| --- | --- | --- | --- |
| `background` | `#fafafa` | `text` | `#333333` |
| `mutedText` | `#555` | `rootFill` | `#2C3E50` |
| `rootText` | `#FFFFFF` | `selection` | `#4A90D9` |
| `fontFamily` | `system-ui, 'Segoe UI', Roboto, sans-serif` | `rootFontSize` | `20` |
| `levelOneFontSize` | `16` | `nodeFontSize` | `15` |
| `horizontalGap` | `80` | `verticalGap` | `16` |
| `rootPaddingX` | `24` | `rootPaddingY` | `12` |
| `nodePaddingX` | `8` | `nodePaddingY` | `6` |
| `branches` | `#FF6B6B`, `#4ECDC4`, `#45B7D1`, `#96CEB4`, `#FFEAA7`, `#DDA0DD`, `#98D8C8`, `#F7DC6F`, `#BB8FCE`, `#F0B27A` | — | — |

The default appearance follows v0.7.1: a capsule root, transparent child nodes with colored underlines, and solid curved connections. The dark runtime theme changes the background, text, muted text, root fill, and selection color while retaining the branch palette and token shape. Treat those values as implementation defaults; use `themeTokens` when a product needs a fixed palette.

## CSS custom properties

The token stylesheet defines six presentation variables on `.mm-static` and `.mm-surface`:

| Variable | Value comes from |
| --- | --- |
| `--mm-background` | `background` |
| `--mm-text` | `text` |
| `--mm-muted` | `mutedText` |
| `--mm-root` | `rootFill` |
| `--mm-selection` | `selection` |
| `--mm-font` | `fontFamily` |

The runtime also sets the same variables inline from the resolved theme. They are useful to style controls and supporting content in the same semantic palette:

```css
.strategy-map .mm-node-detail {
  opacity: .68;
}

.strategy-map .mm-edge {
  stroke: var(--mm-selection);
  stroke-width: 3;
}

.strategy-map .mm-viewport-controls {
  border-color: color-mix(in srgb, var(--mm-selection) 35%, transparent);
}
```

Prefer `themeTokens` for a color, font, padding, or gap that the layout engine measures. A CSS variable override changes presentation only; it does not recompute node geometry or the layout projection.

## Runtime class selectors

Classes below are emitted by the v0.9 runtime or its public Features. Scope overrides beneath a host class to avoid affecting other maps on the page. SVG presentation attributes are the runtime defaults; a matching CSS property can override them for a mounted surface.

### Surfaces and scene layers

| Class | Element | Typical use |
| --- | --- | --- |
| `.mm-static` | Static wrapper | Size and background |
| `.mm-static__svg` | Static SVG | Display and SVG sizing |
| `.mm-surface` | Viewer or Editor wrapper | Surface background and isolation |
| `.mm-viewport` | Interactive SVG viewport | Cursor, focus ring, and interaction surface |
| `.mm-scene` | SVG scene group | Scene-level presentation |
| `.mm-edges` | Edge layer | Layer-level opacity or ordering |
| `.mm-nodes` | Node layer | Layer-level presentation |
| `.mm-semantic-tree` | Visually-hidden semantic tree utility | Accessibility tree presentation when a host/variant mounts one |
| `.mm-viewport-controls` | Zoom, fit, and fullscreen controls | Control placement and chrome |

### Nodes, edges, and content

| Class | Element or state | Typical use |
| --- | --- | --- |
| `.mm-edge` | Parent-child or cross-link path | Stroke, opacity, and dash styling |
| `.mm-node` | Node group | Cursor and node state styling |
| `.mm-node--root` | Root node variant | Root-only presentation |
| `.mm-node--child` | Child node variant | Child-only presentation |
| `.mm-node-shape` | Node background shape | Fill, radius, and stroke |
| `.mm-node-accent` | Child accent line | Accent color and thickness |
| `.mm-node-content` | Node content group | Content-level presentation |
| `.mm-node-label` | Plain primary label | Font, selection, or opacity |
| `.mm-node-detail` | Plain multiline label | Supporting text styling |
| `.mm-node-selection` | Selected root outline | Selection emphasis |
| `.mm-node-tags` | Tag badge group | Tag layout and opacity |
| `.mm-task` | Task marker group | Task marker styling |
| `.mm-task--todo`, `.mm-task--doing`, `.mm-task--done` | Task status variants | Status-specific colors |
| `.mm-fold-control` | Expand/collapse control | Control opacity and hover state |
| `.mm-inline-content` | Formatted `foreignObject` content | Inline links, code, math, and content layout |

The node group also receives state classes such as `.is-selected` and `.is-dimmed`. A selected node is kept visible when viewport culling is enabled; a dimmed node is a non-matching result from the Search Feature.

### Editor and Feature surfaces

| Class | Surface | Typical use |
| --- | --- | --- |
| `.mm-editor` | Editor wrapper | Editor-scoped overrides |
| `.mm-editor-toolbar` | Editor toolbar | Toolbar layout and controls |
| `.mm-editor-toolbar__group` | Toolbar command group | Group spacing and separators |
| `.mm-editor-direction` | Direction controls | Direction control layout |
| `.mm-context-backdrop` | Context-menu backdrop | Backdrop and stacking |
| `.mm-context-menu` | Context menu | Menu size, colors, and shadow |
| `.mm-text-mode` | Text-mode overlay | Text editor placement |
| `.mm-editor-input-object` | Inline edit `foreignObject` | Edit overlay overflow |
| `.mm-editor-input` | Inline edit input | Input border and typography |
| `.mm-node-properties` | Remark editor dialog | Remark panel layout |
| `.mm-tag-filter` | Tag filter controls | Filter label and select styling |
| `.mm-feature` | Shared Feature wrapper | Common Feature layout |
| `.mm-feature-toolbar` | Toolbar Feature group | Feature command spacing |
| `.mm-feature-overlay` | Editor overlay slot | Overlay positioning |
| `.mm-feature-bottom` | Editor bottom slot | Bottom composer positioning |
| `.mm-feature-ai-composer` | AI Feature composer | Composer layout and state |
| `.mm-ai-orb`, `.mm-ai-input-wrap` | AI Feature parts | Composer visual details |
| `.mm-ai-submit`, `.mm-ai-stop` | AI actions | Action button states |
| `.mm-ai-attachments` | AI attachment list | Attachment layout |
| `.mm-feature-menu` | Export menu | Menu placement and buttons |
| `.mm-dialog-backdrop`, `.mm-dialog` | Import dialog | Modal backdrop and panel |
| `.mm-dialog__header`, `.mm-dialog__tabs`, `.mm-dialog__footer`, `.mm-dialog__error` | Import dialog parts | Modal sub-layout and error text |
| `.mm-markdown-panel` | Markdown editor panel | Source panel placement |
| `.mm-markdown-panel__header`, `.mm-markdown-panel__footer` | Markdown panel parts | Panel chrome |
| `.mm-feature-search` | Search Feature | Search control dimensions |
| `.mm-feature-history` | History Feature | Undo/redo control dimensions |

Feature elements are mounted only when the corresponding Feature object is passed to `MindMapEditor`. The editor's optional toolbar controls are controlled by `MindMapToolbarConfig`; hiding a control through configuration is preferable to relying on CSS for behavior.

## Customization examples

### Change semantic theme and branch colors

```tsx
<MindMapViewer
  markdown={markdown}
  theme="light"
  themeTokens={{
    background: '#f7f3ec',
    text: '#2c2520',
    mutedText: '#776b61',
    rootFill: '#a44a3f',
    rootText: '#fffaf3',
    selection: '#d67838',
    branches: ['#a44a3f', '#2f6f68', '#b3833e', '#76518f'],
    fontFamily: 'Georgia, serif',
    horizontalGap: 84,
  }}
/>
```

### Adjust mounted presentation

```css
.strategy-map .mm-node--child .mm-node-shape {
  fill: color-mix(in srgb, var(--mm-background) 88%, var(--mm-selection));
  stroke-width: 2;
}

.strategy-map .mm-fold-control {
  opacity: 1;
}

.strategy-map .mm-viewport-controls {
  bottom: 24px;
}
```

Keep focus indicators visible and preserve the supplied hit target around `.mm-fold-control`. The shipped styles remove transitions when `prefers-reduced-motion: reduce` is active; custom animation should follow the same preference.

## SVG and PNG export

`renderMindMapToSvg` from `@xiangfa/mindmap/core` produces a standalone SVG with resolved theme attributes, escaped user content, an accessible `<title>`, and a `<desc>`. It does not inherit the page's CSS variables, so pass the desired `theme` tokens to the export function:

```tsx
import { renderMindMapToSvg } from '@xiangfa/mindmap/core'

const svg = renderMindMapToSvg(document, {
  extensions,
  theme: {
    background: '#101621',
    text: '#e9eef8',
    rootFill: '#8f83ff',
    rootText: '#ffffff',
  },
  title: 'Product strategy',
  description: 'A rendered product strategy map',
})
```

The Export Feature adds `prepareMindMapSvg` and `renderSvgToPng`. Remote HTTP(S) images are denied by default. `prepareMindMapSvg` can call a host-provided `imageResolver` as explicit authorization to embed selected images as safe PNG, JPEG, GIF, or WebP data URLs. An unresolved URL remains subject to `remoteImagePolicy`; `renderSvgToPng` rejects SVG that still contains remote image URLs and rejects raw SVG over 16 MiB before URI encoding. Authorized browser images use anonymous CORS and no referrer. For math, pass a trusted `renderMath` callback or install the optional KaTeX peer and enable the LaTeX Extension. Exported output uses resolved SVG attributes rather than relying on the mounted page's CSS class or variable cascade.

## Styling checklist

- Import the surface stylesheet and every Feature stylesheet used by the component.
- Use `themeTokens` for semantic colors, font metrics, padding, and layout gaps.
- Scope CSS overrides beneath a host class such as `.strategy-map`.
- Target `.mm-node--root` and `.mm-node--child` for depth variants; use `themeTokens.branches` for per-branch palette changes because branch indices are layout data, not public DOM attributes.
- Keep `.mm-node-selection`, focus rings, fold-control hit targets, and reduced-motion behavior accessible.
- Treat exported SVG/PNG as a separate boundary and configure its theme, image resolver, and math renderer explicitly.

See [Mindmap Syntax Specification](Mindmap%20Syntax%20Specification.md) and [Extended Mindmap Syntax Support](Extended%20Mindmap%20Syntax%20Support.md) for the content and Extension contracts.

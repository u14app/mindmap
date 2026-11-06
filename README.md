# Open MindMap

[![license](https://img.shields.io/npm/l/@xiangfa/mindmap)](./LICENSE)
[![React](https://img.shields.io/badge/react-%E2%89%A518-149eca)](https://react.dev)

Open MindMap is a modular React and TypeScript runtime for interactive SVG mind maps. Version 0.9.0 separates the headless Document Runtime, static rendering, read-only viewing, editing, optional Features, and syntax Extensions into explicit package entries.

The v0.9.0 refactor is a breaking interface upgrade. The implementation and validation record are kept in [the refactor requirements](docs/refactor-v0.9.0-requirements.md). This README intentionally does not publish benchmark numbers or claim checks that have not been rerun against the current repository.

English | [中文](README.zh-CN.md)

## Install

```bash
pnpm add @xiangfa/mindmap
```

React and ReactDOM are peer dependencies. KaTeX remains optional and is needed only when the LaTeX Extension is used.

## Choose an entry

| Use case | Import | Stylesheet |
| --- | --- | --- |
| Headless parsing, layout, patches, streaming, and SVG helpers | `@xiangfa/mindmap/core` | None |
| Static SVG surface | `@xiangfa/mindmap/static` | `@xiangfa/mindmap/styles/static.css` |
| Read-only pan, zoom, selection, and fit | `@xiangfa/mindmap/viewer` | `@xiangfa/mindmap/styles/viewer.css` |
| Editing surface | `@xiangfa/mindmap/editor` | `@xiangfa/mindmap/styles/editor.css` |
| Optional editor capability | `@xiangfa/mindmap/features/*` | Matching feature stylesheet |
| Syntax or render extension | `@xiangfa/mindmap/extensions/*` | Matching stylesheet when provided |

The root `@xiangfa/mindmap` entry exposes the v0.9 editor contract. Use the explicit entries when a smaller or headless dependency graph is useful. `legacy-viewer`, `cognitive`, `cognitive/react`, and the cognitive fallback stylesheet are not v0.9 public entries.

## Quick start

```tsx
import { MindMapEditor } from '@xiangfa/mindmap/editor'
import '@xiangfa/mindmap/styles/editor.css'

const markdown = `Product strategy
- Research
  - Interviews
  - Positioning
- Delivery
  - Prototype`

export function StrategyMap() {
  return <MindMapEditor markdown={markdown} />
}
```

The component fills its parent. Give the parent an explicit width and height.

For a read-only surface:

```tsx
import { MindMapViewer } from '@xiangfa/mindmap/viewer'
import '@xiangfa/mindmap/styles/viewer.css'

export function ReadOnlyMap({ markdown }: { markdown: string }) {
  return <MindMapViewer markdown={markdown} autoFit="initial" />
}
```

For a static surface:

```tsx
import { StaticMindMap } from '@xiangfa/mindmap/static'
import '@xiangfa/mindmap/styles/static.css'

<StaticMindMap markdown={markdown} />
```

## Core runtime

The `core` entry is independent of React and browser rendering. It provides the public Document, Node, Patch, layout, parser, serializer, controller, stream, Extension, and SVG types and functions.

```tsx
import {
  createMarkdownStream,
  createMindMapController,
  parseMindMap,
  renderMindMapToSvg,
  serializeMindMap,
} from '@xiangfa/mindmap/core'

const document = parseMindMap('Root\n- Branch')
const controller = createMindMapController(document)
const stream = createMarkdownStream({ initialMarkdown: 'Root' })

stream.subscribe(({ document: next, patches }) => {
  console.log(next, patches)
})
stream.append('\n- Generated branch')

const markdownAgain = serializeMindMap(controller.getSnapshot().document)
const svg = renderMindMapToSvg(document)
```

The controller publishes frozen snapshots with structural sharing and change events. Treat public Document and snapshot values as read-only; use controller commands to publish changes. Document changes, selection, and Viewport state are separate concerns. Use the controller interface instead of maintaining a second tree in a Feature or host application.

## Editor Features

Features are opt-in and consume the shared controller. Available entry names are:

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

Create Feature and Extension arrays at module scope, or memoize them with `useMemo`, so their identities remain stable between renders. A recreated array is treated as a new configuration and can remount feature sessions.

The AI Feature accepts a host generator that returns complete Markdown or an async iterable of Markdown chunks. The generator receives the current prompt, Markdown, Document, and an `AbortSignal`. Keep credentials behind a server-side proxy in production.

```tsx
import { aiFeature } from '@xiangfa/mindmap/features/ai'

const ai = aiFeature({
  generate: async ({ prompt, signal }) => generateMarkdownOnYourServer(prompt, signal),
})

const features = [ai]

<MindMapEditor markdown={markdown} features={features} />
```

One successful AI generation, drag gesture, or grouped edit creates one committed history entry. Cancellation and failure restore the pre-operation Document. Stream frames remain live previews; use the controller event with `phase === 'commit'` when persistence must happen only after a transaction commits.

For the built-in OpenAI-compatible adapter, configure completion validation explicitly:

```tsx
import { aiFeature, MindMapAIError } from '@xiangfa/mindmap/features/ai'

const features = [aiFeature({
  config: {
    apiUrl: '/api/chat/completions', // Your server proxy
    model: 'your-model',
    completionPolicy: 'strict',
    onCompletion({ status, finishReason, responseType }) {
      // Optional metadata diagnostic. Do not log generated content or credentials.
    },
  },
  onError(error) {
    if (error instanceof MindMapAIError) {
      // Map error.code to your own safe message; error.cause is for controlled handling.
    }
  },
})]
```

| Completion policy | Missing or null `finish_reason` at EOF / `[DONE]` | Explicit completion reason |
| --- | --- | --- |
| `strict` (recommended for new integrations) | Rejects with `invalid_response` | Only `stop` succeeds |
| `legacy` (default, for existing integrations) | Retains the previous nonempty-output behavior; reports `unknown` to `onCompletion` | Only `stop` succeeds |

Both JSON and SSE reject `length` (`incomplete`), `content_filter` (`content_filter`), and unsupported reasons such as `tool_calls` (`invalid_response`). HTTP, provider and transport failures use `provider_error`; malformed, empty or unverifiable responses use `invalid_response`. `MindMapAIError` exposes `code`, `finishReason`, and optional `cause`. Its message and the built-in localized UI never display raw provider details.

`onCompletion` reports provider metadata, not a successful document commit: statuses are `normal`, `incomplete`, `blocked`, or `unknown`, with `responseType: 'sse' | 'json'`. An `unknown` legacy result is **not verified complete**. The callback contains no generated text, prompt, attachment, or credential; treat an unsupported raw `finishReason` as untrusted and log an allow-listed value only. Observe controller commit events to confirm persistence. Prompts and attachments are cleared only after a successful owned commit; failure, stop, or external editing keeps them for a manual retry. The adapter does not retry or continue automatically.

Existing integrations may set `completionPolicy: 'legacy'` explicitly before upgrading, record completion metadata without sensitive payloads, and switch to `strict` after confirming that their proxy forwards the selected choice's terminal reason. The default remains `legacy` in this change; no deprecation date is scheduled. No document migration is needed. Custom generators keep their existing return signature and must throw when their own provider output is incomplete; the built-in adapter cannot validate a custom generator's protocol.

## Syntax and Extensions

The parser accepts Markdown-like tree input with multiple roots separated by a blank line. Existing project syntax includes:

```text
Roadmap
- [x] Shipped task
- [ ] Open task
  > A remark can span lines
  | A continuation line
  + A collapsed branch
```

Task status, remarks, comments, frontmatter, folding, multiline content, tags, dotted connections, links and images, cross-links, and optional LaTeX are represented by the v0.9 parser and Extension contract. Extensions use namespaced attributes so the core Node shape remains stable. The requirements matrix records parser, renderer, export, and round-trip validation for each syntax item.

## Input boundaries and remote images

The runtime validates every public Document boundary before cloning, traversal, layout, rendering, patch application, or resolver callbacks. Markdown and aggregate Document content are limited to 1,000,000 UTF-16 code units, with at most 20,000 nodes and 256 nesting levels. The exported `MAX_MINDMAP_*` constants define the remaining hard limits for IDs, metadata, comments, attribute collections, tags, multiline content, cross-links, inline tokens, images, render primitives, and patch batches. The Export Feature also rejects raw SVG longer than 16 MiB before URI encoding or image decoding.

Remote HTTP(S) images are denied by default and render as their alt text. Raster `data:` images remain available within the shared input limits. Authorize only the origins your application intends to contact with a predicate, or use `"allow"` when every sanitized remote image URL is trusted:

```tsx
const allowProductCdn = (url: string) =>
  new URL(url).hostname === 'images.example.com'

<MindMapViewer
  markdown={markdown}
  remoteImagePolicy={allowProductCdn}
/>
```

A policy supplied to `createMindMapController` is inherited by a surface using that controller; a surface prop overrides it. Authorized browser images use anonymous CORS and omit the referrer. For portable SVG or PNG, pass an explicitly authorized `imageResolver` to `prepareMindMapSvg`; unresolved remote images still follow `remoteImagePolicy`, and PNG conversion requires them to be embedded.

When a surface receives an external `controller`, content ownership is exclusive: do not also pass `document`, `data`, `markdown`, `defaultMarkdown`, or `documentRevision`. Conflicting content props fail synchronously so server rendering cannot expose stale controller content while a replacement is pending.

## Viewport and selection

`autoFit` accepts `initial`, `always`, or `never`:

- `initial` fits the first usable layout and preserves later user pan and zoom.
- `always` fits after eligible layout changes.
- `never` leaves Viewport control to host code.

Viewer and Editor refs expose `getDocument`, `getController`, `fitView`, `focusNode`, `selectNode`, and `setDirection`. The Editor ref also exposes `getMarkdown`, `startEditing`, `addChild`, `addSibling`, and `removeNode`.

## Accessibility and input

The rendered surface combines SVG presentation with a semantic tree. Keep keyboard alternatives available for pointer operations, preserve visible focus, and honor reduced-motion preferences. History and movement shortcuts apply to the active editor surface while text inputs retain native editing behavior.

## Keyboard and events

The Editor handles these commands when its surface has focus:

| Key | Action |
| --- | --- |
| Arrow keys | Move selection through parent, child, and sibling nodes |
| `Tab` | Add a child to the selected node |
| `Shift + Enter` | Add a sibling after the selected node |
| `Enter` or `F2` | Edit the selected node |
| `Delete` or `Backspace` | Remove the selected node |
| `Escape` | Clear selection or close the current edit path |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y` | Redo |

Viewer and Editor expose `onSelectedNodeChange`, `onEvent`, and `onViewportChange`. Editor additionally exposes `onDocumentChange`, `onChange`, and `onMarkdownChange`. Document callbacks are live notifications and may receive transaction previews. Use `onEvent` with `phase === 'commit'` for commit-only persistence; do not persist Viewport changes as Document history.

Controller events use four phases: `preview` for live transaction frames, `commit` for the final history entry, `rollback` when cancellation or failure restores the baseline, and `change` for selection or layout-only updates. `documentRevision` is the explicit host-controlled reset token: changing it replaces the Document, clears history, cancels active work, and permits restoring an older or identical authoritative value. Ordinary controlled echoes should keep the same revision.

## Styling and themes

Import the stylesheet that matches the runtime. Use `theme="light"`, `theme="dark"`, or `theme="auto"`, and pass `themeTokens` for runtime token overrides. The token and runtime styles are separate package exports so a static surface does not pull editor controls into its CSS graph.

```tsx
<MindMapViewer
  markdown={markdown}
  theme="dark"
  themeTokens={{ selection: '#55d9ff' }}
/>
```

The previous aggregate `.mindmap-*` selector and `style.css` import are not the v0.9 contract. See [MIGRATION-v0.9.md](MIGRATION-v0.9.md) before carrying custom selectors forward.

## Detailed syntax

The v0.9 parser and Extension contract are documented in the repository references and the migrated Astro site:

- [Mindmap syntax specification](docs/Mindmap%20Syntax%20Specification.md)
- [Extended syntax support](docs/Extended%20Mindmap%20Syntax%20Support.md)
- [Custom styling reference](docs/Custom%20Styling.md)

Frontmatter, task markers, remarks, comments, folding, multiline content, tags, dotted lines, links/images, cross-links, inline formatting, and LaTeX are part of the v0.9 syntax contract. Parser, render, export, and round-trip results are recorded individually in [the requirements matrix](docs/refactor-v0.9.0-requirements.md).

## Development

```bash
pnpm install
pnpm test:unit
pnpm build:lib
pnpm check:site
pnpm build:site
pnpm lint
```

The complete validation matrix, including permitted E2E and visual checks, is in [docs/refactor-v0.9.0-requirements.md](docs/refactor-v0.9.0-requirements.md). Use its command, revision, fixture, result, and limitation fields when recording release evidence.

## License

Apache-2.0. See [LICENSE](LICENSE).

# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Open MindMap (`@xiangfa/mindmap`) is a zero-dependency React component library for interactive SVG-based mind maps. It supports markdown input (AI streaming ready), a plugin system for extended syntax, and exports to SVG/PNG/markdown.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server at localhost:5173
pnpm build            # TypeScript check + build demo app
pnpm build:lib        # Build library (ESM + UMD + types + CSS)
pnpm lint             # ESLint
```

No test framework is configured.

## Architecture

**Dual build targets:** The project builds both a demo app (`pnpm build`) and an npm library (`pnpm build:lib`). The library entry point is `src/components/MindMap/index.ts`.

**Rendering:** Pure SVG — no Canvas or external layout engines. The layout algorithm in `utils/layout.ts` computes tree positions using DFS traversal and Canvas text measurement.

**Data flow:**

1. Input (markdown string or `MindMapData[]`) → parser (`utils/markdown.ts`)
2. Tree data → layout engine (`utils/layout.ts`) → `LayoutNode[]` + `Edge[]`
3. Layout → SVG rendering via `MindMapNode.tsx` and edge paths
4. User interactions → tree mutations (`utils/tree-ops.ts`) → re-layout → re-render

**Key directories under `src/components/MindMap/`:**

- `hooks/` — React hooks: pan/zoom, drag-drop, node editing, theme detection, animations
- `utils/` — Pure functions: layout, markdown parsing, inline token parsing, tree operations, export, i18n, theme colors
- `components/` — Sub-components: node renderer, toolbar controls, context menu, icons
- `plugins/` — Plugin system with ~20 hook points across parsing, serialization, layout, rendering, and export

**Plugin system:** Plugins implement hooks from the `MindMapPlugin` interface (`plugins/types.ts`). The runner (`plugins/runner.ts`) chains plugins in order. Built-in plugins: frontmatter, dotted-line, folding, multi-line, tags, cross-link, latex.

**Tree operations** in `utils/tree-ops.ts` are immutable — they return new objects rather than mutating.

**MindMap.tsx** (~1000 lines) is the main orchestrator component. It manages state, wires hooks together, handles keyboard shortcuts, and renders the SVG tree. It exposes an imperative API via `MindMapRef` (forwardRef).

## Conventions

- **Package manager:** pnpm
- **Language:** TypeScript with strict mode, `noUnusedLocals`/`noUnusedParameters` enabled
- **Styling:** Plain CSS with `mindmap-` prefix (BEM-like). Single CSS file exported as `dist/style.css`.
- **React:** Functional components only, React 19. No class components.
- **Externals:** React, ReactDOM, and KaTeX (optional peer dep) are external in library builds.
- **ESM preserves modules** for tree-shaking; UMD provides a single bundle.
- **ESLint:** Flat config (v9). `@typescript-eslint/no-explicit-any` is disabled.

## Code Editing Rules

When editing SVG elements or JSX with many attributes, preserve ALL existing attributes. Never drop attributes (y, width, height, fill, textAnchor, dominantBaseline, etc.) when making targeted edits.

## Task Management

When given a list of multiple tasks/issues to fix, create a TodoWrite checklist first, then work through each item sequentially and verify completion before moving on. Do not leave tasks unaddressed.

## Build & Verification

This is a TypeScript project. When creating new files with JSX, always use .tsx extension (not .ts). Run `npm run build` after changes to verify.
After fixing ESLint errors, run `npx eslint . --quiet` to confirm all errors are resolved before reporting completion.

## Styling

When fixing CSS/styling issues, check for cascading style conflicts before applying fixes. Test that new styles don't break existing ones — especially code blocks, dark mode, and z-index layering.

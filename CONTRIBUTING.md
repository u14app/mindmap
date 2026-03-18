# Contributing to Open MindMap

Thank you for your interest in contributing to Open MindMap! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing [issues](https://github.com/u14app/mindmap/issues) to avoid duplicates.

When filing a bug report, include:

- A clear, descriptive title
- Steps to reproduce the behavior
- Expected behavior vs. actual behavior
- Browser and OS information
- Screenshots or screen recordings if applicable
- A minimal code example that reproduces the issue

### Suggesting Features

Feature requests are tracked as [GitHub issues](https://github.com/u14app/mindmap/issues). When suggesting a feature:

- Use a clear, descriptive title
- Explain the use case and why existing features don't address it
- Provide examples of how the feature would work

### Pull Requests

1. Fork the repository and create your branch from `main`
2. Follow the [development setup](#development-setup) below
3. Make your changes
4. Ensure your code passes type checking and linting
5. Write a clear PR description explaining your changes

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8

### Getting Started

```bash
# Fork and clone the repository
git clone https://github.com/<your-username>/mindmap.git
cd mindmap

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

The dev server starts at `http://localhost:5173` with hot module replacement.

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with HMR |
| `pnpm build` | Type-check and build the demo app |
| `pnpm build:lib` | Build the library for npm publishing |
| `pnpm lint` | Run ESLint |
| `pnpm preview` | Preview the production build locally |

### Verifying Your Changes

Before submitting a PR, make sure:

```bash
# Type checking passes
pnpm build

# Linting passes
pnpm lint

# Library build succeeds
pnpm build:lib
```

## Project Structure

```
src/components/MindMap/
  index.ts               Public API exports
  MindMap.tsx             Main component (orchestrator)
  MindMap.css             Styles
  types.ts                Shared TypeScript types
  components/             Sub-components
  hooks/                  React hooks
  utils/                  Pure logic & utilities
```

### Architecture Overview

- **MindMap.tsx** is the orchestrator. It wires together hooks, manages cross-cutting state, and renders the SVG container.
- **components/** contains presentational sub-components (node rendering, controls, context menu).
- **hooks/** encapsulates stateful logic (drag & drop, pan/zoom, editing, theme detection).
- **utils/** contains pure functions with no React dependency (tree operations, layout algorithm, markdown parsing, export).

### Key Design Decisions

- **SVG-based** - all rendering is done with SVG elements, no canvas or DOM-heavy approaches
- **Immutable data operations** - tree manipulation functions in `utils/tree-ops.ts` always return new objects
- **Zero runtime dependencies** - the only peer dependency is React itself
- **Theme-aware** - all colors flow through the theme system in `utils/theme.ts`

## Style Guide

### TypeScript

- Use explicit types for function parameters and return values at module boundaries
- Prefer `interface` over `type` for object shapes
- Use `type` for unions and utility types

### React

- Use function components exclusively
- Extract reusable logic into custom hooks
- Keep components focused - if a component grows beyond ~200 lines, consider splitting it
- Use `useCallback` and `useMemo` where reference stability matters for child components

### CSS

- Use BEM-like naming with the `mindmap-` prefix (e.g., `mindmap-node-animated`)
- Prefer inline styles for theme-dependent colors
- Use CSS classes for structural layout and animations

### Commits

- Use clear, concise commit messages
- Start with a verb in the imperative mood (e.g., "Add dark mode support", "Fix node flicker on edit")

## Releasing

Releases are managed by maintainers. The library is published to npm as `@xiangfa/mindmap`.

## Getting Help

- Open a [GitHub issue](https://github.com/u14app/mindmap/issues) for bugs and feature requests
- Start a [GitHub Discussion](https://github.com/u14app/mindmap/discussions) for questions and ideas

---

Thank you for contributing!

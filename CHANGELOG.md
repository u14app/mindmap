# Changelog

## Unreleased

### Fixed

- The built-in OpenAI-compatible AI adapter now rejects explicitly incomplete, filtered, unsupported, malformed, and empty JSON/SSE results before a generation can commit. Failed previews roll back without adding history or clearing prompts and attachments; cancellation and external edits retain transaction ownership protections.
- AI errors use safe localized UI messages and a typed `MindMapAIError` with `incomplete`, `content_filter`, `invalid_response`, and `provider_error` codes. Controlled host handling can inspect `finishReason` and `cause` through the existing `onError(error)` callback.
- Updated the existing boundary verifier's outdated `0.9.0` version assertion to the current package version, `1.0.0`; the package version itself is unchanged.

### Added

- Optional `completionPolicy: 'strict' | 'legacy'` and content-free `onCompletion` metadata diagnostics, exported from `@xiangfa/mindmap/features/ai` with the error and completion types. New integrations should select `strict`; `legacy` remains the default and explicitly reports missing completion reasons as unverified `unknown`. Both modes reject explicit failure. No deprecation date is scheduled.
- Mock-only provider, transaction, and browser regressions for failed and successful completion, cancellation, external editing, safe UI feedback, and attachment retention. Custom string/stream generators and document formats retain their existing contracts; custom generators must throw on incomplete output. No automatic retry or continuation is introduced.

## 0.9.0

Open MindMap 0.9.0 is a breaking interface release that reorganizes the package around one TypeScript Document Runtime.

### Added

- Headless `core` entry for parsing, serialization, layout, patches, controller snapshots, Markdown streams, Extensions, and standalone SVG rendering.
- Explicit `static`, `viewer`, and `editor` runtime entries with matching stylesheets.
- Optional Feature entries for history, search, import, export, Markdown editing, and AI generation.
- Optional Extension entries for syntax and render contributions that keep namespaced attributes outside the core Node shape.
- Astro documentation and Playground structure for the modular package entries.
- Shared admission limits for Documents, derived render records, patch batches, image resolution, and raw SVG rasterization.
- Explicit `remoteImagePolicy` support on core projections and React surfaces; remote HTTP(S) images are denied by default.

### Changed

- The root `MindMap` contract maps to the v0.9 editor runtime.
- Read-only surfaces use `MindMapViewer`; static surfaces use `StaticMindMap`.
- Document state, derived Projection state, and Viewport state have separate ownership.
- Public examples use package exports instead of private source paths.
- React and ReactDOM remain peer dependencies. KaTeX remains optional for LaTeX support.
- Public traversal, projection, export, and resolver boundaries validate input before side effects; external controllers reject conflicting content Props synchronously.
- Inline tokenization and sibling identity reconciliation use bounded linear scans, while large diffs fall back to one validated Document replacement.

### Removed

- `legacy-viewer`, `cognitive`, `cognitive/react`, and cognitive fallback stylesheet exports.
- The duplicate JavaScript runtime and fallback implementation from the formal package graph.

### Compatibility

This release may require import, stylesheet, Props, and ref updates. See [MIGRATION-v0.9.md](MIGRATION-v0.9.md). Existing syntax and editing capabilities remain release requirements; the evidence and verification state for each capability is tracked in [docs/refactor-v0.9.0-requirements.md](docs/refactor-v0.9.0-requirements.md).

### Verification note

The release record does not claim a passing build, E2E run, visual run, or benchmark until those checks are rerun against the integrated repository. The requirements document records pending and blocked checks separately.

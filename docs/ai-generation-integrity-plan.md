# AI generation integrity — MM-P1-001

Source: `Open MindMap 产品优化PRD 2026-11-05.docx`, reviewed 2026-11-06.

## Scope and decisions

- Fix the built-in OpenAI-compatible adapter for JSON and SSE responses. Explicit `length`, `content_filter`, and unsupported completion reasons must never become successful generations.
- Keep `MindMapAIGenerator`'s string / async iterable signature and `onError(error)` intact. Custom generators remain responsible for throwing when their output is incomplete.
- Adopt the PRD's patch-compatible recommendation: `completionPolicy: 'legacy'` remains the default; recommend explicit `'strict'` for new integrations. Both reject explicit failure. Strict requires a normal `stop`; legacy tolerates a missing completion reason and exposes an optional completion diagnostic.
- Reuse transaction ownership, rollback, cancellation, and single-step history. Never restore an old snapshot over an external edit.
- Preserve prompts and attachments after failure, cancellation, or superseded work; clear them only after an owned successful commit. Map structured errors to safe localized messages.
- Do not change document formats, credentials, model limits, provider selection, or styling. Do not automatically retry or continue a response.
- Preserve the 11 pre-existing modified files. No commits, pushes, PRs, publishing, or production provider calls.

## Todo checklist

- [x] Read the PRD; inventory and back up pre-existing changes.
- [x] Fetch `origin/main` and fast-forward-check local main (`1d0ce317ce204cfddb11fcdc492d9ac589a50793`, already current).
- [x] Phase 1: fix completion/error/configuration contracts and demonstrate the four original failures with regression tests.
- [x] Phase 2: implement response validation, safe UI messages, and A1–A8 transaction/compatibility tests.
- [x] Phase 3: verify browser interactions, full regression, library/site build, lint, package/public exports, and boundary checks.
- [x] Record final evidence and compatibility/release notes; stop all task-started processes and preview services.
- [x] Follow-up: explicitly load Node types in the app configuration and rerun the original standalone type check, unit tests, build, and lint.

## Phase 1 — Contract and reproductions

Deliverables: additive AI-feature exports for typed errors and completion policy/diagnostics; four SSE/JSON × length/content-filter regression cases; lifecycle review.

Acceptance: tests fail on the old adapter because an incomplete response completes normally; defaults and custom-generator responsibilities are explicit. No package version or persistence migration is required.

## Phase 2 — Adapter and interface

Deliverables: bounded, incremental SSE parsing; JSON and SSE completion validation; typed failures; reader/abort cleanup; safe English/Chinese interface feedback; transaction regression coverage.

Acceptance matrix:

| ID | Evidence required |
| --- | --- |
| A1 | Four explicit-failure cases preserve document, selection, and existing history; prompt/attachments remain. |
| A2 | Normal JSON/SSE `stop` commits once; undo restores the original document. |
| A3 | Cancellation ends busy state; late fragments cannot commit; inputs remain. |
| A4 | External edits survive late success, error, and cleanup. |
| A5 | HTTP/provider/protocol failures have typed codes and roll back previews. |
| A6 | Empty/missing bodies, whitespace, and unsupported reasons never report success. |
| A7 | Missing completion reasons fail in strict mode and remain explicitly unverified in legacy mode, for EOF and `[DONE]`. |
| A8 | Existing custom string/stream generators, errors, and cancellation remain compatible. |

Risks: incomplete previews before the terminal event; split UTF-8/CRLF/event boundaries; malformed payloads; asynchronous abort/ownership races; older compatible endpoints without completion metadata. Use simulated responses without keys or real attachments and test final controller/history state independently of UI alerts.

## Phase 3 — Integration and release readiness

Deliverables: deterministic browser coverage of A1/A2/A3 with mock provider responses; bilingual migration guidance; release notes and recorded validation results.

Checks: focused tests per increment, full Vitest, `npm run build`, site type checks, ESLint including `npx eslint . --quiet`, package/boundary/clean-source verification, and Playwright. Review the pre-existing boundary-version assertion separately and record an explicit resolution without introducing size gates. Browser fixtures must not reach real AI endpoints.

Exit: all implementation and local verification complete; task-started services stopped. Publication, real-provider verification, release approval/sign-off, commits, pushes, and PRs are outside this authorized local delivery.

## Completed evidence

See [the verification report](ai-generation-integrity-verification.md) for the A1–A8 acceptance map, 294 passing unit tests, 35 passing browser tests, build/package/boundary/clean-source results, compatibility and rollback guidance, and explicit validation limits. The pre-existing theme palette required aligning one old browser assertion; theme source files remained unchanged. The follow-up app configuration fix explicitly loads Node test types, and the original standalone type-check command now passes without overrides. Unit tests, build, and lint also passed again.

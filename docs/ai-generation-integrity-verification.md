# MM-P1-001 — local development and verification

Date: 2026-11-06 (Asia/Shanghai). Source: `Open MindMap 产品优化PRD 2026-11-05.docx`.

## Implementation and compatibility

Implementation covers AI response integrity, its acceptance coverage, and the requested follow-up app Node-type configuration fix. Local `main` was fetched and checked against `origin/main`: both point to `1d0ce317ce204cfddb11fcdc492d9ac589a50793`. The 11 files modified before this task were backed up outside the repository and remain byte-for-byte unchanged.

The built-in OpenAI-compatible adapter now checks the selected choice's completion reason for JSON and SSE. `length` throws `MindMapAIError` with code `incomplete`; `content_filter` uses `content_filter`; unsupported reasons, malformed/empty responses, and unverified strict completions use `invalid_response`; HTTP, transport, and provider errors use `provider_error`. JSON validates before yielding content. SSE can preview but cannot finish successfully after a terminal failure. Readers and abort listeners are released on completion, error, cancellation, and early iterator return.

The optional `completionPolicy` follows the PRD's recommended compatibility decision: default `legacy` preserves existing missing-reason behavior, while new integrations should explicitly select `strict`. Both modes reject explicit failures. `onCompletion` exposes only completion metadata (`status`, `finishReason`, `responseType`); `unknown` remains explicitly unverified. The default is not silently changed and no deprecation date is promised. README examples, Chinese README, site configuration docs, and unreleased changelog describe this decision and migration.

The error class and completion types are additive exports of `@xiangfa/mindmap/features/ai`; generator return types and `onError(error)` remain compatible. New localization keys are optional so existing full `MindMapMessages` objects continue to type-check. Raw provider details stay in `cause` for controlled host use and never become built-in UI text. No automatic retries, continuation, provider requests, credential changes, persistence migrations, or model-limit changes were added.

Existing controller ownership was retained after independent review. Failure and cancellation dispose only their owned preview, restore selection, and preserve prior undo/redo history. External edits invalidate the old operation, so neither late chunks nor old cleanup can restore an obsolete document. Successful generation commits once; only that successful owned commit clears prompts/attachments. The existing custom-generator responsibility for completeness is documented.

## Incremental evidence

1. Before implementation, exactly four new provider regressions failed: SSE/JSON × `length`/`content_filter` resolved normally instead of rejecting. Seven original tests passed. This established the reported defect against the existing adapter.
2. The repaired provider suite passes 46 tests, covering completion policy, typed errors, selected-choice handling, split UTF-8, LF/CRLF/CR framing, multiline data, trailing events, usage frames, malformed response values, empty bodies, transport failure, cancellation, and cleanup.
3. Combined provider, generation, and feature-ownership verification passes 66 tests. Generation regressions assert actual document equality, selected node, preserved pre-existing undo/redo, visible-preview rollback, one-step successful undo, cancellation with late fragments, and external edits followed by late success/failure.
4. Independent read-only review found no actionable correctness issues in the integrated adapter, UI, ownership, and acceptance coverage.

## Acceptance map

| PRD | Executable evidence |
| --- | --- |
| A1 | Four provider failures plus generation document/selection/history tests; bilingual browser tests assert prompt/attachment retention separately from errors. |
| A2 | JSON/SSE `stop` tests assert exact content, one commit, and one undo restoring the original document. |
| A3 | Visible-preview cancellation with a noncooperative late generator fragment; browser Stop and late-packet rejection. |
| A4 | External edit after a preview followed by late success and failure; browser external takeover. |
| A5 | Typed HTTP, provider, transport, invalid JSON/SSE tests; generator error rollback and safe provider-error browser feedback. |
| A6 | Empty, null, missing body, whitespace, unsupported reason, invalid values, and invalid UTF-8 tests; test runners catch unhandled errors. |
| A7 | Missing reason at EOF, `[DONE]`, and JSON under both modes; both modes reject all explicit failures; browser strict/legacy behavior. |
| A8 | Existing custom string/stream generator and feature-ownership tests plus visible-preview error/cancel/external-edit regressions. |

The new browser fixture imports built public package entries, includes the real AI Feature and history controls, and uses only synthetic local responses and a synthetic text attachment. It is served by a test-only Vite server, not by a new public site route. The existing Playground uses a separate plain-text adapter, so its old AI tests alone would not establish the P1 fix.

## Project checks

| Command | Result |
| --- | --- |
| `pnpm test` | Passed: 31 files, 294 tests. |
| `npm run build` | Passed: ESM/CJS, declarations, manifest/styles, and 10 Astro pages. |
| `pnpm --dir site check` | Passed: 23 files, zero errors/warnings/hints. |
| `pnpm exec tsc -p tests/e2e/tsconfig.json` | Passed: browser specs and fixture public API imports. |
| `npx eslint . --quiet` | Passed after placing the error class re-export in the public entry rather than the React Feature module. |
| `pnpm verify:boundaries` | Passed. The existing release-version pin was corrected from stale `0.9.0` to actual `1.0.0`; package version and other checks are unchanged. |
| `pnpm verify:pack` | Passed: 289 files / 67 export targets, ESM/CJS, declarations, styles, and packed links. |
| `pnpm verify:clean-source` | Passed: frozen install, library build, site check, and site build in a temporary source copy; temporary checkout removed. |
| `pnpm exec playwright test --reporter=line` | Passed: all 35 Chromium browser tests, including 15 new built-in-adapter cases. |
| Direct ESM/CJS AI-feature imports | Passed: error class construction and generator exports resolve in both formats. |
| `pnpm exec tsc -p tsconfig.app.json --noEmit` | Passed after the follow-up configuration fix: application and unit-test source, without command-line type overrides. |

No output-size or build budget gates were added. The build emits normal size information only.

Browser setup initially lacked the matching Playwright Chromium executable; the matching Chromium/headless shell was installed. The next full run passed all 15 new AI cases and 19 original site cases, with one existing site-theme expectation failing: it still expected `#171a23`, while the pre-task changes to `siteTheme.ts` intentionally set `#1a1a2e`. The old expectation was updated to the existing palette, preserving the theme code. A complete rerun then passed 35/35. Playwright stopped its Astro/Vite servers and browser workers; final port inspection found no listeners on 4321 or 4322. No Docker images or containers were created.

The follow-up request on 2026-11-06 resolved the standalone app type-check failure. Before the fix, the original command reproduced four errors: missing declarations for `node:fs/promises` and `node:url` in the included site-contract tests, and two resulting unknown-value errors. `tsconfig.app.json` now explicitly loads `["vite/client", "node"]`; `@types/node` was already installed. The original command passes without `--types` overrides. Strict compiler settings, test coverage, library declaration settings, dependencies, and runtime code remain unchanged.

Follow-up verification reran the standalone app type check, all 294 unit tests, `npm run build` (library and site), `npx eslint . --quiet`, the 23-file Astro check (zero errors/warnings/hints), and browser-spec/fixture type checking; all passed. The existing 35-test browser result and package/clean-source results above are from the initial delivery; this type-only follow-up does not claim those checks were rerun.

## Boundaries and release handoff

No real provider, production key, production attachment, or deployed environment was used. The repository does not identify a supported-provider capability inventory or supply samples for actual compatible services omitting `finish_reason`; strict-mode adoption must be checked against each host proxy. No cross-browser, production, or real-provider verification is claimed.

Local development and integration evidence do not substitute for a maintainer's package-release signature. No package publication, deployment, commit, push, or PR was performed. To release, review the explicit legacy default and public AI exports, confirm host capability samples, and obtain release-owner sign-off through the normal release process.

If a release is rolled back, disable the affected built-in AI entry or restore the prior package version with a clear warning and undo access. Do not rewrite saved documents, revive ended sessions, automatically retry requests, or hide the old version's incomplete-output risk. Logs should record safe codes, response types, and optional correlation identifiers; provider causes, raw reasons, prompts, map contents, attachments, and keys require controlled handling and should not enter ordinary logs.

Three bounded subagents assisted: Astra implemented and tested provider parsing; Sol reviewed transaction ownership and final correctness read-only; Terra inspected package, boundary, and release-check requirements read-only. The primary agent owned planning, UI/localization, public exports, transaction regressions, browser coverage, docs, integration, and project validation.

Protocol references checked during development: [OpenAI Chat Completions reference](https://developers.openai.com/api/reference/resources/chat) for finish reasons, and [MDN SSE format](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format) for UTF-8, line boundaries, comments, and multiline data. Provider completeness classification does not establish semantic correctness of the generated Markdown.

# Memory — Resume Extraction ENOENT Fix + OpenRouter Docs Sync

Last updated: 2026-08-04

## What was built

- **`app/api/resume/extract/route.ts` fixed** — "Extract from Resume" returned 500 `ENOENT: no such file or directory, open 'D:\career\jobapp\[project]\node_modules\pdfjs-dist\legacy\build\pdf.worker.min.mjs [app-route] (ecmascript)'` from `readFileSync` inside `ensureWorker()`. Turbopack statically rewrote `createRequire(import.meta.url).resolve("pdfjs-dist/legacy/build/pdf.worker.min.mjs")` into the literal virtual module ID (confirmed in the compiled dev chunk: `const workerFile = "[project]/node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs [app-route] (ecmascript)";`). Fix: dropped `createRequire`/`require.resolve` and build the path at request time with `join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.min.mjs")` — a dynamic path Turbopack cannot statically rewrite. `PDFParse.setWorker(base64 data URL)` still runs once per process, lazily (a top-level fs read would still throw EBADF during build-time page-data collection).
- **Docs synced to OpenRouter** — replaced the remaining GPT-4o references in current-state docs: `context/architecture.md`, `context/project-overview.md`, `context/code-standards.md`, `context/library-docs.md` (added pdf-parse "Worker setup" section documenting the `[project]` ENOENT gotcha), `context/build-plan.md`. `context/progress-tracker.md` gained a decision entry for the worker ENOENT fix; its historical GPT-4o-era entries were left as-is.

## Decisions made

- **Rule: never resolve runtime-read files via `require.resolve("...")` in server code** — Turbopack rewrites any statically-analyzable resolve into virtual `[project]` paths (verified in both dev and prod chunks). Build the path from `process.cwd()` at runtime instead.
- **OpenRouter remains the AI provider** (prior session): all model calls route through `lib/ai.ts` (`AI_MODEL` default `google/gemma-4-26b-a4b-it:free`, `AI_BASE_URL` default `https://openrouter.ai/api/v1`); Stagehand uses `openai/${AI_MODEL}` + `openaiEndpointFormat: "chat"`. Docs now reflect this consistently.

## Problems solved

- Resume extraction 500 ENOENT — root cause was Turbopack's virtual `[project]` module path, not a missing file (the worker file exists on disk). Fixed via runtime path construction.
- Verified: unauthenticated `POST /api/resume/extract` now returns 401 (worker configured OK, then auth gate) instead of 500. tsc + eslint clean.

## Current state

- Working tree: 7 modified files, nothing committed — `app/api/resume/extract/route.ts` (the fix) + 6 context docs. Dev server on :3000 serves the fixed route.
- **Still open from Feature 13:** browser extraction inside company research FAILS with `Validation failed` at `page.goto` (agent/research.ts:267); research degrades to job+profile-only synthesis (200 + dossier, but `sources` has no URLs). Diagnostic route `app/api/debug/stagehand-diag/route.ts` written and UNTESTED. Two temp debug routes exist (`app/api/debug/research-test/route.ts`, `app/api/debug/stagehand-diag/route.ts`) — delete before commit.
- InsForge backend `allowedRedirectUrls: []` (Feature 02 OAuth callback whitelist unconfirmed); search results not deduped (open since Feature 11).

## Next session starts with

Debug the Feature 13 browser extraction: run `POST /api/debug/stagehand-diag` and read the full `Validation failed` stack at `page.goto`. Likely suspects: Stagehand's a11y-snapshot-at-navigation calling the model through the AI-SDK openai provider and getting output the schema rejects, or the `openaiEndpointFormat`/model combo needs adjusting (try omitting `openaiEndpointFormat` → Responses API, or a different free model). Fix so extraction completes, re-run the full research test confirming `sources` contains real URLs, delete both `app/api/debug/*` routes, verify the live UI flow (scored job → Research Company → dossier + idempotency + `company_researched` PostHog event), then start Feature 14 — Dashboard Page Full UI.

## Open questions

- Root cause of `Validation failed` at `page.goto` — in progress.
- `allowedRedirectUrls` empty on InsForge backend — OAuth callback may need whitelisting before production login works.
- Search result dedupe (Feature 11).
- Browserbase free-plan single-session limit may matter if concurrent research is added.

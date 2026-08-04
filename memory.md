# Memory — Feature 13: Company Research Agent

Last updated: 2026-08-04

## What was built

- **`lib/browserbase.ts`** (new) — `createBrowserbase()` client factory; throws if `BROWSERBASE_API_KEY` missing.
- **`lib/stagehand.ts`** (new) — `createStagehand(sessionId)` — Stagehand v3 init with `env: "BROWSERBASE"`, `browserbaseSessionID`, `model: { modelName: "gpt-4o", apiKey }`, `disablePino`.
- **`agent/research.ts`** (new) — `researchCompany(job, profile) → CompanyDossier` (9-field): derive homepage URL (follow `source_url` redirects → TLD-aware subdomain strip, fallback `https://www.{company}.com`), one Browserbase session + Stagehand homepage extract, up to 3 prioritized internal sub-pages, GPT-4o synthesis. Every browser step try/catch'd — failure degrades to synthesis, never an empty dossier. Session released via `REQUEST_RELEASE` if Stagehand never initialized.
- **`app/api/agent/research/route.ts`** (new) — POST `{ jobId }`, auth, job+profile load, idempotency guard (returns existing dossier), scoped `update({ company_research })`, `company_researched` PostHog event (`.catch`ed), `revalidatePath`.
- **`components/job-details/ResearchCompanyButton.tsx`** (new, client) — POST + `router.refresh()`, `useTransition` spinner, `ErrorBanner`. **`CompanyResearch.tsx`** and `app/find-jobs/[id]/page.tsx` now thread `jobId`.
- **Deps installed:** `@browserbasehq/sdk@2.16.0`, `@browserbasehq/stagehand@3.7.1`, `zod@4.4.3` (all pre-approved in code-standards).
- **Docs:** `progress-tracker.md` (13 checked + decisions incl. post-review fixes), `ui-registry.md` (CompanyResearch updated + ResearchCompanyButton entry, via /imprint), `library-docs.md` Stagehand section rewritten for v3.

## Decisions made

- **Stagehand 3.7.1 is a major API break from v2** — v2 `extract({ instruction, schema })` / `act({ action })` / `activePage()` are gone. Real v3 API: `extract(instruction, schema, { timeout })`, `act(string)`, `context.pages()[0]`, `page.goto(url, { waitUntil, timeoutMs })`, `close()`. `library-docs.md` is now the authority — don't copy v2 examples from training data.
- **Homepage URL derivation:** follow the Adzuna redirect and strip the subdomain (`jobs.stripe.com` → `stripe.com`); `COMPOUND_TLDS` set handles `co.uk`/`com.au` style; only `http:`/`https:` URLs are fetched.
- **Graceful degradation is the invariant:** browser failure (missing creds, DNS, timeout, extract error) → GPT-4o synthesizes from company name + job description + profile only. The route 500s only on hard failures (DB, OpenAI, JSON parse).
- **Navigation robustness:** `goto(waitUntil: "load")` then best-effort `networkidle` wait in its own try/catch — slow sites no longer kill the step.
- **No `maxDuration` on the research route** — the browser runs on Browserbase, not the Next.js server.

## Problems solved

- Stagehand v3 types inspected from `node_modules/@browserbasehq/stagehand/dist/esm` before writing code (constructor options, `context.pages()`, `LoadState`, session release). Don't trust training-data Stagehand examples.
- `sessions.update(id, { status: "REQUEST_RELEASE" })` is how you end a Browserbase session in SDK v2.16.0 (there is no `sessions.end`).
- SSRF / TLD edge cases in homepage derivation fixed during review.
- PostHog failure could 500 a successful research — now `.catch`ed.

## Current state

- tsc, eslint, `next build` all clean (re-verified after review fixes). `/api/agent/research` registered as dynamic route.
- **Known broken / blocked:** `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` are NOT in `.env.local` — in-browser research returns a clean 500 until keys are added. OpenAI was returning HTTP 429 (scoring + research end-to-end untested in browser). Search results not deduped (open since Feature 11).
- Everything in this feature is uncommitted (working tree).

## Next session starts with

Add `BROWSERBASE_API_KEY` + `BROWSERBASE_PROJECT_ID` to `.env.local`, then verify Feature 13 live: load a scored job → click Research Company → confirm dossier renders after `router.refresh()` and re-appears on revisit (idempotency guard). If OpenAI is healthy, also confirm `company_researched` PostHog event. Then start Feature 14 — Dashboard Page Full UI (per build-plan).

## Open questions

- None blocking. Browserbase free-plan session limits (single session) may need handling if concurrent research is later allowed.

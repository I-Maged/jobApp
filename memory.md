# Memory — Feature 17 Analytics Charts PostHog Data

Last updated: 2026-08-05

## What was built

- **`lib/posthog-server.ts`** — new `runPostHogQuery(name, query)`: `POST {POSTHOG_QUERY_HOST}/api/projects/{POSTHOG_PROJECT_ID}/query/` with `Authorization: Bearer {POSTHOG_PERSONAL_API_KEY}` and body `{ query: { kind: "HogQLQuery", query }, name }`. Plain `fetch` + `AbortSignal.timeout(10_000)`, `cache: "no-store"`. No-ops → `[]` (dev warning) when the key or project id env vars are unset; `[posthog-server]` logs on HTTP/throw failures.
- **`lib/dashboard-data.ts`** — `getMockCharts()` + mock `buildDaySeries` deleted. New `fetchDashboardCharts(userId)` with three parallel per-user HogQL queries: `job_found` 30-day daily series, `company_researched` 7-day daily series, `job_found` `matchScore` distribution in the five fixed buckets. Series zero-filled to UTC calendar days with `M/D` labels (`buildCountSeries`); distribution maps SQL bucket keys → `MATCH_BUCKETS` (`buildMatchDistribution`). The SQL `CASE` is **generated from `MATCH_BUCKETS`** (`buildMatchDistributionQuery`) so keys can't drift. Non-UUID `userId` short-circuits with `[dashboard-data]` warning (also the injection guard).
- **`app/dashboard/page.tsx`** — the three data fetches now run in parallel via `Promise.all`; `fetchDashboardCharts(user.id)` replaces `getMockCharts()`.
- **`components/dashboard/AnalyticsCharts.tsx`** — Match Score Distribution subtitle changed to "Saved jobs scoring 50%+".
- **Docs:** `.env.example` + `code-standards.md` env table add `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_QUERY_HOST`; `progress-tracker.md` marks Feature 17 done (build plan 17/17) + decision entry incl. post-review fixes; `ui-registry.md` pattern notes updated.

## Decisions made

- **Charts use the existing hand-rolled SVG components — no recharts** (user decision). The build-plan's recharts line is superseded; no new dependency added.
- **Server-side PostHog queries go through the Query API, not `posthog-node`** — no new dep, plain fetch, personal API key with `query:read` scope. `POSTHOG_QUERY_HOST` defaults to `https://eu.posthog.com` (the app host — NOT the `eu.i.posthog.com` ingestion host).
- **Per-user 60s TTL memo + in-flight dedup** (`chartCache`/`chartInFlight` maps) so overlapping loads fire one query burst, not 3 uncached queries per render — PostHog `/query` is rate-limited (240 req/min, 3 concurrent, shared per project). Empty results from failures are cached too (bounded stale-empty to 60s).
- **Match distribution excludes sub-50 scores** (`properties.matchScore >= 50`); subtitle updated to match. `MATCH_BUCKETS` is the single source for both SQL CASE and TS labels.
- **UTC days everywhere**: SQL windows use `toStartOfDay(now()) - INTERVAL 29 DAY` / `6 DAY` — aligned to the calendar-day fill (review fix; the rolling `now() - INTERVAL 30 DAY` window dropped the oldest partial day). PostHog's `toStartOfDay` uses the project timezone; EU cluster is UTC.

## Problems solved

- PostHog Query API auth/response shape: personal key (`Bearer`) + `HogQLQuery` kind; response `results` is an array of rows (arrays). Confirmed against docs — no `posthog-node` needed.
- No PostHog MCP server exists in this session — user opted to put a personal API key in `.env.local` instead. Key has NOT been added yet; charts render empty until it is.
- Window misalignment bug (rolling vs calendar days) caught by `@review` and fixed.

## Current state

- Build plan complete: 17/17. Verified `npx.cmd tsc --noEmit`, `npx.cmd eslint .`, and full `npm run build` all clean (build was last run after the review fixes).
- Uncommitted working tree: Feature 17 changes (6 files: `app/dashboard/page.tsx`, `lib/dashboard-data.ts`, `lib/posthog-server.ts`, `components/dashboard/AnalyticsCharts.tsx`, `context/code-standards.md`, `context/progress-tracker.md`; `context/ui-registry.md` — check `git status`). Features 14–16 already committed (`3562a53` recent activity real data).
- Live chart values need `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` in `.env.local` plus real `job_found` / `company_researched` events.
- Feature 13 leftover: Stagehand `Validation failed` at `page.goto` (`agent/research.ts:267`) — research degrades to job+profile-only synthesis; diagnostic routes `app/api/debug/stagehand-diag` and `app/api/debug/research-test` exist, UNTESTED, and must be deleted before the Feature 13 commit.
- InsForge `allowedRedirectUrls` is still empty; `.env.local` uses `npx.cmd` (not `npx`) due to the PowerShell execution-policy block on `.ps1` shims.

## Next session starts with

Decide and commit: the working tree holds Feature 17 (plus the earlier dashboard work). Before committing — either fix/remove the Feature 13 Stagehand diagnostics, or commit Feature 17 separately first. Verify the git status and split the commits sensibly.

## Open questions

- Will the user paste `POSTHOG_PERSONAL_API_KEY` / `POSTHOG_PROJECT_ID` into `.env.local`? Charts stay empty until then.
- Search-dedupe question (from Feature 10) still unresolved.
- Feature 13 Stagehand: fix, remove, or keep degraded? The debug routes must go before that commit.

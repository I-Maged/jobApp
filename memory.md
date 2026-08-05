# Memory — Feature 16 Recent Activity Real Data

Last updated: 2026-08-05

## What was built

- **`lib/dashboard-data.ts`** — `getMockActivity()` deleted, replaced with async `fetchRecentActivity(userId)`: two parallel (`Promise.all`) scoped queries — `agent_runs` completed runs (`id, job_title_searched, jobs_found, started_at`, ordered desc, limit 8) and `jobs` where `company_research IS NOT NULL` (`id, company, found_at`, ordered desc, limit 8). Entries merged, sorted desc by **raw** timestamp, sliced to `ACTIVITY_LIMIT = 8` before formatting. Run rows → `Found X jobs for [jobTitle]` (kind `job_search`), research rows → `Researched [company]` (kind `company_research`); ids prefixed `run-`/`job-` to avoid key collisions. New module-private `formatTimeAgo` (Just now < 1 min, `Nm ago`, `Nh ago`, Yesterday, `N days ago`, then `Month D` fallback; `Date.parse` NaN → Just now).
- **`app/dashboard/page.tsx`** — `const activity = user ? await fetchRecentActivity(user.id) : []` replaces `getMockActivity()`.
- **Docs:** `progress-tracker.md` marks Feature 16 done (next = 17) + decision entry; `ui-registry.md` Phase 5 intro + RecentActivity pattern notes updated.

## Decisions made

- **`RecentActivity.tsx` needed zero changes** — `kind` maps 1:1 to the existing dot pairs (job_search = success green, company_research = info blue).
- **`found_at` is the proxy for research time** (no `researched_at` column exists — same decision as Feature 15's Companies Researched trend). Research activity shows the job's found time, not research time.
- **Sort before format**: sorting happens on raw ISO timestamps, then `formatTimeAgo` strings are applied — sorting the formatted "2h ago" strings would be wrong.
- **Error policy matches the dashboard:** query failures log `[dashboard-data]` and degrade to `[]` (card renders empty, page never crashes); a partial result still renders.

## Problems solved

- None new this session. Existing gotcha still applies: `npx` `.ps1` shim is blocked by the PowerShell execution policy — use `npx.cmd tsc --noEmit` / `npx.cmd eslint .`.

## Current state

- Feature 16 complete and verified: `npx.cmd tsc --noEmit` + `npx.cmd eslint .` clean (build not re-run; last full `npm run build` was Feature 14 and was clean). Live activity entries need an authenticated session with completed `agent_runs` / researched `jobs` in the DB. `getMockCharts()` untouched.
- Working tree has uncommitted Features 14 + 15 + 16 files and the two context docs (nothing committed).
- **Feature 13 leftovers still open (untouched, per plan):** browser extraction fails with `Validation failed` at `page.goto` (`agent/research.ts:267`) — research degrades to job+profile-only synthesis with no `sources`. Diagnostic route `app/api/debug/stagehand-diag` is written but UNTESTED, plus `app/api/debug/research-test`. Both debug routes must be deleted before the Feature 13 commit.
- InsForge `allowedRedirectUrls` still empty; search dedupe question still open.

## Next session starts with

**Feature 17 — Analytics Charts: PostHog Data.** Replace `getMockCharts()` in `lib/dashboard-data.ts` with real PostHog queries for current user. Per build-plan: Jobs Found Over Time (job_found events, distinctId = userId, last 30 days, by day), Match Score Distribution (job_found matchScore property → 50-60/60-70/70-80/80-90/90-100 ranges), Company Research Activity (company_researched events, last 7 days, by day). Charts render with recharts per build-plan — but NOTE: the current chart components (`LineChart`, `BarChart`, `ChartCard`, `ChartEmptyState`) are hand-rolled SVG, not recharts; reconcile this before adding a dependency (existing components already satisfy the UI). Empty state shown per chart when no data exists.

**Open item first:** the server-side PostHog query needs a PostHog personal/query API key — flag/confirm with the user before building (memory open question from Feature 15; `lib/posthog-server.ts` no-ops when env vars are unset). Also the `fetchDashboardStats`/`fetchRecentActivity` precedent: real data functions live in `lib/dashboard-data.ts` and log `[dashboard-data]` on error, degrading to empty values.

## Open questions

- Feature 13 Stagehand `Validation failed` root cause — stagehand-diag route still needs to be run.
- Feature 17 needs a server-side PostHog query API key (not confirmed provisioned) — confirm with user before starting; also decide recharts vs existing hand-rolled SVG charts.
- InsForge `allowedRedirectUrls` still empty; search-result dedupe still open.

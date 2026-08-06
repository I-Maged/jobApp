# Memory — Whole-Project Code Review Fixes (In Progress)

Last updated: 2026-08-06

## What was built

Full-project review (all 23 commits on `main`, 134 files) → 23 findings (2 critical, 9 warnings, 12 suggestions). Plan written to `.kilo/plans/1785979227684-code-review-fixes.md`. User approved "fix everything". Fix groups applied so far:

- **Group 1 (done):** Deleted `app/api/debug/research-test/route.ts` and `app/api/debug/stagehand-diag/route.ts` (unauthenticated, cost-abuse + stack-trace leak).
- **Group 2 (done):** SSRF guard in `agent/research.ts` — `isPrivateIp`/`isBlockedHost` (uses `node:dns/promises` `lookup` + IP literal checks) and `isSafeHttpUrl`; applied pre-fetch, post-redirect in `deriveHomepageUrl`, and to the derived homepage URL before `page.goto`.
- **Group 3 (done):** `proxy.ts` now cookie-presence check only (no `getCurrentUser()` call); `lib/get-current-user.ts` wrapped in try/catch → returns `null` instead of throwing.
- **Group 4 (done):** `app/api/agent/research/route.ts` — `export const maxDuration = 300`, `withDeadline(researchCompany, 4min)` helper. `app/api/agent/find/route.ts` — dedupes job inserts against existing `source_url`s (fetches `select("source_url")`, filters, returns early with 0 when all dupes).
- **Group 5 (partial):** `lib/posthog-server.ts` gained constants `EVENT_JOB_FOUND`, `EVENT_COMPANY_RESEARCHED`, `EVENT_PROFILE_COMPLETED`, `PROP_MATCH_SCORE`. `lib/jobs-data.ts` `fetchUserJobs` selects list columns + `.limit(500)` (`MAX_JOBS_LIST`, `JOBS_LIST_COLUMNS`). `lib/dashboard-data.ts` — `MAX_STATS_ROWS = 500` bound on `fetchDashboardStats` (order desc + limit), `buildMatchDistributionQuery` now has `timestamp >= toStartOfDay(now()) - INTERVAL 29 DAY` window, HogQL strings interpolate the PostHog constants.

## Decisions made

- Deleted debug routes rather than dev-gating them (matches earlier "delete before Feature 13 commit" note).
- SSRF guard uses DNS lookup + private-IP checks; unresolvable hostnames are treated as blocked.
- Find-route dedupe is app-level (filter by existing `source_url`) — DB unique index on `(user_id, source_url)` deferred (schema may already contain duplicates).
- `fetchDashboardStats` bounded with `.limit(500)` recent-first instead of a date window, to preserve all-time "Total Jobs Found" semantics.
- Plan says: no commit unless asked; update `context/progress-tracker.md` per AGENTS.md after each group.

## Problems solved

- Runtime error on dashboard: `MAX_STATS_ROWS is not defined` at `lib/dashboard-data.ts:103` (my edit referenced the constant before defining it) — fixed by adding the constant near `WEEK_MS`. Dashboard renders again.

## Current state

- Working tree has MANY uncommitted changes from the fix pass; app was verified loading the dashboard after the constant fix (that was the last verification).
- Done: Groups 1–4 complete; Group 5 partially complete.
- Not yet done: dashboard-data `chartCache` lazy eviction; `app/dashboard/page.tsx` fold `fetchProfile` into `Promise.all`; `FindJobsClient` dedupe/cap (`handleResults`); `jobs-view.ts` `formatDate` hoist; `agent/research.ts` sub-page parallelization; Group 6 (shared `resume-storage.ts`, `dossier.ts`, `auth-constants.ts`, replace inline `auth.getCurrentUser()` in upload/extract/profile action with `getCurrentUser()`, `JobsTablePreview` uses `getScoreTier`, drop redundant `?? "citizen"/"any"` in `app/profile/page.tsx`, use `EVENT_PROFILE_COMPLETED` in `actions/profile.ts`); Group 7 (delete `lib/insforge-client.ts` + update its context-doc references, remove unused `csvToArray`/`arrayToCsv` exports).
- Verification (`tsc`/`eslint`/`build`) NOT yet run after the fix pass.
- `context/progress-tracker.md` / `context/ui-registry.md` not yet updated.
- Nothing committed.

## Next session starts with

Finish the remaining fix groups in `D:\career\jobapp\.kilo\plans\1785979227684-code-review-fixes.md`: complete Group 5 (cache eviction, dashboard `Promise.all`, FindJobsClient cap, `formatDate` hoist, sub-page parallel crawl), then Group 6 and Group 7. Then run `npx.cmd tsc --noEmit`, `npx.cmd eslint .`, `npm run build`, update `context/progress-tracker.md`, and review the diff before any commit decision.

## Open questions

- Commit the fix pass or split into per-group commits? (User hasn't decided.)
- Add DB unique index `(user_id, source_url)` later via InsForge `run-raw-sql` once schema is known duplicate-free?
- Old open items still pending: PostHog keys not in `.env.local` (charts render empty), search-dedupe (Feature 10), InsForge `allowedRedirectUrls` empty.

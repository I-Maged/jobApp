# Memory — Feature 15 Stats Bar Real Data

Last updated: 2026-08-05

## What was built

- **`lib/dashboard-data.ts`** — `getMockStats()` deleted, replaced with async `fetchDashboardStats(userId)`: single `.select("match_score, company_research, found_at").eq("user_id", userId)` on `jobs`, all four cards computed in TS (Total Jobs Found = row count; Avg. Match Rate = rounded mean of non-null `match_score`; Companies Researched = `company_research IS NOT NULL` count; Jobs This Week = `found_at` in last 7 days). `StatCard.trend` is now optional. `getMockActivity()` / `getMockCharts()` untouched (Features 16–17). Module is now server-only; all client imports of it are `import type` (safe).
- **`components/dashboard/StatsBar.tsx`** — trend badge renders only when `stat.trend` is present.
- **`app/dashboard/page.tsx`** — `const stats = user ? await fetchDashboardStats(user.id) : []` replaces `getMockStats()`.
- **Docs:** `progress-tracker.md` marks Feature 15 done (next = 16) + decision entry; `ui-registry.md` Phase 5 intro and StatsBar entry updated.

## Decisions made

- **Trend badges are real (memory open question resolved).** Uniform rolling 7-day windows (this week = `[now-7d, now)`, last week = `[now-14d, now-7d)`): Total Jobs Found → `+N this week`; Companies Researched → `+N this week` (`found_at` is the proxy date — no `researched_at` column exists); Jobs This Week → `+N/-N vs last week`; Avg. Match Rate → `+N%/-N% vs last week`, badge omitted when either window has no scored jobs.
- **Avg. Match Rate shows `—` (not `0%`)** when no job has a `match_score` — a 0% average would falsely imply uniformly bad matches.
- **One select + TS compute instead of head-count queries** — personal job list is small; fewer round trips. Error path returns zero/`—` cards and logs `[dashboard-data]` (page renders, never crashes — same policy as `fetchUserJobs`).

## Problems solved

- `npx` `.ps1` shim is blocked by the PowerShell execution policy on this machine — use `npx.cmd tsc --noEmit` / `npx.cmd eslint .` instead.

## Current state

- Feature 15 complete and verified: `npx.cmd tsc --noEmit` + `npx.cmd eslint .` clean (build not re-run this session; last full `npm run build` was Feature 14 and was clean). Live stats need an authenticated session with jobs in the DB.
- Working tree has uncommitted Feature 14 + Feature 15 files and the two context docs (nothing committed).
- **Feature 13 leftovers still open (untouched, per plan):** browser extraction fails with `Validation failed` at `page.goto` (`agent/research.ts:267`) — research degrades to job+profile-only synthesis with no `sources`. Diagnostic route `app/api/debug/stagehand-diag` is written but UNTESTED, plus `app/api/debug/research-test`. Both debug routes must be deleted before the Feature 13 commit.
- InsForge `allowedRedirectUrls` still empty; search dedupe question still open.

## Next session starts with

**Feature 16 — Recent Activity: Real Data.** Replace `getMockActivity()` in `lib/dashboard-data.ts` with a real fetch (e.g. `fetchRecentActivity(userId)`). Per build-plan: query `agent_runs` for recent completed runs + `jobs` where `company_research` IS NOT NULL, merge and sort by created_at descending, take last 5–10, format "Found X jobs for [jobTitle] — [time ago]" (success dot pair) and "Researched [company] — [time ago]" (info dot pair). Note: `jobs` has no research timestamp — `found_at` (or the job's own created timestamp) is the proxy. Reuse the `ActivityItem` type (kind `job_search` | `company_research`) — zero component changes.

Do NOT touch the Feature 13 debug routes during Feature 16 — they get deleted as part of Feature 13's wrap-up (run `POST /api/debug/stagehand-diag` first, read the `page.goto` stack).

## Open questions

- Feature 13 Stagehand `Validation failed` root cause — stagehand-diag route still needs to be run.
- Feature 17 PostHog charts need a server-side PostHog query API key (not confirmed provisioned) — flag during Feature 16/17 planning.
- InsForge `allowedRedirectUrls` still empty; search-result dedupe still open.

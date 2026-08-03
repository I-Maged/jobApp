# Memory — Feature 11: Filter + Sort + Pagination wired to real DB data

Last updated: 2026-08-03

## What was built

- **`lib/jobs-view.ts`** (new) — pure client-safe helpers: `DisplayJob`, `MatchTier`, `SortKey`, `toDisplayJob(job)`, `filterAndSortJobs(jobs, { text, tier, sort })`. Text filter on company/title, High/Low tiers from `MATCH_THRESHOLD`, sorts score-desc / newest / oldest (compares `Date.getTime()`).
- **`lib/jobs-data.ts`** (new) — `fetchUserJobs(userId)` server helper: `jobs` scoped to `user_id`, ordered `found_at desc`; logs `[jobs-data]` and returns `[]` on error.
- **`lib/utils.ts`** — added `JOBS_PAGE_SIZE = 20`.
- **`app/find-jobs/page.tsx`** — now server-fetches `initialJobs` (all of the user's saved jobs) and passes them into `FindJobsClient`.
- **`components/find-jobs/FindJobsClient.tsx`** — now the container owning `jobs`, `filterText`, `matchTier`, `sortKey`, `page`. Derives filtered/sorted list via `useMemo`, slices by page, and passes presentation-only props down. Search results **merge** (`[...results, ...prev]`), page resets to 1 on any change.
- **`components/find-jobs/JobsTable.tsx`** — presentational: receives the page slice (`rows: DisplayJob[]`) + controlled filter/sort values/setters + `hasJobs`. `MOCK_JOBS` fallback deleted. Empty state differentiates "No jobs yet. Run a search…" vs "No jobs match your filters."
- **`components/find-jobs/JobsPagination.tsx`** — controlled (`page`/`pageSize`/`totalCount`/`onPageChange`); "Showing X to Y of Z results"; windowed page list (≤7 pages shown, else first/last/current±1 with `…`); returns `null` when `totalCount === 0`.
- **Docs updated:** `progress-tracker.md` (11 marked done, next = 12), `ui-registry.md` (FindJobsClient entry added; JobsTable/JobsPagination entries rewired), `ui-rules.md` + `ui-tokens.md` match-score tables reconciled to `MATCH_THRESHOLD`.

## Decisions made

- **List state lives in `FindJobsClient`** (not JobsTable) so the container knows the *filtered* total — the only correct place for pagination. JobsTable/JobsPagination are presentational.
- **"All Matches" = all of the user's saved jobs, loaded server-side at page load** (build-plan Feature 11 spec), not just the last search's 10 rows.
- **New search results merge (prepend) into the existing list** instead of replacing it — otherwise a new search clobbers the full collection. Re-running the same search still inserts duplicate DB rows (no dedupe anywhere — see open questions).
- **`JOBS_PAGE_SIZE = 20`** from build-plan/`project-overview` spec wins over the Feature 09 mock copy ("Showing 1 to 6 of 24 results" was design-mock text).
- **Match-score color boundaries now documented as derived from `MATCH_THRESHOLD`** (≥70 green, 60–69 blue, <60 orange) in both ui-rules.md and ui-tokens.md — resolves the last session's doc-reconciliation open question. Code was already on this.
- Adzuna source badge renders gray (`bg-surface-secondary text-text-secondary`), no new token added.

## Problems solved

- **Static pagination** ("Showing 1 to 6 of 24 results" hardcoded) → fully controlled by filtered totals.
- **`MOCK_JOBS` fallback before first search** → real DB data with a neutral empty state (open question from last session closed).
- **ui-rules.md (80/60) and ui-tokens.md (90/70/50) contradicted the code and each other** on match-score colors — both reconciled to the code's `MATCH_THRESHOLD`-derived rule.

## Current state

- `npx.cmd tsc --noEmit`, `npx.cmd eslint .`, and `npm.cmd run build` all pass. Dev smoke test: `/find-jobs` → 307 to `/login` (auth gate intact), `/api/agent/find` → clean `401 {"success":false,"error":"Not signed in"}`.
- Feature 11 is complete; Phase 3 is done. **Next feature: 12 Job Details Page — Full UI.**
- `/imprint` was not run this session — `ui-registry.md` was updated manually instead (FindJobsClient added, JobsTable/JobsPagination entries rewritten). Run `/imprint` in the next session if strict skill compliance is wanted.
- Scoring end-to-end still blocked by the OpenAI key HTTP 429 (unchanged since last session).

## Next session starts with

1. **Feature 12 — Job Details Page — Full UI** (`app/find-jobs/[id]/page.tsx` + `components/job-details/*`): back to Jobs link, job header (company/logo placeholder/title/match score badge/View Job Post), info cards (salary/location/job type/date found), AI Match Reasoning, Required Skills vs Your Profile (green/red badges), Job Description, Company Research card with empty state + Research Company button (wiring lands in 13), Apply Now → `external_apply_url` in new tab. Job data comes from the DB row (already populated by Phase 3); wire a `fetchJob` server helper (pattern: `lib/jobs-data.ts` + `fetchProfile`).
2. Resolve the **OpenAI 429** — still the operational blocker for live scoring verification.
3. With a working OpenAI key, run a real search and verify: live rows replace the empty state, banner counts are honest, pagination over multiple saved searches, 429 concurrency response.

## Open questions

- **Duplicate rows on re-search:** each Adzuna run inserts fresh `jobs` rows with new uuids, and the list now merges — re-searching the same title+location accumulates duplicate postings. Dedupe by `source_url` at insert time, or accept and let the user filter? (Not in feature 11 scope; flag before Feature 13.)
- Is the OpenAI 429 quota exhaustion, rate limit, or an invalid-key state? (Error body was empty.)
- Feature 12 will need the job-details page to handle a missing/invalid job id gracefully (404 path) — confirm the desired UX.

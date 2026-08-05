# Memory — Feature 14 Dashboard Page Full UI

Last updated: 2026-08-05

## What was built

- **`app/dashboard/page.tsx` created** — async Server Component, `metadata.title: "Dashboard"`, shell `mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-8 md:px-8 md:py-10`. Real incomplete-profile banner (only when `!completion.isComplete`) + `<StatsBar>`, `<RecentActivity>`, `<AnalyticsCharts>` with mock data. Route already existed in the `proxy.ts` auth gate — no new gate logic.
- **`components/dashboard/` (all Server Components):** `StatsBar.tsx`, `RecentActivity.tsx`, `ChartCard.tsx`, `LineChart.tsx`, `BarChart.tsx`, `AnalyticsCharts.tsx`, plus `ChartEmptyState.tsx` and `chart-layout.ts` (shared SVG geometry constants).
- **`lib/dashboard-data.ts` created** — `StatCard`, `ActivityItem`, `ChartPoint`, `DashboardCharts` types + `getMockStats()`, `getMockActivity()`, `getMockCharts()`. Components are prop-driven, so Features 15–17 replace the mock function bodies with real queries — zero component changes.
- **`app/profile/page.tsx` aligned** — its null-profile completion fallback now also seeds `Object.values(REQUIRED_LABELS)` instead of the misleading `["EMAIL"]`.
- **Docs:** `ui-registry.md` gained the "Phase 5 — Dashboard Components" section; `progress-tracker.md` marked Feature 14 done, Phase 5, next = Feature 15.

## Decisions made

- **Stat card set follows Feature 15's real-data spec** (Total Jobs Found / Avg. Match Rate / Companies Researched / Jobs This Week) — the design copy's "Cover Letters Generated" was dropped (out-of-scope feature that could never be wired). Trend badges are mock-only visuals; Feature 15 decides real computation.
- **"Company Research Activity" chart, not "Resume Tailoring Activity"** — same out-of-scope rationale; matches Feature 17's spec.
- **Hand-rolled SVG charts, no recharts** — recharts is not installed and not on the `code-standards.md` approved dependency list; design tokens map 1:1 to SVG. No new dependency, no client bundle.
- **Chart colors are CSS variables via inline `style`** — SVG `stroke`/`fill` presentation attributes don't resolve `var()`; also no dynamic Tailwind classes (Tailwind can't see runtime-constructed classes). `BarChart` takes `color` as a CSS var string (`var(--color-success)` / `var(--color-info)`).
- **Mock data module is the Feature 15–17 contract** — `jobsOverTime` models the real 30-day window (`buildDaySeries(30)`, `M/D` labels), research stays 7 days.
- **Activity palette maps to the two real event sources:** `job_search` → success dot pair (`bg-success-light`/`bg-success-alt`), `company_research` → info pair (`bg-info-light`/`bg-info`).

## Problems solved

- **SVG CSS vars:** `stroke`/`fill` as XML attributes ignore `var()`, so every token color is applied via `style={{ stroke: "var(--color-…)" }}` etc. (documented in ui-registry).
- **Gradient ids:** `useId()` returns colons (`:r0:`) which break `url(#…)` references — sanitize with `useId().replace(/:/g, "")`.
- **Label overlap (review fix):** `LineChart` renders every Nth x label when `data.length > 7` (`labelStep = ceil(n / 7)`) — Feature 17 feeds ~30 daily points.
- **Null-profile banner (review fix):** fallback `{ percent: 0, missing: ["EMAIL"] }` claimed a non-editable field was missing; now `missing: Object.values(REQUIRED_LABELS)`. Applied to both dashboard and profile pages.
- **Duplication (review fix):** chart empty state + geometry constants extracted into `ChartEmptyState.tsx` / `chart-layout.ts` (`CHART = { width: 600, height: 210, padX: 36, padBottom: 28 }`); empty-state height derives from `CHART.height` via inline style.

## Current state

- Feature 14 complete and verified: `npx tsc --noEmit`, `npx eslint .`, `npm run build` all clean; build lists `/dashboard` as dynamic (ƒ). Live render needs an authenticated session (proxy redirects logged-out users to `/login`).
- Working tree has uncommitted Feature 14 files + the two context docs (nothing committed).
- **Feature 13 leftovers still open:** browser extraction in company research still fails with `Validation failed` at `page.goto` (`agent/research.ts:267`) — research degrades to job+profile-only synthesis with no `sources` URLs. Diagnostic route `app/api/debug/stagehand-diag` and `app/api/debug/research-test` are written but the diag route is UNTESTED. Both debug routes must be deleted before the Feature 13 commit.
- InsForge `allowedRedirectUrls` is still empty; search dedupe question still open.

## Next session starts with

**Feature 15 — Stats Bar: Real Data.** Replace `getMockStats()` in `lib/dashboard-data.ts` with real queries against `jobs` (COUNT all = Total Jobs Found; AVG `match_score` = Avg. Match Rate; COUNT `company_research` IS NOT NULL = Companies Researched; COUNT `found_at` within last 7 days = Jobs This Week). Must decide what the trend badges show (mock-only now; schema has `found_at` so this-week-vs-last-week is computable, or drop trends).

Do NOT touch the Feature 13 debug routes during Feature 15 — they get deleted as part of Feature 13's wrap-up (run `POST /api/debug/stagehand-diag` first, read the `page.goto` stack).

## Open questions

- Feature 13 Stagehand `Validation failed` root cause — stagehand-diag route still needs to be run.
- Trend badges: real computation or removal, decided during Feature 15.
- Feature 17 PostHog charts need a server-side PostHog query API key (not confirmed provisioned) — flag during Feature 15/17 planning.

# Memory — Feature 09 Find Jobs Page — Full UI

Last updated: 2026-08-03

## What was built

### Feature 09 — Find Jobs Page — Full UI (static shell, no live logic)

- **`app/find-jobs/page.tsx`** — new Server Component page shell. `export const metadata: Metadata = { title: "Find Jobs" }`, page heading + subheading, renders `SearchControls`, `JobsTable`, `JobsPagination`, and a static "Jobs by Adzuna" credit link. Build output shows `/find-jobs` as static (○); auth gating is enforced by `proxy.ts` (its matcher covers `/find-jobs/:path*`).
- **`components/find-jobs/SearchControls.tsx`** — new Client Component. Search card with 3-col grid (`sm:grid-cols-[1fr_1fr_auto]`): Job Title input with embedded `lucide-react` Search icon, Location input, **disabled** Find Jobs button (`title="Find Jobs lands in Feature 10"`), and a static success banner ("Found 8 jobs and saved 4 strong matches.").
- **`components/find-jobs/JobsTable.tsx`** — new Client Component. Single surface card containing the filter bar (text filter input + two `<select>`: All/High/Low Match and Match Score/Newest/Oldest — all inert in 09) and a 6-column table (COMPANY, ROLE, MATCH SCORE, SALARY EST., SOURCE, DATE FOUND). Six mock rows span all three score bands (96/94/91/88 green, 72 blue, 58 orange) so every color path renders. Table wrapped in `overflow-x-auto`.
- **`components/find-jobs/JobsPagination.tsx`** — new Client Component. Static "Showing 1 to 6 of 24 results" plus Previous / 1 / 2 / 3 / Next cluster with `lucide-react` `ChevronLeft/Right`. Previous disabled (mock first page).
- **`app/globals.css`** — added two new `@theme` tokens: `--color-on-accent-tint: #5E4CFF` and `--color-on-success-tint: #007A55`.
- **`package.json`** — installed `lucide-react`. It had been listed as an approved dependency in `code-standards.md` since Phase 1 but was never actually installed.
- **Docs updated** — `context/progress-tracker.md` (09 checked off, phase flipped to 3, next is 10, new 09 decision block), `context/ui-registry.md` (new Phase 3 section with imprints for the three components), `context/ui-tokens.md` (new "Text on Tinted Backgrounds" section).

## Decisions made

- **Three components, no `JobFilters.tsx`.** The build plan sketched four (`SearchControls`, `JobsTable`, `JobFilters`, `JobsPagination`), but the filter bar is visually a strip at the top of the table card and has no shared state with `SearchControls`. It lives inside `JobsTable.tsx` as a bordered top strip.
- **`job_search_started` PostHog event NOT emitted from Feature 09.** The Find Jobs button is disabled placeholder UI; wiring the event lands in Feature 10 with the real Adzuna call so analytics stay clean of mock clicks.
- **Match score thresholds follow `ui-rules.md` (≥80 green, 60–79 blue, <60 orange), NOT `components/homepage/JobsTablePreview.tsx` (≥90 / 70–89 / <70).** The homepage preview was built in Feature 01 from the original design description and predates the clarification in the token docs. Known deviation, not a bug — token-level fix deferred.
- **Filter/sort/text-filter inputs are plain `<select defaultValue>` / `<input>` with no onChange.** Purely presentational in 09; Feature 11 owns the logic.
- **No row navigation / no `onClick`.** Clicking a job row does nothing in 09; Feature 12 owns the Link-out to `/find-jobs/[id]`.
- **Two new tint-companion tokens (`on-accent-tint`, `on-success-tint`) close a WCAG AA contrast gap.** `text-accent` (#7C5CFC) on `bg-accent-muted` (#FAF5FF), and `text-success` on `bg-success-lightest`, both fail WCAG AA. The rule is now documented: `*-foreground` tokens are only for filled dark/accent button surfaces; text on *light tinted* accent/success backgrounds uses `on-accent-tint` / `on-success-tint`. The Find Jobs success banner and highlighted current-page pagination button both follow this rule.
- **Mock dataset uses 6 rows + "Showing 1 to 6 of 24 results" copy.** Matches the Feature 09 build plan verbatim ("Showing 1 to 6 of 24 results", "Found 8 jobs and saved 4 strong matches").

## Problems solved

- **`import { Link } from "next/link"` failed tsc.** `next/link` in Next.js 16 has no named `Link` export — it's a default export. Fixed with `import Link from "next/link"` in `app/find-jobs/page.tsx`.
- **`npm` PowerShell script blocked by execution policy on this machine.** Use `npm.cmd` (and `npx.cmd`) in the shell tool — the `.ps1` shim is disabled.
- **Dev server smoke-tested `/find-jobs`** — route returned 200 through `proxy.ts`. Server stopped before ending the session.

## Current state

- **Works:** `/find-jobs` shell renders; `tsc --noEmit`, `npm run lint`, `npm run build` all clean. `/find-jobs` registered as a static route. `proxy.ts` auth gate confirmed redirecting unauthenticated hits.
- **Not yet wired (by design):** Find Jobs button (Feature 10), filter/sort/pagination state (Feature 11), row click → details page navigation (Feature 12). Success banner is a static mock.
- **Uncommitted:** four new/changed source files (`app/find-jobs/page.tsx`, `components/find-jobs/SearchControls.tsx`, `components/find-jobs/JobsTable.tsx`, `components/find-jobs/JobsPagination.tsx`, `app/globals.css`, `package.json`/`package-lock.json`) plus the docs (`context/progress-tracker.md`, `context/ui-registry.md`, `context/ui-tokens.md`). Prior sessions' Feature 07/08 changes were also uncommitted — check `git status` for the combined working-tree state.
- **Carried over from prior sessions (still open):** the live round-trip verification for Feature 07 (`/api/resume/extract`) and Feature 08 (`/api/resume/generate`) against a real authenticated profile has never been done in a browser. PDF multi-page overflow is unverified. `library-docs.md` InsForge section still has the outdated legacy `client.from(...)` pattern flagged in Feature 06.

## Next session starts with

**Feature 10 — Adzuna Job Discovery** (Phase 3, per build-plan.md). Run `/architect` before building. Scope: build `agent/adzuna.ts` and `agent/matcher.ts`, wire `app/api/agent/find/route.ts` (POST, `getCurrentUser()` auth), enable the Find Jobs button in `SearchControls.tsx`, and emit `job_search_started` + `job_found` PostHog events. The UI shell for displaying results is already in place from Feature 09 — Feature 10 swaps the mock rows for real data.

## Open questions

- **Live round-trip confirmation for Features 07 and 08** — neither the extract nor the generate route has been confirmed working end-to-end against a real signed-in profile/PDF (carried over, still open).
- **PDF visual QA for the generated resume** — a long profile could overflow one A4 page; `@react-pdf/renderer` does not auto-flow text to a second page without explicit layout handling (carried over, still open).
- **`library-docs.md` InsForge section** still has the outdated `client.from(...)` legacy pattern flagged in Feature 06 — deferred doc refresh (carried over, still open).
- **Adzuna API credentials** must be present in `.env.local` (`ADZUNA_APP_ID`, `ADZUNA_APP_KEY`) before Feature 10 can be exercised end-to-end. Verify with the user before starting Feature 10.
- **Country detection for Adzuna** — build-plan defaults to `'us'` and supports `gb`/`au`/`ca`; the Feature 09 UI has no country picker, so Feature 10 needs to decide whether country inference is part of the first pass or a follow-up.

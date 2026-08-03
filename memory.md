# Memory — Feature 12: Job Details Page — Full UI

Last updated: 2026-08-04

## What was built

- **`app/find-jobs/[id]/page.tsx`** (new) — async Server Component job details page. Awaits `params` (Next 16), `getCurrentUser()` → `fetchJob(id, user.id)` → `notFound()` if null. Composes Back to Jobs link + JobInfo/MatchScore/JobDescription/CompanyResearch in a `flex flex-col gap-6` shell.
- **`app/find-jobs/[id]/not-found.tsx`** (new) — segment 404: Back to Jobs link + "Job not found" card + Go to Find Jobs CTA.
- **`lib/jobs-data.ts`** — added `fetchJob(jobId, userId)` (`.eq("id", jobId).eq("user_id", userId).maybeSingle()`, returns `Job | null`, logs `[jobs-data]` on error).
- **`lib/jobs-view.ts`** — added `formatDate(isoDate)` (hoisted from JobsTable, shared) and `getScoreTier(score): "high" | "mid" | "low"` + `ScoreTier` type (single `>= 70 / >= 60` boundary definition, from `MATCH_THRESHOLD`).
- **`components/job-details/`** (new, 4 files) — `JobInfo.tsx` (header: gradient logo placeholder with company initial, title, company · location, match badge, View Job Post secondary + Apply Now primary anchors; 4 info cards: Salary Est. / Location / Job Type / Date Found), `MatchScore.tsx` (AI Match Reasoning + Matched/Missing Skills badge groups), `JobDescription.tsx` (about_role + Responsibilities/Requirements/Nice to Have/Benefits bullets + About the Company), `CompanyResearch.tsx` (full 9-field dossier render when `company_research` present, else centered empty state with disabled Research Company button).
- **`components/ui/BulletList.tsx`** (new) — shared bullet-list primitive (extracted from duplicate sub-components during review).
- **`components/find-jobs/JobsTable.tsx`** — rows now navigate to `/find-jobs/[id]` (full-row `onClick` + `useRouter`, company cell is a real `<Link>` with `stopPropagation`); score colors use shared `getScoreTier`; `formatDate` imported from jobs-view.
- **Docs updated:** `progress-tracker.md` (12 marked done, next = 13, review-fixes note added), `ui-registry.md` (Phase 4 entries + `BulletList` primitive + `FindJobsClient` entry that was previously missing + JobsTable row-nav note), `/imprint` run.

## Decisions made

- **Details page is a Server Component fetching directly from InsForge** — no client state, no API route. `fetchJob` is always user-scoped (`.eq("user_id", userId)`); a single 404 for both "no such job" and "not your job" avoids leaking existence.
- **Apply Now → `external_apply_url` (fallback `source_url`); View Job Post → `source_url`.** Both `target="_blank" rel="noopener noreferrer"`. Adzuna rows set both to `redirect_url`, so they only diverge for future URL-imported jobs.
- **Company logo placeholder uses the brand gradient** (inline `linear-gradient(45deg, #7C5CFC 0%, #4A2EC5 100%)`, same as `Logo`) — the only accepted inline-style exception in the codebase.
- **Score-tier boundaries centralized in `getScoreTier`** (jobs-view): JobInfo badge + JobsTable text/bar colors all map tier → class maps. Do NOT reintroduce inline `>= MATCH_THRESHOLD / >= 60` comparisons.
- **Composite React keys** (`${value}-${index}`) on all LLM/Adzuna-sourced list renders — matched/missing skills are stored verbatim from LLM output with no dedup (`agent/matcher.ts` `asStringArray` filters type only), so `key={value}` can collide.
- **Match badge colors:** `bg-success-lightest text-on-success-tint` (≥70) / `bg-info-lightest text-info-foreground` (60–69) / `bg-warning text-warning-foreground` (<60). Missing-skill badges: `bg-accent-muted text-on-accent-tint` (NOT `text-accent` — WCAG-AA, same as JobsPagination).
- **job_type display maps Adzuna `contract_type` values** (`permanent`/`fulltime` → Full-time, `part_time`/`parttime` → Part-time, `temporary` → Temporary, `internship` → Internship, `contract` → Contract; raw value as last-resort).
- **`CompanyResearch` renders the full dossier when data exists** (Overview/Why This Role paragraphs, Tech Stack tags, Culture/Your Edge/Gaps/Smart Questions/Interview Prep bullets, Sources as links) — Feature 13 just wires the button + data flow.

## Problems solved

- **Next.js 16 dynamic route**: `params` is a `Promise` — must `await params` in the page. `notFound()` renders the segment-level `not-found.tsx`. Confirmed via `node_modules/next/dist/docs/`.
- **memory.md drift caught**: it claimed "FindJobsClient entry added" to ui-registry.md but the entry was missing — added during `/imprint`.
- **Adzuna job_type values rendered raw** ("permanent" showed as lowercase) — fixed by mapping real `contract_type` values.
- **`job.company` can be NULL** in the DB schema (type says non-null) — `company.trim()` crash guarded with `job.company || "Unknown company"`.
- **Duplicate key risk on skill badges** — LLM output repeats values; composite keys now used everywhere relevant.
- **Score-tier logic existed in 3 copies** (JobsTable ×2 + JobInfo) with hardcoded 60 — consolidated into `getScoreTier`.

## Current state

- Feature 12 complete: tsc, eslint, build all clean. `/find-jobs/[id]` → 307 `/login` when unauthenticated (auth gate verified via curl). Phase 4 done, next = 13.
- **Still blocked (unchanged from previous session):** OpenAI key returns HTTP 429 — scoring end-to-end and the details page render with real DB rows are untested in a live browser session. Company research dossier never populated yet (Feature 13).
- Search results are NOT deduped — re-searching the same title+location accumulates duplicate rows (open since Feature 11, noted in registry).

## Next session starts with

Feature 13 — Company Research Agent. Per `context/build-plan.md`: wire the "Research Company" button in `CompanyResearch.tsx` (remove `disabled` + `title` placeholder) → `POST /api/agent/research` → `agent/research.ts` (Browserbase + Stagehand) → write `company_research` jsonb (fields already typed in `CompanyResearch.asDossier`: companyOverview, techStack, culture, whyThisRole, yourEdge, gapsToAddress, smartQuestions, interviewPrep, sources). Read `library-docs.md` for Browserbase/Stagehand patterns first. Then update progress-tracker + run /imprint.

## Open questions

- OpenAI 429 — needs a working key before the scoring→details end-to-end can be verified in-browser.
- Search-result dedup: decide whether duplicate rows from repeated searches are acceptable or should be deduped (id-based) at insert time.
- `max-w-360` (profile page) vs `max-w-[1440px]` (everywhere else) — same value, left untouched.

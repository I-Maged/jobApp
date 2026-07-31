# Memory — Feature 04 Database Schema

Last updated: 2026-07-31

## What was built (this session)

Feature 04 Database Schema. All work was infrastructure (InsForge DB + storage) plus two doc edits — no app code was touched.

### InsForge infrastructure created

- **`public.profiles`** — 24 columns per `architecture.md`. PK `id uuid REFERENCES auth.users(id) ON DELETE CASCADE`. CHECK constraints on `experience_level`, `remote_preference`, `cover_letter_tone`, `work_authorization`. `is_complete boolean NOT NULL DEFAULT false`. `created_at` / `updated_at` default `now()`. Index `idx_profiles_updated_at`. RLS `profiles_owner_all` (`id = auth.uid()`).
- **`public.agent_runs`** — 8 columns. FK to `profiles` cascade. CHECK on `status IN ('running','completed','failed')`. Indexes `idx_agent_runs_user_id`, `idx_agent_runs_user_recent`. RLS `agent_runs_owner_all`.
- **`public.jobs`** — 23 columns. FK to `profiles` cascade. FK to `agent_runs` SET NULL on delete (URL-imported jobs have no run). CHECK on `source IN ('search','url')`, `job_type`, `match_score 0..100`. `company_research jsonb`. Indexes `idx_jobs_user_id`, `idx_jobs_user_found`, `idx_jobs_user_score`, `idx_jobs_run_id`. RLS `jobs_owner_all`.
- **`public.agent_logs`** — 7 columns. FK to `profiles` cascade, FK to `agent_runs` cascade, FK to `jobs` set-null. CHECK on `level IN ('info','success','warning','error')`. Indexes `idx_agent_logs_run_id`, `idx_agent_logs_user_recent`. RLS `agent_logs_owner_all`.
- **`storage.objects` RLS** — enabled; `storage_resumes_owner_all` policy gates by `bucket='resumes'` AND `key LIKE 'resumes/' || auth.uid() || '/%'` AND `uploaded_by = auth.uid()`.
- **`resumes` storage bucket** — created via `insforge_create-bucket` (public-by-default; access gated entirely by storage RLS).

### Docs edited

- **`context/progress-tracker.md`** — Feature 04 marked complete under "Phase 1 — Foundation". Status block: "Last completed: 04 Database Schema", "Next: 05 Profile Page — Full UI". New "04 Database Schema" decisions section (11 decisions).
- **`context/architecture.md`** — new "Row Level Security" subsection inserted between "InsForge Storage" and "Authentication". Table of policy name / predicate per table, plus the storage policy. Notes that `auth.uid()` is `SELECT nullif(auth.jwt() ->> 'sub', '')::uuid` and that the `resumes` bucket is public at the API layer but locked down by `storage_resumes_owner_all`.

## What was kept from prior sessions

- InsForge SDK instances in `lib/insforge-client.ts` and `lib/insforge-server.ts` — used as-is, no changes needed since the SDK treats `user_id` as a regular column.
- All 9 context files unchanged in shape. Only the two listed above edited.
- Nothing in `app/`, `agent/`, `actions/`, `components/`, `lib/`, `types/`, or `proxy.ts` was modified.

## Decisions made

- **Single RLS policy per table** (`<table>_owner_all`), `FOR ALL TO authenticated` with both `USING` and `WITH CHECK` set to the same predicate. One mental model: `user_id = auth.uid()`. `profiles` uses `id = auth.uid()` because its PK is the user id. Storage RLS independently uses `uploaded_by = auth.uid()` AND key prefix.
- **`auth.uid()` is a real helper on InsForge.** Confirmed definition: `SELECT nullif(auth.jwt() ->> 'sub', '')::uuid`. JWT `sub` claim is set on every authenticated request, so the predicate works under the SDK's `createServerClient`.
- **Cascade rules:** `profiles.id ← auth.users` cascade. `agent_runs.user_id`, `jobs.user_id`, `agent_logs.user_id` cascade (owner removed → their rows gone). `jobs.run_id` set null (URL-imported jobs have no run; deleting a run should not delete jobs the user already saved). `agent_logs.run_id` cascade (logs meaningless without run). `agent_logs.job_id` set null (job can be deleted without losing run-tied logs).
- **All enums implemented as `text CHECK` constraints** — PostgREST surfaces them as `text` to the TS SDK; DB rejects bad values. No Postgres `CREATE TYPE` used.
- **FK-scoped composite indexes for hot read paths:** `(user_id, found_at DESC)` and `(user_id, match_score DESC NULLS LAST)` on `jobs`, `(user_id, started_at DESC)` on `agent_runs`, `(user_id, created_at DESC)` on `agent_logs`, `(updated_at DESC)` on `profiles`.
- **`resumes` bucket is public at the API layer** because the MCP tool has no `isPublic: false` flag. Closed the gap at the DB level — `storage_resumes_owner_all` is the only thing that matters for access.
- **No DB-level validation on `company_research` shape.** Flexible dossier (9 fields, mixed scalars + arrays). Validation lives in agent code at the place that synthesizes the dossier.
- **jsonb typing for `work_experience` / `education` is done at code boundaries** in handlers that read them (Feature 06 `actions/profile.ts` save; Feature 10 `agent/matcher.ts` read). Cast from `unknown` to a typed shape at the top of each handler.
- **`is_complete` defaults to `false`.** Feature 06's `actions/profile.ts` will recompute it on save based on the required-field set from `build-plan.md` Feature 06.
- **`storage_resumes_owner_all` is the only storage policy.** Any new buckets added in later features need their own policy.
- **`pgcrypto` is pre-installed** on this InsForge instance — `gen_random_uuid()` works out of the box; no extension setup needed.

## Problems solved

- **`resumes` bucket could not be created private.** The `insforge_create-bucket` tool always sets `public: true`. Solved by enabling RLS on `storage.objects` and adding a key-prefix + `uploaded_by` predicate so that even though the bucket's flag is public, the row-level filter blocks every read or write outside `resumes/{auth.uid()}/`. Verified via `pg_class.relrowsecurity = true` on `storage.objects`.
- **Open question resolved: InsForge exposes `auth.uid()` and `auth.jwt()`.** Verified by `SELECT n.nspname, p.proname, pg_get_functiondef(p.oid)` — both functions exist in the `auth` schema. The `auth.users` table also exists (10 columns, `id uuid PK`) so `profiles.id REFERENCES auth.users(id)` is the correct FK target.
- **Open question resolved: PostgREST-style RLS works via `auth.uid() = auth.jwt() ->> 'sub'`.** No special InsForge predicate needed — the standard Supabase/PostgREST pattern applies. `FOR ALL TO authenticated` policy with `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())` is sufficient.

## Current state

Working:
- All four tables exist on InsForge with full columns, FKs, indexes, RLS enabled, and owner-only policies attached
- `storage.objects` has RLS enabled and a per-prefix owner-only policy
- `resumes` bucket exists and is locked down by the storage policy
- `npm run lint`, `npx tsc --noEmit`, `npm run build` all clean. Build output unchanged: `○ /`, `○ /_not-found`, `ƒ /callback`, `○ /login`, `ƒ Proxy (Middleware)`

Deferred until later features (intentional, by design):
- `actions/profile.ts` save logic (Feature 06) — will use the new tables
- `agent/matcher.ts` and `app/api/agent/find/route.ts` (Feature 10) — will read/write `jobs`
- `agent/research.ts` (Feature 13) — will write `jobs.company_research`
- Profile page UI (Feature 05)
- Live exercise of RLS by a real authenticated request — confirmed via metadata + SQL inspection only; no browser round-trip this session

Not yet covered (deferred to other features, by design):
- Storage policies for additional buckets that later features may add
- jsonb insert-time validation on `company_research` (rejected — keep validation in agent code)
- Wire-up of `job_search_started`, `job_found`, `profile_completed`, `company_researched` PostHog events (still awaiting features 06 / 10 / 13)

## Next session starts with

**Feature 05 Profile Page — Full UI.**

Before implementing:
1. Read `context/build-plan.md` Feature 05 block (already in context, no need to re-fetch).
2. Decide whether to model the form sections as a single Client Component or split per section — depends on how big the form gets in real Tailwind. Lean toward a single `components/profile/ProfileForm.tsx` Client Component with internal section components, since shadcn primitives handle most of the layout.
3. Confirm profile-banner "needs attention" requirements: percent ring, missing-field tags. Build placeholder logic only — real completion calc comes in Feature 06.
4. Confirm whether `ResumeUpload.tsx` and `CompletionIndicator.tsx` from `architecture.md` are owned by Feature 05 or split across 05/06/07/08. Lean toward building UI shells for all three this pass; wiring + save logic lands in 06/07/08.

Implementation order:
1. `components/profile/ProfileForm.tsx` (Client Component) — all form fields grouped per `build-plan.md` Feature 05 list, validated client-side only (no DB write this session).
2. `components/profile/ResumeUpload.tsx` — drag-and-drop area, file picker fallback, "Extract from Resume" + "Generate Resume from Profile" buttons. Buttons disabled with tooltips this pass (real logic lands in 07/08).
3. `components/profile/CompletionIndicator.tsx` — completion ring + missing-field tags. Mock completion percent.
4. `app/profile/page.tsx` — assemble the three components, server-fetches nothing this pass (data wiring belongs to 06).
5. Update `context/ui-registry.md` with the three new components + exact classes from `ui-tokens.md` / `ui-rules.md`.
6. Update `context/progress-tracker.md` with the Feature 05 completion + decisions.

After 05 lands, Feature 06 wires `actions/profile.ts` against the schema just created. `is_complete` computation and resume upload to `resumes/{user_id}/resume.pdf` via `lib/insforge-server.ts`.

## Open questions

- **Whether `extract from resume` uses the same `app/api/resume/extract/route.ts` shape** as `architecture.md`. `build-plan.md` Feature 07 doesn't reference it explicitly but the architecture does. Should land with Feature 07 unless Feature 05 needs the route skeleton earlier.
- **Whether `ProfileForm` should pre-fill email from session even before 06.** Email is server-known and the form could show it greyed-out as `architecture.md` describes. Low risk to wire in Feature 05 via a Server Component read of `auth.getUser()` — defer unless it stops being an empty-state field awkwardly.
- **Profile banner colour rules** — `ui-rules.md` doesn't specify the incomplete-profile banner. Need to pick a token (probably `bg-accent-muted` / `text-accent` to match the BottomCTA precedent) when building the banner in Feature 05.
- **Date picker UI for work experience** — `architecture.md` profile fields include "Start Date, End Date" as text. Confirm during Feature 05 whether they stay as `<input type="month">` or text only.
- **`posthog-setup-report.md` followup items still open.** "Runtime delivery and attribution remain unresolved" and "Server-side attribution remains unresolved". Reopen when the first real PostHog dashboard query is needed (Feature 17).
- **InsForge PostgREST typability for jsonb.** Code boundaries that cast `unknown` to typed shapes arrive at Feature 06. If the SDK offers a generic `T extends Json` shape, prefer that. Decide when first handler touches the cast — no schema-side change needed.

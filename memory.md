# Memory — Feature 05 Profile Page — Full UI

Last updated: 2026-08-01

## What was built

### Feature 05 Profile Page — Full UI (and follow-ups)

- **`components/profile/ProfileForm.tsx`** — single Client Component, five sections: Personal Info (full name, locked email, phone, location, LinkedIn, portfolio, work authorization), Professional Info (current title, experience level, years, skills + industries tag inputs), Work Experience (up to 3 role cards with add/remove + "currently working here" checkbox), Education (degree/field/institution/year), Job Preferences (titles seeking, remote preference, salary, locations). Save and Extract buttons disabled with tooltips naming the future feature numbers.
- **`components/profile/ResumeUpload.tsx`** — section card with drag-and-drop `<label>` (hidden `<input type="file">` inside), filename chip, Select Resume button, Generate Resume from Profile CTA in a secondary tile (disabled tooltip).
- **`components/profile/CompletionIndicator.tsx`** — inline-SVG ring (72px, stroke 6) with `stroke-accent` fill and animated dashoffset, percent label centered, missing-field tags rendered with `bg-accent-muted text-accent` token. Props: `percent`, `missingLabels`.
- **`app/profile/page.tsx`** — async Server Component, calls `getCurrentUser()` server-side, passes `initialEmail` + `initialFullName` to `<ProfileForm />`. Header card with "Profile needs attention" + `<CompletionIndicator />`. Hardcoded 70% completion with PHONE / LOCATION / EDUCATION flagged.
- **`app/layout.tsx`** — added `<Navbar />` to the root layout (was missing — feature 01 shipped `<Navbar />` but it was only locally imported by `app/page.tsx`).
- **`app/page.tsx`** — removed local `<Navbar />` import (now rendered by root layout, was duplicated).
- **`app/(auth)/callback/route.ts:17`** — post-OAuth redirect changed from `/dashboard` to `/profile` (dashboard page does not exist yet).

### Docs edited

- **`context/ui-registry.md`** — appended "Phase 2 — Profile Components (imprinted 2026-08-01)" section with three full entries (`CompletionIndicator`, `ResumeUpload`, `ProfileForm`) plus an inline `ProfileBanner` note. Each entry has the token class table + pattern notes. Filename: `D:\career\jobapp\context\ui-registry.md`.
- **`context/progress-tracker.md`** — Phase 2 status block updated; "Last completed: 05 Profile Page — Full UI", "Next: 06 Profile Save Logic"; checkbox marked; new "05 Profile Page — Full UI" decisions section added (12 items).

## Decisions made

- **Single `ProfileForm.tsx` Client Component for all five sections** rather than per-section files. Form state in one place so Feature 06's save action has cross-section visibility. Internal sub-components `SectionCard`, `Field`, `TagInputField`, `WorkRoleCard` keep JSX readable.
- **`CompletionIndicator` and `ResumeUpload` are independent components**, no shared state with the form. Banner can render before form is loaded; Feature 06 can swap form to a Server Action without touching banner.
- **Missing-field tags use `bg-accent-muted text-accent`** — the design text said "red", but the design system has no red token for this purpose and `AGENTS.md` forbids raw color classes. Closest "highlight that draws attention" pair is the missing-skill badge token.
- **Email pre-filled from `getCurrentUser()` in Feature 05** (resolved open question from prior memory). Disabled input uses `cursor-not-allowed bg-surface-secondary text-text-secondary`. Phase 2 of Profile: server fetches and passes down.
- **Work experience capped at 3 roles.** `Add role` disabled when at cap. "Currently working here" checkbox clears and disables End Date input. Start/End Date use `type="month"` (resolved prior open question).
- **Industries chip color**: `bg-info-lightest text-info-foreground` to differentiate the optional field from required skills — same chip shape, no new color token.
- **Save / Extract / Generate buttons disabled with tooltips pointing at future feature numbers** (06 / 07 / 08). Form fills freely; clicks do nothing yet.
- **`app/profile/page.tsx` is an async Server Component**, server-fetches `getCurrentUser()`, no DB writes this pass, no `revalidatePath`. Auth gate is the existing `proxy.ts`.
- **Navbar now lives in `app/layout.tsx` (root layout), not on individual pages.** Reverted per-page placement from Feature 01. Single source of truth — any new page gets the nav automatically. `AuthLayout` (`app/(auth)/layout.tsx`) keeps its own centered logo for `/login` + `/callback` (no nav/footer per ui-registry.md pattern).
- **`/callback` redirects to `/profile` post-auth** until dashboard lands. One-line swap when Feature 14 ships.
- **Resume upload area is a `<label>` wrapping a hidden `<input type="file">`.** Click anywhere opens picker. Drag/drop populates filename chip only — actual upload is Feature 06.
- **No `ResumePreview.tsx` in 05** — useless without a saved PDF. Skip for now; add later without registry disruption.

## Problems solved

- **Server Component -> Client Component prop crossing** (`Event handlers cannot be passed to Client Component props` on `<ProfileForm onExtract=...>`). Removed the `onExtract` prop entirely from `ProfileForm` — button is disabled with tooltip, callback was dead code. Updated page to not pass it.
- **Duplicate Navbar on homepage.** Root layout now renders `<Navbar />`; the local import in `app/page.tsx` was removed so it doesn't double-render.
- **ESLint unused-`hasResume` warning on `ResumeUpload`.** Used the prop as `hasResume` first, then `_props`, both flagged by `@typescript-eslint/no-unused-vars`. Final fix: drop the prop signature and accept no props at all — `hasResume` will re-appear in Feature 06 when the file actually consumes it.

## Current state

Working:
- `/profile` page renders end-to-end with the banner, ring (70%), missing-field tags, all five form sections, disabled extract/generate/save buttons.
- Navbar appears exactly once on `/`, `/profile`, and any new page (rendered by `app/layout.tsx`).
- Active-tab highlighting works — Profile tab shows `text-accent` on `/profile`, Dashboard/Find Jobs show `text-text-dark`.
- `/callback` redirects authed users to `/profile`.
- `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean. Build output: `○ /`, `○ /_not-found`, `ƒ /callback`, `○ /login`, `ƒ /profile`, `ƒ Proxy (Middleware)`.

Deferred (intentional, by design):
- `actions/profile.ts` (Feature 06) — wires Save button, computes `is_complete`, uploads resume to `resumes/{user_id}/resume.pdf`.
- `extractFromResume` flow (Feature 07) — landing in `app/api/resume/extract/route.ts` per architecture.
- `generateResumePdf` flow (Feature 08) — landing in `app/api/resume/generate/route.ts`.
- `/dashboard` page (Feature 14); `/callback` currently redirects to `/profile` instead.
- `ResumePreview.tsx` (deferred — useless without saved PDF).

Not yet verified (deferred to later features, by design):
- RLS exercised by a real authenticated browser round-trip.
- PostHog events `job_search_started`, `job_found`, `profile_completed`, `company_researched` (still awaiting features 06 / 10 / 13).

## Next session starts with

**Feature 06 Profile Save Logic.**

Before implementing:
1. Read `context/build-plan.md` Feature 06 block (already in context).
2. Decide whether the form should be split (Server Component with form `<form action={...}>` + Client Component for stateful bits) or stay as one Client Component calling a Server Action via `useTransition`. Lean: keep the one-component shape — it stays simple since all fields are already in client state.
3. Confirm `actions/profile.ts` Server Action signature — single `saveProfile(formData)` vs per-section actions. Lean: single action, accepts typed `ProfileFormData` payload. Cast `work_experience` / `education` from `unknown` at the boundary (per memory decision 04).
4. Decide required-field set for `is_complete` (Personal Info name+phone+location, Professional Info title+level+years+1 skill, Education degree+field, Preferences titles+remote preference). Count and wire.

Implementation order:
1. `actions/profile.ts` — `saveProfile(data)` Server Action. Validates fields, computes `is_complete`, casts jsonb at boundary, upserts `profiles` row (PK = `user.id`), `revalidatePath('/profile')`. Return `{ success, error? }` per `code-standards.md`.
2. `lib/completion.ts` — pure helper `calculateCompletion(profile): { percent: number; missing: string[] }`. Pure function, easy to unit test mentally. Used by page server-render + Server Action.
3. `app/profile/page.tsx` — read profile from `profiles` table via `createInsforgeServer()`, pass real `initialEmail`/`initialFullName`/etc. to `<ProfileForm />`. Read raw `work_experience` / `education` jsonb, cast to typed shapes. Wire banner's `percent` + `missing` to real values.
4. `components/profile/ProfileForm.tsx` — accept `initialProfile` prop instead of just email/fullName. Replace local `useState` defaults with props. Wire Save button -> Server Action via `useTransition`.
5. `components/profile/ResumeUpload.tsx` — re-add `hasResume` prop. Wire drop zone to a new `actions/profile/uploadResume.ts` (or route handler) that pushes the PDF to `resumes/{user_id}/resume.pdf` via `insforge.storage.from('resumes').upload(..., { upsert: true })`. After upload, set `resume_pdf_url` on profile row.
6. Wire `profile_completed` PostHog event from `actions/profile.ts` — fire only on the first save where `is_complete` flips from `false` to `true`. Per `code-standards.md` events table.
7. Update `context/ui-registry.md` with revised `ProfileForm` (now accepts `initialProfile`) + `ResumeUpload` (with `hasResume` prop).
8. Update `context/progress-tracker.md` with Feature 06 completion + decisions.
9. Verify: `npx tsc --noEmit && npm run lint && npm run build`.

After 06 lands, Feature 07 wires the Extract button to `app/api/resume/extract/route.ts`. Feature 08 wires Generate Resume to `app/api/resume/generate/route.ts`.

## Open questions

- **Whether to factor `ProfileForm` to a Server Component + Client Component pair, or keep as one Client Component.** Feature 06 can land with the current shape (`useState` everywhere + Server Action via `useTransition`). Refactor later only if RSC streaming/SEO matters. Lean: defer the split.
- **Whether `ResumePreview.tsx` belongs in 06.** Architecture lists it for the profile page. Could land as a thin "View current resume" link that opens `resume_pdf_url` in a new tab — no PDF preview component needed. Decide at Feature 06 time.
- **PostHog runtime/attribution setup still open from prior session.** "Reopen when the first real PostHog dashboard query is needed (Feature 17)." Now three PostHog events are wired (`login_provider_selected`, `logout_requested`) but the PostHog server keys still need verification before any `profile_completed` event fires.
- **InsForge PostgREST typability for jsonb.** Code boundaries that cast `unknown` to typed shapes arrive in Feature 06. Decide when `actions/profile.ts` first touches the cast.
- **`/callback` -> `/profile` redirect is temporary** — needs to flip back to `/dashboard` when Feature 14 ships. Add a one-line comment at the site to flag it for future selves.

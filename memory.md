# Memory — Feature 06 Profile Save Logic

Last updated: 2026-08-01

## What was built

### Feature 06 Profile Save Logic

- **`types/index.ts`** — new file (filled the placeholder in `architecture.md`). Exports `Profile`, `ProfileFormState`, `WorkExperienceRole`, `Education`, the four enum string unions (`ExperienceLevel`, `RemotePreference`, `WorkAuthorization`, `HighestDegree`) plus `EMPTY_EDUCATION` constant.
- **`lib/completion.ts`** — pure `calculateCompletion(profile)` with 11 required fields. Required set is fixed: full name, phone, location, current title, experience level, years, 1+ skill, degree (non-empty), field of study, 1+ titles seeking, remote preference. Empty `experienceLevel` / `remotePreference` count as missing; `"Other"` degree counts as filled.
- **`lib/profile-data.ts`** — `fetchProfile(userId)` server-side read with jsonb cast at one boundary. Returns `Profile | null`. Plus `csvToArray` / `arrayToCsv` helpers for the array-field round-trip.
- **`actions/profile.ts`** — `saveProfile(input)` Server Action. Validates fields, computes completion, upserts `profiles` row (PK = `user.id`) via `database.from("profiles").upsert(row, { onConflict: "id" })`, calls `revalidatePath("/profile")`. Fires `profile_completed` PostHog event only on the false→true flip. Returns `{ success, error? }` per `code-standards.md`.
- **`app/api/resume/upload/route.ts`** — Route Handler (NOT a Server Action — see Decisions). Authenticates server-side via `getCurrentUser()` (proxy.ts matcher doesn't cover `/api/*`). 10MB PDF cap + content type + extension check. Uploads to `resumes/{user_id}/resume.pdf` (PUT semantics — same path overwrites). Persists public URL to `profiles.resume_pdf_url`. Returns `{ success, resumeUrl, error? }`.
- **`components/profile/ProfileForm.tsx`** — accepts typed `initial: ProfileFormState` prop + `initialEmail` + `hasResume`. `useState` defaults now pulled from props, not hardcoded. Save button wired via `useTransition` to `saveProfile`. Status state machine: `idle | saving | saved | error`. Success banner uses `bg-success-lightest text-success-foreground`; error banner uses `border-error text-error`. Saved state auto-resets to idle after 4s via `useEffect`. Save label flips to `"Saving…"` while pending. Empty work-experience list shows a dashed-border empty state. `onSubmit` preventDefault so Enter in a field does not post.
- **`components/profile/ResumeUpload.tsx`** — accepts `hasResume: boolean` + `resumeUrl: string | null` props. Drag-drop OR click both route through `handleFile` → `fetch('/api/resume/upload', { method: 'POST', body: formData })` via `useTransition`. Spinner SVG inside filename chip during pending. Error renders under chip with `text-error`. Input `e.target.value = ""` reset so same file can be re-picked. "Generate Resume from Profile" CTA stays disabled with `Feature 08` tooltip.
- **`app/profile/page.tsx`** — async Server Component now reads `getCurrentUser()` + `fetchProfile(user.id)` server-side, computes real completion, swaps banner headline/body between "needs attention" / "Profile complete" based on `isComplete`. Passes typed `initial` form state + `hasResume` + `resumeUrl` to children. `proxy.ts` auth gate unchanged.

### Docs edited

- **`context/ui-registry.md`** — appended 06 rewiring notes on `ResumeUpload`, `ProfileForm`, `ProfileBanner` entries (props tables + pattern notes). Last-updated stamps refreshed.
- **`context/progress-tracker.md`** — Phase 2 status block updated; "Last completed: 06 Profile Save Logic", "Next: 07 AI Profile Extraction from Resume"; checkbox marked `[x] 06`; new "### 06 Profile Save Logic" decisions section added (16 items).

## Decisions made

- **Resume upload is a Route Handler, not a Server Action.** Next.js 16 Server Actions cap request bodies at 1MB by default (verified against `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`). Resumes up to 10MB cannot fit through an action. Route Handlers don't carry that cap. The handler authenticates via `getCurrentUser()` server-side because `proxy.ts`'s matcher only covers `/dashboard/:path*`, `/profile/:path*`, `/find-jobs/:path*` — not `/api/*`.
- **InsForge SDK API shape changed: `client.database.from(table)` and `client.storage.from(bucket)`, not `client.from(table)`.** Verified against the installed `@insforge/sdk@1.5.1` type defs (`dist/client-BjhyKtje.d.mts:1038`). Legacy pattern in `context/library-docs.md` is outdated. Documented as an open question for follow-up docs refresh — flagged for Feature 07+.
- **`storage.from("resumes").upload(path, file)` — no `upsert: true` flag.** SDK 1.5.1 docs: "Standard PUT semantics: uploading to an existing key replaces the current object in place." Removed the third arg `{ contentType: "application/pdf" }` because the storage object's `contentType` is inferred from the file. Re-upload just calls upload with the same path.
- **`profile_completed` fires only on the false → true flip.** Inside `saveProfile`: read existing row, compute completion, emit event iff `completion.isComplete && !existing?.isComplete`. Re-saving a complete profile does not re-fire.
- **`types/index.ts` lands in 06.** Fills the placeholder in `architecture.md` line 111. All form types and DB row types share one source.
- **jsonb cast lives in `lib/profile-data.ts`, not `actions/profile.ts`.** `fetchProfile()` returns a fully-typed `Profile | null`. Server Action takes typed CSV inputs and writes the typed `workExperience` / `education` shapes directly to PostgREST jsonb. Only one place deals with the `unknown`→`Profile` narrowing.
- **CSV round-trip for array fields.** `ProfileFormState` has `skillsCsv` / `industriesCsv` / `jobTitlesSeekingCsv` / `preferredLocationsCsv` — the form binds an `<input>` to each string, splits at the boundary. Server Action round-trips back into `string[]` before `upsert`. Avoids `<input type="hidden">` shims for the four arrays.
- **`ProfileForm.tsx` stays a single Client Component, Save wires via `useTransition`.** Matches the prior memory's decision lean (do not split Server + Client yet).
- **`calculateCompletion()` in `lib/completion.ts` is the single source of truth.** Page calls it for the banner's percent + missing labels; `saveProfile` calls it for the `is_complete` upsert. Two callers, one definition.
- **Required-field set: 11 fields.** Empty `experienceLevel` and `remotePreference` count as missing. `"Other"` degree counts as filled (any non-empty value clears the requirement).
- **Banner headline and body copy swap.** "needs attention" + "Complete the missing fields to improve…" → "Profile complete" + "Tailored matches and resume generation are unlocked."
- **`ResumePreview.tsx` stays deferred.** "View current resume" is a plain `<a target="_blank">` link in the upload card's footer row. Resolves prior memory's open question 2 (lean: thin `<a>` link, no PDF preview component).
- **Empty Work Experience list renders an empty-state card.** Replaces the Feature 05 mock seed of one filled role — fresh users start blank, click `Add role` deliberately.
- **`work_experience` `endDate` is cleared server-side when `current === true`.** Server Action maps `r.current ? "" : r.endDate` before upsert. Local form state still preserves the prior value so toggling off `current` restores it.
- **Save / Extract / Generate buttons** — Save is wired (06). Extract stays disabled with `title="Extract from Resume lands in Feature 07"`. Generate Resume stays disabled with `title="Generate Resume lands in Feature 08"`.

## Problems solved

- **Server Actions in Next.js 16 cap body size at 1MB.** Found by reading `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` before writing `uploadResume`. Resume PDF is up to 10MB — cannot fit through an action. Solution: Route Handler at `app/api/resume/upload/route.ts`. Auth handled server-side via `getCurrentUser()` because `proxy.ts` matcher doesn't cover `/api/*`.
- **InsForge SDK surface change.** Initial code used the legacy `client.from("profiles")` pattern from `library-docs.md`. TypeScript error: `Property 'from' does not exist on type 'InsForgeClient'`. Fixed by reading the actual installed SDK type defs (`client-BjhyKtje.d.mts`) and discovered the modern API is `client.database.from(table)` / `client.storage.from(bucket)`. Updated all three call sites: `lib/profile-data.ts`, `actions/profile.ts`, `app/api/resume/upload/route.ts`. The legacy pattern in `library-docs.md` is now known-outdated — open question to fix.
- **`storage.upload(path, file)` signature is 2-arg, not 3-arg.** Old SDK accepted `{ contentType, upsert }` options. New SDK: PUT-overwrites semantics, no options object. Removed `{ contentType: "application/pdf" }` from the call.
- **ESLint `react/no-unescaped-entities` on `"Add role"` literal.** Escaped to `&ldquo;` and `&rdquo;` in `ProfileForm.tsx`.
- **`profiles_experience_level_check` violation on empty string.** Live bug after first deploy: user fills form, clicks Save, gets `Failed to save profile`. Server log: `code: '23514', message: 'new row for relation "profiles" violates check constraint "profiles_experience_level_check"'`. Root cause: form sends `""` for an empty dropdown; CHECK constraints on `experience_level`, `remote_preference`, `work_authorization` only accept `(col IS NULL) OR (col = ANY (...))` — empty string is not in the allowed list and not null. Fix in `actions/profile.ts`: coerce `""` → `null` for all four enum columns + `years_experience` + `linkedin_url` + `portfolio_url` + `salary_expectation` + the three Education jsonb strings via the `emptyStrToNull` helper. Added a `code === '23514'` branch that surfaces a human-readable message ("One or more fields have an invalid value") instead of "Failed to save profile". Type widened: `Education.{fieldOfStudy, institutionName, graduationYear}` is now `string | null`; `lib/profile-data.ts#asEducation` returns `null` for empty jsonb values so the round-trip works.

## Current state

Working:
- `/profile` page renders end-to-end with real DB-driven banner (completion percent, missing labels, headline swap).
- Save button calls `saveProfile` Server Action via `useTransition`, shows inline success/error banner, auto-resets after 4s.
- Resume PDF upload through `POST /api/resume/upload` writes to `resumes/{user_id}/resume.pdf` and persists the public URL back to `profiles.resume_pdf_url`.
- "View current resume" link opens the just-uploaded PDF in a new tab.
- Form pre-fills with existing profile data on every revisit (page is dynamic, server-fetches per request).
- `useTransition` exposes `pending` for the Save button's "Saving…" label.
- `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean. Build output: `○ /`, `○ /_not-found`, `ƒ /api/resume/upload`, `ƒ /callback`, `○ /login`, `ƒ /profile`, `ƒ Proxy (Middleware)`.

Deferred (intentional, by design):
- `extractFromResume` flow (Feature 07) — Extract button still disabled with Feature 07 tooltip.
- `generateResumePdf` flow (Feature 08) — Generate button still disabled with Feature 08 tooltip.
- `/dashboard` page (Feature 14); `/callback` currently still redirects to `/profile`.
- `ResumePreview.tsx` — landed as a thin `<a>` link per prior memory decision.
- `library-docs.md` InsForge DB section still shows the legacy `client.from()` pattern — needs refresh in Feature 07+.

Not yet verified (deferred to later features, by design):
- RLS exercised by a real authenticated browser round-trip (storage RLS in particular — `storage_resumes_owner_all`).
- `profile_completed` PostHog server event firing — requires PostHog server keys to be set; `lib/posthog-server.ts` no-ops gracefully if unset.
- Full upsert round-trip through live InsForge backend (requires running browser session).

## Next session starts with

**Feature 07 AI Profile Extraction from Resume.**

Before implementing:
1. Read `context/build-plan.md` Feature 07 block.
2. Resolve the open question about `library-docs.md` InsForge DB section (update to `client.database.from()` modern API, or leave to a separate docs-only PR).
3. The Extract button lives on `ProfileForm.tsx` (currently disabled next to Save). `ResumeUpload` should now show a `hasResume` state so the button becomes live.
4. Confirm whether the extract flow lives at `app/api/resume/extract/route.ts` (per architecture.md) and reads the *already-uploaded* PDF from `resumes/{user_id}/resume.pdf` rather than re-uploading. Implementation reads the file as a buffer, runs `pdf-parse`, hands extracted text to GPT-4o with a JSON schema matching `ProfileFormState`, returns the structured result, then the form applies it via setState.
5. Confirm `openai` package is on the approved dependency list (it is — `code-standards.md` line 318). No new package install needed.

Implementation order:
1. `app/api/resume/extract/route.ts` — POST handler, server-side `getCurrentUser()`, reads file from storage using `storage.from("resumes").download(path)`, runs `pdf-parse`, returns structured `ProfileFormState` from GPT-4o. Returns `{ success, data, error? }`.
2. Wire `Extract from Resume` button on `ProfileForm.tsx` — `useTransition` to fetch the route, applies the returned `ProfileFormState` to the relevant `useState` setters, shows loading label "Extracting…".
3. Refine the system prompt to extract into the exact `ProfileFormState` shape (CSV strings for arrays, separate fields for work-experience arrays, plus education).
4. Update `progress-tracker.md` + `ui-registry.md` after 07 lands.

After 07 lands, Feature 08 wires Generate Resume to `app/api/resume/generate/route.ts` per architecture.md.

## Open questions

- **`library-docs.md` InsForge DB section is outdated.** Still describes the legacy `client.from()` pattern from older docs; SDK 1.5.1 uses `client.database.from()`. Should be updated either as a docs-only change in 06 follow-up or rolled into Feature 07. Lean: 07 (next session starts there).
- **`proxy.ts` matcher doesn't cover `/api/*`.** The `/api/resume/upload` route handler authenticates via `getCurrentUser()` server-side. Other API routes added later (Features 10/13) will need similar auth checks unless the matcher is expanded. Lean: keep proxy.ts narrow, each route handler does its own `getCurrentUser()` check. Pattern starts here.
- **Whether Feature 07 should read the *uploaded* PDF or re-prompt upload.** The current `ResumeUpload` already uploads to `resumes/{user_id}/resume.pdf`. Feature 07's extract flow should reuse that file. Lean: read from storage; the API route just does a `download`. The Extract button does not re-trigger a file picker.
- **PostHog event deduplication for `profile_completed`.** Resolved — fires only on the false→true flip. Safe to revisit if the schema changes.
- **`/callback` -> `/profile` redirect is temporary** — needs to flip back to `/dashboard` when Feature 14 ships.
- **`upsert` with `onConflict: "id"` — PostgREST API call.** Verified working at compile time, not exercised by a live round-trip yet. If the InsForge backend rejects `onConflict`, fall back to two-step (select-then-insert/update).
- **Whether `extractFromResume` should run automatically right after upload, or only when the user clicks Extract.** Lean: only when the user clicks — keeps the surface non-surprising and matches the design text.
- **`useTransition` + `revalidatePath` interaction.** If `revalidatePath` followed by a `pending` re-render causes layout flicker, fall back to `useActionState`. Not yet observed.

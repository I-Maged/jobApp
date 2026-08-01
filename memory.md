# Memory — Feature 06 Profile Save Logic + post-deploy CHECK-constraint fix

Last updated: 2026-08-01

## What was built

### Feature 06 Profile Save Logic

- **`types/index.ts`** — new file (filled the placeholder in `architecture.md`). Exports `Profile`, `ProfileFormState`, `WorkExperienceRole`, `Education`, the four enum-string unions (`ExperienceLevel`, `RemotePreference`, `WorkAuthorization`, `HighestDegree`), plus `EMPTY_EDUCATION` constant. `Education.{fieldOfStudy, institutionName, graduationYear}` typed as `string | null` (after the bug fix below).
- **`lib/completion.ts`** — pure `calculateCompletion(profile)` with 11 required fields. Required set is fixed: full name, phone, location, current title, experience level, years, 1+ skill, degree (non-empty), field of study, 1+ titles seeking, remote preference. Empty `experienceLevel` / `remotePreference` count as missing; `"Other"` degree counts as filled. `fieldOfStudy` check accepts `null` as missing.
- **`lib/profile-data.ts`** — `fetchProfile(userId)` server-side read with jsonb cast at one boundary. Returns `Profile | null`. `asEducation()` returns `null` for empty jsonb strings (post-fix). Plus `csvToArray` / `arrayToCsv` helpers for the array-field round-trip.
- **`actions/profile.ts`** — `saveProfile(input)` Server Action. Validates fields, computes completion, builds `ProfileRow` with `null` for empty enum/string columns (post-fix), upserts via `database.from("profiles").upsert(row, { onConflict: "id" })`, calls `revalidatePath("/profile")`. Fires `profile_completed` PostHog event only on the false→true flip. Returns `{ success, error? }` per `code-standards.md`. Added `code === '23514'` branch that surfaces "One or more fields have an invalid value…" instead of a generic failure.
- **`app/api/resume/upload/route.ts`** — Route Handler (NOT a Server Action — see Decisions). Authenticates server-side via `getCurrentUser()` (proxy.ts matcher doesn't cover `/api/*`). 10MB PDF cap + content type + extension check. Uploads to `resumes/{user_id}/resume.pdf` (PUT semantics — same path overwrites). Persists public URL to `profiles.resume_pdf_url`. Returns `{ success, resumeUrl, error? }`.
- **`components/profile/ProfileForm.tsx`** — accepts typed `initial: ProfileFormState` prop + `initialEmail` + `hasResume`. `useState` defaults pulled from props. Save wired via `useTransition` to `saveProfile`. Status state machine: `idle | saving | saved | error`. Success banner uses `bg-success-lightest text-success-foreground`; error banner uses `border-error text-error`. Saved state auto-resets to idle after 4s via `useEffect`. Save label flips to `"Saving…"` while pending. Empty work-experience list shows a dashed-border empty state. `onSubmit` preventDefault so Enter in a field does not post.
- **`components/profile/ResumeUpload.tsx`** — accepts `hasResume: boolean` + `resumeUrl: string | null` props. Drag-drop OR click both route through `handleFile` → `fetch('/api/resume/upload', { method: 'POST', body: formData })` via `useTransition`. Spinner SVG inside filename chip during pending. Error renders under chip with `text-error`. Input `e.target.value = ""` reset so same file can be re-picked. "Generate Resume from Profile" CTA stays disabled with `Feature 08` tooltip.
- **`app/profile/page.tsx`** — async Server Component reads `getCurrentUser()` + `fetchProfile(user.id)`, computes real completion via `calculateCompletion`, swaps banner headline/body between "needs attention" / "Profile complete" based on `isComplete`. Passes typed `initial` form state + `hasResume` + `resumeUrl`. `proxy.ts` auth gate unchanged.

### Docs edited

- **`context/ui-registry.md`** — refreshed `ResumeUpload`, `ProfileForm`, `ProfileBanner` entries with Feature 06 rewiring notes (props tables + pattern notes). Last-updated stamps updated.
- **`context/progress-tracker.md`** — Phase 2 status block updated; "Last completed: 06 Profile Save Logic", "Next: 07 AI Profile Extraction from Resume"; checkbox marked `[x] 06`; new "### 06 Profile Save Logic" decisions section added.

## Decisions made

- **Resume upload is a Route Handler, not a Server Action.** Next.js 16 Server Actions cap request bodies at 1MB by default (verified against `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`). Resumes up to 10MB cannot fit. Route Handlers don't carry that cap. The handler authenticates via `getCurrentUser()` because `proxy.ts`'s matcher only covers `/dashboard`, `/profile`, `/find-jobs` — not `/api/*`.
- **InsForge SDK API shape: `client.database.from(table)` and `client.storage.from(bucket)`, not `client.from(table)`.** Verified against installed `@insforge/sdk@1.5.1` type defs (`dist/client-BjhyKtje.d.mts:1038`). Legacy pattern in `context/library-docs.md` is outdated. Flagged as open question for follow-up docs refresh.
- **`storage.from("resumes").upload(path, file)` — no `upsert: true` flag.** SDK 1.5.1 docs: "Standard PUT semantics: uploading to an existing key replaces the current object in place." Re-upload just calls upload with the same path.
- **`profile_completed` fires only on the false → true flip.** Inside `saveProfile`: read existing row, compute completion, emit iff `completion.isComplete && !existing?.isComplete`.
- **`types/index.ts` lands in 06.** Fills the placeholder in `architecture.md`. All form and DB types share one source.
- **jsonb cast lives in `lib/profile-data.ts`, not `actions/profile.ts`.** Only one place deals with `unknown`→`Profile` narrowing.
- **CSV round-trip for array fields** (`skillsCsv`, `industriesCsv`, `jobTitlesSeekingCsv`, `preferredLocationsCsv`). Form binds an `<input>` to each string, splits at the boundary. Avoids `<input type="hidden">` shims.
- **`ProfileForm.tsx` stays a single Client Component, Save wires via `useTransition`.** Do not split Server + Client yet.
- **`calculateCompletion()` is the single source of truth.** Page calls for banner; `saveProfile` calls for the `is_complete` upsert.
- **Required-field set: 11 fields.** Empty `experienceLevel` / `remotePreference` count as missing. `"Other"` degree counts as filled.
- **Banner headline and body swap based on `isComplete`.**
- **`ResumePreview.tsx` stays deferred.** "View current resume" is a plain `<a target="_blank">` link in the upload card's footer row.
- **Empty Work Experience list renders an empty-state card.** Replaces the Feature 05 mock seed of one filled role.
- **`work_experience` `endDate` is cleared server-side when `current === true`.**
- **CHECK constraint handling — empty string → NULL** (post-fix). Postgres CHECK on enum columns allows `(col IS NULL) OR (col = ANY (...))`. Form sent `""` for empty dropdowns — failed. Now `saveProfile` coerces `""` → `null` for all four enum columns + `years_experience` + `linkedin_url` + `portfolio_url` + `salary_expectation` + the three Education jsonb strings. Server Action branches on `code === '23514'` and surfaces a human-readable message.

## Problems solved

- **Server Actions in Next.js 16 cap body size at 1MB.** Solution: Route Handler at `app/api/resume/upload/route.ts`. Auth server-side via `getCurrentUser()`.
- **InsForge SDK surface change** — `client.from()` → `client.database.from()` / `client.storage.from()`. Updated all three call sites.
- **`storage.upload(path, file)` is 2-arg, not 3-arg.** New SDK uses PUT-overwrites semantics; no options object.
- **ESLint `react/no-unescaped-entities`** on `"Add role"`. Escaped to `&ldquo;` / `&rdquo;`.
- **`profiles_experience_level_check` violation on empty string (LIVE BUG).** User filled form, clicked Save, got "Failed to save profile". Server log: `code: '23514', message: 'new row for relation "profiles" violates check constraint "profiles_experience_level_check"'`. Form sent `""` for empty dropdowns; CHECK constraints on `experience_level`, `remote_preference`, `work_authorization` only accept `(col IS NULL) OR (col = ANY (...))`. Fix: coerce `""` → `null` for all four enum columns + `years_experience` + four text columns + three Education jsonb strings via `emptyStrToNull` helper. Added `code === '23514'` branch with a human-readable message. Widened `Education.{fieldOfStudy, institutionName, graduationYear}` to `string | null`. `lib/profile-data.ts#asEducation` returns `null` for empty jsonb values to match.

## Current state

Working:
- `/profile` page renders end-to-end with real DB-driven banner.
- Save button calls `saveProfile` via `useTransition`, shows inline success/error banner, auto-resets after 4s.
- Resume PDF upload through `POST /api/resume/upload` writes to `resumes/{user_id}/resume.pdf` and persists the public URL back to `profiles.resume_pdf_url`.
- "View current resume" link opens the just-uploaded PDF in a new tab.
- Form pre-fills with existing profile data on revisit.
- Empty enum/text fields save correctly post-fix (NULL not `""`).
- `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean. Build output: `○ /`, `○ /_not-found`, `ƒ /api/resume/upload`, `ƒ /callback`, `○ /login`, `ƒ /profile`, `ƒ Proxy (Middleware)`.

Deferred (intentional, by design):
- `extractFromResume` flow (Feature 07) — Extract button still disabled with Feature 07 tooltip.
- `generateResumePdf` flow (Feature 08) — Generate button still disabled with Feature 08 tooltip.
- `/dashboard` page (Feature 14); `/callback` still redirects to `/profile`.
- `ResumePreview.tsx` — landed as a thin `<a>` link per prior memory decision.
- `library-docs.md` InsForge DB section still shows the legacy `client.from()` pattern — needs refresh.

Not yet verified (deferred to later features):
- RLS exercised by a real authenticated browser round-trip (storage RLS in particular).
- `profile_completed` PostHog server event firing — needs env keys; `lib/posthog-server.ts` no-ops gracefully.
- Full upsert round-trip through live InsForge backend.

## Next session starts with

**Feature 07 AI Profile Extraction from Resume.**

Before implementing:
1. Read `context/build-plan.md` Feature 07 block.
2. Decide whether to refresh `library-docs.md` InsForge DB section before 07 (lean: 07 — bundle it in).
3. The Extract button lives on `ProfileForm.tsx` (currently disabled next to Save). `ResumeUpload`'s `hasResume` prop already drives its visibility.
4. Confirm extract flow lives at `app/api/resume/extract/route.ts` (per architecture.md) and reads the *already-uploaded* PDF from `resumes/{user_id}/resume.pdf` via `storage.from("resumes").download(path)`. No re-upload — the button does not trigger a file picker.
5. `openai` package is on the approved dependency list (code-standards.md line 318). No new package install needed — `pdf-parse` is also on the list.

Implementation order:
1. `app/api/resume/extract/route.ts` — POST handler, server-side `getCurrentUser()`, downloads the file from storage, runs `pdf-parse`, hands extracted text to GPT-4o with a JSON schema matching `ProfileFormState`, returns the structured result. Returns `{ success, data, error? }`.
2. Wire `Extract from Resume` button on `ProfileForm.tsx` — `useTransition` to fetch the route, applies the returned `ProfileFormState` to the relevant `useState` setters, label "Extracting…" while pending.
3. Refine the system prompt to extract into the exact `ProfileFormState` shape (CSV strings for arrays, separate fields for work-experience arrays, plus education as a nested object).
4. Update `progress-tracker.md` + `ui-registry.md` after 07 lands.

After 07 lands, Feature 08 wires Generate Resume to `app/api/resume/generate/route.ts` per architecture.md.

## Open questions

- **`library-docs.md` InsForge DB section is outdated.** Describes legacy `client.from()`; SDK 1.5.1 uses `client.database.from()`. Lean: bundle the fix in Feature 07's docs pass.
- **PDF parse failure mode for Feature 07.** `pdf-parse` may return empty text for image-based PDFs — handle that case (return error to user, matching design text "Could not extract text from this PDF").
- **Whether `extractFromResume` should auto-fire after upload or only when the user clicks Extract.** Lean: only on click — keeps the UX non-surprising.
- **`/callback` -> `/profile` redirect is temporary** — flips back to `/dashboard` when Feature 14 ships.
- **`upsert` with `onConflict: "id"`** — verified at compile time, not exercised by a live round-trip yet. If InsForge backend rejects `onConflict`, fall back to select-then-insert/update.
- **`useTransition` + `revalidatePath` interaction.** If pending re-render causes layout flicker, fall back to `useActionState`. Not yet observed.
- **Should the Server Action validate enum values before upsert?** Currently relies on DB CHECK. If prefer fail-fast with a human-readable message, add a Zod check at the boundary. Lean: keep DB CHECK as the single source of truth — fewer duplicated lists.
- **Storage object key must be bucket-prefixed.** RLS policy `storage_resumes_owner_all` predicate is `key LIKE 'resumes/' || auth.uid() || '/%'`. The SDK does NOT inject the bucket prefix — `storage.from("resumes").upload(path, file)` stores `path` verbatim into `storage.objects.key`. So the path must be `resumes/{userId}/resume.pdf`, not `{userId}/resume.pdf`. The same prefix is required for `download` / `getPublicUrl` so the URL matches what was actually stored. (Hotfix applied to `app/api/resume/upload/route.ts:45` after a 403 on first live upload — post-deploy bug discovered via running server log. Feature 07's planned `app/api/resume/extract/route.ts` must use the same `resumes/...` prefix when calling `storage.from("resumes").download(path)`.)

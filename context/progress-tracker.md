# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** 3 — Find Jobs Page
**Last completed:** 09 Find Jobs Page — Full UI
**Next:** 10 Adzuna Job Discovery

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI
- [x] 06 Profile Save Logic
- [x] 07 AI Profile Extraction from Resume
- [x] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [x] 09 Find Jobs Page — Full UI
- [ ] 10 Adzuna Job Discovery
- [ ] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [ ] 12 Job Details Page — Full UI
- [ ] 13 Company Research Agent

### Phase 5 — Dashboard

- [ ] 14 Dashboard Page — Full UI
- [ ] 15 Stats Bar — Real Data
- [ ] 16 Recent Activity — Real Data
- [ ] 17 Analytics Charts — PostHog Data

---

## Decisions Made During Build

### 06 Profile Save Logic

- **Resume upload is a Route Handler (`app/api/resume/upload/route.ts`), not a Server Action.** Next.js 16 Server Actions cap request bodies at **1MB by default** (per `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`). Resumes up to 10MB cannot fit through an action. Route handlers don't carry that cap. The handler authenticates via `getCurrentUser()` server-side because `proxy.ts`'s matcher only covers `/dashboard`, `/profile`, `/find-jobs` — not `/api/*`. Auth wraps the body parse: if no user, return 401 before touching the file.
- **`POST /api/resume/upload` does the full upload → URL → DB write in one request.** InsForge server-side: `storage.from("resumes").upload(path, file)` (PUT semantics — same path overwrites in place, per SDK 1.5.1 docs which dropped the old `upsert: true` option), `getPublicUrl(path)`, then `database.from("profiles").update({ resume_pdf_url, updated_at }).eq("id", user.id)`. After write, the page is revalidated by the client making a second navigation; the route handler itself doesn't need to (the Server Component re-fetches and reads the new URL).
- **`saveProfile` Server Action stays in `actions/profile.ts`.** No body-size risk — `Save Profile` only ships the typed form JSON. `revalidatePath("/profile")` runs at the end so the just-saved values re-render immediately on the next request.
- **`profile_completed` PostHog event fires only on the false → true flip.** `saveProfile` reads the existing row, computes the new completion, and emits the event iff `completion.isComplete && !existing?.isComplete`. Re-saving a completed profile does not re-fire. Resolves the open question in the prior memory about PostHog setup — `lib/posthog-server.ts` already no-ops gracefully when `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` / `NEXT_PUBLIC_POSTHOG_HOST` are unset, so 06 ships without any extra env var work.
- **`types/index.ts` lands in 06.** Fills the placeholder in `architecture.md` (used to read "→ Global TypeScript types"). Exports `Profile`, `ProfileFormState`, `WorkExperienceRole`, `Education`, plus the four enum-string unions (`ExperienceLevel`, `RemotePreference`, `WorkAuthorization`, `HighestDegree`) and an `EMPTY_EDUCATION` constant used by the page. The `ProfileFormState` is a parallel shape with CSV strings for the four array fields — used as the Server Action input.
- **jsonb cast lives in `lib/profile-data.ts`, not in `actions/profile.ts`.** A typed `fetchProfile(userId)` returns a fully-typed `Profile | null`. The page passes its array fields to the form already joined as CSV via `arrayToCsv()`. Server Action round-trips the same arrays as CSVs and passes them directly to PostgREST. `work_experience` and `education` jsonb cast lives at one boundary; nothing else touches `unknown`.
- **CSV round-trip for array fields** (`skillsCsv`, `industriesCsv`, `jobTitlesSeekingCsv`, `preferredLocationsCsv`). The Server Action `split(",").map(s => s.trim()).filter(Boolean)`s into `string[]`. The form's tag chips and the CSV input render the same data — the chips hold the typed array, the input holds the joined string. Avoids adding extra `<input type="hidden">` for array serialization.
- **`ProfileForm.tsx` stays a single Client Component, Save wires via `useTransition`.** Matches the prior memory's decision lean (do not split Server + Client yet). `useTransition` exposes `pending` for the Save button label ("Saving…") and a `useEffect` auto-resets the success banner after 4 s.
- **`calculateCompletion()` lives in `lib/completion.ts`, pure function.** The page calls it for the banner's percent + missing labels; `saveProfile` calls it to compute `is_complete` for the upsert. Two callers, one definition — they cannot drift.
- **Required-field set: 11 fields** — full name, phone, location, current title, experience level, years, 1+ skill, degree (non-empty), field of study, 1+ titles seeking, remote preference. Empty `experienceLevel` (initial select state) and empty `remotePreference` count as missing. `"Other"` degree counts as filled (any non-empty value clears the DEGREE requirement).
- **Banner headline swaps between "Profile needs attention" and "Profile complete"** based on `isComplete`. Body copy swaps to "Tailored matches and resume generation are unlocked." Same card shell. The mock 70% / PHONE / LOCATION / EDUCATION values from Feature 05 are gone — real completion drives both.
- **`ResumePreview.tsx` stays deferred.** "View current resume" is a plain `<a target="_blank">` link in the upload card's footer row (driven by `profile.resume_pdf_url`). A 4-line `<a>` is enough — no new component, no PDF preview surface until a saved PDF's content actually matters to the user (post-extract).
- **SDK API surface is `client.database.from(table).upsert(...)` / `.update(...)`, not `client.from(table)`.** The legacy pattern from `library-docs.md` is outdated with `@insforge/sdk@1.5.1`. Fixed in 06 — needs a follow-up doc refresh for `library-docs.md` InsForge section. Open question.
- **Empty Work Experience list renders an empty-state card** ("No work experience added yet. Click 'Add role' to record one." with a dashed border). Feature 05's mock seeded a filled role; on a fresh profile the form starts with no roles so the user clicks `Add role` deliberately. Same UX as the existing chip lists when empty.
- **`work_experience` `endDate` is cleared when `current === true` server-side.** The Server Action maps `r.current ? "" : r.endDate` before upsert so the column is consistent regardless of what the client has in state. Local form state still preserves the prior value so toggling off `current` restores it.
- **All Save / Extract / Generate buttons handle future features correctly.** Save is wired (06). Extract stays disabled with `title="Extract from Resume lands in Feature 07"` — Feature 07 owns that wiring. Generate Resume from Profile stays disabled with `title="Generate Resume lands in Feature 08"`.

### 07 AI Profile Extraction from Resume

- **`pdf-parse@2.x` is a breaking rewrite — the v1 `import pdf from "pdf-parse"; pdf(buffer)` default export no longer exists.** The installed version is `2.4.5` (class-based). Pattern: `import { PDFParse } from "pdf-parse"` → `const parser = new PDFParse({ data: new Uint8Array(buffer) })` → `const result = await parser.getText()` → `await parser.destroy()` . `result.text` is the concatenated plain text. Resolved the open question from the prior memory about v1 `pdf(buffer)` — it is moot. `library-docs.md` pdf-parse section updated to v2.
- **Extract route is `app/api/resume/extract/route.ts` POST.** Route Handler, not Server Action — mirrors the upload route decision (06) and keeps heavy AI + PDF work off the action surface. Auth via `getCurrentUser()` server-side (`proxy.ts` matcher excludes `/api/*`).
- **Resume is read from storage, NOT re-uploaded.** The route downloads the already-uploaded PDF at `resumes/{userId}/resume.pdf` (the `resumes/` bucket prefix rule from 06 applies) via `insforge.storage.from("resumes").download(path)`. Returns `{ data: Blob | null, error }` (verified in `node_modules/@insforge/sdk/dist/client-BS9Xf-qE.d.ts:530`). Blob → Buffer via `Buffer.from(await blob.arrayBuffer())`, then to `Uint8Array` for `PDFParse`.
- **Empty / image-only PDF handling returns HTTP 200 + `success: false`.** `pdf-parse` returns empty/short text for image-based PDFs. If trimmed `text` < 50 chars, the route returns `{ success: false, error: "Could not extract text from this PDF. It may be an image-only document — please upload a text-based resume." }`. A 200 (not 422/500) — it is a user-input quality issue, not a server fault. The browser surfaces it in the existing extract error banner. A genuine parse failure (worker crash) returns 422.
- **GPT-4o call: `response_format: { type: "json_object" }`, `temperature: 0.3`, `max_tokens: 800`.** Matches `library-docs.md` ("Profile extraction from resume: 800" + extraction on the 0.3 deterministic row). Resume text is truncated to 12,000 chars before the prompt to keep prompt + completion within `gpt-4o` context headroom.
- **System prompt enumerates the exact `ProfileFormState` schema with enum value lists.** Lives in `lib/profile-extract.ts` as `EXTRACT_SYSTEM_PROMPT`. GPT must omit missing fields (never null / empty strings), infer `experienceLevel` from total years (junior 0-2 / mid 3-6 / senior 7-10 / lead 11+), normalise dates to `YYYY-MM`, map degree abbreviations to the enum, and cap work experience at the 3 most recent roles.
- **No Zod — manual `unknown` narrowing per `code-standards.md`.** `buildExtractedProfile(raw)` in `lib/profile-extract.ts` returns `Partial<ProfileFormState>` by narrow-checking each field and dropping anything malformed. Zod was considered (lean in prior memory: keep DB CHECK as single source) and rejected to avoid a new dependency + keep validation logic auditable in plain TS.
- **Extracted JSON auto-fills the form (overwrite-where-extracted-wins), the user still clicks Save.** The Extract route does NOT call `saveProfile`. On success the browser spreads each returned field into its `useState` setter (value present → setter called; absent → existing value kept). A green "Extracted N fields from your resume — review and click Save Profile." banner confirms. Save keeps its own separate 4s auto-reset banner.
- **Two independent statuses on the form.** `status` (Save: idle/saving/saved/error) and `extractStatus` (idle/extracting/error/idle-with-result) are separate pieces of state so an in-flight extract never disturbs the Save banner. Extract uses its own `useTransition` (`extractPending`) and its own error message slot.
- **Extract button gated on `hasResume` (unchanged from 06).** Reads "Extract from Resume" / "Extracting…" while pending. Disabled state removed — the Feature 07 placeholder tooltip is gone.

### 08 Resume PDF Generation from Profile

- **Generate route is `app/api/resume/generate/route.tsx` POST** — `.tsx`, not `.ts`. It calls `renderToBuffer(<ResumeTemplate ... />)`, so it must be a JSX file. Auth via `getCurrentUser()`; profile read from DB via `fetchProfile(user.id)` (never a client-submitted payload — the client POSTs an empty body).
- **JSX construction hoisted into a module-level `buildResumeElement(profile, content)` helper.** The `react-hooks/error-boundaries` lint rule fires on JSX *constructed inside* try/catch. Building the element in a helper outside the try block satisfies the rule while the async `renderToBuffer()` call stays inside the try.
- **Split of responsibilities: GPT-4o writes content, `ResumeTemplate` renders layout.** `lib/resume-generate.ts` → `generateResumeContent(profile): Promise<ResumeContent>` — GPT-4o (`response_format: json_object`, `temperature: 0.7`, `max_tokens: 1000`) produces `{ summary, experience[{...bullets}], skills }` — the professionally-worded text. The PDF component renders contact info, education, and fixed layout directly from the `Profile` row. GPT never sees contact fields; it only rewrites narrative content.
- **`@react-pdf/renderer` v4.5.1 — `renderToBuffer` is the only entry point.** No `renderToStream`, no `PDFDownloadLink`, never imported in client components. `renderToBuffer()` returns `Buffer`; the InsForge Storage `.upload()` takes `File | Blob`, so the route wraps it as `new Blob([new Uint8Array(buffer)], { type: "application/pdf" })` (the raw Buffer is not a valid `BlobPart` under the TS 5.9 `ArrayBufferLike` narrowing).
- **Storage upload matches SDK 1.5.1 — no options object.** `insforge.storage.from("resumes").upload(path, blob)` — the third `{ contentType, upsert }` argument from the old `library-docs.md` example does not exist in the SDK (verified against fetched SDK docs). Uploading to the existing key `resumes/{userId}/resume.pdf` replaces in place. Public URL via `getPublicUrl(path).data.publicUrl`, then `database.from("profiles").update({ resume_pdf_url }).eq("id", user.id)`.
- **No profile-completeness gate.** A thin profile produces a thin resume — GPT generates whatever it can from whatever fields exist. The empty case (no profile row) still returns 400.
- **Generate button lives in `ResumeUpload.tsx` and is now live.** Third `useTransition` (`generatePending`) + `generateStatus` (`idle | generating | generated | error`) + `generatedUrl` local state. On success the component swaps `resumeUrl` → `generatedUrl` locally so "View current resume" updates immediately without a page reload; the DB write is what persists it for the next visit. Button labels: "Generating…" / "Resume Generated" (disabled) / error message in the existing `error` slot.
- **Inter font loaded at render time from Google Fonts.** `Font.register` in `ResumeTemplate.tsx` uses the Inter v20 latin variable-font URL (`fonts.gstatic.com/s/inter/v20/...UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2`) for both 400 and 700 (single variable-font file covers both weights). The v18 URLs originally written 404'd — verified via fetch before wiring. The renderer fetches the font at render time (same runtime network dependency as the GPT-4o call), so no bundling concern. **If the v20 URL ever 404s, generation fails — check Google Fonts CSS (`css2?family=Inter:wght@400;700`) for the current hash before changing anything else.**
- **Template CSS props verified against installed v4.5.1** — `backgroundColor`, `gap`, `textTransform`, `letterSpacing`, `textIndent`, margin/padding shorthands all exist in `@react-pdf/stylesheet` types (the conservative list in `library-docs.md` was incomplete). `library-docs.md` @react-pdf section updated with the verified list and corrected `.upload()` signature.

### 05 Profile Page — Full UI

- **Single `ProfileForm.tsx` Client Component for all five sections** rather than per-section files. The form state lives in one place (`useState` hooks for each field) so cross-section validation, completion calculation, and the Save action in Feature 06 land in one spot. Internal sub-components (`SectionCard`, `Field`, `TagInputField`, `WorkRoleCard`) keep the JSX readable. Folder stays consistent with `AuthAwareCTAs` — multi-purpose Client Components are allowed when their internal state is shared.
- **`CompletionIndicator` and `ResumeUpload` are separate components.** They have no shared state with the form — the banner can render before the form is even loaded. Keeping them independent lets Feature 06 swap the form over to a Server Action without touching the banner.
- **Mock completion state at 70% with `PHONE`, `LOCATION`, `EDUCATION` flagged missing.** Matches the design text description. The completion calculation itself lands in Feature 06 alongside `is_complete` recomputation. Banner values are passed as props so the page can swap to real values with a one-line change.
- **Missing-field tags use the project `bg-accent-muted text-accent` token, not red.** The design text description mentions red text, but the rule from `AGENTS.md` ("Never use hardcoded hex values or raw Tailwind color classes") applies — and there's no red token in the design system for this purpose. The closest "highlight that draws attention" pair is the missing-skill badge color, which is what the missing-field tag uses. Same chip shape as the matched/missing skill tags on the job details page.
- **Email is pre-filled from the auth session in Feature 05**, resolving an open question from memory. `app/profile/page.tsx` calls `getCurrentUser()` server-side and passes the email down as a disabled prop. The disabled input uses `cursor-not-allowed bg-surface-secondary text-text-secondary` so users see it's locked.
- **Work experience is locked to 3 roles with an `Add role` button.** A role card renders per index with a "Remove" link. The `currently working here` checkbox clears and disables the End Date input. Start/End Date use `type="month"` (resolved open question from memory).
- **Tags stored in component state as `string[]`.** Feature 06 maps the chips to `skills` / `industries` `text[]` directly. Industries use `bg-info-lightest text-info-foreground` to visually distinguish the optional field from required skills — same chip shape, different color token. Both colors already exist in `@theme`.
- **All Save / Extract / Generate buttons are intentionally disabled with tooltips pointing at future feature numbers.** The form fills freely; clicking anything shows `"Save Profile lands in Feature 06"` etc. so any reviewer / user immediately sees this is a read-only preview shell.
- **`app/profile/page.tsx` is an async Server Component** that reads `getCurrentUser()` and passes `initialEmail` + `initialFullName` down. Three children render in order: banner card, `<ResumeUpload />`, `<ProfileForm />`. No DB writes this pass; no `revalidatePath` calls. `proxy.ts` auth gate handles the redirect-to-login case before this page ever renders.
- **No `ResumePreview.tsx` rendered in 05.** Architecture lists it but it's a read-only preview of the saved resume — useless without a saved PDF (which arrives in Feature 06/08). Skipped intentionally; can be added later without disrupting the registry.
- **Resume upload area is a `<label>` wrapping a hidden `<input type="file">`.** Click anywhere in the drop zone opens the picker. Drag-and-drop populates the on-page filename chip only — actual upload lands in Feature 06. The Generate Resume button lives in its own secondary tile below the drop zone rather than crowding the card.
- **`ui-registry.md` updated with all three components plus their token classes.** Future profile / job-details / dashboard work can match this surface pattern. `Last updated: 2026-08-01` on each entry.

### 04 Database Schema

- **RLS enforced on all 4 tables (`profiles`, `agent_runs`, `jobs`, `agent_logs`) plus `storage.objects`.** Single policy per table named `<table>_owner_all` targeted at `authenticated`, using `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`. `profiles.id` uses `id = auth.uid()` instead since its PK is the user id. `auth.uid()` is a real helper on InsForge — verified definition: `SELECT nullif(auth.jwt() ->> 'sub', '')::uuid`.
- **All four ID columns are `uuid`** — `gen_random_uuid()` (`pgcrypto`) for new tables, `auth.users.id` for `profiles.id`. Cross-table FKs all use `uuid` and stay consistent.
- **`profiles.id REFERENCES auth.users(id) ON DELETE CASCADE`.** Removing a user cleans up everything else via cascade in `agent_runs`, `jobs`, and `agent_logs`. Storage RLS uses `uploaded_by = auth.uid()` plus prefix gating so orphaned objects become inaccessible even if the row remains.
- **`jobs.run_id` is nullable with `ON DELETE SET NULL`.** Same for `agent_logs.job_id`. Per `architecture.md`, URL-imported jobs have no run; deleting an `agent_runs` row should not cascade-delete the jobs it produced — they remain tied to the user via `user_id`. `agent_runs.user_id` and `agent_logs.user_id` cascade because runs/logs without a user row are meaningless.
- **All four tables have FK-scoped composite indexes** for the hot read paths: `(user_id, found_at DESC)` and `(user_id, match_score DESC NULLS LAST)` on `jobs`, `(user_id, started_at DESC)` on `agent_runs`, `(user_id, created_at DESC)` on `agent_logs`. `profile` has `(updated_at DESC)` for the dashboard profile-banner check.
- **Enums implemented as `text CHECK` constraints** on `profile.experience_level`, `profile.remote_preference`, `profile.cover_letter_tone`, `profile.work_authorization`, `agent_runs.status`, `jobs.source`, `jobs.job_type`, `agent_logs.level`. PostgREST exposes them as `text` to the TypeScript SDK; constraint rejects bad values at the DB.
- **`resumes` storage bucket had to be created as public (the MCP tool has no `isPublic: false` flag).** Closed the gap by enabling RLS on `storage.objects` with a `storage_resumes_owner_all` policy: `bucket = 'resumes'` AND `key LIKE 'resumes/' || auth.uid() || '/%'` AND `uploaded_by = auth.uid()`. Each user can only read/write objects under `resumes/{their-own-uuid}/`. Resolved the read-side concern — `storage.objects` RLS is what the storage serving path checks, not just `bucket.public`.
- **No DB-level validation on `company_research` shape.** It's a flexible dossier (9 fields, mixed scalars + arrays). Validation lives in agent code where the dossier is synthesized; an SQL `CHECK` on a jsonb shape would break the first time we tweak the structure.
- **`work_experience` / `education` jsonb typing decision deferred.** InsForge PostgREST exposes jsonb as `unknown` to the TS SDK. The call sites that need typed access — `actions/profile.ts` save and `agent/matcher.ts` read — will cast at the boundary in code, not at the schema. Both jobs use `unknown` then narrow (`as ProfileWorkExperience`) at the top of each handler.
- **`is_complete` defaults to `false`.** Server Action `actions/profile.ts` (Feature 06) will recompute it on save based on the same required-field set documented in `build-plan.md` Feature 06.
- **`storage_resumes_owner_all` is the only storage policy.** Other buckets added in later features would need their own policy — keep them isolated.

### 03 PostHog

- **Init lives in `instrumentation-client.ts`, not `lib/posthog-client.ts`.** Next.js 16's client-side initialization point runs once at app boot — the only correct place to call `posthog.init`. The two wrapper modules hold the capture/identify/reset helpers, not init logic.
- **Browser wrappers (`lib/posthog-client.ts`) are SSR-safe.** `isReady()` returns false when `window` is undefined or `posthog-js` hasn't initialized — the wrappers no-op rather than throw inside Server Components. Each wrapper is independently try/catch'd so a PostHog failure never breaks the calling component.
- **Server wrapper (`lib/posthog-server.ts`) owns the full lifecycle.** Creates a fresh `PostHog` instance per call with `flushAt: 1` and `flushInterval: 0`, then `await client.shutdown()` in the `finally` block — events are guaranteed flushed even if `capture()` throws. No long-lived server client.
- **Only files that may import `posthog-js`/`posthog-node` directly are `instrumentation-client.ts`, `lib/posthog-client.ts`, and `lib/posthog-server.ts`.** Every other module goes through the project wrappers. Single migration surface.
- **PostHog events table now lists 6 events** (not 4): 2 auth-tier utility events (`login_provider_selected`, `logout_requested`) added to the canonical 4 (`job_search_started`, `job_found`, `profile_completed`, `company_researched`). The "no new events without updating this table first" rule is preserved — this table is the single source of truth in `code-standards.md`.
- **`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` not `NEXT_PUBLIC_POSTHOG_KEY`.** The `.env.example`, `instrumentation-client.ts`, and `lib/posthog-server.ts` all read `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`. Older drafts of `code-standards.md` and `library-docs.md` referenced the wrong name — fixed in this pass so the env var row matches reality.
- **Curl call sites already wired before this build pass:** `LoginButtons.tsx` was firing `posthog.capture("login_provider_selected", ...)` directly; `AuthAwareCTAs.tsx` was calling `posthog.identify(...)`, `posthog.reset()`, and `posthog.capture("logout_requested")`. Both components refactored to import from `@/lib/posthog-client` — behavior unchanged. No new emissions added in this build.
- **Emission points for the 4 canonical events are still pending.** No `/find-jobs/SearchControls.tsx`, no `app/api/agent/find/route.ts`, no `actions/profile.ts`, no `app/api/agent/research/route.ts` exist yet. Wire-ups land in features 06, 10, 13.

### 02 Auth

- **OAuth flow is server-owned via `createAuthActions` from `@insforge/sdk/ssr`.** The browser client holds the auth session in memory only (the SDK's `TokenManager` is explicitly "Memory-only token storage") and only writes the CSRF cookie. Server-side `getCurrentUser()` reads `insforge_access_token` / `insforge_refresh_token` cookies — those never get written by the browser client. Fix: the entire OAuth flow runs on the server. Login buttons submit a Server Action that calls `createAuthActions().signInWithOAuth()`, stashes the returned `codeVerifier` in a short-lived cookie, then redirects the browser to the provider. The `/callback` Server Component reads `insforge_code` from the URL and the verifier from the cookie, calls `createAuthActions().exchangeOAuthCode(code, codeVerifier)` (which writes the auth cookies), then redirects to `/dashboard`.
- **Server Action `signInWithProvider(provider)`** in `actions/auth.ts` — uses `createAuthActions` from `@insforge/sdk/ssr`. Called from `<form action={signInWithProvider.bind(null, 'google')}>` in `LoginButtons.tsx`.
- **Server Action `signOutAction()`** — uses `createAuthActions().signOut()`. Called from a `<form>` in `AuthAwareCTAs` (Sign Out button).
- **Server Action `checkSessionAction()`** — used by `AuthAwareCTAs` to read the session state on the client (calls `createServerClient().auth.getCurrentUser()` server-side).
- **PKCE verifier cookie** named `insforge_pkce_verifier`, httpOnly, 10 minute maxAge. Set in `signInWithProvider`, read in `/callback`, deleted after the exchange.
- **`proxy.ts` not `middleware.ts`.** Next.js 16 renamed `middleware` to `proxy` (function name `proxy`, default Node.js runtime). Confirmed in `node_modules/next/dist/docs/.../proxy.md`. The build output shows `Proxy (Middleware)` under the routes.
- **Login pages live in `app/(auth)/` route group** with a dedicated layout (logo + centered card, no marketing nav/footer). Matches the marketing-site visual style per design direction.
- **Auth-gate redirects to `/login` only — no `next` round-trip.** Per user direction. Simpler redirect path.
- **Nav `variant` prop removed.** The "landing" vs "app" CTA distinction was redundant once `AuthAwareCTAs` checks session state itself. Same for the Hero/BottomCTA wiring.
- **OAuth callback lives at `app/(auth)/callback/route.ts`** (GET Route Handler), not a page. Next.js 16 forbids cookie mutation in Server Components — Server Actions and Route Handlers are the only allowed sites. The SDK's `createAuthActions` accepts `{ requestCookies, responseCookies }` for Route Handlers.
- **OAuth provider callback param name is `insforge_code`** (not `code`) — verified in `node_modules/@insforge/sdk/dist/ssr.mjs:1030`.
- **`proxy.ts` short-circuits on cookie presence**: checks `request.cookies.get("insforge_access_token")` first; if missing, redirects to `/login` without calling `getCurrentUser()` (no InsForge round-trip for obviously-anonymous requests).
- **`signInWithProvider` guards missing PKCE verifier**: redirects to `/login?error=signin` if `data.codeVerifier` is empty, instead of setting an empty cookie and bouncing through the provider round-trip.
- **`checkSessionAction` delegates to `createInsforgeServer()`** — single client construction path. Errors logged via `console.warn` so they're not silently conflated with "signed out".
- **`LoginButtons` uses `useFormStatus`** — each button disables itself and shows "Redirecting…" while its form is pending, preventing double-submit races between Google and GitHub.
- **`/callback` is the post-OAuth redirect target**. The InsForge SDK requires the URL to be in `allowedRedirectUrls` on the InsForge dashboard — to be confirmed by the user before going live.
- **Three bugs found and fixed during this build:**
  1. **First attempt (callback as Server Component):** got cookies from server, but no cookies had been written yet, so the page stuck on "Signing you in…". Fixed by converting to Client Component (browser SDK exchanges the code).
  2. **Second attempt (callback as Client Component):** the browser SDK did the exchange and the user object was available in browser memory, but the server had no cookies. `proxy.ts` still saw "no user" and redirected to `/login`. The "Open Dashboard" CTA also bounced. **Root cause:** the browser client only writes the CSRF cookie, never the auth cookies. Fix: server-owned OAuth flow via `createAuthActions`.
  3. **Third attempt (callback as Server Component calling `exchangeOAuthCode`):** BROKEN. Next.js 16 runtime error: "Cookies can only be modified in a Server Action or Route Handler." Resolved by converting `app/(auth)/callback/page.tsx` to `app/(auth)/callback/route.ts` (GET Route Handler) which calls `createAuthActions({ requestCookies: request.cookies, responseCookies: response.cookies })`. Verified: `npx tsc --noEmit` clean, `npm run lint` clean, `npm run build` clean — `/callback` listed as a dynamic GET route. Live end-to-end sign-in still requires that `/callback` is in `allowedRedirectUrls` on the InsForge dashboard.

### 01 Homepage

- Built all UI components from the landing-page.png design description (image not readable by model — received as text breakdown).
- Logo component created as reusable (`components/layout/Logo.tsx`) — used by both Navbar and Footer.
- Navbar is a Client Component to use `usePathname` for active link styling. CTA button label switches via `variant` prop (`"landing"` → "Start For Free", `"app"` → "Sign Out").
- Footer copyright rendered dynamically with `new Date().getFullYear()`.
- Hero dashboard preview uses `Image` from `next/image` with `priority` flag — `width=2394 height=1208` (half the actual image resolution for display density).
- JobsTablePreview built as live HTML table instead of using `jobs-lists.png` — keeps it crisp at all sizes and renders exactly the 6 jobs from the design description (Vercel 94%, Stripe 88%, Linear 96%, Notion 72%, OpenAI 91%, Figma 85%).
- Match-score color rule differs slightly between JobsTablePreview (uses success/info/warning ranges: 90+/70-89/below 70) and ui-rules.md (which says 80-100 green, 60-79 blue, below 60 orange). JobsTablePreview matches the design description (94/88/96 green, 72 blue, 85 blue) — followed the design.
- AgentLog built as live dark terminal with traffic-light dots, monospace text, color-coded log lines, blinking cursor — instead of using `agnet-log.png`.
- Testimonial avatar uses `user-icon.png` cropped to circular frame.
- BottomCTA uses `bg-accent-muted` (subtle purple tint) — design didn't specify but subtle accent fits the visual hierarchy.

### 09 Find Jobs Page — Full UI

- **Three components, no `JobFilters.tsx`.** `components/find-jobs/SearchControls.tsx` (title/location inputs + disabled accent only-for-level-1-leveling the integration game in order to control Future 10), `components/find-jobs/JobsTable.tsx` (filter bar inlined as the table card's header + 6-row static table), `components/find-jobs/JobsPagination.tsx` (static "Showing 1 to 6 of 24 results" + page buttons). The filter bar has no shared state with SearchControls, so it lives inside the table card rather than as a fourth file. Registered in `ui-registry.md`.
- **`lucide-react` installed** (v.x latest at build time) and added to the package.json deps. Was listed as approved in `code-standards.md` since Phase 1 but not actually installed until this feature. Used in `SearchControls` (Search icon on the button) and `JobsPagination` (ChevronLeft/Right).
- **Find Jobs button intentionally disabled with `title="Find Jobs lands in Feature 10"`.** Follows the Feature 05 pattern for disabled CTAs pointing at the owning feature. `job_search_started` PostHog event NOT emitted here — analytics stay clean of mock clicks; wired in Feature 10.
- **Filter dropdowns/sort/text-filter present but inert.** Plain `<select defaultValue>` and `<input>`, no state or change handlers yet. Feature 11 owns the logic.
- **Match score thresholds updated to match `ui-rules.md`** — ≥80 green (`text-success`/`bg-success`), 60–79 blue (`text-info`/`bg-info`), <60 orange (`text-warning`/`bg-warning`). Note: `components/homepage/JobsTablePreview.tsx` still uses the old 90/70 rule per its original Feature 01 design description — dashed off as a known deviation, token-level fix deferred.
- **Mock data covers all three score bands deliberately** — Figma row uses 58 so the `warning` (orange) visual path is rendered (`<60` needs at least one row). Six rows mirroring the homepage preview companies, extended with Role and Date Found columns.
- **`app/find-jobs/page.tsx` is a Server Component with `export const metadata: Metadata = { title: "Find Jobs" }`.** Follows the same shell pattern as `app/profile/page.tsx` — `max-w-[1440px]` with `px-6/md:px-8 py-8/10`, `gap-6`. `proxy.ts` matcher covers `/find-jobs/:path*` so unauthenticated users bounce to `/login` before render.
- **`"Jobs by Adzuna"` credit rendered below the pagination row** — plain sentence with a text-link on "Adzuna". Build output shows `/find-jobs` as static (○), gated at runtime by `proxy.ts`.
- **Two new tint tokens added to `@theme` in `globals.css`:** `--color-on-accent-tint: #5E4CFF` and `--color-on-success-tint: #007A55`. These close a naming trap: `*-foreground` tokens in `ui-tokens.md` are reserved for filled dark surfaces and accent buttons — NOT for text on light `*-muted` / `*-lightest` tinted backgrounds. `text-accent` on `bg-accent-muted` renders #7C5CFC-on-#FAF5FF (soft-low-contrast), so the Find Jobs success banner and the highlighted current page button use `text-on-success-tint` / `text-on-accent-tint` (WCAG-AA-passing against the tinted backgrounds). Documented in `ui-tokens.md` and `ui-registry.md`.
- **Success banner in `SearchControls` is static mock text:** "Found 8 jobs and saved 4 strong matches." Only shown as a visual placeholder; Feature 10 swaps to conditional rendering based on the Adzuna run result.

---

## Notes

_Notes added during the build._

# Memory — Feature 08 Resume PDF Generation from Profile

Last updated: 2026-08-02

## What was built

### Feature 08 — Resume PDF Generation from Profile

- **`lib/resume-generate.ts`** — new file. Exports `ResumeContent` type (`{ summary, experience[{company, title, startDate, endDate, current, bullets[]}], skills[] }`) and `generateResumeContent(profile: Profile): Promise<ResumeContent>` — GPT-4o call (`response_format: json_object`, `temperature: 0.7`, `max_tokens: 1000`) with a resume-writer system prompt. The model only writes narrative content (summary, polished bullets, skill ordering) from workExperience/education/skills — it never sees contact fields. Manual `unknown` narrowing on the response, no Zod.
- **`components/profile/ResumeTemplate.tsx`** — new file. `@react-pdf/renderer` v4.5.1 `Document` component (A4, `StyleSheet.create`, Inter font). Renders contact header, professional summary, experience (bold title + ` | ` company + date range via `formatRange`), skills chips, education line. Inter 400/700 registered at module scope from the Google Fonts **v20** latin variable-font URL (the v18 URLs originally used 404'd — fixed).
- **`app/api/resume/generate/route.tsx`** — new POST route handler (note: **`.tsx`**, not `.ts` — it renders JSX to `renderToBuffer`). Flow: `getCurrentUser()` auth → `fetchProfile(user.id)` → `generateResumeContent(profile)` → `renderToBuffer(buildResumeElement(profile, content))` → `new Blob([new Uint8Array(buffer)], { type: "application/pdf" })` → `storage.from("resumes").upload("resumes/{userId}/resume.pdf", blob)` → `getPublicUrl(path)` → `database.from("profiles").update({ resume_pdf_url }).eq("id", user.id)` → returns `{ success, resumePdfUrl }`. 401 unauthenticated, 400 no profile row, 500 on upload/failure.
- **`components/profile/ResumeUpload.tsx`** — modified. Generate Resume button is live (was a disabled Feature-08 placeholder). New state: `generatePending` (third `useTransition`), `generateStatus` (`idle | generating | generated | error`), `generatedUrl` (overrides the `resumeUrl` prop locally so "View current resume" updates without a reload). `handleGenerate()` POSTs an empty body to `/api/resume/generate`.
- **`package.json`** — added `@react-pdf/renderer` (installed v4.5.1).
- **Docs updated** — `context/progress-tracker.md` (08 checked off, decisions section added, next is 09), `context/ui-registry.md` (ResumeUpload rewired entry + new ResumeTemplate entry), `context/library-docs.md` (corrected `.upload()` signature — no options param — and expanded verified CSS prop list).

## Decisions made

- **Split: GPT-4o writes content, ResumeTemplate renders layout.** GPT produces the professionally-worded narrative; the PDF component renders contact info, education, and fixed layout directly from the `Profile` row. No invented data — the system prompt forbids fabricating companies/titles/dates/skills.
- **Route handler reads profile from DB, client POSTs an empty body.** No client-submitted payload. Mirrors the extract/upload route decisions (06/07): Route Handler, not Server Action; auth via `getCurrentUser()` server-side (`proxy.ts` matcher excludes `/api/*`).
- **Generate is not gated on profile completeness.** A thin profile produces a thin resume. Only a missing profile row returns 400. User can generate a draft at any time.
- **`.tsx` route file** — the route renders JSX so it must be `.tsx`. JSX construction is hoisted into a module-level `buildResumeElement(profile, content)` helper because the `react-hooks/error-boundaries` lint rule forbids JSX constructed inside try/catch.
- **Storage upload has no options argument in SDK 1.5.1** — the old `{ contentType, upsert }` pattern from library-docs.md does not exist. Uploading to the existing key `resumes/{userId}/resume.pdf` replaces in place (PUT semantics).
- **PDF buffer → `Blob`** — `renderToBuffer()` returns `Buffer`; the SDK `.upload()` takes `File | Blob`, so wrap as `new Blob([new Uint8Array(buffer)], { type: "application/pdf" })`. Raw Buffer fails TS `BlobPart` narrowing.
- **Inter font fetched at render time from Google Fonts v20 variable-font URL** — both 400 and 700 point at the same variable-font file (`UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2`). This is the same runtime network dependency class as the GPT-4o call.

## Problems solved

- **Google Fonts v18 URLs 404.** The Inter woff2 URLs originally written (v18 hashes) returned 404 — verified via fetch before wiring. Fixed by fetching `https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap` and using the v20 latin subset URL. If this ever 404s again, re-check the CSS for the current hash.
- **`react-hooks/error-boundaries` lint error** — "Avoid constructing JSX within try/catch" fired on the inline `<ResumeTemplate />` inside the route's try block. Solved by extracting `buildResumeElement()` to module scope.
- **`.ts` vs `.tsx` route** — initial `route.ts` failed tsc with JSX syntax errors; renamed to `route.tsx`.
- **`styles` naming bug** — `StyleSheet.create` was assigned to `s` but referenced as `styles`; renamed the constant.
- **Unused `WorkExperienceRole` import** in ResumeTemplate — removed (lint).

## Current state

- **Works:** Generate Resume button live; `tsc --noEmit`, `npm run lint`, `npm run build` all pass; `/api/resume/generate` registered as a dynamic route in the build output.
- **Not yet verified end-to-end:** the live round trip (auth → GPT-4o → `renderToBuffer` → storage upload → DB update → new URL in UI) has not been exercised against a real signed-in profile with a populated `profiles` row. Needs a browser test: fill the form, click Generate Resume, confirm the PDF opens from the "View current resume" link.
- **Uncommitted:** all Feature 08 changes are in the working tree (new files untracked: `app/api/resume/generate/`, `components/profile/ResumeTemplate.tsx`, `lib/resume-generate.ts`). Also modified: `components/profile/ResumeUpload.tsx`, `context/library-docs.md`, `context/progress-tracker.md`, `context/ui-registry.md`, `package.json`/`package-lock.json`. Pre-existing uncommitted changes not made this session: `.gitignore`, `memory.md`.

## Next session starts with

**Feature 09 — Find Jobs Page — Full UI** (Phase 3, per build-plan.md). Run `/architect` before building. The existing Feature 07 memory item is now closed; the Feature 07 caveat (live extract round-trip confirmation) and the Feature 08 caveat (live generate round-trip confirmation) are both open browser-test items worth confirming if the user hasn't done so.

## Open questions

- **Live round-trip confirmation for Feature 08** (and 07) — neither the extract nor the generate route has been confirmed working against a real authenticated profile/PDF.
- **PDF visual QA** — the generated resume layout (spacing, single-page fit with 3+ work roles, Inter rendering via variable font in @react-pdf/fontkit) is unverified visually. A long profile could overflow one A4 page — @react-pdf does not auto-flow text to a second page without explicit layout handling.
- **`library-docs.md` InsForge section still has the outdated legacy pattern** flagged in Feature 06 (`client.from(...)` vs `client.database.from(...)`) — doc refresh was deferred, still open.

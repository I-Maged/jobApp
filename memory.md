# Memory — Feature 03 PostHog Initialization

Last updated: 2026-07-31

## Status

Feature 03 PostHog Initialization is complete at the code level. Browser init in `instrumentation-client.ts`, SSR-safe wrappers in `lib/posthog-client.ts`, server wrapper in `lib/posthog-server.ts`. The two existing auth-tier emissions (`login_provider_selected`, `logout_requested`) refactored to go through the new wrappers. Docs updated; events table in `code-standards.md` now lists all 6 events as the single source of truth.

The 4 canonical event emissions (`job_search_started`, `job_found`, `profile_completed`, `company_researched`) are intentionally not wired — their call sites (Find Jobs search controls, Adzuna agent route, profile save Server Action, company research route) don't exist yet. They will land in features 06, 10, 13 with one-line `captureEvent` / `captureServerEvent` calls.

Next feature: **04 Database Schema** — `profiles`, `agent_runs`, `jobs`, `agent_logs` tables + `resumes` storage bucket.

## What was built (this session)

### Code
- **`lib/posthog-client.ts`** — created. Exports `captureEvent(name, props)`, `identifyUser(userId, traits)`, `resetUser()`. SSR-safe (`isReady()` guards `typeof window !== "undefined"` + `posthog.capture` is a function). Each wrapper independently try/catch'd so a PostHog failure never breaks the calling component. No init logic — init lives in `instrumentation-client.ts` per Next.js 16 convention.
- **`lib/posthog-server.ts`** — created. Exports `captureServerEvent(userId, event, properties)`. Creates a fresh `PostHog` instance per call with `flushAt: 1` and `flushInterval: 0`, calls `await client.shutdown()` in the `finally` block. Guards missing env vars with a dev-only `console.warn` and silent no-op in production.
- **`components/auth/LoginButtons.tsx`** — refactored: replaced `posthog.capture("login_provider_selected", { provider })` with `captureEvent("login_provider_selected", { provider })`. Removed `import posthog from "posthog-js"`.
- **`components/auth/AuthAwareCTAs.tsx`** — refactored: replaced `posthog.identify(...)`, `posthog.reset()`, `posthog.capture("logout_requested")` with `identifyUser(...)`, `resetUser()`, `captureEvent("logout_requested", {})`. Removed `import posthog from "posthog-js"`. Behavior unchanged.
- **`package.json`** — added `posthog-node@^5.47.2`. `posthog-js ^1.409.5` was already present.

### Docs
- **`context/code-standards.md`** — PostHog Events table now lists all 6 events with file references (4 canonical + 2 auth-tier). Env var row fixed: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (was stale `NEXT_PUBLIC_POSTHOG_KEY`).
- **`context/library-docs.md`** — PostHog section rewritten: documents `lib/posthog-client.ts` / `lib/posthog-server.ts` as the project entry points, with raw `posthog-js` / `posthog-node` patterns shown only as reference. Rules tightened: "Always use the project wrappers — never import posthog-js or posthog-node directly in components, actions, or API routes". Env var names corrected.
- **`context/architecture.md`** — `posthog-client.ts` / `posthog-server.ts` descriptions updated to reflect the wrapper role (init lives in `instrumentation-client.ts`).
- **`context/build-plan.md`** — Feature 03 description updated: init lives in `instrumentation-client.ts`, wrappers are SSR-safe / lifecycle-owning.
- **`context/progress-tracker.md`** — Feature 03 marked complete. New "Decisions Made" section with 7 decisions.

### Verification
- `npm run lint` — clean
- `npx tsc --noEmit` — clean
- `npm run build` — clean. Build output: `○ /`, `○ /_not-found`, `ƒ /callback`, `○ /login`, `ƒ Proxy (Middleware)` (no change from prior session)

## What was already in place (kept from prior sessions)

- `instrumentation-client.ts` — Next.js 16 client init. Reads `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`. Guards missing vars (dev-only `console.error`). `posthog.init(token, { api_host, capture_exceptions: true, debug: NODE_ENV === "development" })`.
- `.env.example` — documents both public env keys
- `.env` — real values for both keys (set prior, not re-verified this session)
- `components/auth/LoginButtons.tsx` — client component with `useFormStatus`, `text-on-dark`, `currentColor` icons
- `components/auth/AuthAwareCTAs.tsx` — three variants, reads session via `checkSessionAction()`, `identifyUser` after resolve, `captureEvent`+`resetUser` before sign-out
- `actions/auth.ts` — `signInWithProvider` (with verifier guard), `signOutAction`, `checkSessionAction`

## Decisions made (still valid)

- **Init lives in `instrumentation-client.ts`, not `lib/posthog-client.ts`.** Next.js 16's client-side initialization point runs once at app boot — the only correct place to call `posthog.init`. The two wrappers hold capture/identify/reset helpers, not init.
- **Browser wrappers are SSR-safe.** `isReady()` returns false on server or before init — wrappers no-op rather than throw. Each wrapper independently try/catch'd.
- **Server wrapper owns the full lifecycle.** Fresh `PostHog` per call, `flushAt: 1`, `flushInterval: 0`, `await client.shutdown()` in `finally`. No long-lived server client — Next.js functions are short-lived, long-lived clients risk dropped events on cold shutdown.
- **Only three files may import `posthog-js`/`posthog-node` directly: `instrumentation-client.ts`, `lib/posthog-client.ts`, `lib/posthog-server.ts`.** Every other module goes through the wrappers. Single migration surface.
- **PostHog events table is the single source of truth.** 6 events total. The "no new events without updating this table first" rule preserved. Auth-tier events explicitly listed but flagged as not powering dashboard charts.
- **Env var name is `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`** (matches `.env.example`, `instrumentation-client.ts`, `lib/posthog-server.ts`). The stale `NEXT_PUBLIC_POSTHOG_KEY` references in `code-standards.md` / `library-docs.md` were a real bug — fixed this session.

## Problems solved

- **No code bugs surfaced this session.** All clean: lint, typecheck, build, and behavioral preservation of the two pre-existing emissions.
- **Env var drift between code and docs.** `code-standards.md` env var table and `library-docs.md` both referenced `NEXT_PUBLIC_POSTHOG_KEY`, but `.env.example`, `instrumentation-client.ts`, and the new `lib/posthog-server.ts` all use `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`. Doc references corrected in this pass. The codebase was already consistent — only the docs were stale.
- **postHog-js `capture` `posthog-js` returns `CaptureResult | undefined` for the overload that takes an EventName.** The browser wrapper accepts `string` event names (slightly looser than the typed overload) so it works for both the shorthand `captureEvent("name")` and `captureEvent("name", props)`. Internally caught in try/catch.
- **posthog-node v5 type drift.** `client.d.ts` line 676 declares `shutdown(): void`, but the actual implementation in `client.js` awaits `super._shutdown()` so it's an async void. Calling convention `await client.shutdown()` is what works in practice — `library-docs.md` already shows this pattern, and the wrapper matches.

## Current state

Working:
- PostHog init boots the browser session once per app load
- `captureEvent`, `identifyUser`, `resetUser` work from Client Components
- `captureServerEvent` works from Server Actions and Route Handlers (no real call sites yet, but wrapper verified by build)
- Two auth events already fire through the wrappers: `login_provider_selected` (LoginButtons), `logout_requested` + identify/reset (AuthAwareCTAs)
- Lint, typecheck, build all clean

Not done (deliberately deferred):
- Wire-up of `job_search_started`, `job_found`, `profile_completed`, `company_researched` — call sites don't exist yet, they ship with features 06 / 10 / 13
- Live verification that events arrive in PostHog — no browser session exercised this session
- `posthog-setup-report.md` followup items ("Runtime delivery and attribution remain unresolved") — still valid, untouched

## Next session starts with

**Feature 04 Database Schema.**

Before implementing:
1. Read `context/build-plan.md` Feature 04 block.
2. Confirm exact column types / nullability with the user if any field feels ambiguous (already in `architecture.md` but worth re-checking against the InsForge Postgres reality — e.g. `text[]` arrays, `jsonb` for `work_experience` / `education` / `company_research`).
3. Pick an RLS strategy — InsForge convention or project-specific. The plan says "Always filter by `user_id`" so RLS is the database-side enforcement, not just a code convention.

Implementation order to minimize churn:
1. Create tables in dependency order — `profiles` first (no FKs to project tables), then `agent_runs`, `jobs` (FK to `agent_runs`), `agent_logs` (FK to `agent_runs`). FK direction matters for InsForge PostgREST projection.
2. Create `resumes` storage bucket. Confirm path scheme: `resumes/{user_id}/resume.pdf`.
3. Add RLS policies on all 4 tables — owner-only read/write keyed on `auth.uid()` matching `user_id`.
4. Update `lib/insforge-server.ts` — no schema-side changes needed since the SDK treats `user_id` as a regular column.
5. Update `context/progress-tracker.md` with schema decisions.

After schema lands, the project is ready for **Phase 2 — Profile Page** (Feature 05 UI, 06 save logic).

## Open questions

- **RLS policy syntax for InsForge.** No InsForge skill is documented in `library-docs.md` (the file has sections for every other third party). Auth/middleware examples reference the SSR client but not policy authoring. May need to read InsForge docs or example policies to confirm the exact `auth.uid()` predicate form. Worth a quick `insforge_fetch-docs "instructions"` lookup at session start.
- **`work_experience` and `education` as `jsonb`** — the schema uses `jsonb` for these arrays-of-objects. The InsForge SDK surfaces `jsonb` as `unknown` unless typed. Worth deciding once how typed casts happen — fetch + cast in a wrapper, or trust + assert at call sites.
- **Whether `company_research` (jsonb on `jobs`) gets any RLS special-case.** Currently it's a column on a table that already has user-scoped RLS, so reading jobs implicitly gates research access. No issue expected, but it's the most complex jsonb shape in the schema — may want to validate the dossier JSON shape at insert time.
- **`posthog-setup-report.md` followup items still open.** "Runtime delivery and attribution remain unresolved" and "Server-side attribution remains unresolved". Out of scope for this session (still relevant after Feature 04 — revisit whenever the first real PostHog dashboard query is needed).

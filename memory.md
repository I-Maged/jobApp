# Memory — Feature 02 Auth (complete; UI token system extended)

Last updated: 2026-07-31

## Status

Feature 02 Auth is feature-complete at the code level — callback Route Handler, server-owned OAuth flow, hardened actions, proxy gate with cookie short-circuit, double-submit-protected login buttons. **Live end-to-end sign-in still requires InsForge dashboard `allowedRedirectUrls` to include `/callback`.**

Two follow-on changes in this session: (a) post-review hardening of 5 high/medium issues; (b) addition of the `on-dark` design token and replacement of hardcoded `fill="#FFFFFF"` on icon paths with `currentColor`.

Next feature: **03 PostHog Initialization**.

## What was built (this session)

### Phase A — callback fix (first half)
- **Created** `app/(auth)/callback/route.ts` — GET Route Handler. Reads `insforge_code` query param + `insforge_pkce_verifier` cookie. Calls `createAuthActions({ baseUrl, anonKey, requestCookies: request.cookies, responseCookies: response.cookies })` → `auth.exchangeOAuthCode(code, verifier)`. Writes auth cookies onto `NextResponse.redirect('/dashboard')`. Deletes verifier cookie on success. On `!code || !verifier` or `error`, redirects to `/login?error=...`.
- **Edited** `components/homepage/Hero.tsx:9` — headline `text-text-darkest` → `text-text-primary`.

### Phase B — post-review hardening (second half)
- **`actions/auth.ts:31`** — `signInWithProvider` bails to `/login?error=signin` if `data.codeVerifier` is empty (was silently setting an empty cookie and bouncing through the provider round-trip).
- **`actions/auth.ts:63`** — `checkSessionAction` now delegates to `createInsforgeServer()` (single client-construction path). Errors logged via `console.warn` instead of silently swallowed. Removed unused `createServerClient` import.
- **`components/auth/LoginButtons.tsx`** — rewritten as a `"use client"` component. Each `SubmitButton` reads `useFormStatus().pending` from inside its own `<form>` to disable itself and swap its label to "Redirecting…" while in flight. Prevents Google↔GitHub double-submit races.
- **`components/auth/AuthButton.tsx`** — deleted (was a server component called with `disabled={false}`; no longer referenced).
- **`components/homepage/BottomCTA.tsx:8`** — headline `text-text-darkest` → `text-text-primary` (consistency with Hero).
- **`proxy.ts`** — short-circuits on cookie presence: checks `request.cookies.get("insforge_access_token")` first; missing → `/login` without calling `getCurrentUser()` (no InsForge round-trip for obviously-anonymous requests).
- **`context/architecture.md`** — folder tree updated (AuthButton removed).
- **`context/ui-registry.md`** — `AuthButton` entry deleted; `LoginButtons` entry updated to table form with `useFormStatus` pattern, icon path notes, and pending-label convention (`"Redirecting…"` Unicode ellipsis).
- **`context/progress-tracker.md`** — new decisions appended (cookie short-circuit, verifier guard, checkSessionAction dedupe, LoginButtons `useFormStatus`).

### Phase C — UI token system (`/imprint` follow-through)
- **`app/globals.css:30`** — added `--color-on-dark: #ffffff`. Generates Tailwind v4 utility `text-on-dark`.
- **`components/auth/LoginButtons.tsx:46,64`** — SVG paths switched from `fill="#FFFFFF"` to `fill="currentColor"`. The button parent class already includes `text-on-dark`, so the icon path inherits white via `currentColor`.
- **`context/ui-tokens.md`** — `on-dark` token documented in (1) the `@theme` mirror block, (2) a new "Text on Dark Surfaces" usage table with explicit "not interchangeable with `accent-foreground`" rationale.
- **`context/ui-registry.md`** — LoginButtons entry: `text-on-dark` (not `text-accent-foreground`), `fill="currentColor"`. The previously flagged hardcoded-hex inconsistency is resolved and the warning removed.

### Verified clean after each phase
`npx tsc --noEmit`, `npm run lint`, `rm -rf .next && npm run build` — all pass. Build output: `ƒ /callback`, `ƒ Proxy (Middleware)`. Compiled HTML shows `text-on-dark` reaching the rendered button class.

## What was already in place (kept from prior sessions)

Files (correct as-is):
- `lib/insforge-client.ts` — `createInsforgeBrowser()` factory using `createClient` from `@insforge/sdk`
- `lib/insforge-server.ts` — `createInsforgeServer()` factory using `createServerClient` from `@insforge/sdk/ssr`
- `lib/get-current-user.ts` — session read helper
- `proxy.ts` — Next.js 16 auth gate
- `app/(auth)/layout.tsx` — auth shell (logo + centered card on `bg-accent-muted`)
- `app/(auth)/login/page.tsx` — login page with `<LoginButtons />`
- `components/auth/LoginButtons.tsx` — client component, `useFormStatus`, `text-on-dark`, `currentColor` icons
- `components/auth/AuthAwareCTAs.tsx` — three variants (`hero`, `bottom`, `navbar`), reads session via `checkSessionAction()` on mount, Sign Out via `<form action={signOutAction}>`
- `actions/auth.ts` — `signInWithProvider` (with verifier guard), `signOutAction`, `checkSessionAction` (delegates to `createInsforgeServer`)

`app/(auth)/callback/page.tsx` was deleted in a prior session. `components/auth/AuthButton.tsx` was deleted this session.

## Decisions made (still valid)

- **OAuth flow is server-owned via `createAuthActions` from `@insforge/sdk/ssr`.** Browser client holds session in memory only and writes only the CSRF cookie; never the auth cookies. `proxy.ts` reads `insforge_access_token` / `insforge_refresh_token` via `createServerClient`.
- **PKCE verifier in httpOnly cookie** `insforge_pkce_verifier`, 10-min maxAge. Set in `signInWithProvider` (with empty-string guard), consumed in `/callback/route.ts`, deleted after exchange.
- **Login buttons use `<form action={serverAction}>`** not `onClick`. `SubmitButton` reads `useFormStatus` for per-button pending state.
- **`signOutAction()` uses `createAuthActions().signOut()`** which clears auth cookies via `clearAuthCookies`.
- **Next.js 16: `middleware.ts` → `proxy.ts`** at project root. Function name `proxy`, default Node.js runtime.
- **Login page matches marketing-site visual style** — centered card on `bg-accent-muted`, brand logo above, no marketing nav/footer.
- **Auth-gate redirects to `/login` only** — no `?next=` round-trip.
- **OAuth callback at `app/(auth)/callback/route.ts`** (GET Route Handler), NOT a page. Next.js 16 only permits cookie mutation in Server Actions and Route Handlers — Server Components cannot mutate cookies. SDK accepts `{ requestCookies, responseCookies }` for Route Handlers.
- **OAuth provider callback param name is `insforge_code`** (not `code`). Verified in `node_modules/@insforge/sdk/dist/ssr.mjs:1030`.
- **`proxy.ts` short-circuits on cookie presence** before calling `getCurrentUser()`.
- **Single client-construction path for `createInsforgeServer`** — `checkSessionAction` delegates; no duplicate `createServerClient({...})` blocks in app code.
- **`on-dark` design token** for any foreground (text, icon, divider) on a dark filled surface. NOT interchangeable with `accent-foreground` (different semantics: accent button text vs any-dark-surface text). SVG icons render white via `fill="currentColor"` + parent `text-on-dark`.

## Problems solved

- **Bug 1 (Session 1):** callback as Server Component reading session — stuck on "Signing you in…" because no cookies yet. Fixed by moving to Client Component.
- **Bug 2 (Session 1):** callback as Client Component — browser SDK exchanged in memory but server had no cookies; `proxy.ts` always saw "no user". Architecture fix: server-owned OAuth via `createAuthActions`.
- **Bug 3 (Session 2):** callback as Server Component calling `exchangeOAuthCode` — Next.js 16 runtime error: "Cookies can only be modified in a Server Action or Route Handler." Resolved by converting `page.tsx` → `route.ts` (GET Route Handler).
- **Review fix (this session):** `data.codeVerifier` empty-string would silently set empty cookie and bounce — now explicitly guarded.
- **Review fix (this session):** `BottomCTA` headline used `text-text-darkest` while `Hero` used `text-text-primary` — both now `text-text-primary`.
- **Review fix (this session):** Google/GitHub double-submit race — `LoginButtons` is now a client component using `useFormStatus`.
- **Review fix (this session):** `checkSessionAction` duplicated `createServerClient({...})` construction — now delegates to `createInsforgeServer()`, errors logged via `console.warn`.
- **Review fix (this session):** `proxy.ts` always hit InsForge even for anonymous requests — now short-circuits on cookie presence.
- **UI consistency (this session):** SVG icons hardcoded `fill="#FFFFFF"` — replaced with `fill="currentColor"` + parent `text-on-dark` token. New `--color-on-dark` token added to `app/globals.css` and documented in `context/ui-tokens.md`.
- **Cache stale reference to deleted `page.tsx`** — first `npx tsc --noEmit` after deleting `page.tsx` complained about `.next/dev/types/validator.ts`; resolved by `rm -rf .next`. Not a code issue.

## Current state

Build-time verified (re-verified after each of three phases this session):
- `npm run build` succeeds, `npx tsc --noEmit` passes, `npm run lint` passes
- Build route table: `○ /`, `○ /_not-found`, `ƒ /callback`, `○ /login`, `ƒ Proxy (Middleware)`
- Compiled HTML for `/login` confirms `text-on-dark` and `fill="currentColor"` reach the DOM

Runtime (expected, not live-verified):
- `signInWithProvider`, `signOutAction`, `checkSessionAction`, `/callback`, `proxy.ts` gate, double-submit protection, cookie short-circuit, verifier guard, icon token inheritance

Resolved this session:
- Hero headline color → `text-text-primary`
- BottomCTA background → `bg-accent-muted`
- BottomCTA headline color → `text-text-primary`
- OAuth icon fill → token-based via `text-on-dark` + `currentColor`

Not started:
- 03 PostHog Initialization
- 04 Database Schema
- All of Phase 2-5

## Next session starts with

**Phase 1 — closeout and next feature.**

Concrete steps:
1. Confirm with the user that `/callback` is in `allowedRedirectUrls` on the InsForge dashboard (both `http://localhost:3000/callback` and production URL).
2. Run `npm run dev`. Smoke-test sign-in end-to-end: button shows "Redirecting…" then submits → provider → `/callback` → `/dashboard`. Confirm auth cookies in DevTools. Confirm `proxy.ts` lets request through. Sign Out clears cookies and redirects to `/`.
3. Mark Feature 02 done in `context/progress-tracker.md`.
4. Begin **Feature 03 PostHog Initialization**.

Before starting Feature 03, read `context/build-plan.md` (already required by AGENTS.md) for the exact PostHog scope. Per AGENTS.md also load the PostHog skill from `node_modules/` (if available) and check `context/library-docs.md` for project-specific rules.

## Open questions

- **InsForge dashboard `allowedRedirectUrls`** — must include `/callback` for both `http://localhost:3000/callback` and the production URL. Cannot be verified from this environment.
- **Model is image-blind** — any future design reference must be transcribed as text. Two prior design references (homepage, jobs list) were delivered as text breakdowns rather than images.
- **AuthAwareCTAs hoist-to-context (deferred review item):** the three instances each call `checkSessionAction` independently on mount, and the navbar can show stale state after a server-action redirect. Lift session into a server-rendered `initialSignedIn` prop or shared context only if/when this becomes visible. Not blocking Feature 02 closeout.

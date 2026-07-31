# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** 1 — Foundation
**Last completed:** 03 PostHog Initialization
**Next:** 04 Database Schema

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [ ] 04 Database Schema

### Phase 2 — Profile Page

- [ ] 05 Profile Page — Full UI
- [ ] 06 Profile Save Logic
- [ ] 07 AI Profile Extraction from Resume
- [ ] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [ ] 09 Find Jobs Page — Full UI
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

---

## Notes

_Notes added during the build._

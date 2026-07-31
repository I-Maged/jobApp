# PostHog setup report

PostHog product analytics and client-side exception tracking were added to the Next.js App Router application, with authenticated browser identity, two explicit auth events, and a starter dashboard.

## Installed and initialized

- Added `posthog-js` `^1.409.5` to `package.json` and `package-lock.json` using npm. The unused `posthog-node` dependency was subsequently removed because no server instrumentation imports it.
- Initialized the browser SDK once in `instrumentation-client.ts`, the Next.js 16.2.12 initialization point.
- Initialization reads `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`, guards startup when either is unavailable, and emits development-only diagnostics for missing configuration while remaining a production no-op.
- `.env.example` documents both public environment keys; the real configured values were set in `.env` through wizard tools. No PostHog host or token is hardcoded in source.
- Default PostHog capture behavior was preserved. No CSP or reverse-proxy configuration was added because none existed in the project.

## Events instrumented

| Event | What it measures | File |
|---|---|---|
| `login_provider_selected` | A visitor starts OAuth sign-in by selecting an authentication provider; the bounded `provider` property distinguishes Google and GitHub. | `components/auth/LoginButtons.tsx` |
| `logout_requested` | An authenticated user actively signs out of JobPilot. | `components/auth/AuthAwareCTAs.tsx` |

Landing-page links remain covered by default autocapture rather than additional custom events. No server-side capture was added because the OAuth callback did not expose a verified authenticated user ID at its capture point.

## User identification

Identification was wired for browser sessions. `actions/auth.ts` returns the authenticated InsForge user's stable `id` plus optional email and profile name; `components/auth/AuthAwareCTAs.tsx` calls `posthog.identify` after session lookup, including email and name only as person properties. `posthog.reset()` runs before the existing sign-out action, after `logout_requested` is queued.

The login-start event is intentionally personless because it happens before authentication. Server-side events were not added, so server request-scoped attribution remains unimplemented. Runtime delivery and event attribution were not observed during this run.

## Error tracking

`instrumentation-client.ts` enables `capture_exceptions: true` in the guarded `posthog.init` configuration for global client-side exception autocapture. No additional error boundary or manual per-component capture was added. The run did not trigger an exception or observe an error event arriving in PostHog.

## Dashboard

[Analytics basics (wizard)](https://eu.posthog.com/project/237904/dashboard/865350) contains:

- Provider-segmented OAuth sign-in starts trend.
- Logout requests trend.
- Ordered authentication activity funnel.

The dashboard and its three insights were created successfully in PostHog. The insights may remain empty until the application sends events; no event arrival was verified by this run.

## What the run verified

- `npm install` completed and resolved the declared `posthog-js` dependency.
- `npm run build` completed successfully, including TypeScript checking and route generation.
- `npm run lint` exited cleanly.
- The configured PostHog environment keys were present in `.env`.
- The integration changes passed the recorded review for minimality, unrelated behavior, codebase patterns, and reference-example shape.

## What remains unconfirmed

A successful build and lint run prove compilation and static checks only. This run did **not** start the app, exercise OAuth or logout, or observe `login_provider_selected`, `logout_requested`, exception events, or any other event arriving in PostHog. The dashboard's data population is therefore unconfirmed.

## Follow-up issues

- **Runtime delivery and attribution remain unresolved.** No browser session was exercised, so it is unknown whether events reach PostHog in the deployed environment or whether the identified session is retained as intended. If left unresolved, the dashboard and funnel can remain empty or fragment activity across anonymous and identified users.
- **Server-side attribution remains unresolved.** No server-side PostHog client or request-scoped distinct ID was added. If future server events are introduced without an authenticated stable ID, those events cannot be reliably attributed to users.

## Build and dependency conflict

The final verification reported pre-existing npm peer-dependency override warnings for `@napi-rs/wasm-runtime` and `@emnapi` packages, plus 12 high-severity npm audit findings. These did not block installation, build, TypeScript checking, or lint. The initially installed `posthog-node` package was removed during review because no server instrumentation uses it; the event contract was unchanged.

## Before you merge

- [ ] Run the production build and confirm the generated integration remains valid: `instrumentation-client.ts:3-17`, `components/auth/LoginButtons.tsx:1-18`, and `components/auth/AuthAwareCTAs.tsx:1-60`.
- [ ] Run the test suite and update any mocks or fixtures affected by the new captures and session identity calls: `components/auth/LoginButtons.tsx:9` and `components/auth/AuthAwareCTAs.tsx:24-28,43-46`.
- [ ] Set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` in every deploy environment, matching `.env.example`; do not rely only on the local `.env` (`instrumentation-client.ts:3-4`).
- [ ] With a real browser session, exercise OAuth start and logout and confirm `login_provider_selected` and `logout_requested` arrive in PostHog and appear in the [dashboard](https://eu.posthog.com/project/237904/dashboard/865350) (`components/auth/LoginButtons.tsx:9`, `components/auth/AuthAwareCTAs.tsx:44`).
- [ ] With an authenticated returning session, confirm `posthog.identify` runs after refresh and that logout resets the session (`components/auth/AuthAwareCTAs.tsx:20-31,43-47`).

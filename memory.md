# Memory — Whole-Project Testing Suite (In Progress)

Last updated: 2026-08-06

## What was built

Testing plan approved and saved at `.kilo/plans/1785988853505-testing-plan.md` (Vitest; fully-mocked integration; unit + integration + component tests; no Playwright E2E). Implementation started:

- **Tooling (Phase A, done):** Installed `vitest@4`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react|jest-dom|user-event`, `@vitejs/plugin-react`, `vitest-mock-extended`. Created `vitest.config.mts` (renamed from `.ts` to silence the CJS/ESM loader warning), `tests/setup.ts` (jest-dom + cleanup + restore mocks/fake timers), scripts `test` / `test:watch` / `test:coverage` in `package.json`. `/coverage` already in `.gitignore`.
- **Testability refactor (Phase B, done):** New `lib/jobs-insert.ts` — `formatSalary`, `mapToJobInsert` extracted from `app/api/agent/find/route.ts` (route now imports them; also fixed a dangling `Job` type import). Exported private pure helpers: `csvToArr`/`parseYears` (`actions/profile.ts`), `formatTimeAgo`/`toDayKey`/`buildCountSeries`/`buildMatchDistribution`/`buildMatchDistributionQuery` (`lib/dashboard-data.ts`), `stripSubdomain`/`isPrivateIp`/`isBlockedHost`/`isSafeHttpUrl`/`deriveHomepageUrl`/`pickSubPages`/`buildUserPrompt`/`mergeSources`/`asDossier` (`agent/research.ts`).
- **Fixtures + helpers (Phase B, done):** `tests/fixtures/profiles.ts` (`makeProfile`, `makeMinimalProfile`, `makeWorkRole`), `tests/fixtures/jobs.ts` (`makeJob`, `makeAdzunaJob`, `makeScoredJob`), `tests/fixtures/dossiers.ts` (`makeDossier`). `tests/helpers/insforge-mock.ts` (`createMockInsforgeClient` — query chains log to `__queries`, per-table FIFO results via `setQueryResults`; storage bucket chain; `mockUser`, `okData`, `errData`), `tests/helpers/request.ts` (`makeNextRequest`).
- **Unit tests written & passing (Phase C, partial — 29 tests):** `lib/utils.test.ts`, `lib/jobs-view.test.ts`, `lib/completion.test.ts`, `lib/profile-extract.test.ts`.

## Decisions made

- **Vitest 4 removed `environmentMatchGlobs`** — component tests will use the per-file `// @vitest-environment jsdom` pragma instead of a config glob.
- **Fully-mocked integration**: InsForge SDK, Adzuna, OpenRouter, Browserbase/Stagehand, PostHog all stubbed at module level; no live backends/credentials.
- `makeMinimalProfile` mirrors real `fetchProfile` output (education cleared, `remotePreference: "any"`, `workAuthorization: "citizen"` defaults) — so a fresh profile yields **10 missing labels → 9%**, not 0%.
- Coverage thresholds (global): lines/statements/functions 70, branches 60; exclusions include `lib/stagehand.ts`, `lib/browserbase.ts`, `lib/insforge-client.ts`, `proxy.ts`, `instrumentation-client.ts`, `app/layout.tsx`, `components/profile/ResumeTemplate.tsx`.

## Problems solved

- **`remotePreference: ""` is a TS error** — `Profile` type excludes `""`; tested the falsy-guard with a casted object instead of a typed override.
- **Minimal-profile fixture bug**: originally inherited complete `education` (only 9 missing → 18%), fixed by building the profile literally.
- **Stale `.next` broke `tsc`**: `.next/types/validator.ts` referenced deleted debug routes; deleted the `.next` dir (regenerates on next build).
- **Pre-existing TS error in `agent/research.ts`**: `fetch(target)` with `URL | null` — fixed with `if (target && (await isSafeHttpUrl(target)))`.
- **PowerShell execution policy blocks `npm`/`npx`** — always use `npm.cmd` / `npx.cmd`.

## Current state

`npm.cmd test` passes 29 tests (4 unit files). `npx.cmd tsc --noEmit` clean. Phase C not finished; Phases D–G not started.

## Next session starts with

1. Finish Phase C unit tests: `agent/research-helpers.test.ts` (mock `node:dns/promises` + global `fetch` for `isBlockedHost`/`deriveHomepageUrl`), `lib/jobs-insert.test.ts`, `actions/profile-helpers.test.ts`, `lib/dashboard-helpers.test.ts` (pin time with `vi.useFakeTimers`).
2. Phase D mocked unit tests: `agent/adzuna.test.ts`, `agent/matcher.test.ts` (mock `@/lib/ai`), `lib/resume-generate.test.ts`, `lib/posthog-server.test.ts`, `lib/posthog-client.test.ts`, `lib/dashboard-data.test.ts`, `lib/profile-data.test.ts`, `lib/jobs-data.test.ts`.
3. Phase E component tests (jsdom pragma + mock `next/navigation`, `next/link`, `@/lib/posthog-client`).
4. Phase F integration tests in `tests/integration/`: agent/find, agent/research, resume upload/extract/generate, profile action, auth actions. Mock `next/cache` (`revalidatePath`); stub `fs.readFileSync`/`pdf-parse` for `ensureWorker`; mock `@react-pdf/renderer`.
5. Phase G: full verify (`npm.cmd test`, `npx.cmd tsc --noEmit`, `npm.cmd run lint`, `npm.cmd run build`), then update `context/progress-tracker.md`.

## Open questions

- None blocking. Coverage thresholds may need adjustment after the AI/browser-heavy paths (research orchestration) drag the global numbers down.

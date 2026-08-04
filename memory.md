# Memory — AI Provider Switch to OpenRouter + Feature 13 Live Verification

Last updated: 2026-08-04

## What was built

- **`lib/ai.ts`** (new) — single source for all model calls. Reads `OPENROUTER_API_KEY` (required), `AI_MODEL` (default `google/gemma-4-26b-a4b-it:free`), `AI_BASE_URL` (default `https://openrouter.ai/api/v1`). Exports memoized `openai()` (60s timeout) and `openaiFast()` (15s) accessors plus `getAiApiKey()` — lazy on purpose: a missing key fails at request time, never at `next build`.
- **All 5 AI call sites switched off OpenAI:** `agent/matcher.ts`, `agent/research.ts` (synthesis), `app/api/resume/extract/route.ts`, `lib/resume-generate.ts` use `model: AI_MODEL` from `@/lib/ai`; `lib/stagehand.ts` passes `modelName: "openai/<AI_MODEL>"` + `apiKey: getAiApiKey()` + `baseURL` + `openaiEndpointFormat: "chat"`.
- **Docs synced:** `library-docs.md` (Stagehand init + "AI Model — OpenRouter" section replacing "OpenAI GPT-4o"), `architecture.md` Company Research Pattern, `code-standards.md` env table, `.env.example`, `progress-tracker.md` decision entry "13 Company Research Agent — AI Provider Switch".
- **`OPENROUTER_API_KEY` added to `.env.local`** by the user (copied from InsForge dashboard). Value never stored in docs/memory.

## Decisions made

- **OpenRouter replaces OpenAI** (user choice). Root cause of the switch: OpenAI account returns `429 insufficient_quota` (billing, not rate limit) on every call. Model is Gemma 4 free; model swaps are env-only (`AI_MODEL`) with zero code changes.
- **Stagehand v3 provider routing (verified in `LLMProvider.js`):** any model name containing `/` routes through the AI-SDK providers — a raw `google/gemma-…` ID would hit Google's API, not OpenRouter. Prefixing with `openai/` + `openaiEndpointFormat: "chat"` forces `createOpenAI({ baseURL, apiKey })` chat-completions to OpenRouter with the real `google/gemma-…` ID. Also kills the `gpt-4o` deprecation warning.
- **No module-scope env throw in `lib/ai.ts`** — the original throw broke `next build` page-data collection for `/api/agent/find`; lazy accessors are the fix.
- **Adzuna keys were never wrong** — my test harness had an off-by-one (`Substring(13)` on a 13-char name included the `=`). App reads `process.env` directly and is unaffected. Same bug bit me once on `OPENROUTER_API_KEY=` (19 chars, value starts at index 19).

## Problems solved

- OpenAI `429 insufficient_quota` unblocked: all AI features now run on OpenRouter free Gemma 4. Smoke test + full research test both returned 200.
- **Full research end-to-end works** (temp route, mock Stripe job): Browserbase session created, dossier synthesized with all 9 fields, well-grounded content, ~20s total.
- **Adzuna `redirect_url` returns 403 to server-side fetch** (bot protection; confirmed with curl AND Node undici). `deriveHomepageUrl` therefore always uses the company-name fallback for Adzuna rows — verified it produces valid homepages (`dollargeneral.com`, `saab.com`). The redirect-follow path is effectively dead for Adzuna jobs; behavior is acceptable (by design graceful degradation).

## Current state

- tsc, eslint, `next build` all clean with the OpenRouter switch.
- **Feature 13 research chain mostly verified:** auth gate 401 ✓, Browserbase session ✓, OpenRouter gemma-4 synthesis ✓ (returns complete dossier).
- **Known broken / in progress:** browser extraction inside research FAILS with `Validation failed` at `page.goto` (agent/research.ts:267) — navigation throws right after the Browserbase session starts; research degrades to job+profile-only synthesis (still returns 200 with a good dossier, but `sources` has no URLs). The previous OpenAI run reached the extract step with the same options, so the model config is implicated. A diagnostic route `app/api/debug/stagehand-diag/route.ts` is written and UNTESTED — it navigates to example.com and returns the full error stack/cause.
- **Temp debug routes exist (delete before commit):** `app/api/debug/research-test/route.ts`, `app/api/debug/stagehand-diag/route.ts`.
- Dev server running on :3000 (must restart to pick up `.env.local` changes). Everything uncommitted (working tree).
- Also noticed: InsForge backend `allowedRedirectUrls: []` (Feature 02 auth callback whitelist still unconfirmed); search results still not deduped (open since Feature 11).

## Next session starts with

Run `POST /api/debug/stagehand-diag` and read the full stack of the `Validation failed` error at `page.goto`. Likely suspects: Stagehand's a11y-snapshot-at-navigation path calling the model via the AI-SDK openai provider and getting output the schema rejects, or the model string/`openaiEndpointFormat` combo needs adjusting (e.g. try `openaiEndpointFormat` omitted → Responses API, or a different free model like `google/gemma-4-31b-it:free`). Fix so browser extraction completes, then re-run the full research test and confirm `sources` contains real URLs. After that, delete the two `app/api/debug/*` routes, verify the live UI flow (scored job → Research Company → dossier renders + idempotency + `company_researched` PostHog event), then start Feature 14 — Dashboard Page Full UI.

## Open questions

- Root cause of `Validation failed` at `page.goto` — in progress.
- `allowedRedirectUrls` empty on InsForge backend — OAuth callback may need whitelisting before production login works.
- Search result dedupe (Feature 11).
- Browserbase free-plan single-session limit may matter if concurrent research is added.

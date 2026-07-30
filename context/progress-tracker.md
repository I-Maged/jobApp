# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** 1 — Foundation
**Last completed:** 01 Homepage (UI)
**Next:** 02 Auth — InsForge Google + GitHub OAuth

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [ ] 02 Auth
- [ ] 03 PostHog Initialization
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

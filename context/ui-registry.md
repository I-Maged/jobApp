# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Logo — `components/layout/Logo.tsx`

Purple-gradient square (10px radius, 36x36 default) with white shield icon + "JobPilot" wordmark.

```tsx
<Logo href="/" size="sm" | "md" | "lg" showText={true} />
```

Classes:
- Wrapper: `flex items-center gap-2`
- Square: `h-9 w-9 rounded-[10px] flex items-center justify-center` — gradient `linear-gradient(45deg, #7C5CFC 0%, #4A2EC5 100%)`
- Icon: white stroke, viewBox 0 0 24 24, h-5 w-5
- Text: `font-bold text-[19px] text-text-darkest leading-7`

### Navbar — `components/layout/Navbar.tsx`

Sticky white top bar. Logo left, nav links center (md+), CTA right.

- Wrapper: `sticky top-0 z-50 w-full bg-surface border-b border-border`
- Inner: `mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6`
- Nav link active: `text-sm font-medium text-accent`
- Nav link inactive: `text-sm font-medium text-text-dark hover:text-text-primary`
- CTA button: `inline-flex items-center justify-center rounded-md bg-text-darkest px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-overlay transition-colors`

### Footer — `components/layout/Footer.tsx`

White surface, top border. Logo left, footer links center, copyright right (md+).

- Wrapper: `w-full bg-surface border-t border-border`
- Inner: `mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row`
- Link: `text-sm font-medium text-text-dark hover:text-text-primary transition-colors`
- Copyright: `text-xs text-text-muted`

### Hero — `components/homepage/Hero.tsx`

Centered headline + subhead + 2 buttons + framed dashboard screenshot.

- Section: `w-full bg-background`
- Inner: `mx-auto max-w-[1440px] px-8 pt-20 pb-16 md:pt-28 md:pb-20`
- Headline wrapper: `mx-auto flex max-w-3xl flex-col items-center text-center`
- Headline: `text-4xl font-bold leading-tight tracking-tight text-text-darkest md:text-6xl`
- Subhead: `mt-6 max-w-2xl text-base leading-6 text-text-secondary md:text-lg md:leading-7`
- Button row: `mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4`
- Primary button: `inline-flex items-center justify-center gap-2 rounded-md bg-text-darkest px-5 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-overlay`
- Secondary button: `inline-flex items-center justify-center rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary`
- Preview image wrapper: `mt-16 md:mt-20`
- Preview frame: `overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_48px_-12px_rgba(16,24,40,0.18)]`

### FeatureSection1 — `components/homepage/FeatureSection1.tsx`

Section heading + 2-col grid (features left, jobs table preview right).

- Section: `w-full bg-background`
- Inner: `mx-auto max-w-[1440px] px-8 py-20 md:py-24`
- Heading block: `mx-auto mb-14 max-w-2xl text-center md:mb-16`
- Heading: `text-3xl font-bold leading-tight tracking-tight text-text-darkest md:text-4xl`
- Grid: `grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16`
- Feature icon wrapper: `mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full` — gradient `linear-gradient(45deg, rgba(124,92,252,0.15) 0%, rgba(74,46,197,0.15) 100%)`
- Feature icon path stroke: `#7C5CFC` width 2.5
- Feature title: `text-base font-semibold leading-6 text-text-primary`
- Feature body: `text-sm leading-6 text-text-secondary`

### JobsTablePreview — `components/homepage/JobsTablePreview.tsx`

Mock jobs table card with 6 rows.

- Wrapper: `overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_48px_-12px_rgba(16,24,40,0.12)]`
- Thead row: `border-b border-border bg-surface-secondary`
- Th: `px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary`
- Body row: `border-b border-border last:border-b-0 transition-colors hover:bg-surface-secondary`
- Cell: `px-5 py-4 text-sm font-medium text-text-primary` (company)
- Score: `text-sm font-semibold tabular-nums` — color by range (success/info/warning)
- Bar track: `h-1 w-20 overflow-hidden rounded-full bg-border-light`
- Bar fill: `h-full rounded-full` — color by range
- Salary cell: `px-5 py-4 text-sm text-text-secondary tabular-nums`
- Source badge (LinkedIn): `bg-linkedin-light text-linkedin`
- Source badge (URL): `bg-surface-secondary text-text-secondary`
- All badges: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium`

### FeatureSection2 — `components/homepage/FeatureSection2.tsx`

Section heading + 2-col grid (agent log left, features right) on white surface.

- Section: `w-full bg-surface`
- Inner: `mx-auto max-w-[1440px] px-8 py-20 md:py-24`
- (same heading + grid + feature classes as FeatureSection1)

### AgentLog — `components/homepage/AgentLog.tsx`

Dark terminal-style mock window with traffic-light dots, filename header, color-coded log lines.

- Wrapper: `overflow-hidden rounded-2xl bg-overlay-dark shadow-[0_24px_48px_-12px_rgba(16,24,40,0.25)]`
- Title bar: `flex items-center gap-2 border-b border-white/10 px-4 py-3`
- Traffic dots: `h-3 w-3 rounded-full` — `bg-error` / `bg-warning` / `bg-success`
- Filename: `ml-3 font-mono text-xs text-text-muted`
- Body: `px-5 py-6 font-mono text-sm leading-7`
- Line colors: `[SYSTEM]` → `text-info`, `[SCAN]` → `text-accent`, sub-step → `text-text-muted` w/ `pl-8`, `[ACTION]` → `text-success`, `...` → `text-warning`
- Cursor: `mt-2 inline-block h-4 w-2 animate-pulse bg-text-muted`

### Testimonial — `components/homepage/Testimonial.tsx`

Centered quote, decorative quote icon, avatar + name + role.

- Section: `w-full bg-background`
- Inner: `mx-auto max-w-[1440px] px-8 py-20 md:py-24`
- Content wrapper: `mx-auto max-w-3xl text-center`
- Quote icon: `mx-auto h-10 w-10 text-accent`
- Quote: `mt-8 text-2xl font-medium leading-snug text-text-primary md:text-3xl`
- Avatar wrapper: `relative h-12 w-12 overflow-hidden rounded-full border border-border`
- Name: `text-sm font-semibold text-text-primary`
- Role: `text-xs text-text-secondary`

### BottomCTA — `components/homepage/BottomCTA.tsx`

Centered CTA card with accent-muted background.

- Section: `w-full bg-surface`
- Inner: `mx-auto max-w-[1440px] px-8 py-20 md:py-24`
- Card: `mx-auto max-w-3xl rounded-2xl bg-accent-muted px-8 py-16 text-center md:px-12`
- Headline: `text-3xl font-bold leading-tight tracking-tight text-text-darkest md:text-4xl`
- Subhead: `mt-4 text-base leading-6 text-text-secondary md:text-lg`
- Button row: delegated to `<AuthAwareCTAs variant="bottom" />`

### AuthAwareCTAs — `components/auth/AuthAwareCTAs.tsx`

Client Component that reads auth state on mount and renders different CTAs per variant.

- Variants: `"hero"`, `"bottom"`, `"navbar"`
- Container (hero): `mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4`
- Container (bottom): `mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4`
- Primary button: `inline-flex items-center justify-center gap-2 rounded-md bg-text-darkest px-5 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-overlay`
- Secondary button: `inline-flex items-center justify-center rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary`
- Navbar variant: `inline-flex items-center justify-center rounded-md bg-text-darkest px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-overlay`
- Loading placeholder (navbar): `inline-flex h-9 w-24 items-center justify-center rounded-md bg-text-darkest px-4 py-2 text-sm font-medium text-accent-foreground opacity-60`
- Label switch on auth — signed in: "Open Dashboard" / "Find Your Next Match" / "Sign Out"; signed out: "Get Started" / "Find Your First Match" / "Start For Free"

### LoginButtons — `components/auth/LoginButtons.tsx`

File: `components/auth/LoginButtons.tsx`
Last updated: 2026-07-31

Client component. Two stacked OAuth submit buttons (Google + GitHub). Each button reads `useFormStatus().pending` from inside its own `<form>` to disable itself and swap its label to "Redirecting…" while the form is in flight, preventing double-submits.

| Property         | Class |
| ---------------- | ----- |
| Background       | `bg-text-darkest` |
| Border           | none |
| Border radius    | `rounded-md` |
| Text — primary   | `text-accent-foreground` (on the dark button) |
| Text — label     | `text-sm font-medium` |
| Spacing          | container `flex flex-col gap-3`; button `inline-flex items-center justify-center gap-3 px-5 py-3 w-full` |
| Hover state      | `hover:bg-overlay` |
| Disabled state   | `disabled:cursor-not-allowed disabled:opacity-60` |
| Transition       | `transition-colors` |
| Shadow           | none |
| Accent usage     | none |

**Icon (Google "G" / GitHub Octocat)**
- Inline SVG, `h-5 w-5`, `fill="currentColor"` — picked up from the button's `text-on-dark` utility (no raw hex on the path)
- `aria-hidden="true"`, `xmlns="http://www.w3.org/2000/svg"`, `viewBox="0 0 24 24"`

**Pattern notes:**
- The button is a **full-width dark filled button** (the inverse of the marketing site's outline / light buttons). Match this weight when adding more OAuth providers.
- Label uses `text-on-dark`, not `text-accent-foreground`. See `ui-tokens.md` "Text on Dark Surfaces" — these tokens are not interchangeable.
- `useFormStatus` must be read inside the `<form>` it controls — keep `SubmitButton` nested under the form, not hoisted out.
- Pending label uses a Unicode ellipsis `"Redirecting…"`, not three dots.
- The previous standalone `AuthButton.tsx` was deleted; `LoginButtons` is now self-contained.

**Pattern notes:**
- The button is a **full-width dark filled button** (the inverse of the marketing site's outline / light buttons). Match this weight when adding more OAuth providers.
- `useFormStatus` must be read inside the `<form>` it controls — keep `SubmitButton` nested under the form, not hoisted out.
- Pending label uses a Unicode ellipsis `"Redirecting…"`, not three dots.
- The previous standalone `AuthButton.tsx` was deleted; `LoginButtons` is now self-contained.

### AuthLayout — `app/(auth)/layout.tsx`

Centered shell for login + callback routes. No nav/footer, brand logo above the card.

- Wrapper: `flex min-h-full flex-1 flex-col items-center justify-center bg-background px-6 py-12`
- Logo block: `mb-8`

---

## Phase 3 — Find Jobs Components (imprinted 2026-08-03)

### SearchControls — `components/find-jobs/SearchControls.tsx`

File: `components/find-jobs/SearchControls.tsx`
Last updated: 2026-08-03

Client Component (will own controlled state in Feature 10). Search card at the top of `/find-jobs` with Job Title input (Search icon inside, left-aligned), Location input, disabled Find Jobs button, and a static green success banner.

| Property              | Class |
| --------------------- | ----- |
| Card                  | `rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]` |
| 3-col grid            | `grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto]` |
| Field wrapper         | `flex flex-col gap-2` |
| Label                 | `text-xs font-medium uppercase tracking-wide text-text-secondary` |
| Input (no icon)       | `block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent` |
| Icon-input wrapper    | `relative`, inner `<Search>` icon `absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted`, input uses `pl-10 pr-3` |
| Find Jobs button      | `inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60` |
| Success banner        | `rounded-md border border-success-lightest bg-success-lightest px-4 py-2.5 text-sm font-medium text-on-success-tint` |

**Pattern notes:**
- Two input variants: iconless Location uses the same baseline class only; icon Title wraps the `<Search />` absolutely and pads the input left to `pl-10`.
- Find Jobs button is fixed-height `h-10` and bottom-aligned via `sm:items-end` wrapper (`flex items-end`) so the button sits baseline-flush with the inputs.
- Button is disabled in Feature 09 (`title="Find Jobs lands in Feature 10"`) — mirrors the Feature 05 CTA convention.
- Success banner uses the new `text-on-success-tint` token — not `text-accent`/`text-success`, which are below WCAG AA against `bg-success-lightest`. See `ui-tokens.md` "Text on Tinted Backgrounds".

### JobsTable — `components/find-jobs/JobsTable.tsx`

File: `components/find-jobs/JobsTable.tsx`
Last updated: 2026-08-03

Client Component. Single bordered surface card containing (a) the filter bar as a top strip separated by a bottom border, (b) the jobs table, (c) horizontally-scrollable overflow on narrow viewports. Filter + sort inputs are inert-controlled (no state) — Feature 11 will wire them.

| Property              | Class |
| --------------------- | ----- |
| Card                  | `flex flex-col gap-0 rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]` — overflow handled per-region |
| Filter bar            | `flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center` |
| Filter text input     | same as SearchControls input class |
| Filter/sort `<select>`| `block w-32 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent` |
| Table scroller        | `overflow-x-auto` wrapper div |
| Table                 | `w-full border-collapse` |
| THead row             | `border-b border-border bg-surface-secondary` |
| Th                    | `px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary` |
| Body row              | `border-b border-border transition-colors hover:bg-surface-secondary last:border-b-0` |
| Cell (base)           | `px-5 py-4` |
| Company cell          | + `text-sm font-medium text-text-primary` |
| Role cell             | + `text-sm text-text-primary` |
| Salary cell           | + `text-sm text-text-secondary tabular-nums` |
| Date cell             | + `text-xs text-text-muted` |
| Score wrapper         | `flex items-center gap-3` |
| Score %               | `text-sm font-semibold tabular-nums` colored via `getScoreColor` — ≥80 `text-success`, ≥60 `text-info`, else `text-warning` |
| Score bar track       | `h-1 w-20 overflow-hidden rounded-full bg-border-light` |
| Score bar fill        | `h-full rounded-full` colored via `getScoreBarColor`, inline `style={{ width: \`${score}%\` }}` |
| Source badge          | `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium` + `bg-linkedin-light text-linkedin` for LinkedIn, `bg-surface-secondary text-text-secondary` for URL |

**Pattern notes:**
- Filter bar lives INSIDE the table card (border-b separator), not as a separate card. Visually one surface; functionally three inputs above the rows.
- Plain `<select defaultValue>` elements with no `onChange` — purely presentational in Feature 09, wired in Feature 11.
- Mock job data covers all three score bands (96/94/91/88 green, 72 blue, 58 orange) so every color path renders in the static shell.
- `matchScore` thresholds come from `ui-rules.md` (80/60), NOT from `components/homepage/JobsTablePreview.tsx` (90/70) — intentional deviation; the homepage preview predates the rule clarification.
- No `onClick` / no row navigation in Feature 09 — clicking a row is a no-op; Feature 12 owns the Link-out to `/find-jobs/[id]`.

### JobsPagination — `components/find-jobs/JobsPagination.tsx`

File: `components/find-jobs/JobsPagination.tsx`
Last updated: 2026-08-03

Client Component. Static "Showing 1 to 6 of 24 results" left, page-button cluster right.

| Property              | Class |
| --------------------- | ----- |
| Wrapper               | `flex flex-col items-center justify-between gap-4 sm:flex-row` |
| Summary text          | `text-sm text-text-secondary` with inner `font-medium text-text-primary` numerals |
| Button cluster        | `flex items-center gap-0 rounded-md border border-border bg-surface` |
| Prev/Next button      | `flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50` |
| Page-number button    | `border-l border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary` |
| Current page button   | `border-l border-border bg-accent-muted px-3 py-1.5 text-sm font-medium text-on-accent-tint` |

**Pattern notes:**
- Buttons sit flush with no gaps (`gap-0`), separated by `border-l border-border` on every button except the first.
- Current page uses `bg-accent-muted text-on-accent-tint` (NOT `text-accent` on `bg-accent-muted`, see `ui-tokens.md` "Text on Tinted Backgrounds"). Accent only used for the tint highlight — never the button surface color itself.
- Previous disabled on the first (and only) page in the mock; Feature 11 will wire real pagination.
- Icons are `lucide-react` (`ChevronLeft`, `ChevronRight`) at `h-4 w-4`.

---

## Phase 2 — Profile Components (imprinted 2026-08-01)

### ProfileBanner (inline header in `app/profile/page.tsx`)

File: `app/profile/page.tsx` (inline, not its own component)
Last updated: 2026-08-01 (imprinted); rewired 2026-08-01 (Feature 06 — headline swaps between "Profile needs attention" and "Profile complete" based on `calculateCompletion(profile).isComplete`)

Top-of-page "needs attention" header card. Card surface + layout. Not factored to its own component — kept inline in the page because it composes `<CompletionIndicator />` and the page-level headline.

- Card: `rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]`
- Inner row: `flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`
- Headline: `text-xl font-semibold leading-7 text-text-primary` — text content driven by `completion.isComplete`
- Body: `max-w-2xl text-sm leading-5 text-text-secondary` — body text swaps to "Tailored matches and resume generation are unlocked." once complete

### CompletionIndicator — `components/profile/CompletionIndicator.tsx`

File: `components/profile/CompletionIndicator.tsx`
Last updated: 2026-08-01

Horizontal pill: circular ring on the left, percent + missing-field tags on the right. Used in the profile banner header.

| Property         | Class |
| ---------------- | ----- |
| Container        | `flex flex-col gap-3 rounded-xl border border-border bg-surface-secondary p-4 sm:flex-row sm:items-center sm:gap-5` |
| Ring SVG         | size 72, stroke 6, `fill-none stroke-border-light` track + `fill-none stroke-accent transition-[stroke-dashoffset] duration-500` fill, `stroke-linecap="round"`, rotated -90deg |
| Ring label       | `text-sm font-semibold text-text-primary tabular-nums` |
| Side label (sm- ) | `text-xs font-medium text-text-secondary` |
| Missing label    | `text-xs font-medium text-text-secondary` |
| Missing tag      | `inline-flex items-center rounded-full bg-accent-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent` |
| All-filled text  | `text-xs font-medium text-success-foreground` |

**Pattern notes:**
- Missing-field tags deliberately use the missing-skill token (`bg-accent-muted` / `text-accent`) even though the design text description reads "red". The accent-muted token is the closest "highlight that draws attention without violating the no-raw-color-classes rule" in `ui-tokens.md`.
- Ring fill animates over 500ms when the percent changes — a single `transition-[stroke-dashoffset]` on the inner circle.
- Ring is rendered as inline SVG (not div ring), so the percent label sits absolutely centered inside an `absolute inset-0` wrapper.

### ResumeUpload — `components/profile/ResumeUpload.tsx`

File: `components/profile/ResumeUpload.tsx`
Last updated: 2026-08-02 (Feature 08 — Generate Resume button live; `generatePending`/`generateStatus`/`generatedUrl` state; local `generatedUrl` overrides the `resumeUrl` prop so "View current resume" updates without a reload)

Standalone section card. Drag-and-drop upload area with hidden file input, "View current resume" link (when uploaded) + Generate Resume CTA in a footer row. Generate Resume is live in Feature 08 — POSTs to `/api/resume/generate` with an empty body.

| Property         | Class |
| ---------------- | ----- |
| Card             | `rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]` |
| Heading          | `text-base font-semibold leading-6 text-text-primary` |
| Subheading       | `mt-1 text-sm leading-5 text-text-secondary` |
| Drop zone        | `mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-surface-secondary px-6 py-10 text-center transition-colors` |
| Drop zone idle   | `border-border-light hover:border-accent` |
| Drop zone active | `border-accent bg-accent-muted` |
| Dropzone icon    | `h-7 w-7 text-text-muted` (upload SVG, `stroke="currentColor"`, strokeWidth 1.5) |
| Dropzone prompt  | `text-sm font-medium text-text-primary` |
| Dropzone hint    | `text-xs text-text-muted` |
| Filename chip    | `mt-1 inline-flex items-center gap-1.5 rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent` (chip shows a spinner SVG while pending) |
| Dropzone error   | `mt-1 text-xs font-medium text-error` (rendered under the chip when upload fails) |
| Footer row       | `mt-4 flex items-center justify-between gap-3` |
| Footer copy      | `text-xs text-text-muted` (left-aligned; if uploaded, contains a `text-accent` "View current resume" link with `target="_blank" rel="noopener noreferrer"`) |
| Generate CTA     | `inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60` (live; disabled while `generatePending` or after `generated`; label swaps "Generating…" / "Resume Generated") |
| Pending spinner  | inline SVG `h-3 w-3 animate-spin`, `stroke="currentColor"`, `stroke-width="2"`, `fill="none"`, path draws a 270deg arc |

**Pattern notes:**
- The drag-and-drop label is a `<label>` wrapping a hidden `<input type="file">` — click anywhere in the zone opens the picker. Both click-to-pick and drop events run through a single `handleFile` → `useTransition` → `fetch('/api/resume/upload', { method: 'POST', body: formData })` path. No Server Action involvement — see decision in 06.
- File input `e.target.value = ""` reset after each change — same file can be re-picked (e.g. after a failed upload) without forcing the user to rename.
- "View current resume" is a plain `<a>` link to `resume_pdf_url` opened in a new tab — not a `ResumePreview.tsx` component. The bucket is public but path-scoped via `storage_resumes_owner_all` RLS in `architecture.md`.
- `Generate Resume from Profile` is live (Feature 08). `handleGenerate` runs its own `useTransition` and POSTs an empty body to `/api/resume/generate`; on success `generatedUrl` state overrides the `resumeUrl` prop so the footer link updates immediately. The DB write persists it for the next page load.
- Pending state during upload: drop zone disabled (`<input disabled={pending}>`), chip shows the spinner. On success: parent `revalidatePath('/profile')` re-runs page so the just-persisted `resume_pdf_url` flows back as `resumeUrl` and the chip becomes the steady filename.

### ResumeTemplate — `components/profile/ResumeTemplate.tsx`

File: `components/profile/ResumeTemplate.tsx`
Last updated: 2026-08-02 (Feature 08 — PDF Document template)

Server-side-only `@react-pdf/renderer` document. **Not a Tailwind component** — styling is `StyleSheet.create` props (verified against v4.5.1: padding/margin, fontSize, color, fontFamily, flexDirection, fontWeight, textAlign, lineHeight, backgroundColor, gap, textTransform, letterSpacing, textIndent). Never imported in client components.

- `Document` → single `Page size="A4"` (padding 48, `fontFamily: "Inter"`, fontSize 11)
- Header: centered full name (22, bold) + contact row (email/phone/location/LinkedIn/portfolio, 9pt, muted, joined with gaps)
- Sections each preceded by a 1px `#e5e7eb` divider: Professional Summary (accent, uppercase, letterSpacing 1.5), Professional Experience (role title bold + company ` | ` + date range), Skills (chips, `#f3f4f6` bg), Education (degree/field `~` institution, `,` year)
- Inter 400/700 registered at module scope from the Google Fonts v20 latin variable-font URL (`fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2`)
- Props: `{ profile: Profile, summary: string, experience: Array<{company, title, startDate, endDate, current, bullets}> , resumeSkills: string[] }`

### ProfileForm — `components/profile/ProfileForm.tsx`

File: `components/profile/ProfileForm.tsx`
Last updated: 2026-08-01 (imprinted); rewired 2026-08-01 (Feature 06 — accepts typed `initial` ProfileFormState prop, Save button calls Server Action via `useTransition`); rewired 2026-08-02 (Feature 07 — Extract from Resume button is live, auto-fills all fields from GPT extraction)

Single Client Component that owns all five profile sections. Internal sub-components `SectionCard`, `Field`, `TagInputField`, and `WorkRoleCard` keep the markup readable without splitting into multiple files.

| Property         | Class |
| ---------------- | ----- |
| Form wrapper     | `flex flex-col gap-6` (with `onSubmit` preventDefault so Enter inside a field does not post) |
| Section card     | `rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]` |
| Section header   | `mb-5 flex items-start justify-between gap-4` |
| Section title    | `text-base font-semibold leading-6 text-text-primary` |
| Section subtitle | `mt-1 text-sm leading-5 text-text-secondary` |
| Section body     | `flex flex-col gap-4` |
| Field wrapper    | `flex flex-col gap-1.5` |
| Field label      | `text-sm font-medium text-text-primary` |
| Field hint       | `text-xs text-text-muted` |
| Field "Optional" | `text-xs text-text-muted` (right-aligned label row) |
| Input            | `block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent` |
| Disabled input   | `${input} cursor-not-allowed bg-surface-secondary text-text-secondary` (used for the pre-filled email field) |
| Tag chips        | `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-accent-muted text-accent` (skills) / `bg-info-lightest text-info-foreground` (industries) |
| Tag remove button | `inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10` |
| Tag input row    | `flex items-center gap-2` — input + Add button (`border border-border bg-surface ... hover:bg-surface-secondary`) |
| Role card        | `rounded-xl border border-border-light bg-surface-secondary p-4` |
| Role index label | `text-xs font-semibold uppercase tracking-wide text-text-muted` |
| Remove role link | `text-xs font-medium text-text-secondary hover:text-error` |
| Empty roles state | `rounded-md border border-dashed border-border-light bg-surface-secondary px-4 py-6 text-center text-sm text-text-muted` |
| Date grid        | `grid grid-cols-1 gap-3 sm:grid-cols-2` |
| Checkbox label   | `inline-flex items-center gap-2 text-sm text-text-primary` |
| Checkbox control | `h-4 w-4 rounded border-border text-accent focus:ring-accent` |
| Action stack wrapper | `flex flex-col gap-3` (banner above the Save/Extract row) |
| Saved success banner | `rounded-md border border-success-lightest bg-success-lightest px-4 py-2.5 text-sm font-medium text-success-foreground` (`role="status"`, auto-resets to `idle` after 4s) |
| Extract success banner | `rounded-md border border-success bg-surface px-4 py-2.5 text-sm font-medium text-success` (`role="status"`, `border-success`/`text-success` tokens, shows "Extracted N fields…") |
| Error banner    | `rounded-md border border-error bg-surface px-4 py-2.5 text-sm font-medium text-error` (`role="alert"`) — shared shape for Save errors and Extract errors (separate state slots) |
| Save + Extract row | `flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between` — Extract secondary (`onClick={handleExtract}`, label "Extract from Resume" → "Extracting…" on `extractPending`, `disabled:cursor-not-allowed disabled:opacity-60`) gated on `hasResume`, else the muted helper span + Save primary (`bg-accent ... text-accent-foreground ... hover:bg-accent-dark ... disabled:opacity-60`, `sm:w-auto`, label toggles to "Saving…" while `pending`) |

**Pattern notes:**
- `Props` now takes `initial: ProfileFormState` from `types/index.ts` (typed CSV-string shape for the four array fields). The page server-renders the typed `initial` by reading `profiles` via `fetchProfile()` in `lib/profile-data.ts` and joins array fields with `", "` before they reach the form.
- All five sections share the same `SectionCard` shell so the page reads as a stack of equivalent cards, matching the homepage card precedent.
- Tag chips use the same `bg-accent-muted text-accent` token as the missing-field tags in `CompletionIndicator` — skills look like missing-fields when the list is empty. Industries use `bg-info-lightest text-info-foreground` to differentiate the optional field visually without adding a new color.
- Work-role checkbox is bound to `current`. When `current` flips to `true`, `endDate` is cleared and the End Date input becomes `disabled` with `bg-surface-secondary text-text-muted`. When `current` is `false`, `endDate` is preserved in the local state during the toggle.
- The Save button calls `saveProfile(input)` from `actions/profile.ts` via `useTransition`. The button's label flips to `"Saving…"` while `pending === true`. Status transitions to `"saved"` (success banner, auto-resets to idle after 4s) or `"error"` (error banner with message from Server Action). Server Action calls `revalidatePath("/profile")` so the page re-renders with fresh server data on the next request.
- The Extract button stays disabled with `title="Extract from Resume lands in Feature 07"` — Feature 07 owns that wiring.
- **Feature 07 wiring (2026-08-02):** Extract button is now live. `onClick={handleExtract}` fires `POST /api/resume/extract` via a second `useTransition` (`extractPending`); label flips "Extract from Resume" → "Extracting…". On success each returned field is spread into its `useState` setter (extracted-wins, absent-keeps-existing); a green "Extracted N fields…" banner confirms and the Save banner is reset to `idle` so the two statuses never collide. Extract errors (`extractStatus === "error"`) use the same banner visual as Save errors but a separate state/message slot. Extract does NOT call `saveProfile` — the user explicitly clicks Save Profile after reviewing.
- Email field is `disabled` — server pre-fills it from `profile.email` (which itself fell back to `user.email`) in `app/profile/page.tsx`.

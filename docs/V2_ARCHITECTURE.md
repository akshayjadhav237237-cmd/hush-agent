# Hush Landing Page v2 Architecture

## Overview
Hush v2 is an alternative landing page built alongside the existing v1 landing page. It lives in `src/v2/`, `public/v2/`, `docs/`, `qa/`, and the entry point `v2.html`. The existing v1 codebase (`index.html`, `src/features/**`, `src/styles/**`, `src/data/**`, `.github/workflows/deploy.yml`) is completely untouched and read-only.

## File Map & Ownership

### Lead (Sequential Setup & Final Integration)
- `vite.config.ts`: Multi-entry configuration (`index.html` and `v2.html`).
- `package.json`: Addition of scoped font dependencies (`@fontsource-variable/inter-tight`, `@fontsource-variable/space-grotesk`, `@fontsource/cormorant-garamond`) and devDependency `@playwright/test`.
- `v2.html`: Entry HTML document for v2.
- `src/v2/main.tsx`: React DOM mount for v2.
- `src/v2/App.tsx`: Master composition of sections.
- `src/v2/styles/v2.css`: Scoped design tokens, typography, and variable remapping under `.v2`.
- `src/v2/ui/*`: Reusable atomic UI components (`Section`, `Container`, `Eyebrow`, `SerifItalic`, `PillButton`, `useReducedMotion`).
- `src/v2/data/*`: `copy.v2.ts`, `extraFaq.ts`, and `adapters.ts`.
- `docs/V2_ARCHITECTURE.md`: This architecture specification.
- `docs/LANDING_SWAP.md`: Documentation for future swap to production root.

### Subagent M — Media (`public/v2/media/*`, `src/v2/data/media.ts`, `docs/MEDIA_CREDITS.md`)
- Hero and Bento video assets, transcoding, posters, dimensions, credits and rights.

### Subagent A — Nav + Hero (`src/v2/features/hero/*`, `src/v2/ui/VideoBg.tsx`)
- Floating black pill navigation with active section detection and mobile Radix Dialog sheet.
- Hero viewport panel with inset radius, VideoBg, accessible play/pause toggle, giant responsive wordmark, CTA pill button, and scroll cue.

### Subagent B — Manifesto + Reveal Primitives (`src/v2/features/manifesto/*`, `src/v2/ui/reveal/*`)
- Centered dark card (~40px radius).
- `WordReveal`: Scroll-linked opacity reveal per word using Motion `useScroll`/`useTransform`.
- `LineReveal`: Scroll-linked opacity reveal per rendered line using font-ready measurement and ResizeObserver.
- Zero layout shift, full fallback under reduced motion and no-JS.

### Subagent C — Bento (`src/v2/features/bento/*`)
- 4-column responsive grid (1 column mobile, 2 tablet, 4 desktop).
- Cormorant serif title and periwinkle subtitle.
- Tile 1: VideoBg with bottom caption.
- Cards 01–03: Lucide icons, mono numerals, serif titles, checkmark lists, and links populated exclusively from `bentoCards()`.

### Subagent D — How It Works (`src/v2/features/how/*`)
- 3-node timeline tracking scroll progress with active highlights.
- Phases 01, 02, 03 corresponding to Claude planning, Gemini Deep Research, and Antigravity + Graphify build loop.

### Subagent E — Gates + Compare (`src/v2/features/gates/*`, `src/v2/features/compare/*`)
- Attention Gates: 3x2 grid driven by `gatesList()` with enforcement labels ("Enforced in code" vs "Judged by the model") and verification summary footnote.
- System Comparatives: Monospace diff window (`hush.workflow.diff`) highlighting manual vs Hush workflows with high-contrast `+` and `-` indicators.

### Subagent F — Replay + Stats (`src/v2/features/replay/*`, `src/v2/features/stats/*`)
- Replay: Re-wrapped existing `ReplayPlayer` with scoped CSS variable remapping (`--bg`, `--surface`, etc.) to match v2 palette without touching v1 code.
- Stats: Dynamic metric cards (`unit tests passing`, `policy gates`, `engines coordinated`) driven by `stats()` with accessible count-up animation.

### Subagent G — FAQ + Footer (`src/v2/features/faq/*`, `src/v2/features/footer/*`)
- FAQ: Radix Accordion with expandable numbered items, custom `+` / `×` icons, and green active indicator. Includes terms and responsible use entry.
- Footer: Wordmark, quick links, external repository links, Apache 2.0 and MIT attribution lines.

### QA Subagent Q (`qa/*`, `docs/QA_V2.md`)
- Playwright-driven automated visual regression, responsiveness (360px, 768px, 1280px, 1920px), accessibility, contrast, and performance audit.

## Data Flow & Adapters
All claims and statistics are resolved at build time via `src/v2/data/adapters.ts`:
1. `stats()`: Extracts `TEST_COUNT` via dynamic eager glob (`import.meta.glob('/src/data/testcount.ts')`), policy gate count from `ATTENTION_GATES.length`, and coordinated engines count.
2. `gatesList()`: Imports `ATTENTION_GATES` from `src/data/gates.ts`.
3. `faqList()`: Combines `FAQ_ITEMS` from `src/data/faq.ts` and `EXTRA_FAQ_ITEMS` from `src/v2/data/extraFaq.ts`.
4. `verificationSummary()`: Safely probes for optional `verification.ts` / `verification.json` and formats verified check counts, returning `null` if missing.
5. `bentoCards()`: Dynamically includes or excludes the Graphify graph stall alert based on `GRAPH_STALL_VERIFIED` from `src/data/brand.ts`.

## Styling Tokens
Tokens are strictly scoped to `.v2`:
- Background: `#000000`
- Cards: `#141414` (surface 1), `#1B1B1B` (surface 2)
- Borders: `rgba(255, 255, 255, 0.08)`
- Primary Text: `#F5F0E8`
- Mint Headline: `#EFFFE6`
- Muted Text: `rgba(245, 240, 232, 0.55)`
- Accent: `#2EF27A`
- Link / Subtitle: `#7C93F5`
- Warning / Attention: `#FFB020` (used strictly for human intervention moments)
- Diff Add: `#2EF27A` on `#08150C`
- Diff Del: `#FF6B6B` on `#170909`

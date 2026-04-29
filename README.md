# cobos.io · portfolio

```
$ whoami
ernesto.cobos · cloud_architect+platform_engineer+devsecops
```

Personal portfolio of **Ernesto Cobos** — Cloud Architect · Platform Engineer · DevSecOps.

> **Operator-console aesthetic.** Terminal-flavored, data-rich, the portfolio as a control plane. Live status indicators, animated cloud topology, isometric architecture lattice, and (in dev) a real shell that mutates the DOM as if it were a unix filesystem.

Live: <https://cobos.io> &nbsp;·&nbsp; Source: <https://github.com/ErnestoCobos/Portfolio>

---

## Stack

| Layer | Tech |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router · Turbopack · React Compiler) |
| Runtime | React 19 · TypeScript 5 |
| Styling | Tailwind v4 · CSS variables for the design system tokens |
| Type | Inter Tight · Inter · JetBrains Mono (via `next/font/google`) |
| Hosting | Static export — works anywhere that can serve files |

Node 20+ required (per `next@16` minimum).

---

## Quick start

```bash
# install
pnpm install

# dev (Turbopack — Hot Reload + the dev-only live terminal)
pnpm dev
# → http://localhost:3000

# production build (statically prerendered)
pnpm build
pnpm start

# lint
pnpm lint
```

---

## Project structure

```
app/
├── layout.tsx               ─ root layout, fonts, metadata
├── globals.css              ─ design tokens + utility classes (.btn-primary,
│                              .nav-chip, .tap, focus-visible, prefers-reduced-motion)
├── page.tsx                 ─ portfolio entry
└── components/
    ├── Portfolio.tsx        ─ all 10 sections + sticky nav + mobile menu (portal)
    ├── portfolio-data.ts    ─ profile, projects, experience, posts, trends, approach
    ├── portfolio-visuals.tsx ─ CloudTopology canvas, IsoCloud SVG lattice,
    │                           ArchDiagram, useTicker, useMounted, useReducedMotion
    └── LiveTerminal.tsx     ─ dev-only shell that operates on the DOM (see below)
public/                      ─ static assets
```

The portfolio is a single page. Every section is co-located inside [`Portfolio.tsx`](app/components/Portfolio.tsx); content lives in [`portfolio-data.ts`](app/components/portfolio-data.ts) — edit that file to update bio, projects, experience, posts, etc.

---

## Design system

Tokens live in [`app/globals.css`](app/globals.css) under `:root`.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0A0F` | page background |
| `--surface` | `#11111B` | card backgrounds |
| `--cyan` | `#00D4FF` | primary accent · CTAs · active nav |
| `--violet` | `#7C3AED` | secondary accent · `@mentions` · gradient stops |
| `--fg` | `#F8FAFC` | foreground text |
| `--muted` | `#94A3B8` | secondary text |
| `--hairline` | `rgba(255,255,255,.08)` | dividers |
| `--hairline-strong` | `rgba(255,255,255,.14)` | card borders |

**Spacing**: 8px scale (`--s1` … `--s8`). **Radii**: `--r-card 20px`, `--r-btn 12px`, `--r-chip 999px`.

**Type**: distinctive font choices — Inter Tight for display, Inter for body, JetBrains Mono for everything terminal-flavored. Avoid generic system fonts.

**Motion**: subtle. All ticker-driven animations gate behind `prefers-reduced-motion: reduce` and a `useMounted` hook to prevent SSR hydration drift on FP precision values.

---

## Live terminal · dev only

Hit backtick (`` ` ``) in development and a quake-style shell drops down. It walks `[data-fs-path]` attributes across the page and builds a virtual filesystem you can browse and **mutate**.

```
/ $ tree /
├─ about/
│  ├─ bio.md
│  ├─ headline.md
│  └─ name.txt
├─ work/
│  ├─ enkiflow.md
│  ├─ idp.md
│  └─ legacy-migration.md
├─ stack/  infra/  experience/  trends/  blog/  approach/  contact/
└─ ...

/ $ echo "this writes back to the DOM" > about/bio.md
wrote 31 bytes → /about/bio.md

/ $ rm work/idp.md
removed '/work/idp.md'  ⟲ undo with: undo
```

| Command | What it does |
|---|---|
| `ls / cd / pwd / tree` | navigate the VFS (cd also scrolls the page) |
| `cat <file>` | read a file's text content |
| `grep <pattern> <file>` | search inside a file |
| `echo "x" > <file>` | overwrite text content (modifies live DOM with cyan flash) |
| `rm <path>` | remove node from DOM (fade-out animation, `undo` to restore) |
| `mv <src> <dst>` | reorder DOM nodes |
| `theme accent #ff6b9d` | hot-swap CSS variable values across the whole site |
| `tour` | guided demo — watch the page change as the terminal types |
| `whoami / uptime / date / hostname` | meta info |
| `history / clear / help` | obvious |

**Bindings**: `` ` `` toggle · `Esc` close · `Tab` autocomplete paths · `↑↓` history · `Ctrl/Cmd+L` clear · click any cyan suggestion to insert it.

**Production**: the entire `LiveTerminal.tsx` module is gated behind `process.env.NODE_ENV === "development"` via `next/dynamic`. Verified absent from the production bundle:

```bash
pnpm build
grep -rl "buildVFS\|lt-input" .next/static/  # → empty
```

---

## Editing your content

| Want to change | File · field |
|---|---|
| Name, role, location, email, GitHub | [`portfolio-data.ts`](app/components/portfolio-data.ts) → `PROFILE` |
| Stack categories & tools | [`portfolio-data.ts`](app/components/portfolio-data.ts) → `STACK` |
| Projects (cards in Work) | [`portfolio-data.ts`](app/components/portfolio-data.ts) → `PROJECTS` (each has a `slug` used by the live terminal as `/work/<slug>.md`) |
| Experience timeline | [`portfolio-data.ts`](app/components/portfolio-data.ts) → `EXPERIENCE` |
| 2026 trends · feature flags | [`portfolio-data.ts`](app/components/portfolio-data.ts) → `TRENDS` |
| Blog posts | [`portfolio-data.ts`](app/components/portfolio-data.ts) → `POSTS` |
| Approach phases | [`portfolio-data.ts`](app/components/portfolio-data.ts) → `APPROACH` |
| Hero headline & boot log | [`Portfolio.tsx`](app/components/Portfolio.tsx) → `Hero` component |
| About bio · headline | [`Portfolio.tsx`](app/components/Portfolio.tsx) → `About` component |
| Design tokens | [`globals.css`](app/globals.css) → `:root` |

---

## Deployment

The build is statically prerendered (`○ /` in `next build` output). Deploy anywhere that serves static files:

```bash
pnpm build      # writes .next/
```

For Vercel: one-click via **Import Git Repository**. For other static hosts (Netlify, Cloudflare Pages, S3+CloudFront), enable Next.js's static export by following the [official docs](https://nextjs.org/docs/app/guides/static-exports) — the page has no server actions or runtime data, so static export works without changes.

---

## Browser support

Targets evergreen Chrome / Edge / Firefox / Safari 16.4+ (per Next 16 minimums). The page uses `backdrop-filter`, CSS grid, `@property`, `:focus-visible`, and ES2022 syntax. No polyfills.

---

## Accessibility & motion

- AA color contrast across all token combinations (`--fg / --bg ≈ 17:1`, `--cyan / --bg ≈ 10.6:1`).
- `:focus-visible` rings on every interactive element.
- `:active` pressed states on buttons, chips, and tap targets.
- `prefers-reduced-motion: reduce` freezes all rAF tickers, canvas particle motion, isometric pulse, and SVG `<animateMotion>`.
- Mobile: 16px form font-size to suppress iOS focus-zoom; 44×44 minimum tap targets on the nav.

---

## Contact

| | |
|---|---|
| email | [hola@cobos.io](mailto:hola@cobos.io) |
| web | [cobos.io](https://cobos.io) |
| github | [github.com/ErnestoCobos](https://github.com/ErnestoCobos) |
| linkedin | [linkedin.com/in/cobos](https://linkedin.com/in/cobos) |

---

```
$ exit 0 · © 2026 ernesto cobos
```

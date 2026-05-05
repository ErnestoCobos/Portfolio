# cobos.io · design system

A brief, opinionated guide to the tokens and primitives that ship with this site. Source of truth: [`app/globals.css`](../app/globals.css). Use this doc to decide *which* token (not whether to inline).

## Rule of thumb

**If a value would appear 2+ times across distinct sections, it is a token.** One-offs stay inline with a short `//` comment. Magic numbers beat fragile abstractions.

## Color tokens — semantics

The site uses two accent colors. They aren't decoration — they communicate.

| Token | Use for | Examples |
|---|---|---|
| `--cyan` | Infra, code, ops, observability, GitOps, FinOps, signals — anything "low-level / technical / quantitative" | Section 03 Infra topology, hero terminal output, FinOps dashboard, GitOps pipelines |
| `--violet` | Product, founder, transformation, migrations, platform engineering — anything "builder / business / qualitative" | EnkiFlow / GetDecant cards, Approach `+ devsecops` headline, migrations posts, founder periods in Experience timeline |
| `--green` | Status: success, healthy, done, enabled, online | "online" dot, Approach pipeline `done` state, feature flags `enabled` |
| `--amber` | Status: warning, in-progress, staged | Feature flags `staged`, p99 spikes |

**Why this matters**: cyan dominates if every accent is cyan. Splitting by meaning gives the eye a second axis (besides hierarchy) to parse the page, and gives violet real load — it's not just "the other color".

### Tints (rgba opacity ladders)

For backgrounds and glows. Pick by visual weight, not by exact opacity number.

```
--cyan-tint-soft   .06  | --violet-tint-soft   .06   ← whisper / hover idle
--cyan-tint        .08  | --violet-tint        .10   ← hover hint / active fill
--cyan-tint-mid    .10  | --violet-tint-mid    .12   ← chip selected
--cyan-tint-strong .14  | --violet-tint-strong .18   ← card-active hint
--cyan-tint-loud   .22  | --violet-tint-loud   .26   ← featured / hero
--cyan-glow        .60  | --violet-glow        .60   ← box-shadow halos
--border-cyan-soft .25  | --border-violet-soft .25   ← borders only
```

### Surface / backdrop

```
--surface-overlay   white .015   ← faintest hairline background
--surface-soft      white .025   ← card-on-card
--surface-elev      white .05    ← elevated panel
--backdrop-deep     black .96    ← modal / fullscreen overlay
--backdrop-mid      black .70    ← panel header bg
--backdrop-light    black .78    ← sticky header bg (with backdrop-filter)
```

### Body text variants

`--muted` (#94A3B8) is for body-size text. For mono ≤11px, use `--meta` (#A8B5C7) — better contrast (~6.8:1 vs 5.4:1) with no perceptible color shift.

```
--muted        body subdued
--meta         small mono ≤ 11px (overline, status badges, breadcrumbs)
--body-soft    article paragraphs (.82 alpha)
--body-softer  trailing-line metadata (.55 alpha)
```

## Typography scale

Two parallel scales — desktop and mobile. Use the boolean `mobile` from `useIsMobile()` to switch.

| Token (desktop) | Mobile sibling | px | Use for |
|---|---|---|---|
| `--text-display` | `--text-display-m` | 88 / 36 | OG images, /blog hero on widescreen |
| `--text-h1` | `--text-h1-m` | 64 / 36 | Home hero H1, /blog landing hero |
| `--text-h2-page` | `--text-h2-page-m` | 52 / 30 | Page-level H2 (Approach, About) |
| `--text-h2-section` | `--text-h2-section-m` | 44 / 28 | Mid-level H2 (Work, sub-sections) |
| `--text-h3` | `--text-h3-m` | 28 / 22 | Card titles (large) |
| `--text-h3-sm` | `--text-h3-sm-m` | 21 / 19 | Card titles (medium) |
| `--text-body-lg` | `--text-body-lg-m` | 18 / 16 | Hero subhead, bold lead |
| `--text-body` | `--text-body-m` | 16 / 15 | Default body |
| `--text-body-sm` | — | 14 | Card descriptions |
| `--text-meta` | — | 13 | Metadata, breadcrumbs |
| `--text-mono` | — | 11 | Mono badges, status labels |
| `--text-mono-xs` | — | 10 | Tiny mono (overlines, footers) |
| `--text-mono-mm` | — | 9 | Metric labels (Infra panels) |

### Line heights

```
--lh-display  1.02   ← display + H1 (tight)
--lh-heading  1.10   ← H2 / H3
--lh-tight    1.20   ← compact card titles
--lh-body     1.55   ← default body
--lh-prose    1.75   ← long-form articles
```

### Letter spacing

```
--ls-display  -0.030em   ← display, H1
--ls-heading  -0.025em   ← H2
--ls-tight    -0.015em   ← H3, body emphasis
--ls-mono       0        ← mono default
--ls-meta     +0.05em    ← mono metadata
--ls-tag      +0.15em    ← uppercase tags, status badges
--ls-overline +0.22em    ← section overlines, "FEATURED" pills
```

## Spacing

Standard 8px scale. Use `--s1`..`--s8`. Off-scale values (4, 5, 6, 10, 14) stay inline — they're for micro-alignment in components and don't belong in the rhythm system.

```
--s1 8   --s2 16   --s3 24   --s4 32
--s5 48  --s6 64   --s7 96   --s8 128
```

## Radii

```
--r-tile     6px     ← chips, status pills, inline buttons
--r-card-sm  10px    ← mid cards (blog tiles, hero card, work CTA)
--r-card     20px    ← big cards (Hero, glass surfaces)
--r-btn      12px    ← primary / secondary CTAs
--r-chip     999px   ← pill chips, dots, category badges
```

## Motion durations

Three-step scale. Pick by what's transitioning, not by gut feel.

```
--motion-fast   0.15s   ← micro-interactions: hover color, focus ring
--motion-base   0.30s   ← state changes: panel reveal, accordion, modal fade
--motion-slow   0.60s   ← cinematic: hero entrance, full-screen overlay
```

All animation classes must respect `prefers-reduced-motion: reduce` — use `useReducedMotion()` in JS or wrap CSS keyframes in the existing media query block in `globals.css`.

## Approved primitives

Don't reinvent visuals. These exist and have been load-tested:

| File | Export | Returns |
|---|---|---|
| [`portfolio-visuals.tsx`](../app/components/portfolio-visuals.tsx) | `CloudTopology` | Animated node-network canvas (cyan/violet flow) |
| | `IsoCloud` | Isometric height-map grid with phase-based lift |
| | `ArchDiagram` | Production architecture SVG with live traffic telemetry |
| | `CobosLogo` | Cyan-to-violet gradient hexagon |
| | `useTicker(enabled)` | Frame-synced animation timer |
| | `useMounted()` | SSR-safe hydration check |
| | `useReducedMotion()` | Honors `prefers-reduced-motion: reduce` |
| [`BlogCover.tsx`](../app/components/BlogCover.tsx) | `BlogCover` | Seeded procedural cover (dot field + category mark + topology lines) |
| [`seeded-rand.ts`](../app/components/seeded-rand.ts) | `createRand(seed)` | Deterministic PRNG. Same seed → same sequence. Use for any procedural visual. |
| [`architectures.ts`](../app/components/architectures.ts) | `AWS_SAAS`, `GCP_BANK`, `AZURE_DATA`, `ONPREM_HYBRID` | Structured architecture data (nodes, edges, zones, metrics) |

**Animation keyframes** (in `globals.css`): `fadeIn`, `hero-bounce`, `pipe-pulse`, `pipe-cursor`, `pipe-dot`, `pipe-iterate`. Reuse before adding new ones.

## When NOT to inline

Don't inline a value if:

- It's already in this doc (use the token).
- You're about to use the same number/color in another section (token it first).
- It's a repeated rgba opacity of `--cyan` or `--violet` — there's almost certainly a tint token for it.

Inline IS fine for:

- Component-internal layout (transform, width/height of an SVG element, flex gaps inside a single card).
- Genuine one-offs that are tied to a specific element's geometry.
- Tweaks that don't follow a system (e.g. `marginLeft: -3` to nudge an icon — comment why).

## Accessibility minimums

- Color contrast: `--fg` on `--bg` ≥ 14:1 ✓. `--cyan` on `--bg` ≈ 12:1 ✓. `--meta` on `--bg` ≈ 6.8:1 ✓ (use this, not `--muted`, for ≤ 11px text).
- Touch targets: minimum 32×32 px for clickable elements on mobile. Nav chips are 22×~75 — accept on desktop, target ≥ 32 height on mobile.
- All animations must respect `prefers-reduced-motion: reduce`. Use the `useReducedMotion()` hook and short-circuit the cycle.
- Icon-only links (`→`, `↗`, `✓`, `×`) need `aria-label` or visually-hidden text. Mono unicode is read aloud.

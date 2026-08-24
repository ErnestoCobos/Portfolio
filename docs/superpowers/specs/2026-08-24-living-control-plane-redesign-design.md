# Living Control Plane — home redesign

**Date:** 2026-08-24 · **Status:** approved by user (brainstorming session) · **Scope:** home page (`/`, `/en`) only. `/start`, `/blog`, `/now`, `/cv` untouched except where noted.

## Concept

The site stops *describing* infrastructure and becomes a control plane that is **switched on**: the background breathes, panels show live data, and typography moves with scroll. The operator-console essence (terminal, mono type, semantic cyan/violet, status dots) is preserved and amplified — nothing in this spec changes content, tone, or the token system.

## Goals

1. A "wow" beat roughly every 100vh of scroll — the page reads as a journey, not a stacked list of 13 sections.
2. Live data on screen: space telemetry, this repo's own latest commit, session state. Fetch failures always degrade to plausible static fallbacks.
3. Operator feel: power rail, magnetic cursor, panels that *power on* as they enter the viewport.
4. Zero new dependencies. Raw WebGL + existing primitives only.
5. Non-negotiables preserved: static export, AA contrast, `prefers-reduced-motion` freezes everything animated, mobile experience intact.

## Non-goals

- No scrollytelling / pinned scroll-jacking narrative. Sections stay document-flow.
- No WebGL framework (three.js), no animation library (framer-motion, GSAP), no new runtime services.
- No redesign of section content or of `/start` visuals (only its `spaceData` module moves).
- The dev-only `LiveTerminal` stays dev-only (a production "site-as-terminal" was considered and deferred — possible future phase).

## Design

### 1. Atmosphere layer (`AtmosphereCanvas`)

- Fullscreen raw-WebGL fragment-shader canvas mounted once in `Portfolio.tsx`, behind `#main-scene` (`position: fixed; inset: 0; z-index: -1`).
- Visual: a very subtle nebula-grid in cyan/violet — faint drifting gradient blobs over a barely-visible perspective grid. Intensity target: *felt, not seen*. Max ~8% luminance contribution over `--bg`.
- Reacts to scroll (parallax drift) and pointer (slow lerp toward cursor position).
- Fallbacks, in order: no WebGL context → animated CSS gradient layer; `prefers-reduced-motion` → single static frame (or CSS gradient); small/touch devices may skip the canvas entirely via `pointer: fine` + viewport heuristics.
- rAF loop pauses when `document.hidden`; canvas renders at `min(devicePixelRatio, 1.5)` and is throttled to ~30fps — it is atmosphere, not a game.
- Existing `.film-grain` overlay stays on top; verify AA contrast of all text tokens over the brightest shader state (adjust shader intensity, never the tokens).

### 2. Kinetic chapters (`ChapterMarker`, `KineticMarquee`)

- Each of the 13 sections gets a **chapter marker**: the existing `SectionHeader` number+label rendered at display scale (`clamp(64px, 18vw, 220px)`), entering with the existing `DecodeText` decode effect plus a one-shot scanline sweep — the section "powers on". Implemented as a wrapper around the current `SectionHeader` so section components keep their API.
- Between major section groups, a **kinetic marquee**: a single horizontal line of domain words (`gitops · platform · finops · zero-trust · sre`) in Inter Tight display size, translateX driven by scroll velocity (not autoplay). Reduced-motion: static line.
- Both reuse `useTicker`, `useReducedMotion`, and the existing type/motion tokens. No new keyframes unless strictly necessary (`globals.css` already has `fadeIn`, scanline-adjacent primitives).

### 3. Live data (`app/lib/live-data.ts`)

- Move `getSpaceData()` from `app/start/spaceData.ts` to `app/lib/live-data.ts`; `/start` imports from the new location (no behavior change there). Add `getLatestCommit()` — GitHub public API for `ErnestoCobos/Portfolio`, client-side fetch with 4s timeout, `allSettled` pattern, static fallback ("last deploy · recently").
- **Telemetry strip**: a slim mono-type strip inside the Hero, directly below the boot log (not in ProofStrip — it stays a proof divider), showing: solar wind km/s · K-index · humans in space · ISS velocity · session uptime · local time · latest commit subject + relative age. Client-only rendering with server-identical placeholder to avoid hydration drift (same pattern as existing `useMounted`/`SessionClock`).
- Static export untouched: all live values resolve client-side after mount; nothing blocks prerender.

### 4. Power rail (`PowerRail`)

- Fixed lateral rail (desktop only, `min-width` media gate): a thin vertical "power line" with 13 nodes, one per section. Nodes light up via `IntersectionObserver` on the existing `[data-fs-path]` section wrappers; click = smooth-scroll jump. A small fill meter shows overall scroll progress.
- Hidden on mobile (nav already covers wayfinding there).

### 5. Magnetic cursor (`MagneticCursor`)

- Desktop + `pointer: fine` only. Custom crosshair/reticle cursor (CSS-drawn, not an image) that lerps toward magnetic targets: CTAs, nav chips, rail nodes (mark with `data-magnetic`). Targets get a 2–4px translate toward the pointer — operator-panel feel.
- Never hides the native cursor entirely; it augments it. Reduced-motion: disabled.

## Architecture

New files:

- `app/components/visuals/AtmosphereCanvas.tsx` — shader canvas + fallbacks.
- `app/components/cinematic/ChapterMarker.tsx` — display-scale section marker.
- `app/components/cinematic/KineticMarquee.tsx` — scroll-velocity marquee.
- `app/components/visuals/PowerRail.tsx` — lateral progress rail.
- `app/components/visuals/MagneticCursor.tsx` — cursor + magnetism.
- `app/lib/live-data.ts` — shared live-data fetchers + fallbacks.

Modified files (minimal, additive):

- `app/components/Portfolio.tsx` — mount `AtmosphereCanvas`, `PowerRail`, `MagneticCursor`.
- `app/components/chrome/primitives.tsx` — `Section`/`SectionHeader` accept optional `ChapterMarker` wrapper; export stays backward-compatible.
- `app/components/chrome/Hero.tsx` — telemetry strip slot below the boot log.
- `app/start/spaceData.ts` — re-export from `app/lib/live-data.ts` (or delete + update import in `app/start/page.tsx`).
- `app/globals.css` — styles for the five new pieces, tokens only; shader-intensity guard for contrast.

Section components (`About` … `Contact`) are **not** rewritten — the chapter effect lands via the shared `Section` wrapper.

## Accessibility & performance rules

- Every animated piece gates on `useReducedMotion()` and collapses to a static equivalent.
- All text keeps AA contrast over the brightest atmosphere state; verify `--fg`, `--muted`, `--meta`, `--cyan` over shader, tune shader not text.
- rAF loops pause off-screen / on `document.hidden`; no always-on 60fps loops added (follow the Hero "time-islands" precedent).
- Bundle: no new deps; new client code should stay under ~15KB gzip total.
- Mobile: no custom cursor, no power rail, atmosphere may degrade to CSS gradient; 44×44 tap targets unchanged.

## Testing

- `pnpm lint` and `pnpm build` clean after each phase; `○ /` static prerender preserved.
- Manual QA matrix per phase: desktop Chrome/Safari/Firefox, mobile Safari (iOS), `prefers-reduced-motion` emulation, WebGL disabled (`--disable-webgl`) for fallback check.
- Existing Playwright smoke (`e2e/smoke.spec.ts`) must keep passing; add one assertion that the atmosphere canvas exists and that the page renders an h1 with WebGL disabled.

## Phases (each independently mergeable)

1. **Atmosphere** — `AtmosphereCanvas` + fallbacks + contrast tuning.
2. **Kinetic chapters** — `ChapterMarker` on all 13 sections + `KineticMarquee` between groups.
3. **Live data** — `live-data.ts` move + `getLatestCommit` + hero telemetry strip.
4. **Operator layer** — `PowerRail` + `MagneticCursor`.
5. **Polish** — perf audit (rAF pausing, DPR), contrast pass, mobile QA, e2e assertion.

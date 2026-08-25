# Living Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the home page into a "living control plane" — WebGL atmosphere, kinetic chapter typography, real live data (space telemetry + own commit log), power rail navigation, and a magnetic cursor — without touching content, tokens, or the static export.

**Architecture:** Five new self-contained client components mount once in `app/components/Portfolio.tsx` or inside the shared `Section`/`SectionHeader` primitives, so the 11 section components are never rewritten. Live data moves to a shared `app/lib/live-data.ts` consumed by both `/start` and the home hero. All animation gates on the existing `useReducedMotion()` / `useMounted()` / `useTicker()` primitives.

**Tech Stack:** Next.js 16 (App Router, static prerender), React 19, TypeScript 5, raw WebGL (no deps), Tailwind v4 + CSS tokens in `app/globals.css`, Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-08-24-living-control-plane-redesign-design.md`

## Global Constraints

- **Zero new dependencies.** No three.js, no framer-motion, no GSAP. Raw WebGL + CSS only.
- Static export must stay intact: `pnpm build` keeps `○ /` prerendered; all live data resolves client-side after mount.
- Every animated piece gates on `useReducedMotion()` from `app/components/portfolio-visuals.tsx` and collapses to a static equivalent.
- Use design tokens from `app/globals.css` (`--cyan`, `--violet`, `--bg`, `--text-*`, `--ls-*`, `--motion-*`) — no new hex values except inside the GLSL shader (commented with their token equivalents).
- Contrast: text tokens must keep AA over the brightest atmosphere state — tune shader intensity (max ~5% color add), never the tokens.
- rAF loops pause when `document.hidden` and when off-screen; no always-on 60fps loops (follow the Hero "time-islands" precedent). Atmosphere renders at ≤30fps, DPR ≤1.5.
- The 11 section components (`app/components/sections/*.tsx`) are NOT edited. Chapter effects land via `app/components/chrome/primitives.tsx`.
- Commits: `type(scope): message` matching git history style (e.g. `feat(home): …`).
- Verification per task: `pnpm lint`, `pnpm typecheck`, `pnpm build`, and the task's Playwright assertions (`pnpm test:e2e`).

## File Structure

| File | Responsibility |
|---|---|
| `app/components/visuals/AtmosphereCanvas.tsx` | Fullscreen WebGL nebula-grid behind the page; CSS/static fallbacks |
| `app/components/cinematic/ChapterMarker.tsx` | Display-scale `0N · label` marker with decode + scanline "power-on" |
| `app/components/cinematic/KineticMarquee.tsx` | Scroll-velocity-driven horizontal type line between section groups |
| `app/lib/live-data.ts` | `getSpaceData()` (moved) + `getLatestCommit()` with static fallbacks |
| `app/components/chrome/TelemetryStrip.tsx` | Mono live-data line under the hero boot log |
| `app/components/visuals/PowerRail.tsx` | Fixed lateral rail: 11 section nodes + scroll progress |
| `app/components/visuals/MagneticCursor.tsx` | Crosshair cursor with magnetic pull on `[data-magnetic]` targets |
| `app/components/chrome/primitives.tsx` | `SectionHeader` renders `ChapterMarker`; `Section` unchanged |
| `app/components/Portfolio.tsx` | Mounts AtmosphereCanvas, PowerRail, MagneticCursor, 3 marquees |
| `app/components/chrome/Hero.tsx` | Renders `TelemetryStrip` below `BootLog` |
| `app/components/chrome/Nav.tsx` | Add `data-magnetic` to chips (one-line edits) |
| `app/start/spaceData.ts` | Becomes a re-export of `app/lib/live-data.ts` |
| `app/globals.css` | Styles for all new pieces |
| `e2e/smoke.spec.ts` | One new assertion per task |

---

### Task 1: AtmosphereCanvas — WebGL nebula-grid background

**Files:**
- Create: `app/components/visuals/AtmosphereCanvas.tsx`
- Modify: `app/components/Portfolio.tsx`
- Modify: `app/globals.css`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `useReducedMotion` from `../portfolio-visuals`.
- Produces: `export function AtmosphereCanvas(): JSX.Element | null` — mounts `<canvas id="atmosphere">` (WebGL) or `<div id="atmosphere" className="atmosphere-fallback">` (no WebGL). Renders one static frame under reduced motion.

- [ ] **Step 1: Write the failing e2e test**

Append to `e2e/smoke.spec.ts`:

```ts
test("atmosphere layer exists and page still renders h1", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#atmosphere")).toBeAttached();
  await expect(page.locator("h1").first()).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:e2e -- -g "atmosphere layer"`
Expected: FAIL — `locator('#atmosphere')` not found.

- [ ] **Step 3: Implement AtmosphereCanvas**

Create `app/components/visuals/AtmosphereCanvas.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../portfolio-visuals";

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

// Colors below are the GLSL twins of --cyan #00D4FF, --violet #7C3AED,
// --bg #0A0A0F. Adds are capped at 0.05 so text contrast is untouched.
const FRAG = `
precision mediump float;
uniform vec2 u_res;uniform float u_time;uniform float u_scroll;uniform vec2 u_mouse;
float blob(vec2 p,vec2 c,float r){return smoothstep(r,0.,length(p-c));}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  vec2 p=uv;p.x*=u_res.x/u_res.y;
  float t=u_time*0.05;
  vec2 m=(u_mouse-0.5)*0.12;
  float c1=blob(p,vec2(0.35+0.12*sin(t*1.3),0.72+0.08*cos(t))+m+vec2(0.,u_scroll*0.06),0.6);
  float c2=blob(p,vec2(0.85+0.1*cos(t*0.7),0.22+0.1*sin(t*1.1))+m*0.6-vec2(0.,u_scroll*0.04),0.55);
  vec3 col=vec3(0.039,0.039,0.059);
  col+=vec3(0.,0.83,1.)*c1*0.05;
  col+=vec3(0.49,0.23,0.93)*c2*0.05;
  vec2 g=abs(fract(uv*vec2(28.,28.))-0.5);
  col+=vec3(0.55,0.65,0.8)*smoothstep(0.47,0.5,max(g.x,g.y))*0.025;
  gl_FragColor=vec4(col,1.);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
  return s;
}

/**
 * AtmosphereCanvas — fullscreen nebula-grid behind the whole page.
 * ~30fps, DPR ≤1.5, pauses on document.hidden. Reduced motion renders a
 * single static frame; missing WebGL falls back to a CSS gradient div.
 */
export function AtmosphereCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [webglDead, setWebglDead] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) {
      setWebglDead(true);
      return;
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      setWebglDead(true);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uScroll = gl.getUniformLocation(prog, "u_scroll");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    let mx = 0.5;
    let my = 0.5;
    let smx = 0.5;
    let smy = 0.5;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth;
      my = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (time: number) => {
      smx += (mx - smx) * 0.03;
      smy += (my - smy) * 0.03;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform1f(
        uScroll,
        window.scrollY / Math.max(1, document.body.scrollHeight)
      );
      gl.uniform2f(uMouse, smx, smy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    if (reduced) {
      draw(10); // one static frame, arbitrary pleasant time
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", resize);
      };
    }

    let raf = 0;
    let last = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      if (now - last >= 33 && !document.hidden) {
        last = now;
        draw((now - t0) / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  if (webglDead) {
    return <div id="atmosphere" className="atmosphere-fallback" aria-hidden />;
  }
  return <canvas id="atmosphere" ref={ref} aria-hidden />;
}
```

- [ ] **Step 4: Add CSS**

Append to `app/globals.css`:

```css
/* ─── Atmosphere layer (Living Control Plane) ─────────────── */
#atmosphere {
  position: fixed;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.atmosphere-fallback {
  background:
    radial-gradient(60% 50% at 30% 70%, var(--cyan-tint-soft), transparent 70%),
    radial-gradient(55% 45% at 85% 20%, var(--violet-tint-soft), transparent 70%),
    var(--bg);
}
```

- [ ] **Step 5: Mount in Portfolio.tsx**

In `app/components/Portfolio.tsx`, add the import and render it as the first child of `#main-scene`:

```tsx
import { AtmosphereCanvas } from "./visuals/AtmosphereCanvas";
// ...
<div className="cobos-art" id="main-scene">
  <AtmosphereCanvas />
  <span id="top" aria-hidden style={{ position: "absolute" }} />
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test:e2e -- -g "atmosphere layer"`
Expected: PASS

- [ ] **Step 7: Full verification**

Run: `pnpm lint && pnpm typecheck && pnpm build`
Expected: clean; `○ /` still statically prerendered.

- [ ] **Step 8: Commit**

```bash
git add app/components/visuals/AtmosphereCanvas.tsx app/components/Portfolio.tsx app/globals.css e2e/smoke.spec.ts
git commit -m "feat(home): webgl nebula-grid atmosphere layer with css fallback"
```

---

### Task 2: ChapterMarker — display-scale "power-on" section markers

**Files:**
- Create: `app/components/cinematic/ChapterMarker.tsx`
- Modify: `app/components/chrome/primitives.tsx:19-83` (SectionHeader only)
- Modify: `app/globals.css`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `DecodeText` from `./DecodeText`.
- Produces: `export function ChapterMarker({ n, label }: { n: number; label: string }): JSX.Element`. `SectionHeader` keeps its existing props — no caller changes.

- [ ] **Step 1: Write the failing e2e test**

Append to `e2e/smoke.spec.ts`:

```ts
test("every section renders a chapter marker", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".chapter-marker")).toHaveCount(11);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:e2e -- -g "chapter marker"`
Expected: FAIL — count 0.

- [ ] **Step 3: Implement ChapterMarker**

Create `app/components/cinematic/ChapterMarker.tsx`:

```tsx
"use client";

import { DecodeText } from "./DecodeText";

/**
 * ChapterMarker — the section's `0N · label` at display scale, decoded on
 * entry with a one-shot scanline sweep: the section "powers on". Rendered
 * above the regular SectionHeader line. Reduced motion: DecodeText renders
 * final text and the scanline keyframes are frozen by the existing
 * prefers-reduced-motion block in globals.css.
 */
export function ChapterMarker({ n, label }: { n: number; label: string }) {
  return (
    <div className="chapter-marker" aria-hidden>
      <span className="chapter-marker-num">0{n}</span>
      <span className="chapter-marker-label">
        <DecodeText text={label.toUpperCase()} />
      </span>
      <span className="chapter-marker-scan" />
    </div>
  );
}
```

Note: `aria-hidden` because the accessible heading remains the existing `SectionHeader` line below.

- [ ] **Step 4: Wire into SectionHeader**

In `app/components/chrome/primitives.tsx`, import `ChapterMarker` from `../cinematic/ChapterMarker` and render it inside `SectionHeader`, immediately before the existing flex row `<div>`:

```tsx
<Reveal>
  <ChapterMarker n={n} label={t} />
  <div style={{ display: "flex", /* …unchanged… */ }}>
```

- [ ] **Step 5: Add CSS**

Append to `app/globals.css`:

```css
/* ─── Chapter markers ─────────────────────────────────────── */
.chapter-marker {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 8px;
  font-family: var(--font-display, inherit);
  font-size: clamp(40px, 10vw, 120px);
  line-height: var(--lh-display);
  letter-spacing: var(--ls-display);
  font-weight: 700;
  color: var(--fg);
  opacity: 0.14; /* ghost watermark — felt, not competing with content */
  user-select: none;
  white-space: nowrap;
}
.chapter-marker-num { color: var(--cyan); font-weight: 400; }
.chapter-marker-scan {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--cyan-tint-loud) 48%,
    var(--cyan-tint-loud) 52%,
    transparent 100%
  );
  transform: translateY(-101%);
  animation: chapter-scan var(--motion-slow) ease-out 1;
  pointer-events: none;
}
@keyframes chapter-scan {
  from { transform: translateY(-101%); }
  to { transform: translateY(101%); }
}
```

The existing `prefers-reduced-motion` block in `globals.css` already freezes registered keyframes — verify `chapter-scan` is covered by that block's selector (it uses a blanket `animation: none` rule; if it lists keyframes by name, add `chapter-scan`).

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test:e2e -- -g "chapter marker"`
Expected: PASS (11 markers: About, Stack, Infra, Work, Experience, Certifications, Testimonials, Trends, Blog, Approach, Contact).

- [ ] **Step 7: Full verification**

Run: `pnpm lint && pnpm typecheck && pnpm build`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add app/components/cinematic/ChapterMarker.tsx app/components/chrome/primitives.tsx app/globals.css e2e/smoke.spec.ts
git commit -m "feat(home): display-scale chapter markers with power-on scanline"
```

---

### Task 3: KineticMarquee — scroll-velocity type lines

**Files:**
- Create: `app/components/cinematic/KineticMarquee.tsx`
- Modify: `app/components/Portfolio.tsx`
- Modify: `app/globals.css`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `export function KineticMarquee({ words, mobile }: { words: string[]; mobile: boolean }): JSX.Element` — renders `.kinetic-marquee`.

- [ ] **Step 1: Write the failing e2e test**

Append to `e2e/smoke.spec.ts`:

```ts
test("kinetic marquees divide section groups", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".kinetic-marquee")).toHaveCount(3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:e2e -- -g "kinetic marquee"`
Expected: FAIL — count 0.

- [ ] **Step 3: Implement KineticMarquee**

Create `app/components/cinematic/KineticMarquee.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "../portfolio-visuals";

/**
 * KineticMarquee — a single horizontal line of domain words whose
 * translateX follows scroll VELOCITY (drifts back to 0 when idle). Writes
 * transform directly to the DOM: zero React re-renders per frame.
 * Reduced motion: static line, no listeners.
 */
export function KineticMarquee({
  words,
  mobile,
}: {
  words: string[];
  mobile: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const track = trackRef.current;
    if (!track) return;
    let lastY = window.scrollY;
    let vel = 0;
    let x = 0;
    let raf = 0;
    const onScroll = () => {
      vel += window.scrollY - lastY;
      lastY = window.scrollY;
    };
    const loop = () => {
      vel *= 0.92; // decay
      x = (x - vel * 0.6) % 1000;
      track.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const line = words.join("  ·  ") + "  ·  ";
  return (
    <div className="kinetic-marquee" aria-hidden>
      <div ref={trackRef} className="kinetic-marquee-track">
        {/* 4 copies so the 1000px wrap never shows a gap */}
        {[0, 1, 2, 3].map((i) => (
          <span key={i}>{line}</span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add CSS**

Append to `app/globals.css`:

```css
/* ─── Kinetic marquee ─────────────────────────────────────── */
.kinetic-marquee {
  overflow: hidden;
  border-top: 1px solid var(--hairline);
  padding: 12px 0;
  user-select: none;
}
.kinetic-marquee-track {
  display: inline-flex;
  white-space: nowrap;
  will-change: transform;
  font-family: var(--font-display, inherit);
  font-size: clamp(28px, 5vw, 56px);
  font-weight: 700;
  letter-spacing: var(--ls-heading);
  line-height: var(--lh-heading);
  color: transparent;
  -webkit-text-stroke: 1px var(--hairline-strong);
}
```

- [ ] **Step 5: Mount three marquees in Portfolio.tsx**

Import `KineticMarquee` and render between section groups:

```tsx
<About mobile={mobile} />
<Stack mobile={mobile} />
<Infra mobile={mobile} />
<KineticMarquee mobile={mobile} words={["gitops", "platform", "finops", "zero-trust", "sre"]} />
<Work mobile={mobile} />
{/* …Experience, Certifications, Testimonials, Trends… */}
<KineticMarquee mobile={mobile} words={["aws", "gcp", "azure", "kubernetes", "terraform"]} />
<Blog mobile={mobile} posts={posts} />
<KineticMarquee mobile={mobile} words={["ship", "measure", "harden", "repeat"]} />
<Approach mobile={mobile} />
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test:e2e -- -g "kinetic marquee"`
Expected: PASS. Also re-run the existing "no horizontal overflow" test — the marquee is the main overflow risk (`overflow: hidden` on the wrapper should keep it green).

- [ ] **Step 7: Full verification**

Run: `pnpm lint && pnpm typecheck && pnpm build`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add app/components/cinematic/KineticMarquee.tsx app/components/Portfolio.tsx app/globals.css e2e/smoke.spec.ts
git commit -m "feat(home): scroll-velocity kinetic marquees between section groups"
```

---

### Task 4: Live data — shared fetchers + hero telemetry strip

**Files:**
- Create: `app/lib/live-data.ts`
- Create: `app/components/chrome/TelemetryStrip.tsx`
- Modify: `app/start/spaceData.ts` → re-export shim
- Modify: `app/components/chrome/Hero.tsx` (render strip below `BootLog`)
- Modify: `app/globals.css`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `useMounted` from `../portfolio-visuals`; existing `SpaceData` shape from `app/start/spaceData.ts`.
- Produces (later tasks and `/start` rely on these):
  - `app/lib/live-data.ts`: `export type SpaceData = { solarWind: number; kp: number; iss: { lat: number; lon: number; velKms: number } | null; people: number }`
  - `export async function getSpaceData(): Promise<SpaceData>` — identical behavior to today's `app/start/spaceData.ts`.
  - `export type LatestCommit = { sha: string; subject: string; when: string }` (`when` = ISO date)
  - `export async function getLatestCommit(): Promise<LatestCommit | null>` — null on any failure.
  - `TelemetryStrip({ mobile }: { mobile: boolean })` renders `#telemetry-strip`.

- [ ] **Step 1: Write the failing e2e test**

Append to `e2e/smoke.spec.ts`:

```ts
test("hero shows telemetry strip with placeholders before hydration", async ({ page }) => {
  await page.goto("/");
  const strip = page.locator("#telemetry-strip");
  await expect(strip).toBeAttached();
  // Network may be unavailable in CI — assert structure, not live values.
  await expect(strip.locator("span").first()).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:e2e -- -g "telemetry strip"`
Expected: FAIL — `#telemetry-strip` not found.

- [ ] **Step 3: Create app/lib/live-data.ts**

Move the full contents of `app/start/spaceData.ts` (types, `FALLBACK`, `fetchJson`, `getSpaceData`) verbatim into `app/lib/live-data.ts`, then append:

```ts
export type LatestCommit = { sha: string; subject: string; when: string };

/** Latest commit on this very repo — the portfolio shows its own
 * deployment log. Public GitHub API, no token, 60 req/hr per IP is
 * plenty for a client-side fetch. Null on any failure. */
export async function getLatestCommit(): Promise<LatestCommit | null> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/ErnestoCobos/Portfolio/commits?per_page=1",
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as {
      sha?: string;
      commit?: { message?: string; committer?: { date?: string } };
    }[];
    const c = rows[0];
    if (!c?.sha || !c.commit?.message || !c.commit.committer?.date) return null;
    return {
      sha: c.sha.slice(0, 7),
      subject: c.commit.message.split("\n")[0].slice(0, 60),
      when: c.commit.committer.date,
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Turn app/start/spaceData.ts into a re-export shim**

Replace the entire file with:

```ts
// Moved to app/lib/live-data.ts (shared with the home telemetry strip).
// This shim keeps existing /start imports working.
export * from "../lib/live-data";
```

Verify `/start` still builds (its imports of `getSpaceData` / `SpaceData` resolve through the shim). If `/start` imports individual names, `export *` covers them.

- [ ] **Step 5: Create TelemetryStrip**

Create `app/components/chrome/TelemetryStrip.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { getLatestCommit, getSpaceData } from "../../lib/live-data";
import type { LatestCommit, SpaceData } from "../../lib/live-data";
import { useMounted } from "../portfolio-visuals";

function relAge(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "<1h ago";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * TelemetryStrip — live control-plane line under the hero boot log:
 * space telemetry + this repo's own last commit. Server and first client
 * render both show "···" placeholders (hydration-safe); values fill in
 * after mount. Failures keep the static fallbacks baked into live-data.
 */
export function TelemetryStrip({ mobile }: { mobile: boolean }) {
  const mounted = useMounted();
  const [space, setSpace] = useState<SpaceData | null>(null);
  const [commit, setCommit] = useState<LatestCommit | null>(null);

  useEffect(() => {
    let live = true;
    getSpaceData().then((d) => live && setSpace(d));
    getLatestCommit().then((c) => live && setCommit(c));
    return () => {
      live = false;
    };
  }, []);

  const items: [string, string][] = [
    ["solar_wind", mounted && space ? `${space.solarWind} km/s` : "···"],
    ["kp_index", mounted && space ? space.kp.toFixed(1) : "···"],
    ["humans_in_space", mounted && space ? String(space.people) : "···"],
    [
      "last_deploy",
      mounted && commit ? `${commit.sha} · ${relAge(commit.when)}` : "···",
    ],
  ];

  return (
    <div
      id="telemetry-strip"
      className="mono"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: mobile ? "8px 16px" : "8px 24px",
        fontSize: "var(--text-mono)",
        letterSpacing: "var(--ls-meta)",
        color: "var(--meta)",
      }}
    >
      {items.map(([k, v]) => (
        <span key={k}>
          <span style={{ color: "var(--muted)" }}>{k}:</span>{" "}
          <span style={{ color: "var(--cyan)" }}>{v}</span>
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Mount in Hero below BootLog**

In `app/components/chrome/Hero.tsx`, import `TelemetryStrip` from `./TelemetryStrip` and render it directly under the `<BootLog … />` element inside the hero terminal chrome (same parent, so it inherits the terminal panel look). Pass the existing `mobile` prop.

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm test:e2e -- -g "telemetry strip"`
Expected: PASS.

- [ ] **Step 8: Full verification**

Run: `pnpm lint && pnpm typecheck && pnpm build`
Expected: clean; `/start` page builds and its telemetry still works (shim).

- [ ] **Step 9: Commit**

```bash
git add app/lib/live-data.ts app/components/chrome/TelemetryStrip.tsx app/start/spaceData.ts app/components/chrome/Hero.tsx e2e/smoke.spec.ts
git commit -m "feat(home): live telemetry strip — space data + own commit log"
```

---

### Task 5: PowerRail — lateral module navigation

**Files:**
- Create: `app/components/visuals/PowerRail.tsx`
- Modify: `app/components/Portfolio.tsx`
- Modify: `app/globals.css`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: the existing `section[id]` elements rendered by `Section` in `chrome/primitives.tsx`.
- Produces: `export function PowerRail(): JSX.Element | null` — renders `.power-rail` with one `.power-rail-node` per section. Desktop only; returns null below 1100px viewport width.

- [ ] **Step 1: Write the failing e2e test**

Append to `e2e/smoke.spec.ts`:

```ts
test("power rail lists every section as a node", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".power-rail-node")).toHaveCount(11);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:e2e -- -g "power rail"`
Expected: FAIL — count 0.

- [ ] **Step 3: Implement PowerRail**

Create `app/components/visuals/PowerRail.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "../portfolio-visuals";
import { useViewportWidth } from "../hooks";

type Node = { id: string; label: string };

/**
 * PowerRail — fixed lateral "power line" with one node per section.
 * Nodes light up via IntersectionObserver; click jumps (smooth, or
 * instant under reduced motion). Discovers sections from the DOM so it
 * can never drift out of sync with Portfolio.tsx.
 */
export function PowerRail() {
  const width = useViewportWidth();
  const reduced = useReducedMotion();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("#main-scene section[id]")
    );
    setNodes(
      sections.map((s) => ({ id: s.id, label: s.id.replace(/-/g, " ") }))
    );
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive((e.target as HTMLElement).id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  if (width < 1100 || nodes.length === 0) return null;

  return (
    <nav className="power-rail" aria-label="Section navigation">
      {nodes.map((n) => (
        <button
          key={n.id}
          type="button"
          data-magnetic
          className={`power-rail-node${active === n.id ? " active" : ""}`}
          aria-label={n.label}
          onClick={() =>
            document
              .getElementById(n.id)
              ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" })
          }
        />
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Add CSS**

Append to `app/globals.css`:

```css
/* ─── Power rail ──────────────────────────────────────────── */
.power-rail {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.power-rail::before {
  content: "";
  position: absolute;
  left: 50%;
  top: -8px;
  bottom: -8px;
  width: 1px;
  background: var(--hairline);
}
.power-rail-node {
  position: relative;
  width: 9px;
  height: 9px;
  padding: 0;
  border-radius: var(--r-chip);
  border: 1px solid var(--hairline-strong);
  background: var(--bg);
  cursor: pointer;
  transition: background var(--motion-fast), box-shadow var(--motion-fast),
    border-color var(--motion-fast);
}
.power-rail-node:hover { border-color: var(--cyan); }
.power-rail-node.active {
  background: var(--cyan);
  border-color: var(--cyan);
  box-shadow: 0 0 12px var(--cyan-glow);
}
```

- [ ] **Step 5: Mount in Portfolio.tsx**

Import `PowerRail` and render it next to `AtmosphereCanvas` (order irrelevant — it's fixed):

```tsx
<AtmosphereCanvas />
<PowerRail />
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test:e2e -- -g "power rail"`
Expected: PASS (11 nodes).

- [ ] **Step 7: Full verification**

Run: `pnpm lint && pnpm typecheck && pnpm build`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add app/components/visuals/PowerRail.tsx app/components/Portfolio.tsx app/globals.css e2e/smoke.spec.ts
git commit -m "feat(home): power rail section navigation with live nodes"
```

---

### Task 6: MagneticCursor — crosshair cursor with magnetic targets

**Files:**
- Create: `app/components/visuals/MagneticCursor.tsx`
- Modify: `app/components/Portfolio.tsx`
- Modify: `app/components/chrome/Nav.tsx` (add `data-magnetic` to chips)
- Modify: `app/components/chrome/Hero.tsx` (add `data-magnetic` to CTA buttons)
- Modify: `app/globals.css`
- Test: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `useReducedMotion`, `useMounted` from `../portfolio-visuals`.
- Produces: `export function MagneticCursor(): JSX.Element | null` — renders `#magnetic-cursor` only when `matchMedia("(pointer: fine)")` matches and motion is allowed. Magnetic contract: any element with a `data-magnetic` attribute attracts the cursor and translates ≤4px toward the pointer.

- [ ] **Step 1: Write the failing e2e test**

Append to `e2e/smoke.spec.ts`:

```ts
test("magnetic cursor mounts on pointer:fine desktops", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#magnetic-cursor")).toBeAttached();
  // Power rail nodes (Task 5) carry the magnetic contract.
  expect(await page.locator("[data-magnetic]").count()).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:e2e -- -g "magnetic cursor"`
Expected: FAIL — `#magnetic-cursor` not found.

- [ ] **Step 3: Implement MagneticCursor**

Create `app/components/visuals/MagneticCursor.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../portfolio-visuals";

/**
 * MagneticCursor — crosshair reticle that lerps after the real pointer
 * (the native cursor is never hidden) and magnetizes [data-magnetic]
 * elements: cursor snaps toward them, target translates ≤4px toward the
 * pointer. All DOM writes, zero re-renders per frame.
 */
export function MagneticCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [fine, setFine] = useState(false);

  useEffect(() => {
    setFine(window.matchMedia("(pointer: fine)").matches);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !fine) return;
    let px = -100;
    let py = -100;
    let cx = -100;
    let cy = -100;
    let target: HTMLElement | null = null;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
    };
    const onOver = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest?.("[data-magnetic]");
      if (target && target !== t) target.style.transform = "";
      target = (t as HTMLElement) ?? null;
      el.dataset.state = target ? "locked" : "free";
    };

    const loop = () => {
      let gx = px;
      let gy = py;
      if (target) {
        const r = target.getBoundingClientRect();
        const tx = r.left + r.width / 2;
        const ty = r.top + r.height / 2;
        const dist = Math.hypot(tx - px, ty - py);
        if (dist < 120) {
          const pull = 1 - dist / 120;
          gx = px + (tx - px) * pull * 0.5;
          gy = py + (ty - py) * pull * 0.5;
          const ox = Math.max(-4, Math.min(4, (px - tx) * 0.08));
          const oy = Math.max(-4, Math.min(4, (py - ty) * 0.08));
          target.style.transform = `translate(${ox}px,${oy}px)`;
        } else {
          target.style.transform = "";
        }
      }
      cx += (gx - cx) * 0.18;
      cy += (gy - cy) * 0.18;
      el.style.transform = `translate3d(${cx - 12}px,${cy - 12}px,0)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      target?.style.removeProperty("transform");
    };
  }, [reduced, fine]);

  if (reduced || !fine) return null;
  return <div id="magnetic-cursor" ref={ref} aria-hidden data-state="free" />;
}
```

- [ ] **Step 4: Add CSS**

Append to `app/globals.css`:

```css
/* ─── Magnetic cursor ─────────────────────────────────────── */
#magnetic-cursor {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 90;
  width: 24px;
  height: 24px;
  pointer-events: none;
  border: 1px solid var(--cyan);
  border-radius: var(--r-chip);
  opacity: 0.6;
  transition: width var(--motion-fast), height var(--motion-fast),
    opacity var(--motion-fast);
}
#magnetic-cursor::before,
#magnetic-cursor::after {
  content: "";
  position: absolute;
  background: var(--cyan);
}
#magnetic-cursor::before { left: 50%; top: -4px; width: 1px; height: 6px; }
#magnetic-cursor::after { top: 50%; left: -4px; height: 1px; width: 6px; }
#magnetic-cursor[data-state="locked"] {
  width: 36px;
  height: 36px;
  opacity: 0.9;
}
```

- [ ] **Step 5: Mount + tag magnetic targets**

1. In `app/components/Portfolio.tsx`: `<MagneticCursor />` next to `<PowerRail />`.
2. In `app/components/chrome/Nav.tsx`: add `data-magnetic` to each nav chip element (find the chip class/nav link JSX; one attribute per element).
3. In `app/components/chrome/Hero.tsx`: add `data-magnetic` to the primary/secondary CTA buttons.

(PowerRail nodes already carry `data-magnetic` from Task 5.)

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test:e2e -- -g "magnetic cursor"`
Expected: PASS.

- [ ] **Step 7: Full verification**

Run: `pnpm lint && pnpm typecheck && pnpm build`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add app/components/visuals/MagneticCursor.tsx app/components/Portfolio.tsx app/components/chrome/Nav.tsx app/components/chrome/Hero.tsx app/globals.css e2e/smoke.spec.ts
git commit -m "feat(home): magnetic crosshair cursor for pointer:fine desktops"
```

---

### Task 7: Polish — performance, contrast, full suite

**Files:**
- Modify: whichever of the five new files need tuning (expected: `AtmosphereCanvas.tsx` intensity constants, `globals.css`)
- Test: `e2e/smoke.spec.ts` (no new assertions — whole suite must stay green)

**Interfaces:**
- Consumes: everything from Tasks 1–6.
- Produces: no new API.

- [ ] **Step 1: Full e2e suite**

Run: `pnpm test:e2e`
Expected: all tests PASS — including the pre-existing "no horizontal overflow", "work section has exactly 6 project cards", and locale-switch tests.

- [ ] **Step 2: Reduced-motion audit**

Run Chromium with reduced motion and confirm no animation runs:

```ts
// temporary manual check (do not commit): in e2e or via devtools emulation
page.emulateMedia({ reducedMotion: "reduce" });
// expect: chapter-scan frozen, marquee static, atmosphere = 1 frame, no cursor
```

Manual devtools pass is acceptable: Emulation → `prefers-reduced-motion: reduce` → scroll the whole page, confirm static.

- [ ] **Step 3: WebGL-disabled fallback check**

Run Chrome with `--disable-webgl` (Playwright `launchOptions.args` in a scratch run, or Chrome flag manually) and confirm `.atmosphere-fallback` renders and the page is intact. Do not commit a separate test unless it's stable; the smoke test already accepts either `#atmosphere` form.

- [ ] **Step 4: Contrast pass**

Scroll the page at the atmosphere's brightest state (mid-scroll, pointer at blob centers) and verify body text, `--muted` and `--meta` stay readable. If any doubt, lower the shader add constants (`0.05` → `0.035`) in `AtmosphereCanvas.tsx` — never touch text tokens.

- [ ] **Step 5: Performance pass**

In devtools Performance: scroll top→bottom once. Confirm: atmosphere ≤30fps, no long tasks >50ms from marquee/cursor loops, no layout thrash (`getBoundingClientRect` only inside the magnetic loop, throttled by rAF). Fix by lowering fps caps if violated.

- [ ] **Step 6: Final verification**

Run: `pnpm lint && pnpm typecheck && pnpm build && pnpm test:e2e`
Expected: everything green; `○ /` statically prerendered.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refine(home): living control plane polish — perf, contrast, fallbacks"
```

---

## Self-Review Notes (completed by plan author)

- **Spec coverage:** Atmosphere → Task 1; Chapter markers → Task 2; Kinetic marquee → Task 3 (split from Task 2 so each has its own test cycle); Live data + telemetry strip → Task 4; PowerRail → Task 5; MagneticCursor → Task 6; perf/contrast/e2e polish → Task 7. All spec sections covered.
- **Type consistency:** `SpaceData`/`LatestCommit` names match between Tasks 4 (definition) and TelemetryStrip (consumer). `data-magnetic` contract defined in Task 6 and pre-used by Task 5's PowerRail nodes — intentional, documented in both tasks. `ChapterMarker({ n, label })` matches its SectionHeader call site.
- **Placeholder scan:** no TBDs; every code step contains full code; every verification step has an exact command and expected result.

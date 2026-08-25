"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { RefObject } from "react";
import type { Architecture } from "./architectures";

/**
 * rAF ticker driving slow ambient motion (waves, pulses, gauge wobble).
 * `fps` caps the setState rate — these visuals are gentle sines, so
 * 20–24fps is indistinguishable from 60 while cutting React reconciliation
 * to a fraction of the work. Callers that truly need frame-precision
 * (nothing left does) can pass 60.
 */
export function useTicker(enabled: boolean = true, fps: number = 60) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let last = 0;
    const minDelta = 1000 / Math.max(1, Math.min(fps, 60));
    const start = performance.now();
    const loop = (now: number) => {
      if (now - last >= minDelta) {
        last = now;
        setT((now - start) / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [enabled, fps]);
  return enabled ? t : 0;
}

const noopSubscribe = () => () => {};
const getMountedClient = () => true;
const getMountedServer = () => false;

export function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, getMountedClient, getMountedServer);
}

const subscribeReducedMotion = (cb: () => void) => {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getReducedMotionClient = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getReducedMotionServer = () => false;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionClient,
    getReducedMotionServer
  );
}

/**
 * Whether the attached element is (about to be) on screen. Threshold 0 with a
 * +100px margin so ambient loops resume just before the element scrolls in.
 * Ambient rAF/ticker visuals used to keep burning CPU/battery three
 * viewports down the page; callers gate their loops on the boolean.
 * Starts `true` so SSR and engines without IntersectionObserver simply never
 * pause — the observer is the only thing allowed to flip it false.
 */
function useInViewport<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      // Last entry wins: batches arrive oldest→newest.
      (entries) => setInView(entries[entries.length - 1].isIntersecting),
      { threshold: 0, rootMargin: "100px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

type CloudTopologyProps = {
  width: number;
  height: number;
  density?: number;
  palette?: [string, string];
  animate?: boolean;
};

export function CloudTopology({
  width,
  height,
  density = 1,
  palette = ["#00D4FF", "#7C3AED"],
  animate = true,
}: CloudTopologyProps) {
  const [canvasRef, inView] = useInViewport<HTMLCanvasElement>();
  // Per-frame step installed by the setup effect; the loop effect below
  // invokes it. Splitting this way lets the rAF loop stop/start on viewport
  // entry/exit without tearing down the particle field (positions survive).
  const stepRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = width * dpr;
    c.height = height * dpr;
    ctx.scale(dpr, dpr);

    const N = Math.floor(36 * density);
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 1 + Math.random() * 2.2,
      hue: Math.random() < 0.7 ? palette[0] : palette[1],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            const alpha = (1 - d / 130) * 0.35;
            ctx.strokeStyle = a.hue === b.hue ? a.hue : "#5b6e9e";
            ctx.globalAlpha = alpha * 0.7;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      for (const n of nodes) {
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 8);
        grd.addColorStop(0, n.hue);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = n.hue;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (!animate) {
      draw();
      return;
    }

    stepRef.current = () => {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10) n.x = width + 10;
        if (n.x > width + 10) n.x = -10;
        if (n.y < -10) n.y = height + 10;
        if (n.y > height + 10) n.y = -10;
      }
      draw();
    };
    return () => {
      stepRef.current = null;
    };
  }, [canvasRef, width, height, density, palette, animate]);

  // The actual rAF loop runs only while the canvas is on screen — off-screen
  // it cancels entirely instead of painting frames nobody sees.
  useEffect(() => {
    if (!animate || !inView) return;
    let raf = 0;
    const tick = () => {
      stepRef.current?.();
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [animate, inView]);

  return <canvas ref={canvasRef} style={{ width, height, display: "block" }} />;
}

export function IsoCloud({
  size = 360,
  animate = true,
}: {
  size?: number;
  animate?: boolean;
}) {
  const [svgRef, inView] = useInViewport<SVGSVGElement>();
  // Ticker gated on visibility — off-screen the wave freezes instead of
  // re-rendering 36 cells at 24fps for nobody.
  const t = useTicker(animate && inView, 24); // slow wave — 24fps is plenty
  const cells: { x: number; z: number; h: number; op: number }[] = [];
  const W = 6;
  for (let z = 0; z < W; z++) {
    for (let x = 0; x < W; x++) {
      const phase = (x + z) * 0.4 + t * 1.2;
      const lift = (Math.sin(phase) + 1) / 2;
      cells.push({ x, z, h: 6 + lift * 28, op: 0.25 + lift * 0.6 });
    }
  }
  return (
    <svg ref={svgRef} viewBox="0 0 240 240" style={{ width: size, height: size, overflow: "visible" }}>
      <defs>
        <linearGradient id="iso-cyan" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#00D4FF" stopOpacity=".95" />
          <stop offset="1" stopColor="#00D4FF" stopOpacity=".25" />
        </linearGradient>
        <linearGradient id="iso-violet" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7C3AED" stopOpacity=".95" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity=".25" />
        </linearGradient>
      </defs>
      <g transform="translate(120,140)">
        {cells.map((c, i) => {
          const px = (c.x - c.z) * 14;
          const py = (c.x + c.z) * 7 - c.h;
          const fill = (c.x + c.z) % 2 === 0 ? "url(#iso-cyan)" : "url(#iso-violet)";
          return (
            <g key={i} transform={`translate(${px},${py})`} opacity={c.op}>
              <polygon points="0,0 14,7 0,14 -14,7" fill={fill} />
              <polygon
                points={`0,14 14,7 14,${7 + c.h} 0,${14 + c.h}`}
                fill="rgba(0,212,255,.18)"
                stroke="rgba(0,212,255,.35)"
                strokeWidth=".4"
              />
              <polygon
                points={`0,14 -14,7 -14,${7 + c.h} 0,${14 + c.h}`}
                fill="rgba(124,58,237,.18)"
                stroke="rgba(124,58,237,.35)"
                strokeWidth=".4"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

const ARCH_COLOR = {
  edge: "#00D4FF",
  net: "#00D4FF",
  k8s: "#7C3AED",
  gitops: "#7C3AED",
  data: "#94A3B8",
  sec: "#F59E0B",
  obs: "#22C55E",
} as const;

export function ArchDiagram({
  arch,
  compact = false,
  animate = true,
}: {
  arch: Architecture;
  compact?: boolean;
  animate?: boolean;
}) {
  const [svgRef, inView] = useInViewport<SVGSVGElement>();
  // Ticker gated on visibility — off-screen diagrams hold their last frame
  // instead of diffing the whole SVG at 20fps.
  const t = useTicker(animate && inView, 20); // slow pulses — no need for 60fps diffs of the whole SVG
  const W = compact ? 360 : 920;
  const H = compact ? 260 : 560;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
  const nodes = arch.nodes;
  const edges = arch.edges;
  const zones = arch.zones;

  if (compact) {
    // Distill the architecture down to 9 chips on a 360×260 canvas.
    const ids = Object.keys(nodes).slice(0, 9);
    const cols = 3;
    return (
      <svg
        key={arch.id}
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {ids.map((id, i) => {
          const n = nodes[id];
          const c = ARCH_COLOR[n.kind] || "#94A3B8";
          const cx = 60 + (i % cols) * 120;
          const cy = 50 + Math.floor(i / cols) * 80;
          return (
            <g key={id} transform={`translate(${cx},${cy})`}>
              <rect x={-44} y={-16} width={88} height={32} rx={6} fill="#0E0E14" stroke={c} strokeOpacity=".7" />
              <text x={0} y={4} textAnchor="middle" fill="#F8FAFC" fontSize="10" fontFamily="JetBrains Mono">
                {n.label.slice(0, 12)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <svg
      key={arch.id}
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <defs>
        <pattern id="ad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#ad-grid)" />
      <rect x="20" y="20" width={W - 40} height={H - 40} rx="14" fill="none" stroke="rgba(255,255,255,.08)" strokeDasharray="6 6" />
      <text x="36" y="14" fill="rgba(255,255,255,.4)" fontSize="10" fontFamily="JetBrains Mono" letterSpacing=".15em">
        {arch.region}
      </text>
      {zones.map((z, i) => {
        const c = ARCH_COLOR[z.kind] || "#94A3B8";
        // fieldset/legend pattern: punch through the dashed border under the
        // label so cards rendered later cannot eat the text. ~6.6px per glyph
        // at fontSize 9 with .15em letter-spacing in JetBrains Mono.
        const labelW = z.label.length * 6.6 + 14;
        return (
          <g key={i}>
            <rect
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              rx="10"
              fill={c}
              fillOpacity=".035"
              stroke={c}
              strokeOpacity=".22"
            />
            <rect
              x={z.x + 10}
              y={z.y - 7}
              width={labelW}
              height={14}
              fill="#08080C"
            />
            <text
              x={z.x + 17}
              y={z.y}
              dominantBaseline="middle"
              fill={c}
              fillOpacity=".85"
              fontSize="9"
              fontFamily="JetBrains Mono"
              letterSpacing=".15em"
            >
              {z.label}
            </text>
          </g>
        );
      })}
      {edges.map(([fromK, toK, kind], i) => {
        const a = nodes[fromK];
        const b = nodes[toK];
        if (!a || !b) return null;
        const stroke =
          kind === "sec"
            ? "rgba(245,158,11,.45)"
            : kind === "gitops"
              ? "rgba(124,58,237,.55)"
              : kind === "dim"
                ? "rgba(255,255,255,.12)"
                : "rgba(0,212,255,.45)";
        const dash = kind === "sec" ? "4 4" : kind === "gitops" ? "2 5" : kind === "dim" ? "3 5" : "0";
        return (
          <g key={`${fromK}-${toK}-${i}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={kind === "sec" || kind === "gitops" ? 1 : 1.2} strokeDasharray={dash} />
            {animate && kind === "flow" && (
              <circle r={2.6} fill="#00D4FF">
                <animateMotion dur={`${1.8 + (i % 4) * 0.4}s`} repeatCount="indefinite" path={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} />
              </circle>
            )}
            {animate && kind === "gitops" && (
              <circle r={2.2} fill="#7C3AED">
                <animateMotion dur={`${2.6 + (i % 3) * 0.3}s`} repeatCount="indefinite" path={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} />
              </circle>
            )}
          </g>
        );
      })}
      {Object.entries(nodes).map(([k, n]) => {
        const c = ARCH_COLOR[n.kind] || "#94A3B8";
        // Label cell runs from x=-50 up to ~x=42 (badge sits at x=44..62).
        // For labels wider than the cell, compress with textLength so they
        // never bleed under the right-side badge chip.
        const labelMaxW = 92;
        const labelW = n.label.length * 6.6;
        const compressLabel = labelW > labelMaxW;
        const subMaxW = 108;
        const subW = (n.sub?.length ?? 0) * 5.4;
        const compressSub = subW > subMaxW;
        return (
          <g key={k} transform={`translate(${n.x},${n.y})`}>
            <rect x={-72} y={-26} width={144} height={52} rx="10" fill={c} fillOpacity=".05" />
            <rect x={-70} y={-24} width={140} height={48} rx="9" fill="#0B0B12" stroke={c} strokeOpacity=".7" strokeWidth="1" />
            <circle cx={-58} cy={-12} r="2.5" fill={c} opacity={0.5 + 0.5 * Math.sin(t * 2 + n.x * 0.01)} />
            <text
              x={-50}
              y={-7}
              fill="#F8FAFC"
              fontSize="11"
              fontFamily="JetBrains Mono"
              fontWeight="500"
              {...(compressLabel && { textLength: labelMaxW, lengthAdjust: "spacingAndGlyphs" as const })}
            >
              {n.label}
            </text>
            {n.sub && (
              <text
                x={-50}
                y={9}
                fill="rgba(255,255,255,.45)"
                fontSize="9"
                fontFamily="JetBrains Mono"
                {...(compressSub && { textLength: subMaxW, lengthAdjust: "spacingAndGlyphs" as const })}
              >
                {n.sub}
              </text>
            )}
            <text x={62} y={-9} textAnchor="end" fill={c} fillOpacity=".55" fontSize="8" fontFamily="JetBrains Mono" letterSpacing=".1em">
              {(n.short || k).toUpperCase().slice(0, 4)}
            </text>
          </g>
        );
      })}
      <g transform={`translate(${W - 220}, ${H - 70})`}>
        <rect x="0" y="0" width="200" height="56" rx="6" fill="#0B0B12" stroke="rgba(255,255,255,.12)" />
        <text x="10" y="14" fill="rgba(255,255,255,.4)" fontSize="9" fontFamily="JetBrains Mono" letterSpacing=".15em">
          LIVE · TRAFFIC
        </text>
        <text x="10" y="34" fill="#F8FAFC" fontSize="13" fontFamily="JetBrains Mono">
          {arch.rps + Math.floor(Math.sin(t) * Math.max(60, arch.rps * 0.1))} rps
        </text>
        <text x="10" y="48" fill="rgba(0,212,255,.85)" fontSize="9" fontFamily="JetBrains Mono">
          p95 {(arch.p95 + pulse * 8).toFixed(0)}ms · err {arch.errPct.toFixed(2)}%
        </text>
        <circle cx="186" cy="14" r="3" fill="#22C55E" opacity={0.6 + 0.4 * Math.sin(t * 3)} />
      </g>
    </svg>
  );
}

export function CobosLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" style={{ display: "block" }}>
      <defs>
        <linearGradient id="clg" x1="0" x2="1">
          <stop offset="0" stopColor="#00D4FF" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <path d="M14 4 L24 9 V19 L14 24 L4 19 V9 Z" fill="none" stroke="url(#clg)" strokeWidth="1.6" />
      <circle cx="14" cy="14" r="3.2" fill="url(#clg)" />
    </svg>
  );
}

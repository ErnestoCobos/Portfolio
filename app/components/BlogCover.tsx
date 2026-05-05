"use client";

import type { PostCategory } from "./portfolio-data";
import { createRand } from "./seeded-rand";

/* ── Visual tokens per category ─────────────────────────────── */
const ACCENT_HEX: Record<PostCategory, string> = {
  gitops: "#00D4FF",
  migrations: "#7C3AED",
  finops: "#00D4FF",
  platform: "#7C3AED",
};

/* ── Category-specific "feature mark" ───────────────────────────
 * All marks draw centered around origin (0,0). Caller wraps in a
 * <g transform="translate(cx,cy) scale(s)"> to place + size. */
function CategoryMark({
  category,
  accent,
}: {
  category: PostCategory;
  accent: string;
}) {
  switch (category) {
    case "gitops": {
      // Branching tree: trunk node (left) → 2 child nodes (right)
      const a: [number, number] = [-40, 0];
      const b: [number, number] = [40, -36];
      const c: [number, number] = [40, 36];
      return (
        <g>
          <line
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
            stroke={accent}
            strokeWidth={1.6}
            opacity={0.9}
          />
          <line
            x1={a[0]}
            y1={a[1]}
            x2={c[0]}
            y2={c[1]}
            stroke={accent}
            strokeWidth={1.6}
            opacity={0.9}
          />
          {[a, b, c].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={14} fill={accent} opacity={0.12} />
              <circle cx={x} cy={y} r={6} fill={accent} opacity={0.28} />
              <circle cx={x} cy={y} r={3.5} fill={accent} />
            </g>
          ))}
        </g>
      );
    }
    case "migrations": {
      // 4-step arrow chain ascending right
      const steps = 4;
      const w = 30;
      const startX = -((steps * w) / 2);
      return (
        <g opacity={0.95}>
          {Array.from({ length: steps }).map((_, i) => {
            const x = startX + i * w;
            const y = -i * 8;
            return (
              <path
                key={i}
                d={`M${x} ${y + 12} L${x + w - 6} ${y + 12} L${x + w - 16} ${y + 2} M${x + w - 6} ${y + 12} L${x + w - 16} ${y + 22}`}
                stroke={accent}
                strokeWidth={1.6}
                fill="none"
                opacity={0.6 + i * 0.1}
              />
            );
          })}
        </g>
      );
    }
    case "finops": {
      // Ascending bars + sparkline overlay
      const bars = [12, 20, 14, 30, 22, 40, 32, 56, 46, 64];
      const bw = 9;
      const gap = 3;
      const totalW = bars.length * (bw + gap) - gap;
      const startX = -totalW / 2;
      const baseY = 28;
      return (
        <g>
          {bars.map((h, i) => (
            <rect
              key={i}
              x={startX + i * (bw + gap)}
              y={baseY - h}
              width={bw}
              height={h}
              fill={accent}
              opacity={0.15 + (i / bars.length) * 0.6}
            />
          ))}
          <polyline
            points={bars
              .map(
                (h, i) =>
                  `${startX + i * (bw + gap) + bw / 2},${baseY - h - 4}`
              )
              .join(" ")}
            fill="none"
            stroke={accent}
            strokeWidth={1.8}
            opacity={0.95}
          />
        </g>
      );
    }
    case "platform": {
      // Concentric hex wireframes
      const r1 = 56;
      const r2 = 34;
      const r3 = 14;
      const hex = (R: number) =>
        Array.from({ length: 6 })
          .map((_, i) => {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            return `${Math.cos(a) * R},${Math.sin(a) * R}`;
          })
          .join(" ");
      return (
        <g>
          <polygon
            points={hex(r1)}
            fill="none"
            stroke={accent}
            strokeWidth={1.4}
            opacity={0.55}
          />
          <polygon
            points={hex(r2)}
            fill="none"
            stroke={accent}
            strokeWidth={1.4}
            opacity={0.85}
          />
          <polygon
            points={hex(r3)}
            fill={accent}
            opacity={0.22}
            stroke={accent}
            strokeWidth={1.2}
          />
          <circle cx={0} cy={0} r={3.5} fill={accent} />
        </g>
      );
    }
  }
}

/* ── Main cover ─────────────────────────────────────────────── */
export function BlogCover({
  slug,
  category,
  variant = "hero",
  ariaHidden = true,
}: {
  slug: string;
  category: PostCategory;
  variant?: "hero" | "thumb";
  ariaHidden?: boolean;
}) {
  const accent = ACCENT_HEX[category];
  const rand = createRand(slug);

  if (variant === "thumb") {
    // Compact 64x64 — just dot field + 1-2 highlight nodes
    const dots: { x: number; y: number; r: number; o: number }[] = [];
    for (let y = 6; y < 64; y += 8) {
      for (let x = 6; x < 64; x += 8) {
        const o = rand();
        dots.push({
          x,
          y,
          r: o > 0.85 ? 1.6 : 0.8,
          o: o > 0.85 ? 0.9 : 0.18 + o * 0.2,
        });
      }
    }
    const ax = 8 + Math.floor(rand() * 6) * 8;
    const ay = 8 + Math.floor(rand() * 6) * 8;
    return (
      <svg
        viewBox="0 0 64 64"
        width="100%"
        height="100%"
        aria-hidden={ariaHidden}
        style={{ display: "block", background: "#0A0A0F" }}
      >
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r}
            fill={accent}
            opacity={d.o}
          />
        ))}
        <circle cx={ax} cy={ay} r={4} fill={accent} opacity={0.18} />
        <circle cx={ax} cy={ay} r={1.8} fill={accent} />
        <line
          x1={0}
          y1={0}
          x2={64}
          y2={0}
          stroke={accent}
          strokeWidth={1}
          opacity={0.9}
        />
      </svg>
    );
  }

  // Hero variant — 800x400 viewBox
  const W = 800;
  const H = 400;

  // Dot grid with seeded intensity
  const dots: { x: number; y: number; r: number; o: number; bright: boolean }[] =
    [];
  const SP = 26; // grid spacing
  for (let y = 18; y < H; y += SP) {
    for (let x = 18; x < W; x += SP) {
      const v = rand();
      const bright = v > 0.92;
      dots.push({
        x,
        y,
        r: bright ? 2.4 : 0.9,
        o: bright ? 0.95 : 0.08 + v * 0.12,
        bright,
      });
    }
  }

  // 3-5 connecting lines between bright dots
  const bright = dots.filter((d) => d.bright);
  const lines: { a: (typeof dots)[number]; b: (typeof dots)[number] }[] = [];
  if (bright.length >= 2) {
    const n = Math.min(4, Math.floor(bright.length / 2));
    for (let i = 0; i < n; i++) {
      const a = bright[Math.floor(rand() * bright.length)];
      const b = bright[Math.floor(rand() * bright.length)];
      if (a !== b) lines.push({ a, b });
    }
  }

  // Mark position — slightly off-center so the layout stays asymmetric and
  // alive without crowding the edges
  const markX = W * (0.42 + rand() * 0.22);
  const markY = H * (0.4 + rand() * 0.22);
  // Mark scale — make it the visual anchor of the cover
  const markScale = 1.5 + rand() * 0.4;

  // Radial gradient seed position — push toward the mark for a natural halo
  const gx = (markX / W) * 100;
  const gy = (markY / H) * 100;

  const gradId = `cover-grad-${slug}`;
  const haloId = `cover-halo-${slug}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden={ariaHidden}
      style={{ display: "block", background: "#0A0A0F" }}
    >
      <defs>
        <radialGradient id={gradId} cx={`${gx}%`} cy={`${gy}%`} r="65%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="55%" stopColor={accent} stopOpacity="0.06" />
          <stop offset="100%" stopColor="#0A0A0F" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
          <stop offset="60%" stopColor={accent} stopOpacity="0.06" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Mood gradient */}
      <rect width={W} height={H} fill={`url(#${gradId})`} />

      {/* Faint horizon grid lines */}
      {[H * 0.33, H * 0.66].map((y, i) => (
        <line
          key={i}
          x1={0}
          y1={y}
          x2={W}
          y2={y}
          stroke="#fff"
          strokeOpacity={0.025}
          strokeDasharray="2 6"
        />
      ))}

      {/* Connecting topology lines (drawn under dots) */}
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.a.x}
          y1={l.a.y}
          x2={l.b.x}
          y2={l.b.y}
          stroke={accent}
          strokeWidth={0.8}
          opacity={0.35}
        />
      ))}

      {/* Dot field */}
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={accent}
          opacity={d.o}
        />
      ))}

      {/* Bright halos */}
      {bright.map((d, i) => (
        <circle
          key={`h${i}`}
          cx={d.x}
          cy={d.y}
          r={8}
          fill={accent}
          opacity={0.12}
        />
      ))}

      {/* Soft halo behind the mark */}
      <circle
        cx={markX}
        cy={markY}
        r={120 * markScale}
        fill={`url(#${haloId})`}
      />

      {/* Category-specific feature mark */}
      <g transform={`translate(${markX} ${markY}) scale(${markScale})`}>
        <CategoryMark category={category} accent={accent} />
      </g>

      {/* Top accent stripe */}
      <line
        x1={0}
        y1={1}
        x2={W}
        y2={1}
        stroke={accent}
        strokeWidth={2}
        opacity={1}
      />

      {/* Bottom hairline */}
      <line
        x1={0}
        y1={H - 0.5}
        x2={W}
        y2={H - 0.5}
        stroke="#fff"
        strokeOpacity={0.08}
      />
    </svg>
  );
}

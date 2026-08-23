"use client";

import { useState } from "react";

type Entry = { y: string; role: string; co: string; note: string };

/** Map a company token to its semantic accent. Founder periods read as
 * violet; ops/infra periods as cyan; consultancy as neutral. Order matches
 * substrings checked top-down. */
function accentFor(co: string): "cyan" | "violet" | "neutral" {
  const lower = co.toLowerCase();
  if (lower.includes("enkiflow") || lower.includes("getdecant"))
    return "violet";
  if (lower.includes("agencia") || lower.includes("consultor")) return "neutral";
  return "cyan";
}

const COLOR: Record<"cyan" | "violet" | "neutral", string> = {
  cyan: "var(--cyan)",
  violet: "var(--violet)",
  neutral: "var(--meta)",
};

const GLOW: Record<"cyan" | "violet" | "neutral", string> = {
  cyan: "var(--cyan-glow)",
  violet: "var(--violet-glow)",
  neutral: "rgba(168,181,199,.45)",
};

/** Parse "2024 — hoy" or "2021 — 2023" → [from, to] integers. "hoy" maps
 * to currentYear (passed in to keep the function pure for SSR). */
function parseRange(y: string, currentYear: number): [number, number] {
  const parts = y.split(/—|–|-/).map((s) => s.trim());
  const from = parseInt(parts[0], 10);
  const toRaw = parts[1] ?? parts[0];
  const to = /hoy|present/i.test(toRaw)
    ? currentYear
    : parseInt(toRaw, 10);
  return [from, isNaN(to) ? currentYear : to];
}

const VIEW_W = 1200;
const PAD_X = 60;
const PAD_TOP = 50;
const PAD_BOT = 50;
const LANE_H = 32;

export function ExperienceTimeline({
  entries,
  currentYear = 2026,
}: {
  entries: Entry[];
  currentYear?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Sort oldest → newest by start year so lanes flow chronologically top→bot.
  const ranges = entries.map((e, i) => {
    const [from, to] = parseRange(e.y, currentYear);
    return { ...e, from, to, idx: i };
  });
  ranges.sort((a, b) => a.from - b.from);

  const minYear = Math.min(...ranges.map((r) => r.from));
  const maxYear = currentYear;
  const span = Math.max(1, maxYear - minYear);
  const usableW = VIEW_W - PAD_X * 2;

  const xAt = (year: number) =>
    PAD_X + ((year - minYear) / span) * usableW;

  const laneY = (laneIdx: number) =>
    PAD_TOP + laneIdx * LANE_H;

  const totalH = PAD_TOP + ranges.length * LANE_H + PAD_BOT;
  const yearTicks: number[] = [];
  for (let y = minYear; y <= maxYear; y++) yearTicks.push(y);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${totalH}`}
        width="100%"
        height="auto"
        role="img"
        aria-label={`Experience timeline from ${minYear} to ${currentYear}, ${ranges.length} roles`}
        style={{ display: "block" }}
      >
        {/* Year axis grid: thin verticals + labels at the bottom */}
        {yearTicks.map((y) => {
          const x = xAt(y);
          const isPivot = y % 2 === 0; // emphasize even years
          return (
            <g key={y}>
              <line
                x1={x}
                y1={PAD_TOP - 6}
                x2={x}
                y2={totalH - PAD_BOT + 6}
                stroke="var(--hairline)"
                strokeWidth={0.5}
                strokeDasharray={isPivot ? "none" : "1 6"}
                opacity={isPivot ? 0.55 : 0.3}
              />
              <text
                x={x}
                y={totalH - PAD_BOT + 24}
                textAnchor="middle"
                fontFamily="var(--font-jetbrains-mono)"
                fontSize="10"
                fill="var(--meta)"
                letterSpacing="0.05em"
              >
                {y}
              </text>
            </g>
          );
        })}

        {/* Horizontal axis baseline */}
        <line
          x1={PAD_X}
          y1={totalH - PAD_BOT}
          x2={VIEW_W - PAD_X}
          y2={totalH - PAD_BOT}
          stroke="var(--hairline-strong)"
          strokeWidth={1}
        />

        {/* "Now" marker */}
        <g>
          <line
            x1={xAt(currentYear)}
            y1={PAD_TOP - 12}
            x2={xAt(currentYear)}
            y2={totalH - PAD_BOT + 6}
            stroke="var(--cyan)"
            strokeWidth={1}
            strokeDasharray="2 3"
            opacity={0.7}
          />
          <text
            x={xAt(currentYear)}
            y={PAD_TOP - 18}
            textAnchor="middle"
            fontFamily="var(--font-jetbrains-mono)"
            fontSize="9"
            fill="var(--cyan)"
            letterSpacing="0.18em"
          >
            NOW
          </text>
        </g>

        {/* Role bars */}
        {ranges.map((r, lane) => {
          // Render newest at the top (Ford 2024-hoy first).
          const reverseLane = ranges.length - 1 - lane;
          const a = accentFor(r.co);
          const x1 = xAt(r.from);
          const x2 = xAt(r.to);
          const y = laneY(reverseLane);
          const w = Math.max(8, x2 - x1);
          const h = LANE_H - 14;
          const isHover = hoverIdx === r.idx;
          const others = hoverIdx !== null && hoverIdx !== r.idx;

          return (
            <g
              key={r.idx}
              onMouseEnter={() => setHoverIdx(r.idx)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                opacity: others ? 0.35 : 1,
                transition: "opacity .2s",
                cursor: "pointer",
              }}
            >
              {/* Bar */}
              <rect
                x={x1}
                y={y}
                width={w}
                height={h}
                rx={4}
                fill={COLOR[a]}
                opacity={isHover ? 0.32 : 0.18}
                style={{
                  filter: isHover ? `drop-shadow(0 0 12px ${GLOW[a]})` : "none",
                  transition: "opacity .18s, filter .18s",
                }}
              />
              {/* Bar border */}
              <rect
                x={x1}
                y={y}
                width={w}
                height={h}
                rx={4}
                fill="none"
                stroke={COLOR[a]}
                strokeWidth={isHover ? 1.4 : 0.8}
                opacity={isHover ? 1 : 0.7}
              />
              {/* Start dot */}
              <circle
                cx={x1}
                cy={y + h / 2}
                r={3}
                fill={COLOR[a]}
                style={{
                  filter: isHover ? `drop-shadow(0 0 6px ${GLOW[a]})` : "none",
                }}
              />
              {/* End dot — only if to < currentYear */}
              {r.to < currentYear && (
                <circle cx={x2} cy={y + h / 2} r={2} fill={COLOR[a]} />
              )}
              {/* Inline label inside the bar when it fits; otherwise next to
                  the bar — to the right, or flipped to the left when the bar
                  ends at the NOW edge and the label would clip the viewBox. */}
              {(() => {
                const labelW = r.role.length * 7; // ~11px JetBrains Mono
                const overflowsRight = x2 + 8 + labelW > VIEW_W - 4;
                if (w >= 220) {
                  return (
                    <text
                      x={x1 + 10}
                      y={y + h / 2 + 4}
                      fontFamily="var(--font-jetbrains-mono)"
                      fontSize="11"
                      fill="var(--fg)"
                    >
                      {r.role}
                      <tspan fill={COLOR[a]} dx="6">
                        @{r.co.toLowerCase().split(" ")[0].replace(",", "")}
                      </tspan>
                    </text>
                  );
                }
                if (overflowsRight) {
                  return (
                    <text
                      x={x1 - 8}
                      y={y + h / 2 + 4}
                      textAnchor="end"
                      fontFamily="var(--font-jetbrains-mono)"
                      fontSize="11"
                      fill="var(--fg)"
                    >
                      {r.role}
                    </text>
                  );
                }
                return (
                  <text
                    x={x2 + 8}
                    y={y + h / 2 + 4}
                    fontFamily="var(--font-jetbrains-mono)"
                    fontSize="11"
                    fill="var(--fg)"
                  >
                    {r.role}
                  </text>
                );
              })()}
            </g>
          );
        })}
      </svg>

      {/* Tooltip — text rendered in HTML for crisp typography on hover */}
      {hoverIdx !== null && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: 16,
            padding: "12px 16px",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--r-card-sm)",
            background: "var(--surface-soft)",
          }}
        >
          {(() => {
            const r = ranges.find((x) => x.idx === hoverIdx)!;
            const a = accentFor(r.co);
            return (
              <>
                <div
                  className="mono"
                  style={{
                    fontSize: "var(--text-mono-xs)",
                    color: COLOR[a],
                    letterSpacing: "var(--ls-tag)",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {r.from} — {r.to >= currentYear ? "hoy" : r.to} ·{" "}
                  <span style={{ color: "var(--meta)" }}>{r.role}</span>
                </div>
                <div
                  style={{
                    fontSize: "var(--text-body-sm)",
                    color: "var(--body-soft)",
                    lineHeight: "var(--lh-body)",
                  }}
                >
                  <span
                    className="mono"
                    style={{ color: COLOR[a], marginRight: 6 }}
                  >
                    @{r.co.toLowerCase().replace(/\s+/g, "_")}
                  </span>
                  {r.note}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { createRand } from "../seeded-rand";

type StackGroup = { group: string; items: string[] };

/** Per-group accent. Code-leaning groups read as violet (DX, app layer);
 * everything else reads as cyan (infra/runtime/ops). */
const GROUP_ACCENT: Record<string, "cyan" | "violet"> = {
  Cloud: "cyan",
  Platform: "cyan",
  Runtime: "cyan",
  Code: "violet",
  Security: "cyan",
  Observability: "cyan",
};

/** SVG geometry constants — tuned to fit the section comfortably without
 * crowding the rings. Outer ring (last group) sits at radius 360 in a 760
 * wide viewBox, leaving margin for labels. */
const VIEW_W = 760;
const VIEW_H = 540;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const RING_RADII = [80, 130, 180, 230, 280, 330];

export function StackRadial({ stack }: { stack: StackGroup[] }) {
  const [hoverItem, setHoverItem] = useState<string | null>(null);
  const [hoverGroup, setHoverGroup] = useState<string | null>(null);

  const totalItems = stack.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        // Cap the visual on very wide screens so the radial doesn't lose
        // density. Keeps it feeling like a focused diagram, not a stretched
        // canvas.
        maxWidth: 760,
        margin: "0 auto",
      }}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        height="auto"
        role="img"
        aria-label={`Stack constellation with ${totalItems} tools across ${stack.length} groups`}
        style={{ display: "block" }}
      >
        <defs>
          <radialGradient id="stack-radial-bg" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.08" />
            <stop offset="60%" stopColor="var(--cyan)" stopOpacity="0.02" />
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft mood gradient behind everything */}
        <rect width={VIEW_W} height={VIEW_H} fill="url(#stack-radial-bg)" />

        {/* Concentric rings (one per group, plus a faint inner core) */}
        {RING_RADII.slice(0, stack.length).map((r, i) => {
          const isHover = hoverGroup === stack[i].group;
          return (
            <circle
              key={`ring-${i}`}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke="var(--hairline-strong)"
              strokeWidth={isHover ? 1.4 : 0.8}
              strokeDasharray={isHover ? "none" : "2 6"}
              opacity={isHover ? 1 : 0.55}
              style={{ transition: "opacity .2s, stroke-width .2s" }}
            />
          );
        })}

        {/* Crosshair guides — light hairlines at 0° and 90° to evoke a
         * polar plot. Operator-console flavor. */}
        <line
          x1={CX - RING_RADII[stack.length - 1] - 12}
          y1={CY}
          x2={CX + RING_RADII[stack.length - 1] + 12}
          y2={CY}
          stroke="var(--hairline)"
          strokeDasharray="1 8"
        />
        <line
          x1={CX}
          y1={CY - RING_RADII[stack.length - 1] - 12}
          x2={CX}
          y2={CY + RING_RADII[stack.length - 1] + 12}
          stroke="var(--hairline)"
          strokeDasharray="1 8"
        />

        {/* Center label */}
        <g>
          <circle cx={CX} cy={CY} r={42} fill="var(--bg)" />
          <circle
            cx={CX}
            cy={CY}
            r={42}
            fill="none"
            stroke="var(--cyan)"
            strokeWidth={1}
            opacity={0.7}
          />
          <text
            x={CX}
            y={CY - 4}
            textAnchor="middle"
            fontFamily="var(--font-jetbrains-mono)"
            fontSize="10"
            fill="var(--meta)"
            letterSpacing="0.18em"
          >
            COBOS::
          </text>
          <text
            x={CX}
            y={CY + 12}
            textAnchor="middle"
            fontFamily="var(--font-jetbrains-mono)"
            fontSize="14"
            fontWeight="600"
            fill="var(--cyan)"
          >
            stack
          </text>
          <text
            x={CX}
            y={CY + 28}
            textAnchor="middle"
            fontFamily="var(--font-jetbrains-mono)"
            fontSize="9"
            fill="var(--meta)"
            letterSpacing="0.12em"
          >
            {totalItems} TOOLS
          </text>
        </g>

        {/* Items — distributed around each ring evenly. Labels rotate to
         * stay readable (we counter-rotate at top vs bottom hemispheres). */}
        {stack.map((group, gi) => {
          const r = RING_RADII[gi];
          const accent =
            GROUP_ACCENT[group.group] === "violet"
              ? "var(--violet)"
              : "var(--cyan)";
          const accentGlow =
            GROUP_ACCENT[group.group] === "violet"
              ? "var(--violet-glow)"
              : "var(--cyan-glow)";
          const rand = createRand(group.group);
          // Slight per-group rotation offset so items don't all align radially
          const phase = rand() * Math.PI * 2;
          const items = group.items;
          return (
            <g
              key={group.group}
              onMouseEnter={() => setHoverGroup(group.group)}
              onMouseLeave={() => setHoverGroup(null)}
            >
              {/* Group label sits on the ring, top-left quadrant */}
              <g transform={`translate(${CX + Math.cos(-Math.PI * 0.78) * r}, ${CY + Math.sin(-Math.PI * 0.78) * r})`}>
                <rect
                  x={-44}
                  y={-9}
                  width={88}
                  height={18}
                  rx={9}
                  fill="var(--bg)"
                  stroke={accent}
                  strokeWidth={0.8}
                  opacity={hoverGroup === group.group ? 1 : 0.7}
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fontFamily="var(--font-jetbrains-mono)"
                  fontSize="10"
                  fill={accent}
                  letterSpacing="0.15em"
                  style={{ textTransform: "uppercase" }}
                >
                  {group.group}
                </text>
              </g>

              {items.map((item, ii) => {
                // Distribute items around the ring starting from -π/2 (top)
                // and stepping clockwise. Skip the small arc near the group
                // label so they don't overlap.
                const arcStart = -Math.PI * 0.55 + phase;
                const arcEnd = Math.PI * 1.35 + phase;
                const a =
                  arcStart +
                  ((arcEnd - arcStart) * ii) / Math.max(items.length - 1, 1);
                const x = CX + Math.cos(a) * r;
                const y = CY + Math.sin(a) * r;
                const isItemHover = hoverItem === `${group.group}::${item}`;
                const isGroupHover = hoverGroup === group.group;
                const otherGroupHover =
                  hoverGroup !== null && hoverGroup !== group.group;
                const opacity = otherGroupHover ? 0.25 : 1;

                // Label offset radially outward so it doesn't overlap the
                // ring; flip side based on which hemisphere we're in
                const isRight = Math.cos(a) > 0;
                const labelDx = isRight ? 12 : -12;
                const anchor: "start" | "end" = isRight ? "start" : "end";

                return (
                  <g
                    key={item}
                    style={{ opacity, transition: "opacity .2s" }}
                    onMouseEnter={() =>
                      setHoverItem(`${group.group}::${item}`)
                    }
                    onMouseLeave={() => setHoverItem(null)}
                  >
                    {/* Halo on hover or when group is hovered */}
                    {(isItemHover || isGroupHover) && (
                      <circle
                        cx={x}
                        cy={y}
                        r={isItemHover ? 10 : 7}
                        fill={accent}
                        opacity={0.18}
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isItemHover ? 4 : 2.5}
                      fill={accent}
                      style={{
                        filter: isItemHover
                          ? `drop-shadow(0 0 6px ${accentGlow})`
                          : "none",
                        transition: "r .2s, filter .2s",
                      }}
                    />
                    <text
                      x={x + labelDx}
                      y={y + 3}
                      textAnchor={anchor}
                      fontFamily="var(--font-jetbrains-mono)"
                      fontSize="10"
                      fill={isItemHover ? accent : "var(--fg)"}
                      style={{ transition: "fill .15s" }}
                    >
                      {item}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

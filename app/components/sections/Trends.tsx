"use client";

import { pick, TRENDS } from "../portfolio-data";
import { useLocale, useT } from "../../lib/i18n/locale-context";
import { createRand } from "../seeded-rand";
import { Reveal } from "../cinematic/Reveal";
import { Section, SectionHeader, spotlightMove } from "../chrome/primitives";

/* ─── Trends ─────────────────────────────────────────────── */
/** Categorize each trend by semantic color. Transformation/product-leaning
 * trends (AI, platform engineering) read as violet; ops-leaning trends
 * (FinOps, zero-trust, edge, policy) read as cyan. Two trends are marked
 * `staged` (amber) for visual variety — they're the more nascent ones. */
const TREND_META: Record<
  string,
  { accent: "cyan" | "violet"; status: "enabled" | "staged" }
> = {
  "AI-ready infra": { accent: "violet", status: "staged" },
  "Platform engineering": { accent: "violet", status: "enabled" },
  "FinOps + GreenOps": { accent: "cyan", status: "enabled" },
  "Zero-trust by default": { accent: "cyan", status: "enabled" },
  "Cloud-native edge": { accent: "cyan", status: "staged" },
  "Policy as code": { accent: "cyan", status: "enabled" },
};

/** Generate a deterministic, monotonically rising adoption curve for a trend.
 * 12 weekly samples in [0, 1]. The wobble keeps it from looking "too perfect"
 * but each call with the same seed always returns the same series. */
function adoptionSeries(seed: string, n = 12): number[] {
  const rand = createRand(seed);
  const out: number[] = [];
  let v = 0.05 + rand() * 0.1; // start low (~5–15%)
  for (let i = 0; i < n; i++) {
    const slope = 0.04 + rand() * 0.08; // weekly delta
    const wobble = (rand() - 0.5) * 0.04; // ±2pp noise
    v = Math.max(0, Math.min(1, v + slope + wobble));
    out.push(v);
  }
  return out;
}

function TrendCard({
  tr,
  i,
  mobile,
}: {
  /** `metaKey` is the stable ES name used as a lookup into TREND_META
   * regardless of UI locale. `t` and `d` are already locale-resolved. */
  tr: { metaKey: string; t: string; d: string };
  i: number;
  mobile: boolean;
}) {
  const t = useT();
  const meta = TREND_META[tr.metaKey] ?? { accent: "cyan", status: "enabled" as const };
  const statusLabel =
    meta.status === "staged" ? t.trends.statusStaged : t.trends.statusEnabled;
  const accent = meta.accent === "violet" ? "var(--violet)" : "var(--cyan)";
  const accentGlow =
    meta.accent === "violet" ? "var(--violet-glow)" : "var(--cyan-glow)";
  const tintSoft =
    meta.accent === "violet" ? "var(--violet-tint-soft)" : "var(--cyan-tint-soft)";
  const statusColor = meta.status === "staged" ? "var(--amber)" : accent;
  const statusBg =
    meta.status === "staged" ? "rgba(245,158,11,.06)" : tintSoft;

  // Seed deterministic mock numbers off the stable ES key so the
  // sparkline + tenant counts don't reshuffle when the user switches
  // locale.
  const rand = createRand(tr.metaKey);
  const rollout = Math.floor(10 + rand() * 80); // 10-90%
  const tenants = Math.floor(50 + rand() * 9950);

  // Adoption sparkline: 12 weekly samples in [0,1], plot in a 120×30 viewBox.
  const series = adoptionSeries(tr.metaKey, 12);
  const W = 240;
  const H = 48;
  const pad = 4;
  const stepX = (W - pad * 2) / (series.length - 1);
  const points = series
    .map((v, idx) => `${pad + idx * stepX},${H - pad - v * (H - pad * 2)}`)
    .join(" ");
  // Area path under the sparkline for soft fill
  const areaPath =
    `M ${pad},${H - pad} ` +
    series
      .map(
        (v, idx) =>
          `L ${pad + idx * stepX},${H - pad - v * (H - pad * 2)}`
      )
      .join(" ") +
    ` L ${W - pad},${H - pad} Z`;

  return (
    <Reveal fill delayMs={(i % 2) * 80}>
      <div
        onMouseMove={spotlightMove}
        className="spotlight"
        style={{
          border: "1px solid var(--hairline)",
          borderTop: `1px solid ${accent}`,
          borderRadius: "var(--r-card-sm)",
          padding: mobile ? 16 : 20,
          background: `linear-gradient(180deg, ${tintSoft}, transparent 40%)`,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
      {/* Top row: flag id + status pill */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: "var(--text-mono)",
            color: "var(--meta)",
            letterSpacing: "var(--ls-tag)",
          }}
        >
          {t.trends.flagPrefix}
          {(i + 1).toString().padStart(2, "0")}
        </span>
        <span
          className="mono"
          style={{
            fontSize: "var(--text-mono-xs)",
            color: statusColor,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            border: `1px solid ${statusColor}`,
            borderRadius: "var(--r-chip)",
            background: statusBg,
            letterSpacing: "var(--ls-tag)",
            textTransform: "uppercase",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: "var(--r-chip)",
              background: statusColor,
              boxShadow: `0 0 8px ${
                meta.status === "staged" ? "var(--amber-glow)" : accentGlow
              }`,
            }}
          />
          {statusLabel}
        </span>
      </div>

      {/* Title + description */}
      <div>
        <h3
          style={{
            fontSize: mobile ? "var(--text-h3-sm-m)" : "var(--text-h3-sm)",
            fontWeight: 500,
            marginBottom: 6,
            letterSpacing: "var(--ls-tight)",
          }}
        >
          {tr.t}
        </h3>
        <p
          style={{
            color: "var(--muted)",
            fontSize: "var(--text-body-sm)",
            lineHeight: "var(--lh-body)",
          }}
        >
          {tr.d}
        </p>
      </div>

      {/* Sparkline + metrics row */}
      <div
        style={{
          marginTop: 4,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 16,
          alignItems: "end",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          aria-hidden
          preserveAspectRatio="none"
          style={{ display: "block" }}
        >
          {/* Baseline grid */}
          <line
            x1={pad}
            y1={H - pad}
            x2={W - pad}
            y2={H - pad}
            stroke="var(--hairline)"
            strokeWidth={0.5}
          />
          <line
            x1={pad}
            y1={pad}
            x2={W - pad}
            y2={pad}
            stroke="var(--hairline)"
            strokeWidth={0.5}
            strokeDasharray="2 4"
          />
          {/* Area fill */}
          <path d={areaPath} fill={accent} opacity={0.12} />
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={accent}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.95}
          />
          {/* Latest value dot */}
          <circle
            cx={pad + (series.length - 1) * stepX}
            cy={H - pad - series[series.length - 1] * (H - pad * 2)}
            r={3}
            fill={accent}
            style={{ filter: `drop-shadow(0 0 4px ${accentGlow})` }}
          />
        </svg>
        <div
          className="mono"
          style={{
            fontSize: "var(--text-mono-xs)",
            color: "var(--meta)",
            letterSpacing: "var(--ls-tag)",
            textTransform: "uppercase",
            textAlign: "right",
            lineHeight: 1.5,
            whiteSpace: "nowrap",
          }}
        >
          <div>
            {t.trends.rollout} <span style={{ color: accent }}>{rollout}%</span>
          </div>
          <div>
            {t.trends.tenants}{" "}
            <span style={{ color: "var(--fg)" }}>
              {tenants.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>
      </div>
    </Reveal>
  );
}

export function Trends({ mobile }: { mobile: boolean }) {
  const locale = useLocale();
  const t = useT();
  return (
    <Section id="trends" fsPath="/trends" mobile={mobile}>
      <SectionHeader
        n={7}
        t={t.trends.sectionLabel}
        action={t.trends.action}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "repeat(2, 1fr)",
          gap: 14,
        }}
      >
        {TRENDS.map((tr, i) => (
          <TrendCard
            key={tr.t.es}
            tr={{
              metaKey: tr.t.es,
              t: pick(tr.t, locale),
              d: pick(tr.d, locale),
            }}
            i={i}
            mobile={mobile}
          />
        ))}
      </div>
    </Section>
  );
}

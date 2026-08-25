"use client";

import { pick, TRENDS } from "../portfolio-data";
import { useLocale, useT } from "../../lib/i18n/locale-context";
import { Reveal } from "../cinematic/Reveal";
import { Section, SectionHeader, spotlightMove } from "../chrome/primitives";

/* ─── Trends ─────────────────────────────────────────────── */
/** Categorize each trend by semantic color. Transformation/product-leaning
 * trends (AI, platform engineering) read as violet; ops-leaning trends
 * (FinOps, zero-trust, GitOps, policy) read as cyan. The `staged` mark
 * (amber) is editorial, not telemetry: it flags the nascent trend whose
 * underlying survey data shows adoption is still early (44% of orgs don't
 * run AI/ML on K8s yet). */
const TREND_META: Record<
  string,
  { accent: "cyan" | "violet"; status: "enabled" | "staged" }
> = {
  "AI-ready infra": { accent: "violet", status: "staged" },
  "Platform engineering": { accent: "violet", status: "enabled" },
  "FinOps + GreenOps": { accent: "cyan", status: "enabled" },
  "Zero-trust by default": { accent: "cyan", status: "enabled" },
  "GitOps como estándar": { accent: "cyan", status: "enabled" },
  "Policy as code": { accent: "cyan", status: "enabled" },
};

function TrendCard({
  tr,
  i,
  mobile,
}: {
  /** `metaKey` is the stable ES name used as a lookup into TREND_META
   * regardless of UI locale. `t`, `d` and `stat.label` are already
   * locale-resolved; `stat.value`/`source`/`year`/`url` are verbatim from
   * portfolio-data and must never be computed or generated here. */
  tr: {
    metaKey: string;
    t: string;
    d: string;
    stat: { value: string; label: string };
    source: string;
    year: number;
    url: string;
  };
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

      {/* Real cited stat (A2 de-mock): verbatim figure from a published
          survey, with the source visible and linked so any reader can
          verify it. Replaces the seeded-rand sparkline/rollout/tenants. */}
      <div
        style={{
          marginTop: 4,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span
            className="mono"
            style={{
              fontSize: mobile
                ? "var(--text-h2-section-m)"
                : "var(--text-h2-section)",
              lineHeight: 1,
              color: accent,
              textShadow: `0 0 24px ${accentGlow}`,
              whiteSpace: "nowrap",
            }}
          >
            {tr.stat.value}
          </span>
          <span
            style={{
              color: "var(--muted)",
              fontSize: "var(--text-body-sm)",
              lineHeight: "var(--lh-body)",
            }}
          >
            {tr.stat.label}
          </span>
        </div>
        {/* Source line: mono, small, external — credibility is the point
           of this section now, so the citation is first-class UI. */}
        <a
          href={tr.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mono"
          style={{
            fontSize: "var(--text-mono-xs)",
            color: "var(--meta)",
            letterSpacing: "var(--ls-tag)",
            textDecorationLine: "underline",
            textDecorationColor: "var(--hairline)",
            textUnderlineOffset: 3,
            alignSelf: "flex-start",
          }}
        >
          {tr.source} · {tr.year} ↗
        </a>
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
              stat: { value: tr.stat.value, label: pick(tr.stat.label, locale) },
              source: tr.source,
              year: tr.year,
              url: tr.url,
            }}
            i={i}
            mobile={mobile}
          />
        ))}
      </div>
    </Section>
  );
}

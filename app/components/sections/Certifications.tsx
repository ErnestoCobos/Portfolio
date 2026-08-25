"use client";

import type { CSSProperties } from "react";
import { CERTIFICATIONS, pick, type Certification } from "../portfolio-data";
import { useLocale, useT } from "../../lib/i18n/locale-context";
import { Reveal } from "../cinematic/Reveal";
import { Section, SectionHeader, spotlightMove } from "../chrome/primitives";

/* ─── Certifications ───────────────────────────────────── */
/** A certification's lifecycle is binary — earned / in-progress — which
 * maps directly onto the `.dot.green` / `.dot.amber` status motif already
 * carried by Trends (enabled/staged) and Approach (pending/running/done).
 * Cards mirror the Work pattern; mobile uses Experience's dense git-log
 * list. Status owns colour (top border, faint tint, dot, status word and
 * the date-line lead all flip green/amber together). Vendor is plain
 * text — no AWS-orange or GCP-blue leaks into the cyan/violet palette. */

type CertCardData = {
  slug: string;
  code: string;
  vendor: Certification["vendor"];
  status: Certification["status"];
  verifyUrl?: string;
  /** 100 when earned (`Certifications` normalises this), else 0–100. */
  progress: number;
  name: string;
  issuer: string;
  when: string | null;
  note: string | null;
};

function CertificationCard({ c, ci }: { c: CertCardData; ci: number }) {
  const t = useT();
  const earned = c.status === "earned";
  const statusColor = earned ? "var(--green)" : "var(--amber)";
  const statusGlow = earned ? "var(--green-glow)" : "var(--amber-glow)";
  const statusTint = earned
    ? "rgba(34,197,94,.06)"
    : "rgba(245,158,11,.06)";
  const statusLabel = earned
    ? t.certs.statusEarned
    : t.certs.statusInProgress;
  const whenLeadLabel = earned ? t.certs.labelEarned : t.certs.labelTarget;
  const whenValue = c.when ?? t.certs.targetTbd;
  // Floor at 4 so the bar is always visible — 0% reads as broken even
  // though the label below it correctly says "queued".
  const progressPct = Math.max(4, Math.min(100, c.progress));
  const showProgressLabel = c.progress > 0;

  return (
    <Reveal fill delayMs={(ci % 3) * 80}>
      <div
        className="cert-card spotlight"
        onMouseMove={spotlightMove}
        data-fs-path={`/certs/${c.slug}.md`}
        data-fs-type="file"
        style={
          {
            // Status accent: a single coloured top border + a faint top-down
            // tint over --surface-overlay. The two CSS custom properties
            // drive the .cert-card:hover rule in globals.css.
            border: "1px solid var(--hairline-strong)",
          borderTop: `1px solid ${statusColor}`,
          borderRadius: "var(--r-card-sm)",
          padding: 24,
          background: `linear-gradient(180deg, ${statusTint}, transparent 40%), var(--surface-overlay)`,
          display: "flex",
          flexDirection: "column",
          minHeight: 220,
          "--cert-accent": statusColor,
          "--cert-glow": statusGlow,
          } as CSSProperties
      }
    >
      {/* Status row — dot+word on the left, cyan exam-code badge on the right */}
      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 20,
          fontSize: "var(--text-mono)",
          letterSpacing: "var(--ls-tag)",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: statusColor,
          }}
        >
          <span
            className={earned ? "dot green" : "dot amber"}
            style={{ boxShadow: `0 0 12px ${statusGlow}` }}
          />
          {statusLabel}
        </span>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: "var(--r-tile)",
            background: "var(--cyan-tint-soft)",
            color: "var(--cyan)",
            border: "1px solid var(--hairline-strong)",
            letterSpacing: "var(--ls-tag)",
          }}
        >
          {c.code}
        </span>
      </div>

      {/* Cert name — clickable when earned + a verifyUrl exists */}
      <h3
        style={{
          fontSize: "var(--text-h3-sm)",
          fontWeight: 500,
          letterSpacing: "var(--ls-tight)",
          lineHeight: 1.1,
          marginBottom: 8,
          color: "var(--fg)",
        }}
      >
        {earned && c.verifyUrl ? (
          <a
            href={c.verifyUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {c.name}
          </a>
        ) : (
          c.name
        )}
      </h3>

      {/* Issuer + neutral vendor chip (never carries colour) */}
      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 16,
          fontSize: "var(--text-mono)",
          color: "var(--muted)",
        }}
      >
        <span>{c.issuer}</span>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: "var(--r-chip)",
            border: "1px solid var(--hairline)",
            color: "var(--meta)",
            fontSize: "var(--text-mono-xs)",
            letterSpacing: "var(--ls-tag)",
          }}
        >
          {c.vendor}
        </span>
      </div>

      {/* Date / target — always rendered (TBD when missing) so card heights stay honest */}
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono)",
          letterSpacing: "var(--ls-meta)",
          color: "var(--meta)",
          marginBottom: 12,
        }}
      >
        <span style={{ color: statusColor }}>{whenLeadLabel} ·</span>{" "}
        {whenValue}
      </div>

      {/* Rationale (flex:1 pushes the footer down for equal-height cards) */}
      {c.note && (
        <p
          style={{
            color: "var(--muted)",
            fontSize: "var(--text-body-sm)",
            lineHeight: "var(--lh-body)",
            marginBottom: 16,
            flex: 1,
          }}
        >
          {c.note}
        </p>
      )}

      {/* Footer: progress bar (in-progress) OR verify link (earned + URL) */}
      {earned ? (
        c.verifyUrl ? (
          <a
            href={c.verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="tap mono"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              border: "1px solid var(--green)",
              borderRadius: "var(--r-tile)",
              background:
                "linear-gradient(180deg, rgba(34,197,94,.10), transparent)",
              color: "var(--green)",
              fontSize: "var(--text-meta)",
              letterSpacing: ".02em",
              marginTop: "auto",
            }}
          >
            <span>{t.certs.verifyCta}</span>
            <span aria-hidden style={{ fontSize: 14 }}>
              ↗
            </span>
          </a>
        ) : null
      ) : (
        // Slim Gauge — reuses the Gauge recipe (height 4, cyan→violet fill)
        // so an all-amber grid still carries the structural palette.
        <div style={{ marginTop: "auto" }}>
          <div
            className="mono"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
              fontSize: "var(--text-mono)",
              color: "var(--muted)",
            }}
          >
            <span>
              {showProgressLabel
                ? t.certs.progressLabel
                : t.certs.progressQueued}
            </span>
            {showProgressLabel && (
              <span style={{ color: "var(--fg)" }}>{c.progress}%</span>
            )}
          </div>
          <div
            style={{
              height: 4,
              background: "rgba(255,255,255,.05)",
              borderRadius: "var(--r-chip)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, var(--cyan), var(--violet))",
              }}
            />
          </div>
        </div>
      )}
      </div>
    </Reveal>
  );
}

/** Sort key — earned first (1000), then by prep progress. Keeps the grid
 * leading on momentum even when every entry is still in-progress. */
function certRank(c: Certification): number {
  return c.status === "earned" ? 1000 : c.progress ?? 0;
}

export function Certifications({ mobile }: { mobile: boolean }) {
  const locale = useLocale();
  const t = useT();
  // Pre-resolve bilingual fields + sort once; the card components consume
  // a flat, locale-resolved shape — same approach as Experience.
  const items: CertCardData[] = [...CERTIFICATIONS]
    .sort((a, b) => certRank(b) - certRank(a))
    .map((c) => ({
      slug: c.slug,
      code: c.code,
      vendor: c.vendor,
      status: c.status,
      verifyUrl: c.verifyUrl,
      progress: c.status === "earned" ? 100 : c.progress ?? 0,
      name: pick(c.name, locale),
      issuer: pick(c.issuer, locale),
      when: c.when ? pick(c.when, locale) : null,
      note: c.note ? pick(c.note, locale) : null,
    }));

  return (
    <Section id="certs" fsPath="/certs" mobile={mobile} dark>
      <SectionHeader
        n={6}
        t={t.certs.sectionLabel}
        action={t.certs.action}
      />
      <div style={{ marginBottom: mobile ? 32 : 48 }}>
        <h2
          style={{
            fontSize: mobile
              ? "var(--text-h2-section-m)"
              : "var(--text-h2-section)",
            fontWeight: 500,
            letterSpacing: "var(--ls-heading)",
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          {t.certs.headline[0]}
          <span style={{ color: "var(--cyan)" }}>{t.certs.headline[1]}</span>
          {t.certs.headline[2]}
        </h2>
        <p
          style={{
            color: "var(--muted)",
            fontSize: mobile ? 15 : 17,
            maxWidth: 640,
          }}
        >
          {t.certs.blurb}
        </p>
      </div>

      {mobile ? (
        // Dense git-log list — mirrors Experience mobile. Stacked cards
        // scan poorly on a phone; a credential ledger reads in one pass.
        <div
          className="mono"
          style={{ fontSize: "var(--text-meta)", lineHeight: 1.9 }}
        >
          {items.map((c, i) => {
            const earned = c.status === "earned";
            const statusColor = earned ? "var(--green)" : "var(--amber)";
            const statusGlow = earned
              ? "var(--green-glow)"
              : "var(--amber-glow)";
            const progressPct = Math.max(4, Math.min(100, c.progress));
            return (
              <div
                key={c.slug}
                data-fs-path={`/certs/${c.slug}.md`}
                data-fs-type="file"
                style={{
                  padding: "12px 0",
                  borderTop: i ? "1px solid var(--hairline)" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      className={earned ? "dot green" : "dot amber"}
                      style={{ boxShadow: `0 0 10px ${statusGlow}` }}
                    />
                    <span
                      style={{
                        color: "var(--fg)",
                        letterSpacing: "var(--ls-tag)",
                      }}
                    >
                      {c.code}
                    </span>
                  </span>
                  <span
                    style={{
                      color: statusColor,
                      textTransform: "uppercase",
                      letterSpacing: "var(--ls-tag)",
                    }}
                  >
                    {earned
                      ? t.certs.statusEarned
                      : t.certs.statusInProgress}
                  </span>
                </div>
                <div style={{ color: "var(--fg)", marginTop: 4 }}>
                  {c.name}
                </div>
                <div style={{ color: "var(--muted)", marginTop: 2 }}>
                  <span style={{ color: "var(--violet)" }}>@{c.vendor}</span>{" "}
                  · {c.issuer} ·{" "}
                  <span style={{ color: statusColor }}>
                    {earned ? t.certs.labelEarned : t.certs.labelTarget}
                  </span>{" "}
                  {c.when ?? t.certs.targetTbd}
                </div>
                {!earned && (
                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{
                        height: 4,
                        background: "rgba(255,255,255,.05)",
                        borderRadius: "var(--r-chip)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPct}%`,
                          height: "100%",
                          background:
                            "linear-gradient(90deg, var(--cyan), var(--violet))",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {items.map((c, ci) => (
            <CertificationCard key={c.slug} c={c} ci={ci} />
          ))}
        </div>
      )}
    </Section>
  );
}

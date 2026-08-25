"use client";

import { pick, PROJECTS } from "../portfolio-data";
import { useLocale, useT } from "../../lib/i18n/locale-context";
import { Reveal } from "../cinematic/Reveal";
import { Section, SectionHeader, spotlightMove } from "../chrome/primitives";

/* ─── Work ──────────────────────────────────────────────── */
export function Work({ mobile }: { mobile: boolean }) {
  const t = useT();
  return (
    <Section id="work" fsPath="/work" mobile={mobile} dark>
      <SectionHeader
        n={4}
        t={t.work.sectionLabel}
        action={t.work.action(PROJECTS.length)}
      />
      <div style={{ marginBottom: mobile ? 32 : 48 }}>
        <h2
          style={{
            fontSize: mobile ? "var(--text-h2-section-m)" : "var(--text-h2-section)",
            fontWeight: 500,
            letterSpacing: "var(--ls-heading)",
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          {t.work.headline[0]}
          <span style={{ color: "var(--cyan)" }}>{t.work.headline[1]}</span>
          {t.work.headline[2]}
        </h2>
        <p
          style={{
            color: "var(--muted)",
            fontSize: mobile ? 15 : 17,
            maxWidth: 640,
          }}
        >
          {t.work.blurb}
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {PROJECTS.map((p, pi) => (
          <WorkCard key={p.slug} p={p} pi={pi} mobile={mobile} />
        ))}
      </div>
    </Section>
  );
}

/** One Work card. Owns its reveal timing so hooks stay at component top
 * level (no hooks inside .map callbacks). */
function WorkCard({
  p,
  pi,
  mobile,
}: {
  p: (typeof PROJECTS)[number];
  pi: number;
  mobile: boolean;
}) {
  const locale = useLocale();
  const t = useT();
  const c = p.accent === "violet" ? "var(--violet)" : "var(--cyan)";
  const glow =
    p.accent === "violet" ? "rgba(124,58,237,.6)" : "rgba(0,212,255,.6)";
  const href = p.href ?? `https://${p.url}`;
  return (
    <Reveal fill delayMs={pi * 80}>
      <div
        data-fs-path={`/work/${p.slug}.md`}
        data-fs-type="file"
        onMouseMove={spotlightMove}
        className="spotlight"
        style={{
          border: "1px solid var(--hairline-strong)",
          borderRadius: "var(--r-card-sm)",
          padding: 24,
          background: "var(--surface-overlay)",
          display: "flex",
          flexDirection: "column",
          minHeight: mobile ? "auto" : 360,
        }}
      >
              <div
                className="mono"
                style={{
                  fontSize: "var(--text-mono)",
                  color: c,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <span
                  className="dot"
                  style={{ background: c, boxShadow: `0 0 6px ${glow}` }}
                />
                {pick(p.tag, locale)}
              </div>
              <h3
                style={{
                  fontSize: mobile ? 24 : 28,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  marginBottom: 10,
                }}
              >
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {p.name}
                </a>
              </h3>
              <div
                className="mono"
                style={{
                  fontSize: "var(--text-mono)",
                  color: "var(--muted)",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <span style={{ color: c }}>↗</span>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    minWidth: 0,
                    overflowWrap: "anywhere",
                  }}
                >
                  {p.url}
                </a>
              </div>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "var(--text-body-sm)",
                  lineHeight: 1.6,
                  marginBottom: 24,
                  flex: 1,
                }}
              >
                {pick(p.blurb, locale)}
              </p>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="tap mono"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  border: `1px solid ${c}`,
                  borderRadius: "var(--r-tile)",
                  background: `linear-gradient(180deg, ${
                    p.accent === "violet"
                      ? "rgba(124,58,237,.10)"
                      : "var(--cyan-tint)"
                  }, transparent)`,
                  color: c,
                  fontSize: "var(--text-meta)",
                  letterSpacing: ".02em",
                }}
              >
                <span>{p.repo ? t.work.repo : t.work.visit}</span>
                <span aria-hidden style={{ fontSize: 14 }}>→</span>
              </a>
      </div>
    </Reveal>
  );
}

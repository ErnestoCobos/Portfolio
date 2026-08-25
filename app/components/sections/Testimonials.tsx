"use client";

import { TESTIMONIALS, pick, type Testimonial } from "../portfolio-data";
import { useLocale, useT } from "../../lib/i18n/locale-context";
import { Reveal } from "../cinematic/Reveal";
import { Section, SectionHeader, spotlightMove } from "../chrome/primitives";

/* ─── Testimonials ─────────────────────────────────────── */
/** Social-proof quotes. TESTIMONIALS is intentionally empty until real,
 * attributable quotes exist — the component returns null so the section
 * (and its nav anchor) never reaches the DOM while there's nothing to
 * show. Cards carry a violet left border as their accent; quote on top,
 * author/role pinned to the bottom for equal-height alignment. */

function TestimonialCard({ q }: { q: Testimonial }) {
  const locale = useLocale();
  return (
      <div
        className="spotlight"
        onMouseMove={spotlightMove}
        style={{
          border: "1px solid var(--hairline-strong)",
          borderLeft: "3px solid var(--violet)",
          borderRadius: "var(--r-card-sm)",
          padding: 24,
          background: "var(--surface-overlay)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <p
          style={{
            color: "var(--fg)",
            fontStyle: "italic",
            fontSize: "var(--text-body-sm)",
            lineHeight: "var(--lh-body)",
            flex: 1,
            margin: 0,
          }}
        >
          “{pick(q.quote, locale)}”
        </p>
        <div style={{ marginTop: 20 }}>
          <div
            className="mono"
            style={{
              color: "var(--cyan)",
              fontSize: "var(--text-mono)",
              letterSpacing: "var(--ls-tag)",
            }}
          >
            {q.author}
          </div>
          <div
            className="mono"
            style={{
              color: "var(--muted)",
              fontSize: "var(--text-mono-xs)",
              letterSpacing: "var(--ls-meta)",
              marginTop: 4,
            }}
          >
            {pick(q.role, locale)}
          </div>
        </div>
      </div>
  );
}

export function Testimonials({ mobile }: { mobile: boolean }) {
  const t = useT();
  if (TESTIMONIALS.length === 0) return null;

  return (
    <Section id="testimonials" fsPath="/testimonials" mobile={mobile}>
      <SectionHeader n={7} t={t.testimonials.label} />
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
          {t.testimonials.headline[0]}
          <span style={{ color: "var(--cyan)" }}>
            {t.testimonials.headline[1]}
          </span>
          {t.testimonials.headline[2]}
        </h2>
        <p
          style={{
            color: "var(--muted)",
            fontSize: mobile ? 15 : 17,
            maxWidth: 640,
          }}
        >
          {t.testimonials.blurb}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {TESTIMONIALS.map((q, i) => (
          <Reveal key={q.author} delayMs={(i % 3) * 80} fill>
            <TestimonialCard q={q} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

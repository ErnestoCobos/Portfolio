"use client";

import { EXPERIENCE, pick } from "../portfolio-data";
import { useLocale, useT } from "../../lib/i18n/locale-context";
import { ExperienceTimeline } from "../visuals/ExperienceTimeline";
import { Section, SectionHeader } from "../chrome/primitives";

/* ─── Experience ─────────────────────────────────────────── */
export function Experience({ mobile }: { mobile: boolean }) {
  const locale = useLocale();
  const t = useT();
  // Pre-resolve bilingual fields so the dense git-log + the timeline
  // visual both consume the same flat shape.
  const entries = EXPERIENCE.map((e) => ({
    y: pick(e.y, locale),
    role: pick(e.role, locale),
    co: pick(e.co, locale),
    note: pick(e.note, locale),
  }));
  return (
    <Section id="exp" fsPath="/experience" mobile={mobile}>
      <SectionHeader
        n={5}
        t={t.experience.sectionLabel}
        action={t.experience.action}
      />
      {mobile ? (
        // Mobile keeps the dense git-log style — timeline needs horizontal
        // real estate the radial doesn't have on small screens
        <div
          className="mono"
          style={{ fontSize: "var(--text-meta)", lineHeight: 1.9 }}
        >
          {entries.map((e, i) => (
            <div
              key={i}
              style={{
                padding: "10px 0",
                borderTop: i ? "1px solid var(--hairline)" : "none",
              }}
            >
              <span style={{ color: "var(--cyan)" }}>{e.y}</span>
              <div style={{ color: "var(--fg)", marginTop: 4 }}>{e.role}</div>
              <div style={{ color: "var(--muted)", marginTop: 2 }}>
                <span style={{ color: "var(--violet)" }}>
                  @{e.co.toLowerCase().replace(/\s+/g, "_")}
                </span>{" "}
                {e.note}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ExperienceTimeline entries={entries} currentYear={2026} />
      )}
    </Section>
  );
}

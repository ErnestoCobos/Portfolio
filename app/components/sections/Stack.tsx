"use client";

import { STACK } from "../portfolio-data";
import { useT } from "../../lib/i18n/locale-context";
import { StackRadial } from "../visuals/StackRadial";
import { Section, SectionHeader } from "../chrome/primitives";

/* ─── Stack ─────────────────────────────────────────────── */
export function Stack({ mobile }: { mobile: boolean }) {
  const t = useT();
  return (
    <Section id="stack" fsPath="/stack" mobile={mobile} dark>
      <SectionHeader n={2} t={t.stack.sectionLabel} action={t.stack.action} />
      {mobile ? (
        // Mobile: keep the dense table — radial loses density below ~600px
        <div
          style={{
            border: "1px solid var(--hairline)",
            borderRadius: "var(--r-card-sm)",
            overflow: "hidden",
          }}
        >
          {STACK.map((s, i) => (
            <div
              key={s.group}
              style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr",
                borderTop: i ? "1px solid var(--hairline)" : "none",
                background:
                  i % 2 === 0 ? "var(--surface-overlay)" : "transparent",
              }}
            >
              <div
                className="mono"
                style={{
                  padding: "14px 12px",
                  fontSize: 12,
                  color: "var(--cyan)",
                  borderRight: "1px solid var(--hairline)",
                }}
              >
                {s.group.toLowerCase()}/
              </div>
              <div
                style={{
                  padding: "14px 12px",
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                {s.items.map((it) => (
                  <span
                    key={it}
                    className="mono"
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: "var(--r-tile)",
                      border: "1px solid var(--hairline)",
                      background: "var(--cyan-tint-soft)",
                      color: "var(--fg)",
                    }}
                  >
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StackRadial stack={STACK} />
      )}
    </Section>
  );
}

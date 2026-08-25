"use client";

import { useEffect, useRef } from "react";
import { PROOF_METRICS } from "../portfolio-data";
import { useT } from "../../lib/i18n/locale-context";
import { CountUp } from "../cinematic/CountUp";

/* ─── Social proof strip ─────────────────────────────────── */
/** Slim metrics band between hero and nav — A1 outcome metrics, not
 * vanity stats. Figures live in PROOF_METRICS (portfolio-data) with
 * their sources; labels resolve per locale from `proof.metrics`. Same
 * count-up treatment as before. */
export function ProofStrip({ mobile }: { mobile: boolean }) {
  const t = useT();
  return (
    <section
      aria-label={t.proof.aria}
      style={{
        borderTop: "1px solid var(--hairline)",
        borderBottom: "1px solid var(--hairline)",
        background: "#08080C",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)",
        }}
      >
        {PROOF_METRICS.map((m, i) => (
          <div
            key={m.labelKey}
            style={{
              padding: mobile ? "18px 16px" : "22px 32px",
              borderLeft: i % (mobile ? 2 : 4) !== 0 ? "1px solid var(--hairline)" : "none",
              borderTop: mobile && i >= 2 ? "1px solid var(--hairline)" : "none",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: mobile ? 24 : 30,
                fontWeight: 500,
                color: "var(--cyan)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {/* Numeric metrics count up on scroll-in; text metrics
               * ("multi-cloud") render verbatim at the same size. */}
              {m.count !== undefined && <CountUp value={m.count} />}
              {m.raw}
              {m.suffix && <span style={{ color: "var(--violet)" }}>{m.suffix}</span>}
            </div>
            <div
              className="mono"
              style={{
                fontSize: "var(--text-mono-xs)",
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "var(--ls-tag)",
              }}
            >
              {t.proof.metrics[m.labelKey]}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Intro veil (one-shot cinematic boot) ───────────────── */
/** Port of /start's StartIntro. A pre-paint script in RootHead adds
 * `intro-boot` to <html> once per session (skipped entirely under
 * reduced motion); this renders the black veil and drops the class on
 * animationend so hover/fixed behavior returns to normal. No class →
 * component is inert and invisible. */
export function IntroVeil() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("intro-boot")) return;
    const el = ref.current;
    const finish = () => root.classList.remove("intro-boot");
    el?.addEventListener("animationend", finish, { once: true });
    const safety = window.setTimeout(finish, 2400);
    return () => {
      el?.removeEventListener("animationend", finish);
      window.clearTimeout(safety);
    };
  }, []);
  return <div ref={ref} aria-hidden className="intro-veil" />;
}

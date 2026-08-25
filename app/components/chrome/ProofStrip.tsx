"use client";

import { useEffect, useRef } from "react";
import { CERTIFICATIONS, PROJECTS, STACK } from "../portfolio-data";
import { useT } from "../../lib/i18n/locale-context";
import { CountUp } from "../cinematic/CountUp";

/* ─── Social proof strip ─────────────────────────────────── */
/** Slim metrics band between hero and nav. It doubles as the "next
 * section peek" under the fold-breaking hero — real numbers from
 * portfolio-data, counted up when scrolled into view. */
export function ProofStrip({ mobile }: { mobile: boolean }) {
  const t = useT();
  const sinceYear = parseInt(t.about.since, 10) || 2017;
  const stats = [
    { v: Math.max(1, new Date().getFullYear() - sinceYear), label: t.proof.years, suffix: "+" },
    { v: PROJECTS.length, label: t.proof.projects },
    { v: STACK.reduce((a, g) => a + g.items.length, 0), label: t.proof.tools },
    { v: CERTIFICATIONS.length, label: t.proof.certs },
  ];
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
        {stats.map((s, i) => (
          <div
            key={s.label}
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
              <CountUp value={s.v} />
              {s.suffix && <span style={{ color: "var(--violet)" }}>{s.suffix}</span>}
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
              {s.label}
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

"use client";

import Link from "next/link";
import { NOW, pick } from "./portfolio-data";
import { useLocale, useT } from "../lib/i18n/locale-context";
import { Reveal } from "./cinematic/Reveal";

/**
 * /now — snapshot of current fronts, rendered as a terminal ledger.
 * Reads NOW data + the `now` dictionary slice; locale comes from the
 * nearest LocaleProvider (ES at root, EN under /en).
 */
export default function NowView() {
  const t = useT();
  const locale = useLocale();
  const now = t.now;
  const homeHref = locale === "en" ? "/en" : "/";

  return (
    <div className="cobos-art" style={{ minHeight: "100vh" }}>
      {/* Top chrome — mirrors /blog header bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "14px clamp(16px, 4vw, 32px)",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          background: "rgba(10,10,15,.78)",
          backdropFilter: "blur(14px) saturate(140%)",
          WebkitBackdropFilter: "blur(14px) saturate(140%)",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: "var(--text-meta)",
            color: "var(--fg)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            letterSpacing: "-0.01em",
          }}
        >
          cobos<span style={{ color: "var(--cyan)" }}>::</span>
          <span style={{ color: "var(--cyan)" }}>/now</span>
        </span>
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: "var(--text-mono)",
            color: "var(--meta)",
            letterSpacing: "var(--ls-meta)",
            textTransform: "uppercase",
          }}
        >
          <span className="dot green" aria-hidden />
          {now.updatedLabel} {pick(NOW.updated, locale)}
        </span>
      </header>

      <main
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding:
            "clamp(40px, 7vw, 72px) clamp(20px, 5vw, 48px) clamp(64px, 9vw, 120px)",
        }}
      >
        {/* ── Hero copy ─────────────────────────────────────── */}
        <h1
          style={{
            fontSize: "clamp(34px, 6vw, var(--text-h1))",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
            maxWidth: 920,
            margin: 0,
          }}
        >
          {now.headline[0]}
          <span style={{ color: "var(--cyan)" }}>{now.headline[1]}</span>
          {now.headline[2]}
        </h1>
        <p
          style={{
            marginTop: 18,
            marginBottom: 0,
            color: "var(--body-soft)",
            fontSize: "clamp(16px, 2vw, var(--text-body-lg))",
            maxWidth: 720,
            lineHeight: 1.55,
          }}
        >
          {now.subhead}
        </p>

        {/* ── Ledger ────────────────────────────────────────── */}
        <section style={{ marginTop: "clamp(36px, 6vw, 64px)" }}>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              borderTop: "1px solid var(--hairline)",
            }}
          >
            {NOW.items.map((item, i) => {
              const active = item.status === "active";
              return (
                <li key={i}>
                  <Reveal delayMs={i * 80}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "14px clamp(110px, 16vw, 210px) minmax(0, 1fr)",
                        columnGap: 18,
                        rowGap: 6,
                        alignItems: "start",
                        padding: "18px 0",
                        borderBottom: "1px solid var(--hairline)",
                      }}
                    >
                      <span
                        className={`dot ${active ? "green" : "amber"}`}
                        role="img"
                        aria-label={active ? now.statusActive : now.statusBrewing}
                        title={active ? now.statusActive : now.statusBrewing}
                        style={{ marginTop: 7 }}
                      />
                      <span
                        className="mono"
                        style={{
                          fontSize: "var(--text-mono-xs)",
                          color: "var(--muted)",
                          letterSpacing: "var(--ls-tag)",
                          textTransform: "uppercase",
                          lineHeight: 1.6,
                          paddingTop: 3,
                        }}
                      >
                        {pick(item.period, locale)}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "clamp(17px, 2vw, 19px)",
                            fontWeight: 500,
                            letterSpacing: "var(--ls-tight)",
                            lineHeight: 1.3,
                            color: "var(--fg)",
                          }}
                        >
                          {pick(item.title, locale)}
                        </div>
                        <p
                          style={{
                            margin: "6px 0 0",
                            color: "var(--body-softer)",
                            fontSize: "var(--text-body)",
                            lineHeight: 1.55,
                            maxWidth: 640,
                          }}
                        >
                          {pick(item.detail, locale)}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ── Footer ────────────────────────────────────────── */}
        <footer
          className="mono"
          style={{
            marginTop: "clamp(56px, 8vw, 96px)",
            paddingTop: 24,
            borderTop: "1px solid var(--hairline)",
            fontSize: "var(--text-mono)",
            letterSpacing: "var(--ls-meta)",
          }}
        >
          <Link
            href={homeHref}
            style={{ color: "var(--cyan)", textDecoration: "none" }}
          >
            {now.backHome}
          </Link>
        </footer>
      </main>
    </div>
  );
}

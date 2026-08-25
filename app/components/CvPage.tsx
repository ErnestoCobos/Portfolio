"use client";

import {
  CERTIFICATIONS,
  EXPERIENCE,
  PROFILE,
  PROJECTS,
  STACK,
  pick,
} from "./portfolio-data";
import { useLocale, useT } from "../lib/i18n/locale-context";

/**
 * /cv — printable one-page résumé. Dark operator-console on screen;
 * `.cv-print` + the `@media print` block in globals.css turn it into a
 * single A4 sheet (white, dark ink) via window.print(). Fully static —
 * no Reveal/animations — so the print snapshot is deterministic.
 */
export function CvView() {
  const t = useT();
  const locale = useLocale();
  const cv = t.cv;

  const sectionLabelStyle: React.CSSProperties = {
    margin: "0 0 5px",
    fontSize: "var(--text-mono)",
    fontWeight: 600,
    color: "var(--cyan)",
    letterSpacing: "var(--ls-tag)",
    textTransform: "uppercase",
  };

  return (
    <div className="cobos-art" style={{ minHeight: "100vh" }}>
      {/* Keep the paper white edge-to-edge — the site paints a dark bg on
          html/body that the globals print block doesn't reset. */}
      <style>{`@media print { html, body, .cobos-art { background: #fff !important; } }`}</style>
      {/* Top chrome */}
      <header
        style={{
          padding: "14px clamp(16px, 4vw, 32px)",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          background: "rgba(10,10,15,.78)",
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
          <span style={{ color: "var(--cyan)" }}>/cv</span>
        </span>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-primary mono cv-noprint"
          style={{ padding: "8px 16px", fontSize: "var(--text-meta)" }}
        >
          {cv.print}
        </button>
      </header>

      <main
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding:
            "clamp(24px, 4vw, 40px) clamp(20px, 5vw, 40px) clamp(56px, 8vw, 96px)",
        }}
      >
        {/* ── Print sheet ───────────────────────────────────── */}
        <section className="cv-print" style={{ fontSize: 11, lineHeight: 1.32, paddingBottom: 6 }}>
          {/* 1 · Identity */}
          <h1
            style={{
              margin: 0,
              fontSize: 21,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "var(--fg)",
            }}
          >
            {PROFILE.name}
          </h1>
          <p
            className="mono"
            style={{
              margin: "3px 0 0",
              fontSize: "var(--text-meta)",
              color: "var(--muted)",
              letterSpacing: "var(--ls-tag)",
              textTransform: "uppercase",
            }}
          >
            {PROFILE.role} · {PROFILE.loc}
          </p>
          <p
            className="mono"
            style={{
              margin: "4px 0 0",
              fontSize: "var(--text-mono)",
              color: "var(--meta)",
            }}
          >
            {PROFILE.email} · {PROFILE.github} · {PROFILE.linkedin}
          </p>

          {/* 2 · Headline tagline */}
          <p
            style={{
              margin: "8px 0 0",
              color: "var(--body-softer)",
              fontStyle: "italic",
            }}
          >
            {cv.headline}
          </p>

          {/* 3 · Experience */}
          <section style={{ marginTop: 12 }}>
            <h2 style={sectionLabelStyle}>$ {cv.expLabel}</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {EXPERIENCE.map((e, i) => (
                <li
                  key={i}
                  style={{
                    padding: "4px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                    display: "grid",
                    gridTemplateColumns: "78px minmax(0, 1fr)",
                    columnGap: 10,
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: "var(--text-mono-xs)",
                      color: "var(--meta)",
                      paddingTop: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pick(e.y, locale)}
                  </span>
                  <div>
                    <span style={{ color: "var(--fg)", fontWeight: 600 }}>
                      {pick(e.role, locale)}
                    </span>{" "}
                    <span style={{ color: "var(--muted)" }}>
                      @ {pick(e.co, locale)}
                    </span>
                    <div style={{ color: "var(--body-softer)", marginTop: 2 }}>
                      {pick(e.note, locale)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 4 · Projects */}
          <section style={{ marginTop: 12 }}>
            <h2 style={sectionLabelStyle}>$ {cv.projectsLabel}</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {PROJECTS.map((p, i) => (
                <li
                  key={p.slug}
                  style={{
                    padding: "4px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                  }}
                >
                  <span style={{ color: "var(--fg)", fontWeight: 600 }}>
                    {p.name}
                  </span>{" "}
                  <span
                    className="mono"
                    style={{ fontSize: "var(--text-mono-xs)", color: "var(--cyan)" }}
                  >
                    {p.url}
                  </span>
                  <div style={{ color: "var(--body-softer)", marginTop: 2 }}>
                    {pick(p.blurb, locale)}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 5 · Certifications */}
          <section style={{ marginTop: 12 }}>
            <h2 style={sectionLabelStyle}>$ {cv.certsLabel}</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {CERTIFICATIONS.map((c, i) => (
                <li
                  key={c.slug}
                  style={{
                    padding: "3px 0",
                    borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: "var(--text-mono-xs)",
                      color: "var(--cyan)",
                      marginRight: 8,
                    }}
                  >
                    {c.code}
                  </span>
                  <span style={{ color: "var(--fg)" }}>{pick(c.name, locale)}</span>
                  {c.when ? (
                    <span
                      className="mono"
                      style={{
                        fontSize: "var(--text-mono-xs)",
                        color: "var(--meta)",
                        marginLeft: 8,
                      }}
                    >
                      · {pick(c.when, locale)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          {/* 6 · Stack */}
          <section style={{ marginTop: 12 }}>
            <h2 style={sectionLabelStyle}>$ {cv.stackLabel}</h2>
            <div
              className="mono"
              style={{
                display: "grid",
                gap: 3,
                fontSize: "var(--text-mono)",
                color: "var(--body-softer)",
              }}
            >
              {STACK.map((g) => (
                <div key={g.group}>
                  <span style={{ color: "var(--cyan)" }}>{g.group}: </span>
                  {g.items.join(" · ")}
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

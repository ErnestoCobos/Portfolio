import Link from "next/link";
import { getDictionary, type Locale } from "../lib/i18n";
import {
  CERTIFICATIONS,
  EXPERIENCE,
  PROFILE,
  PROJECTS,
  STACK,
  pick,
} from "./portfolio-data";
import { PrintButton } from "./PrintButton";

/**
 * Print-optimized CV, rendered entirely from the same `portfolio-data`
 * source of truth as the site — so it can never drift from what's on the
 * homepage. Visit `/cv` (es) or `/en/cv` (en) and "Save as PDF" from the
 * browser. Deliberately a *light* document (white paper, dark ink) regardless
 * of the site's dark theme, so it prints cleanly; the site chrome (skip link,
 * locale switcher) is suppressed in print via the style block below.
 */

// Light, ink-friendly palette — darker accents than the site's neon so they
// keep contrast on white paper.
const INK = "#0f172a";
const MUTED = "#475569";
const FAINT = "#64748b";
const HAIRLINE = "#e2e8f0";
const CYAN = "#0e7490";
const VIOLET = "#6d28d9";

const PRINT_CSS = `
  @media print {
    .skip-link, .locale-switcher, .theme-toggle, .cv-noprint { display: none !important; }
    @page { margin: 1.4cm; }
    html, body { background: #fff !important; }
    .cv-doc { box-shadow: none !important; margin: 0 !important; }
  }
  .cv-print-btn {
    font-family: var(--font-jetbrains-mono), ui-monospace, monospace;
    font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
    color: ${CYAN}; background: #fff;
    border: 1px solid ${CYAN}; border-radius: 6px; padding: 9px 16px;
    transition: background .15s ease, color .15s ease;
  }
  .cv-print-btn:hover { background: ${CYAN}; color: #fff; }
  .cv-back {
    font-family: var(--font-jetbrains-mono), ui-monospace, monospace;
    font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
    color: ${MUTED};
  }
`;

function Heading({ children }: { children: string }) {
  return (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: CYAN,
        borderBottom: `2px solid ${HAIRLINE}`,
        paddingBottom: 6,
        margin: "32px 0 16px",
      }}
    >
      {children}
    </h2>
  );
}

export function CurriculumVitae({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).cv;
  const homeHref = locale === "en" ? "/en" : "/";

  return (
    <main
      id="about"
      style={{
        background: "#fff",
        color: INK,
        minHeight: "100vh",
        padding: "48px 20px",
        fontFamily: "var(--font-inter), -apple-system, sans-serif",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <article
        className="cv-doc"
        style={{
          maxWidth: 820,
          margin: "0 auto",
          background: "#fff",
        }}
      >
        {/* Action row — hidden in print */}
        <div
          className="cv-noprint"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <Link href={homeHref} className="cv-back">
            {t.backHome}
          </Link>
          <PrintButton label={t.print} />
        </div>

        {/* Header */}
        <header style={{ marginBottom: 8 }}>
          <p
            style={{
              fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: CYAN,
              margin: "0 0 8px",
            }}
          >
            {t.overline}
          </p>
          <h1
            style={{
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              margin: 0,
              color: INK,
            }}
          >
            {PROFILE.name}
          </h1>
          <p
            style={{
              fontSize: 16,
              color: VIOLET,
              fontWeight: 600,
              margin: "6px 0 12px",
            }}
          >
            {PROFILE.role}
          </p>
          <p
            style={{
              fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: 12.5,
              color: MUTED,
              margin: 0,
              lineHeight: 1.8,
            }}
          >
            {PROFILE.email}
            {"  ·  "}
            {PROFILE.github}
            {"  ·  "}
            {PROFILE.linkedin}
            {"  ·  "}
            {PROFILE.loc}
          </p>
        </header>

        {/* Summary */}
        <Heading>{t.summary}</Heading>
        <p style={{ fontSize: 14.5, lineHeight: 1.65, color: INK, margin: 0 }}>
          {pick(PROFILE.bio, locale)}
        </p>

        {/* Experience */}
        <Heading>{t.experience}</Heading>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {EXPERIENCE.map((e, i) => (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>
                  {pick(e.role, locale)}
                  <span style={{ color: VIOLET }}> · {pick(e.co, locale)}</span>
                </span>
                <span
                  style={{
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    fontSize: 12,
                    color: FAINT,
                    whiteSpace: "nowrap",
                  }}
                >
                  {pick(e.y, locale)}
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: MUTED, margin: "4px 0 0" }}>
                {pick(e.note, locale)}
              </p>
            </div>
          ))}
        </div>

        {/* Stack */}
        <Heading>{t.stack}</Heading>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STACK.map((g) => (
            <div key={g.group} style={{ fontSize: 13.5, lineHeight: 1.5 }}>
              <span
                style={{
                  display: "inline-block",
                  minWidth: 130,
                  fontWeight: 600,
                  color: CYAN,
                }}
              >
                {g.group}
              </span>
              <span style={{ color: INK }}>{g.items.join(" · ")}</span>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <Heading>{t.certifications}</Heading>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CERTIFICATIONS.map((c) => {
            const status =
              c.status === "earned"
                ? c.when
                  ? pick(c.when, locale)
                  : ""
                : `${t.certInProgress}${
                    c.when ? ` · ${pick(c.when, locale)}` : ""
                  }${typeof c.progress === "number" ? ` · ${c.progress}%` : ""}`;
            return (
              <div key={c.slug}>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: INK }}>
                  <span style={{ color: VIOLET }}>{c.code}</span>{" "}
                  {pick(c.name, locale)}
                </span>
                <span
                  style={{
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    fontSize: 12,
                    color: FAINT,
                  }}
                >
                  {"  —  "}
                  {pick(c.issuer, locale)}
                  {status ? ` · ${status}` : ""}
                </span>
              </div>
            );
          })}
        </div>

        {/* Projects */}
        <Heading>{t.projects}</Heading>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {PROJECTS.map((p) => (
            <div key={p.slug}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: INK }}>
                {p.name}
                <span
                  style={{
                    fontFamily:
                      "var(--font-jetbrains-mono), ui-monospace, monospace",
                    fontSize: 12,
                    color: CYAN,
                    fontWeight: 500,
                  }}
                >
                  {"  —  "}
                  {p.url}
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: MUTED, margin: "4px 0 0" }}>
                {pick(p.blurb, locale)}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p
          style={{
            marginTop: 36,
            paddingTop: 14,
            borderTop: `1px solid ${HAIRLINE}`,
            fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
            fontSize: 11.5,
            color: FAINT,
          }}
        >
          {t.updated} 2026 · cobos.io
        </p>
      </article>
    </main>
  );
}

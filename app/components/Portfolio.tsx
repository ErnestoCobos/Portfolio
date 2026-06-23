"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  APPROACH,
  CATEGORY_META,
  CERTIFICATIONS,
  EXPERIENCE,
  IMPACT,
  NAV,
  PROFILE,
  PROJECTS,
  STACK,
  TRENDS,
  pick,
  type Certification,
  type Post,
} from "./portfolio-data";
import { useLocale, useT } from "../lib/i18n/locale-context";
import { ArticleModal } from "./ArticleModal";
import { BlogCover } from "./BlogCover";
import { createRand } from "./seeded-rand";
import { StackRadial } from "./visuals/StackRadial";
import { ExperienceTimeline } from "./visuals/ExperienceTimeline";
import { ARCHITECTURES } from "./architectures";
import {
  ArchDiagram,
  CloudTopology,
  CobosLogo,
  IsoCloud,
  useMounted,
  useReducedMotion,
  useTicker,
} from "./portfolio-visuals";

// Dev-only live terminal. In production the const folds to null so the module
// is never imported and gets tree-shaken from the bundle.
const LiveTerminal =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./LiveTerminal"), { ssr: false })
    : null;

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [breakpoint]);
  return mobile;
}

function useViewportWidth(fallback = 1440) {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const sync = () => setW(window.innerWidth);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return w;
}

/* ─── Nav ────────────────────────────────────────────────── */
function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const ids = NAV.map((n) => n.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-36px 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75] }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return active;
}

function MobileMenu({
  active,
  onClose,
}: {
  active: string | null;
  onClose: () => void;
}) {
  const mounted = useMounted();
  const t = useT();
  const locale = useLocale();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handlePick = (id: string) => {
    onClose();
    window.setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    }, 60);
  };

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "var(--panel-strong)",
        backdropFilter: "blur(18px) saturate(140%)",
        WebkitBackdropFilter: "blur(18px) saturate(140%)",
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn .18s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: "var(--text-meta)",
            color: "var(--fg)",
            letterSpacing: "-0.01em",
          }}
        >
          cobos<span style={{ color: "var(--cyan)" }}>::</span>menu
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.nav.ariaCloseMenu}
          className="mono tap"
          style={{
            color: "var(--muted)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--r-tile)",
            padding: "6px 12px",
            fontSize: 12,
            background: "var(--surface-overlay)",
          }}
        >
          ESC ×
        </button>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ padding: "20px 18px", flex: 1, overflowY: "auto" }}
      >
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--muted)",
            marginBottom: 8,
          }}
        >
          <span style={{ color: "var(--cyan)" }}>$</span> tree /
        </div>
        <div
          className="mono"
          style={{ fontSize: "var(--text-body-sm)", color: "var(--fg)", marginBottom: 8 }}
        >
          cobos.io/
        </div>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {NAV.map((n, i) => {
            const isLast = i === NAV.length - 1;
            const branch = isLast ? "└──" : "├──";
            const isActive = active === n.id;
            const linkStyle = {
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 8px",
              fontSize: 15,
              color: isActive ? "var(--cyan)" : "var(--fg)",
              background: isActive
                ? "var(--cyan-tint)"
                : "transparent",
              borderRadius: "var(--r-tile)",
            } as const;
            if (n.id === "blog") {
              return (
                <li key={n.id}>
                  <Link
                    href={locale === "en" ? "/en/blog" : "/blog"}
                    onClick={onClose}
                    className="mono tap"
                    style={linkStyle}
                  >
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>
                      {branch}
                    </span>
                    <span
                      style={{
                        color: isActive ? "var(--cyan)" : "var(--muted)",
                      }}
                    >
                      /
                    </span>
                    <span>{n.label.toLowerCase()}</span>
                    {isActive && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: "var(--text-mono)",
                          color: "var(--cyan)",
                        }}
                      >
                        {t.nav.menuActiveHere}
                      </span>
                    )}
                  </Link>
                </li>
              );
            }
            return (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePick(n.id);
                  }}
                  className="mono tap"
                  style={linkStyle}
                >
                  <span
                    style={{
                      color: "var(--muted)",
                      fontSize: "var(--text-meta)",
                    }}
                  >
                    {branch}
                  </span>
                  <span style={{ color: isActive ? "var(--cyan)" : "var(--muted)" }}>
                    /
                  </span>
                  <span>{n.label.toLowerCase()}</span>
                  {isActive && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "var(--text-mono)",
                        color: "var(--cyan)",
                      }}
                    >
                      {t.nav.menuActiveHere}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
        <div
          className="mono"
          style={{
            marginTop: 24,
            fontSize: "var(--text-mono)",
            color: "var(--muted)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span>{t.nav.menuEntries(NAV.length)}</span>
          {/* Locale chip — mirrors the desktop dock chip so phones aren't the
           *  only viewport without a persistent language indicator. The
           *  floating switcher still handles the toggle. */}
          <span
            aria-label={`current locale ${locale}`}
            style={{
              color: "var(--cyan)",
              padding: "2px 7px",
              border: "1px solid rgba(0,212,255,.22)",
              background: "var(--cyan-tint-soft)",
              borderRadius: 4,
              fontSize: "var(--text-mono-xs)",
              letterSpacing: "var(--ls-tag)",
              textTransform: "uppercase",
            }}
          >
            lang: {locale}
          </span>
          <span style={{ color: "var(--cyan)" }}>● {t.nav.online}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * tmux-style status dock: fixed at the bottom of the viewport, ~36px tall,
 * always visible. Left segment shows the active section as a path indicator
 * (cobos:: > /work), center holds the navigation chips, right shows status
 * (online · ./contact). Mobile collapses to logo + path + ≡ trigger.
 */
function Nav({ mobile }: { mobile: boolean }) {
  const t = useT();
  const locale = useLocale();
  const active = useActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeLabel =
    NAV.find((n) => n.id === active)?.label.toLowerCase() ?? "/";
  const blogHref = locale === "en" ? "/en/blog" : "/blog";

  return (
    <>
      <div
        role="navigation"
        aria-label={t.nav.ariaSections}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          height: 36,
          padding: mobile ? "0 10px" : "0 14px",
          display: "flex",
          alignItems: "center",
          gap: mobile ? 8 : 14,
          background: "var(--panel)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderTop: "1px solid var(--hairline-strong)",
          borderBottom: "1px solid var(--hairline-strong)",
          boxShadow: "0 8px 24px rgba(0,0,0,.45)",
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "var(--text-mono)",
        }}
      >
        {/* LEFT: logo + active-path */}
        <a
          href="#top"
          aria-label={t.nav.ariaBackToTop}
          className="tap"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 4,
            padding: "4px 8px 4px 4px",
            background: "var(--cyan-tint-soft)",
            border: "1px solid rgba(0,212,255,.22)",
            color: "var(--fg)",
            flexShrink: 0,
          }}
        >
          <span style={{ width: 16, height: 16, display: "block" }}>
            <CobosLogo />
          </span>
          <span
            style={{
              fontSize: "var(--text-mono)",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            cobos<span style={{ color: "var(--cyan)" }}>::</span>
          </span>
        </a>

        {/* Active locale chip — always visible while scrolling so the
         *  language identity is never ambiguous, even before the eye
         *  notices the floating switcher. Desktop only; mobile relies on
         *  the floating switcher to avoid cramping the 36px dock. */}
        {!mobile && (
          <span
            className="mono"
            aria-label={`current locale ${locale}`}
            style={{
              fontSize: "var(--text-mono-xs)",
              letterSpacing: "var(--ls-tag)",
              textTransform: "uppercase",
              color: "var(--cyan)",
              padding: "3px 7px",
              border: "1px solid rgba(0,212,255,.22)",
              background: "var(--cyan-tint-soft)",
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            {locale}
          </span>
        )}

        {/* path indicator (active section) */}
        <span
          className="mono"
          style={{
            color: "var(--muted)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "var(--cyan)" }}>›</span>{" "}
          <span style={{ color: "var(--fg)" }}>/{activeLabel}</span>
        </span>

        {/* CENTER: chips (desktop only) */}
        {!mobile && (
          <nav
            style={{
              display: "flex",
              gap: 1,
              marginLeft: "auto",
              marginRight: "auto",
              alignItems: "center",
            }}
          >
            {NAV.map((n) => {
              const isActive = active === n.id;
              const chipStyle = {
                padding: "5px 10px",
                fontSize: "var(--text-mono)",
                color: isActive ? "var(--cyan)" : "var(--muted)",
                background: isActive ? "rgba(0,212,255,.10)" : "transparent",
                borderRadius: 4,
                cursor: "pointer",
              } as const;
              if (n.id === "blog") {
                return (
                  <Link
                    key={n.id}
                    href={blogHref}
                    data-active={isActive ? "true" : undefined}
                    className="mono nav-chip"
                    style={chipStyle}
                  >
                    /{n.label.toLowerCase()}
                  </Link>
                );
              }
              return (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  data-active={isActive ? "true" : undefined}
                  className="mono nav-chip"
                  style={chipStyle}
                >
                  /{n.label.toLowerCase()}
                </a>
              );
            })}
          </nav>
        )}

        {/* mobile spacer */}
        {mobile && <span style={{ flex: 1 }} />}

        {/* RIGHT: online + ./contact + (mobile) menu */}
        {!mobile && (
          <span
            style={{
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "var(--r-chip)",
                background: "var(--cyan)",
                boxShadow: "0 0 8px var(--cyan)",
              }}
            />
            {t.nav.online}
          </span>
        )}

        <a
          href="#contact"
          className="mono tap"
          style={{
            padding: mobile ? "5px 10px" : "5px 12px",
            border: "1px solid var(--cyan)",
            color: "var(--cyan)",
            borderRadius: 4,
            background: "var(--cyan-tint)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            fontSize: "var(--text-mono)",
          }}
        >
          {t.nav.contactCta}
        </a>

        {mobile && (
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t.nav.ariaOpenMenu}
            aria-expanded={menuOpen}
            className="mono tap"
            style={{
              width: 32,
              height: 26,
              padding: 0,
              border: "1px solid var(--hairline-strong)",
              color: "var(--fg)",
              borderRadius: 4,
              background: "rgba(255,255,255,.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <span aria-hidden style={{ fontSize: "var(--text-body-sm)", lineHeight: 1 }}>
              ≡
            </span>
          </button>
        )}
      </div>
      {mobile && menuOpen && (
        <MobileMenu active={active} onClose={() => setMenuOpen(false)} />
      )}
    </>
  );
}

/** Format session uptime. <1min: `12.3s`. ≥1min: `1m 23s`. Ticks every
 * frame from useTicker so it always reads as "real time". */
function fmtSession(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

/* ─── Hero (terminal chrome + animated boot log + iso lattice) ── */
function Hero({ mobile }: { mobile: boolean }) {
  const dict = useT();
  const mounted = useMounted();
  const reduced = useReducedMotion();
  const tickerT = useTicker(!reduced);
  const t = mounted ? tickerT : 0;
  const vw = useViewportWidth();
  const accent = "#00D4FF";
  const violet = "#7C3AED";
  const prompt = "$";

  const LINES = [
    { k: "cmd" as const, v: `${prompt} whoami` },
    {
      k: "out" as const,
      v: "ernesto.cobos · cloud_architect+platform_engineer+devsecops",
    },
    { k: "cmd" as const, v: `${prompt} uptime` },
    {
      k: "out" as const,
      v: "9 years, 4 months · current sprint:  enkiflow.com (saas · prod)",
    },
    { k: "cmd" as const, v: `${prompt} ls ./expertise` },
    {
      k: "out" as const,
      v: "aws/  gcp/  azure/  k8s/  argo/  vault/  opa/  terraform/  istio/",
    },
    { k: "cmd" as const, v: `${prompt} echo $POSITION` },
    {
      k: "out" as const,
      v: "one of the cloud architects you actually want answering at 3am.",
    },
    { k: "cmd" as const, v: `${prompt} ` },
  ];
  const total = LINES.reduce((a, l) => a + l.v.length, 0);
  const progress = Math.min(total, t * 55);
  let used = 0;
  const typed: { k: "cmd" | "out"; v: string }[] = [];
  for (const l of LINES) {
    const remaining = progress - used;
    if (remaining <= 0) break;
    typed.push({
      ...l,
      v: l.v.slice(0, Math.floor(Math.min(l.v.length, remaining))),
    });
    used += l.v.length;
  }
  const showCursor = Math.floor(t * 2) % 2 === 0;
  const topoW = mobile ? Math.min(vw, 600) : Math.min(vw - 96, 1440);
  const topoH = mobile ? 720 : 1000;

  return (
    // Hero is intentionally <100vh so the next section's header peeks ~60px
    // below the fold — turns scrolling from a decision into a consequence.
    <section
      style={{
        padding: mobile ? "20px 16px 32px" : "24px 48px 56px",
        height: mobile ? "auto" : "calc(85vh - 36px)",
        minHeight: mobile ? "auto" : 640,
        maxHeight: mobile ? "none" : 920,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 70% 15%, ${accent}24, transparent 55%), radial-gradient(ellipse at 15% 85%, ${violet}26, transparent 55%)`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
          <CloudTopology
            width={topoW}
            height={topoH}
            density={mobile ? 0.5 : 0.9}
            animate={!reduced}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(var(--surface-soft) 1px, transparent 1px), linear-gradient(90deg, var(--surface-soft) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1280,
          margin: "0 auto",
          width: "100%",
          flex: 1,
          border: "1px solid var(--hairline-strong)",
          borderRadius: 14,
          overflow: "hidden",
          background: "var(--panel-glass)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: `0 30px 80px rgba(0,0,0,.5), 0 0 80px ${accent}1A`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderBottom: "1px solid var(--hairline)",
            background: "var(--surface-overlay)",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "var(--r-chip)",
              background: "#444",
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "var(--r-chip)",
              background: "#444",
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "var(--r-chip)",
              background: accent,
              boxShadow: `0 0 12px ${accent}`,
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginLeft: 12,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {mobile ? dict.hero.terminalTitleMobile : dict.hero.terminalTitle}
          </span>
          <span
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--meta)",
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
            aria-label={`Sesión activa hace ${Math.floor(t)} segundos`}
          >
            <span className="dot green" aria-hidden /> {dict.hero.sessionLabel} · {fmtSession(t)}
          </span>
        </div>

        <div
          style={{
            padding: mobile ? "16px 18px 10px" : "20px 36px 14px",
            borderBottom: "1px solid var(--hairline)",
            minHeight: mobile ? 160 : 200,
          }}
        >
          {typed.map((l, i) => {
            const isLast = i === typed.length - 1;
            return (
              <div
                key={i}
                className="mono"
                style={{
                  fontSize: mobile ? 12 : 14,
                  lineHeight: 1.7,
                  // var(--cyan) so the boot-log prompts darken to a legible
                  // teal in light mode (the hex `accent` const stays for the
                  // decorative gradients/glow that need hex-alpha concat).
                  color: l.k === "cmd" ? "var(--cyan)" : "var(--fg)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {l.v}
                {isLast && (
                  <span
                    style={{
                      display: "inline-block",
                      width: ".55em",
                      height: "1em",
                      verticalAlign: "-2px",
                      background: accent,
                      marginLeft: 2,
                      opacity: showCursor ? 1 : 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "1.1fr 1fr",
            gap: mobile ? 28 : 44,
            padding: mobile ? "28px 18px 24px" : "40px 40px 32px",
            alignItems: "center",
            flex: 1,
            minHeight: mobile ? 0 : 380,
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: "var(--text-mono)",
                color: "var(--muted)",
                marginBottom: 16,
              }}
            >
              <span style={{ color: accent }}>›</span> {dict.hero.versionLine.replace(/^›\s*/, "")}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: mobile ? 38 : 64,
                lineHeight: mobile ? 0.98 : 0.98,
                letterSpacing: "-0.04em",
                fontWeight: 500,
                marginBottom: 20,
              }}
            >
              {mobile ? (
                <>
                  cobos<span style={{ color: accent }}>::</span>
                  <br />
                  <span style={{ color: "var(--muted)" }}>cloud_</span>
                  <wbr />
                  architect
                  <br />
                  <span style={{ color: violet }}>+</span>{" "}
                  <span style={{ color: "var(--muted)" }}>devsecops</span>
                </>
              ) : (
                <>
                  cobos<span style={{ color: accent }}>::</span>cloud_architect
                  <br />
                  <span style={{ color: violet }}>+</span>{" "}
                  <span style={{ color: "var(--muted)" }}>devsecops</span>
                </>
              )}
            </h1>
            <p
              style={{
                color: "var(--muted)",
                fontSize: mobile ? 15 : 16,
                maxWidth: 540,
                marginBottom: 22,
                lineHeight: 1.55,
              }}
            >
              {dict.hero.subhead}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#work" className="btn-primary">
                {dict.hero.cta}
              </a>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: mobile ? 220 : 320,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: mobile ? -20 : -32,
                background: `radial-gradient(circle, ${accent}26, transparent 60%)`,
                filter: "blur(20px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {mounted && (
                <IsoCloud size={mobile ? 200 : 320} animate={!reduced} />
              )}
            </div>
            {/* Connector lines from cube center to each orbiting pill. The
             * "active" index cycles every 2s, drawing a bright stroke + glow
             * to that pill while others stay as faint hairlines. */}
            {mounted && !mobile && (() => {
              const PILL_LABELS = ["EKS", "GKE", "AKS", "Argo CD", "Vault", "OPA"];
              const active = Math.floor(t * 0.5) % PILL_LABELS.length;
              return (
                <svg
                  aria-hidden
                  viewBox="-200 -150 400 300"
                  preserveAspectRatio="xMidYMid meet"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  {PILL_LABELS.map((_, i) => {
                    const a = t * 0.32 + i * ((Math.PI * 2) / 6);
                    const x = Math.cos(a) * 165;
                    const y = Math.sin(a) * 100;
                    const isActive = i === active;
                    const c = i % 2 === 0 ? accent : violet;
                    return (
                      <g key={i}>
                        <line
                          x1={0}
                          y1={0}
                          x2={x}
                          y2={y}
                          stroke={isActive ? c : "rgba(168,181,199,.18)"}
                          strokeWidth={isActive ? 1.4 : 0.6}
                          strokeDasharray={isActive ? "none" : "2 4"}
                          opacity={isActive ? 1 : 0.65}
                          style={{
                            filter: isActive
                              ? `drop-shadow(0 0 6px ${c})`
                              : "none",
                            transition: "opacity .3s",
                          }}
                        />
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
            {mounted &&
              ["EKS", "GKE", "AKS", "Argo CD", "Vault", "OPA"].map((l, i) => {
                if (mobile) {
                  return null;
                }
                const a = t * 0.32 + i * ((Math.PI * 2) / 6);
                const dx = (Math.cos(a) * 165).toFixed(2);
                const dy = (Math.sin(a) * 100).toFixed(2);
                const c = i % 2 === 0 ? accent : violet;
                const active = Math.floor(t * 0.5) % 6;
                const isActive = i === active;
                return (
                  <div
                    key={l}
                    className="mono"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
                      fontSize: "var(--text-mono)",
                      color: c,
                      padding: "4px 10px",
                      background: "var(--panel-mid)",
                      border: `1px solid ${c}${isActive ? "" : "55"}`,
                      borderRadius: "var(--r-tile)",
                      boxShadow: isActive
                        ? `0 0 0 1px ${c}, 0 0 18px ${c}66`
                        : `0 0 12px ${c}33`,
                      pointerEvents: "none",
                      zIndex: 2,
                      letterSpacing: "var(--ls-meta)",
                      whiteSpace: "nowrap",
                      transition: "box-shadow .3s, border-color .3s",
                    }}
                  >
                    {l}
                  </div>
                );
              })}
            {mobile && mounted && (
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  right: 12,
                  bottom: 8,
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 8,
                  zIndex: 2,
                }}
              >
                {["EKS", "GKE", "AKS", "Argo CD", "Vault", "OPA"].map((l, i) => {
                  const c = i % 2 === 0 ? accent : violet;
                  return (
                    <div
                      key={l}
                      className="mono"
                      style={{
                        fontSize: "var(--text-mono-xs)",
                        color: c,
                        padding: "4px 8px",
                        background: "var(--panel-mid)",
                        border: `1px solid ${c}55`,
                        borderRadius: 5,
                        boxShadow: `0 0 12px ${c}22`,
                        letterSpacing: "var(--ls-meta)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--hairline)",
            padding: mobile ? "10px 14px" : "12px 18px",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            background: "var(--surface-overlay)",
          }}
        >
          <span className="mono" style={{ fontSize: "var(--text-mono)", color: "var(--muted)" }}>
            eks-prod · eu-west-1
          </span>
          <span className="mono" style={{ fontSize: "var(--text-mono)", color: "var(--muted)" }}>
            argo cd: synced
          </span>
          <span className="mono" style={{ fontSize: "var(--text-mono)", color: accent }}>
            p95 118ms
          </span>
          <span className="mono" style={{ fontSize: "var(--text-mono)", color: "#22c55e" }}>
            ● healthy
          </span>
        </div>
      </div>

      {!mobile && (
        <button
          type="button"
          aria-label="Scroll to next section"
          onClick={() => {
            document
              .getElementById("about")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="tap"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 12,
            transform: "translateX(-50%)",
            zIndex: 5,
            width: 32,
            height: 32,
            borderRadius: "999px",
            background: "var(--panel)",
            border: `1px solid ${accent}55`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
            boxShadow: `0 0 0 4px var(--cyan-tint-soft), 0 0 24px ${accent}33, 0 8px 24px rgba(0,0,0,.45)`,
            animation: reduced ? undefined : "hero-bounce 1.6s ease-in-out infinite",
            cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M3.5 6 L8 10.5 L12.5 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

    </section>
  );
}

/* ─── shared section primitives ─────────────────────────── */
function SectionHeader({
  n,
  t,
  action,
  onActionClick,
}: {
  n: number;
  t: string;
  action?: string;
  onActionClick?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 32,
        paddingBottom: 16,
        borderBottom: "1px solid var(--hairline)",
        flexWrap: "wrap",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono)",
          color: "var(--cyan)",
          letterSpacing: "var(--ls-tag)",
        }}
      >
        <span style={{ color: "var(--muted)" }}>0{n}</span> &nbsp;·&nbsp; {t}
      </div>
      {action &&
        (onActionClick ? (
          <button
            type="button"
            onClick={onActionClick}
            className="mono tap"
            style={{
              fontSize: "var(--text-mono)",
              color: "var(--cyan)",
              background: "transparent",
              padding: 0,
              border: "none",
              cursor: "pointer",
              letterSpacing: "var(--ls-meta)",
            }}
          >
            {action}
          </button>
        ) : (
          <div className="mono" style={{ fontSize: "var(--text-mono)", color: "var(--muted)" }}>
            {action}
          </div>
        ))}
    </div>
  );
}

function Section({
  id,
  fsPath,
  children,
  mobile,
  dark,
}: {
  id?: string;
  fsPath?: string;
  children: ReactNode;
  mobile: boolean;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      data-fs-path={fsPath}
      data-fs-type={fsPath ? "dir" : undefined}
      style={{
        padding: mobile ? "48px 16px" : "80px 48px",
        background: dark ? "var(--section-dark)" : "transparent",
        borderTop: "1px solid var(--hairline)",
        scrollMarginTop: 52,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

/* ─── About ─────────────────────────────────────────────── */
function About({ mobile }: { mobile: boolean }) {
  const t = useT();
  const locale = useLocale();
  return (
    <Section id="about" fsPath="/about" mobile={mobile}>
      <SectionHeader
        n={1}
        t={t.about.sectionLabel}
        action={t.about.action}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "1fr 2fr",
          gap: mobile ? 24 : 64,
        }}
      >
        <div>
          <a
            href={`https://${PROFILE.github}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${PROFILE.name} on GitHub`}
            style={{
              width: mobile ? 96 : 140,
              height: mobile ? 96 : 140,
              borderRadius: "var(--r-card-sm)",
              border: "1px solid var(--cyan)",
              display: "block",
              overflow: "hidden",
              boxShadow: "0 0 32px rgba(0,212,255,.22)",
              transition: "box-shadow .2s, transform .2s",
            }}
          >
            <Image
              src={PROFILE.avatarUrl}
              alt={PROFILE.name}
              width={140}
              height={140}
              priority
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "saturate(.85) contrast(1.05)",
              }}
            />
          </a>
          <div
            className="mono"
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "var(--muted)",
              lineHeight: 1.7,
            }}
          >
            <div data-fs-path="/about/name.txt" data-fs-type="file">
              name: <span data-fs-text style={{ color: "var(--fg)" }}>{t.about.name}</span>
            </div>
            <div data-fs-path="/about/role.txt" data-fs-type="file">
              role: <span data-fs-text style={{ color: "var(--fg)" }}>{t.about.role}</span>
            </div>
            <div data-fs-path="/about/location.txt" data-fs-type="file">
              loc:  <span data-fs-text style={{ color: "var(--fg)" }}>{t.about.location}</span>
            </div>
            <div data-fs-path="/about/since.txt" data-fs-type="file">
              since: <span data-fs-text style={{ color: "var(--fg)" }}>{t.about.since}</span>
            </div>
            <div data-fs-path="/about/status.txt" data-fs-type="file">
              status: <span data-fs-text style={{ color: "var(--cyan)" }}>{t.about.statusOnline}</span>
            </div>
          </div>
        </div>
        <div>
          <h2
            data-fs-path="/about/headline.md"
            data-fs-type="file"
            style={{
              fontSize: mobile ? 26 : 40,
              fontWeight: 500,
              lineHeight: 1.15,
              marginBottom: 24,
              letterSpacing: "var(--ls-heading)",
            }}
          >
            <span data-fs-text>{t.about.headline[0]}</span>
          </h2>
          {t.about.bioParas.map((para, i) => (
            <p
              key={i}
              data-fs-path={i === 0 ? "/about/bio.md" : undefined}
              data-fs-type={i === 0 ? "file" : undefined}
              style={{
                color: "var(--muted)",
                fontSize: mobile ? 15 : 17,
                lineHeight: 1.65,
                marginBottom: 16,
              }}
            >
              <span data-fs-text={i === 0 ? "" : undefined}>{para}</span>
            </p>
          ))}
          <p
            style={{
              color: "var(--muted)",
              fontSize: mobile ? 15 : 17,
              lineHeight: 1.65,
            }}
          >
            {t.about.bioContinuation.pre}
            <span style={{ color: "var(--violet)" }}>
              {t.about.bioContinuation.enkiflow}
            </span>
            {t.about.bioContinuation.and}
            <span style={{ color: "var(--violet)" }}>
              {t.about.bioContinuation.getdecant}
            </span>
            {t.about.bioContinuation.post}
          </p>
          <Link
            href={locale === "en" ? "/en/cv" : "/cv"}
            className="mono"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 24,
              fontSize: "var(--text-mono)",
              letterSpacing: "var(--ls-tag)",
              textTransform: "uppercase",
              color: "var(--cyan)",
              border: "1px solid var(--border-cyan-soft)",
              borderRadius: "var(--r-tile)",
              padding: "8px 14px",
              width: "fit-content",
            }}
          >
            {t.cv.cta} <span aria-hidden>↗</span>
          </Link>
        </div>
      </div>
    </Section>
  );
}

/* ─── Impact strip ──────────────────────────────────────── */
function ImpactStrip({ mobile }: { mobile: boolean }) {
  const t = useT();
  const locale = useLocale();
  return (
    <section
      data-fs-path="/impact"
      data-fs-type="dir"
      aria-label={t.impact.sectionLabel}
      style={{
        padding: mobile ? "32px 16px" : "40px 48px",
        background: "var(--section-dark)",
        borderTop: "1px solid var(--hairline)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          className="mono"
          style={{
            fontSize: "var(--text-mono)",
            letterSpacing: "var(--ls-tag)",
            textTransform: "uppercase",
            color: "var(--meta)",
            marginBottom: mobile ? 20 : 24,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span style={{ color: "var(--cyan)" }}>$</span>
          {t.impact.action}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: mobile ? 20 : 32,
          }}
        >
          {IMPACT.map((m, i) => {
            const even = i % 2 === 0;
            return (
              <div
                key={m.value}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: mobile ? 40 : 56,
                    fontWeight: 600,
                    lineHeight: 1,
                    letterSpacing: "var(--ls-heading)",
                    color: even ? "var(--cyan)" : "var(--violet)",
                    textShadow: `0 0 24px ${
                      even ? "var(--cyan-glow)" : "var(--violet-glow)"
                    }`,
                  }}
                >
                  {m.value}
                </span>
                <span
                  style={{
                    fontSize: "var(--text-meta)",
                    color: "var(--muted)",
                    lineHeight: 1.4,
                    maxWidth: 220,
                  }}
                >
                  {pick(m.label, locale)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Stack ─────────────────────────────────────────────── */
function Stack({ mobile }: { mobile: boolean }) {
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

/* ─── Infra ─────────────────────────────────────────────── */
function Gauge({
  label,
  val,
  display,
  suffix = "%",
}: {
  label: string;
  val: number;
  display?: string;
  suffix?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
          {label}
        </span>
        <span className="mono" style={{ fontSize: 12, color: "var(--fg)" }}>
          {display ?? val.toFixed(1) + suffix}
        </span>
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
            width: Math.min(100, val) + "%",
            height: "100%",
            background: "linear-gradient(90deg, var(--cyan), var(--violet))",
          }}
        />
      </div>
    </div>
  );
}

const ARCH_EVENTS: Record<
  string,
  { t: string; m: string; c: string }[]
> = {
  "aws-saas": [
    { t: "+12s", m: "CodeDeploy · canary api-gateway@v2.41 → green", c: "var(--cyan)" },
    { t: "+24s", m: "Cognito · MFA enrollment for tenant_842", c: "var(--violet)" },
    { t: "+47s", m: "Aurora · scale 8→12 ACU (tenant_217 burst)", c: "var(--muted)" },
    { t: "+58s", m: "WAF · 412 reqs blocked (rate-limit · /v2/auth)", c: "var(--violet)" },
  ],
  "gcp-bank": [
    { t: "+09s", m: "Spanner · multi-region commit p99 = 67ms", c: "var(--cyan)" },
    { t: "+22s", m: "VPC-SC · perimeter ingress denied (project mismatch)", c: "var(--violet)" },
    { t: "+41s", m: "Cloud Armor · 2.4k DDoS reqs absorbed at edge", c: "var(--muted)" },
    { t: "+55s", m: "DLP · PII redacted in 18 BigQuery rows (PCI scope)", c: "var(--violet)" },
  ],
  "azure-data": [
    { t: "+11s", m: "Flux · helm release synapse-pool@2.7 → success", c: "var(--cyan)" },
    { t: "+19s", m: "Defender · medium · public IP on AKS-pool-3", c: "var(--violet)" },
    { t: "+38s", m: "Cosmos · multi-master conflict resolved (LWW)", c: "var(--muted)" },
    { t: "+52s", m: "Front Door · failover westeurope→eastus2 (4s rtt)", c: "var(--violet)" },
  ],
  "onprem-hybrid": [
    { t: "+15s", m: "Argo CD · sync ocp-dc1/api@v3.12.4 (sealed-secrets)", c: "var(--cyan)" },
    { t: "+27s", m: "Patroni · failover replica → primary (37ms)", c: "var(--violet)" },
    { t: "+44s", m: "MinIO → AWS S3 · 12.4GB cold replication", c: "var(--muted)" },
    { t: "+59s", m: "Wazuh · suricata alert · investigated (false-positive)", c: "var(--violet)" },
  ],
};

function Infra({ mobile }: { mobile: boolean }) {
  const dict = useT();
  const reduced = useReducedMotion();
  const tick = useTicker(!reduced);
  const [archIdx, setArchIdx] = useState(0);
  const arch = ARCHITECTURES[archIdx];
  // Baselines come from the active architecture so a SaaS, a bank, an
  // analytics platform and an on-prem hybrid don't all read the same load.
  const cpu = arch.cpu + Math.sin(tick * 0.7) * 6;
  const mem = arch.mem + Math.sin(tick * 0.5 + 1) * 5;
  const rpsBase = arch.rps;
  const rps = rpsBase + Math.floor(Math.sin(tick * 1.1) * Math.max(60, rpsBase * 0.1));
  const events = ARCH_EVENTS[arch.id] || [];

  return (
    <Section id="infra" fsPath="/infra" mobile={mobile}>
      <SectionHeader
        n={3}
        t={dict.infra.sectionLabel}
        action={dict.infra.action}
      />

      {/* Tab strip — terminal-style, click to switch architecture */}
      <div
        role="tablist"
        aria-label="Reference architectures"
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 16,
          borderBottom: "1px solid var(--hairline)",
          overflowX: "auto",
          flexWrap: mobile ? "nowrap" : "wrap",
        }}
      >
        {ARCHITECTURES.map((a, i) => {
          const active = i === archIdx;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setArchIdx(i)}
              className="mono tap"
              style={{
                padding: mobile ? "10px 12px" : "10px 16px",
                fontSize: 12,
                color: active ? "var(--cyan)" : "var(--muted)",
                background: active ? "var(--cyan-tint-soft)" : "transparent",
                border: "none",
                borderBottom: active
                  ? "2px solid var(--cyan)"
                  : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                marginBottom: -1,
              }}
            >
              <span style={{ color: "var(--muted)", marginRight: 6 }}>0{i + 1}</span>
              <span>{a.vendor}</span>
              <span style={{ color: "var(--muted)", marginLeft: 6 }}>·</span>
              <span style={{ marginLeft: 6, color: active ? "var(--fg)" : "inherit" }}>
                {a.name}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono)",
          color: "var(--muted)",
          marginBottom: 16,
        }}
      >
        <span style={{ color: "var(--cyan)" }}>›</span> {arch.caption}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "5fr 3fr",
          gap: 16,
        }}
      >
        <div
          style={{
            border: "1px solid var(--hairline)",
            borderRadius: 8,
            padding: mobile ? 12 : 24,
            background: "rgba(0,0,0,.2)",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: "var(--text-mono)",
              color: "var(--muted)",
              marginBottom: 16,
            }}
          >
            topology · {arch.vendor.toLowerCase()} reference
          </div>
          <ArchDiagram arch={arch} compact={mobile} animate={!reduced} />
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: "var(--text-mono)",
                color: "var(--muted)",
                marginBottom: 16,
              }}
            >
              {arch.region}
            </div>
            <Gauge label="cpu" val={cpu} />
            <Gauge label="memory" val={mem} />
            <Gauge label="net rps" val={rps / 25} display={`${rps}`} suffix=" rps" />
          </div>
          <div
            style={{
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: "var(--text-mono)",
                color: "var(--muted)",
                marginBottom: 12,
              }}
            >
              events · last 60s
            </div>
            {events.map((e, i) => (
              <div
                key={i}
                className="mono"
                style={{
                  fontSize: "var(--text-mono)",
                  padding: "6px 0",
                  borderTop: i ? "1px solid var(--hairline)" : "none",
                  display: "flex",
                  gap: 10,
                }}
              >
                <span style={{ color: "var(--muted)", minWidth: 38 }}>{e.t}</span>
                <span style={{ color: e.c }}>●</span>
                <span style={{ color: "var(--fg)", flex: 1 }}>{e.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─── Work ──────────────────────────────────────────────── */
function Work({ mobile }: { mobile: boolean }) {
  const locale = useLocale();
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
        {PROJECTS.map((p) => {
          const c = p.accent === "violet" ? "var(--violet)" : "var(--cyan)";
          const glow =
            p.accent === "violet"
              ? "rgba(124,58,237,.6)"
              : "rgba(0,212,255,.6)";
          const href = p.href ?? `https://${p.url}`;
          return (
            <div
              key={p.slug}
              data-fs-path={`/work/${p.slug}.md`}
              data-fs-type="file"
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
          );
        })}
      </div>
    </Section>
  );
}

/* ─── Experience ─────────────────────────────────────────── */
function Experience({ mobile }: { mobile: boolean }) {
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

function CertificationCard({ c }: { c: CertCardData }) {
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
    <div
      className="cert-card"
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
  );
}

/** Sort key — earned first (1000), then by prep progress. Keeps the grid
 * leading on momentum even when every entry is still in-progress. */
function certRank(c: Certification): number {
  return c.status === "earned" ? 1000 : c.progress ?? 0;
}

function Certifications({ mobile }: { mobile: boolean }) {
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
          {items.map((c) => (
            <CertificationCard key={c.slug} c={c} />
          ))}
        </div>
      )}
    </Section>
  );
}

/* ─── Trends ─────────────────────────────────────────────── */
/** Categorize each trend by semantic color. Transformation/product-leaning
 * trends (AI, platform engineering) read as violet; ops-leaning trends
 * (FinOps, zero-trust, edge, policy) read as cyan. Two trends are marked
 * `staged` (amber) for visual variety — they're the more nascent ones. */
const TREND_META: Record<
  string,
  { accent: "cyan" | "violet"; status: "enabled" | "staged" }
> = {
  "AI-ready infra": { accent: "violet", status: "staged" },
  "Platform engineering": { accent: "violet", status: "enabled" },
  "FinOps + GreenOps": { accent: "cyan", status: "enabled" },
  "Zero-trust by default": { accent: "cyan", status: "enabled" },
  "Cloud-native edge": { accent: "cyan", status: "staged" },
  "Policy as code": { accent: "cyan", status: "enabled" },
};

/** Generate a deterministic, monotonically rising adoption curve for a trend.
 * 12 weekly samples in [0, 1]. The wobble keeps it from looking "too perfect"
 * but each call with the same seed always returns the same series. */
function adoptionSeries(seed: string, n = 12): number[] {
  const rand = createRand(seed);
  const out: number[] = [];
  let v = 0.05 + rand() * 0.1; // start low (~5–15%)
  for (let i = 0; i < n; i++) {
    const slope = 0.04 + rand() * 0.08; // weekly delta
    const wobble = (rand() - 0.5) * 0.04; // ±2pp noise
    v = Math.max(0, Math.min(1, v + slope + wobble));
    out.push(v);
  }
  return out;
}

function TrendCard({
  tr,
  i,
  mobile,
}: {
  /** `metaKey` is the stable ES name used as a lookup into TREND_META
   * regardless of UI locale. `t` and `d` are already locale-resolved. */
  tr: { metaKey: string; t: string; d: string };
  i: number;
  mobile: boolean;
}) {
  const t = useT();
  const meta = TREND_META[tr.metaKey] ?? { accent: "cyan", status: "enabled" as const };
  const statusLabel =
    meta.status === "staged" ? t.trends.statusStaged : t.trends.statusEnabled;
  const accent = meta.accent === "violet" ? "var(--violet)" : "var(--cyan)";
  const accentGlow =
    meta.accent === "violet" ? "var(--violet-glow)" : "var(--cyan-glow)";
  const tintSoft =
    meta.accent === "violet" ? "var(--violet-tint-soft)" : "var(--cyan-tint-soft)";
  const statusColor = meta.status === "staged" ? "var(--amber)" : accent;
  const statusBg =
    meta.status === "staged" ? "rgba(245,158,11,.06)" : tintSoft;

  // Seed deterministic mock numbers off the stable ES key so the
  // sparkline + tenant counts don't reshuffle when the user switches
  // locale.
  const rand = createRand(tr.metaKey);
  const rollout = Math.floor(10 + rand() * 80); // 10-90%
  const tenants = Math.floor(50 + rand() * 9950);

  // Adoption sparkline: 12 weekly samples in [0,1], plot in a 120×30 viewBox.
  const series = adoptionSeries(tr.metaKey, 12);
  const W = 240;
  const H = 48;
  const pad = 4;
  const stepX = (W - pad * 2) / (series.length - 1);
  const points = series
    .map((v, idx) => `${pad + idx * stepX},${H - pad - v * (H - pad * 2)}`)
    .join(" ");
  // Area path under the sparkline for soft fill
  const areaPath =
    `M ${pad},${H - pad} ` +
    series
      .map(
        (v, idx) =>
          `L ${pad + idx * stepX},${H - pad - v * (H - pad * 2)}`
      )
      .join(" ") +
    ` L ${W - pad},${H - pad} Z`;

  return (
    <div
      style={{
        border: "1px solid var(--hairline)",
        borderTop: `1px solid ${accent}`,
        borderRadius: "var(--r-card-sm)",
        padding: mobile ? 16 : 20,
        background: `linear-gradient(180deg, ${tintSoft}, transparent 40%)`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Top row: flag id + status pill */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: "var(--text-mono)",
            color: "var(--meta)",
            letterSpacing: "var(--ls-tag)",
          }}
        >
          {t.trends.flagPrefix}
          {(i + 1).toString().padStart(2, "0")}
        </span>
        <span
          className="mono"
          style={{
            fontSize: "var(--text-mono-xs)",
            color: statusColor,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            border: `1px solid ${statusColor}`,
            borderRadius: "var(--r-chip)",
            background: statusBg,
            letterSpacing: "var(--ls-tag)",
            textTransform: "uppercase",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: "var(--r-chip)",
              background: statusColor,
              boxShadow: `0 0 8px ${
                meta.status === "staged" ? "var(--amber-glow)" : accentGlow
              }`,
            }}
          />
          {statusLabel}
        </span>
      </div>

      {/* Title + description */}
      <div>
        <h3
          style={{
            fontSize: mobile ? "var(--text-h3-sm-m)" : "var(--text-h3-sm)",
            fontWeight: 500,
            marginBottom: 6,
            letterSpacing: "var(--ls-tight)",
          }}
        >
          {tr.t}
        </h3>
        <p
          style={{
            color: "var(--muted)",
            fontSize: "var(--text-body-sm)",
            lineHeight: "var(--lh-body)",
          }}
        >
          {tr.d}
        </p>
      </div>

      {/* Sparkline + metrics row */}
      <div
        style={{
          marginTop: 4,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 16,
          alignItems: "end",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          aria-hidden
          preserveAspectRatio="none"
          style={{ display: "block" }}
        >
          {/* Baseline grid */}
          <line
            x1={pad}
            y1={H - pad}
            x2={W - pad}
            y2={H - pad}
            stroke="var(--hairline)"
            strokeWidth={0.5}
          />
          <line
            x1={pad}
            y1={pad}
            x2={W - pad}
            y2={pad}
            stroke="var(--hairline)"
            strokeWidth={0.5}
            strokeDasharray="2 4"
          />
          {/* Area fill */}
          <path d={areaPath} fill={accent} opacity={0.12} />
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={accent}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.95}
          />
          {/* Latest value dot */}
          <circle
            cx={pad + (series.length - 1) * stepX}
            cy={H - pad - series[series.length - 1] * (H - pad * 2)}
            r={3}
            fill={accent}
            style={{ filter: `drop-shadow(0 0 4px ${accentGlow})` }}
          />
        </svg>
        <div
          className="mono"
          style={{
            fontSize: "var(--text-mono-xs)",
            color: "var(--meta)",
            letterSpacing: "var(--ls-tag)",
            textTransform: "uppercase",
            textAlign: "right",
            lineHeight: 1.5,
            whiteSpace: "nowrap",
          }}
        >
          <div>
            {t.trends.rollout} <span style={{ color: accent }}>{rollout}%</span>
          </div>
          <div>
            {t.trends.tenants}{" "}
            <span style={{ color: "var(--fg)" }}>
              {tenants.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Trends({ mobile }: { mobile: boolean }) {
  const locale = useLocale();
  const t = useT();
  return (
    <Section id="trends" fsPath="/trends" mobile={mobile}>
      <SectionHeader
        n={7}
        t={t.trends.sectionLabel}
        action={t.trends.action}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "repeat(2, 1fr)",
          gap: 14,
        }}
      >
        {TRENDS.map((tr, i) => (
          <TrendCard
            key={tr.t.es}
            tr={{
              metaKey: tr.t.es,
              t: pick(tr.t, locale),
              d: pick(tr.d, locale),
            }}
            i={i}
            mobile={mobile}
          />
        ))}
      </div>
    </Section>
  );
}

/* ─── Blog ───────────────────────────────────────────────── */
function Blog({ mobile, posts }: { mobile: boolean; posts: Post[] }) {
  const t = useT();
  const locale = useLocale();
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  // Open from URL hash on mount and when hash changes (linkeable: #blog/<slug>)
  useEffect(() => {
    const sync = () => {
      const m = window.location.hash.match(/^#blog\/([\w-]+)$/);
      setOpenSlug(m ? m[1] : null);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const open = openSlug ? posts.find((p) => p.slug === openSlug) ?? null : null;

  const openPost = (slug: string) => {
    setOpenSlug(slug);
    window.history.replaceState(null, "", `#blog/${slug}`);
  };

  const closePost = () => {
    setOpenSlug(null);
    window.history.replaceState(null, "", "#blog");
  };

  return (
    <Section id="blog" fsPath="/blog" mobile={mobile} dark>
      <SectionHeader n={8} t={t.blog.sectionLabel} action={t.blog.action(posts.length)} />
      <div
        className="mono"
        style={{ fontSize: mobile ? 13 : 14, lineHeight: 1.8 }}
      >
        {posts.slice(0, 3).map((p, i) => {
          const accent =
            CATEGORY_META[p.category].accent === "cyan"
              ? "var(--cyan)"
              : "var(--violet)";
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => openPost(p.slug)}
              className="tap"
              style={{
                display: "grid",
                gridTemplateColumns: mobile
                  ? "44px 1fr"
                  : "44px 90px 100px 1fr 70px",
                gap: 14,
                padding: "12px 0",
                borderTop: i ? "1px solid var(--hairline)" : "none",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                background: "transparent",
                fontFamily: "inherit",
                fontSize: "inherit",
                color: "inherit",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "1px solid var(--hairline)",
                  flexShrink: 0,
                }}
              >
                <BlogCover
                  slug={p.slug}
                  category={p.category}
                  variant="thumb"
                />
              </div>
              {mobile ? (
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "var(--text-mono-xs)",
                      color: "var(--muted)",
                      letterSpacing: "var(--ls-tag)",
                      textTransform: "uppercase",
                      display: "flex",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: accent }}>{p.d.toLowerCase()}</span>
                    <span>·</span>
                    <span style={{ color: accent }}>
                      {CATEGORY_META[p.category].label}
                    </span>
                  </div>
                  <span style={{ color: "var(--fg)", fontSize: 14 }}>
                    {p.t}
                  </span>
                </div>
              ) : (
                <>
                  <span style={{ color: "var(--muted)" }}>
                    {p.d.toLowerCase()}
                  </span>
                  <span
                    style={{
                      color: accent,
                      fontSize: "var(--text-mono-xs)",
                      letterSpacing: "var(--ls-tag)",
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      border: `1px solid ${accent}`,
                      borderRadius: "var(--r-chip)",
                      justifySelf: "start",
                    }}
                  >
                    {CATEGORY_META[p.category].label}
                  </span>
                  <span style={{ color: "var(--fg)", fontSize: 16 }}>
                    {p.t}
                  </span>
                  <span style={{ color: accent, textAlign: "right" }}>
                    {p.r} →
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <div
        style={{
          marginTop: mobile ? 24 : 32,
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <a
          href={locale === "en" ? "/en/blog" : "/blog"}
          className="tap mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            border: "1px solid var(--cyan)",
            borderRadius: "var(--r-tile)",
            color: "var(--cyan)",
            fontSize: "var(--text-meta)",
            letterSpacing: ".04em",
            textTransform: "uppercase",
            background:
              "linear-gradient(180deg, var(--cyan-tint), transparent)",
          }}
        >
          {t.blog.teaserReadMore}
          <span aria-hidden style={{ fontSize: 14 }}>→</span>
          <span
            style={{ color: "var(--muted)", textTransform: "none", marginLeft: 6 }}
          >
            {t.blog.teaserNotasCount(posts.length)}
          </span>
        </a>
      </div>
      {open && <ArticleModal post={open} onClose={closePost} mobile={mobile} />}
    </Section>
  );
}

/* ─── Approach ───────────────────────────────────────────── */
/** Per-phase running duration (ms). Slightly varied so the cycle feels
 * organic rather than robotic. */
const APPROACH_PHASE_MS = [1100, 1350, 1250, 1050];

type PhaseStatus = "pending" | "running" | "done";

function Approach({ mobile }: { mobile: boolean }) {
  const locale = useLocale();
  const t = useT();
  const reduceMotion = useReducedMotion();
  // -1 = idle, 0..3 = that index running, 4 = all done.
  // If the user prefers reduced motion, jump straight to "done" so the
  // section stays visually consistent without animation.
  const [phase, setPhase] = useState<number>(reduceMotion ? 4 : -1);
  const [inView, setInView] = useState(false);
  const startedRef = useRef(false);

  // Trigger the pipeline once when the section enters the viewport. In
  // dev React Strict Mode, this effect re-runs on mount; the startedRef
  // gate ensures we only kick off once per page load. We attach the
  // observer to the section's <section> element via id lookup since the
  // shared Section wrapper does not forward refs.
  useEffect(() => {
    if (reduceMotion) {
      // `useReducedMotion()` is a client-side hook that starts from the
      // SERVER snapshot (always `false`) and updates after hydration —
      // so initial state can't see the user's real preference, and we
      // must snap to done here once we learn the truth. Guarded by
      // `phase < 4` so this fires at most once per mount (single render
      // ≠ cascading renders), but the lint rule is categorical — suppress
      // it with explicit reason.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot reduceMotion → done snap, not a cascade
      if (phase < 4) setPhase(4);
      return;
    }
    if (typeof window === "undefined") return;

    const arm = (el: Element) => {
      if (typeof IntersectionObserver === "undefined") {
        // Fallback: just kick the cycle
        if (!startedRef.current) {
          startedRef.current = true;
          setPhase(0);
        }
        return () => {};
      }
      const obs = new IntersectionObserver(
        (entries) => {
          const visible = entries.some((e) => e.isIntersecting);
          if (visible && !startedRef.current) {
            startedRef.current = true;
            setPhase(0);
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0 }
      );
      obs.observe(el);
      return () => obs.disconnect();
    };

    let cleanup: (() => void) | undefined;
    const tryArm = () => {
      const el = document.getElementById("approach");
      if (el) {
        cleanup = arm(el);
        return true;
      }
      return false;
    };
    const armed = tryArm();
    // window.setTimeout returns `number` in browsers; @types/node leaks
    // a Node `Timeout` into the global setTimeout signature, so we just
    // pin the variable to the browser return type explicitly.
    let retryT: number | undefined;
    if (!armed) retryT = window.setTimeout(tryArm, 0);

    // Safety net: if the observer hasn't fired in 600ms (e.g. browser
    // doesn't support it well, or section is already past the viewport),
    // start the pipeline anyway. We're not gating on visibility for
    // correctness, only for niceness.
    const safetyT = window.setTimeout(() => {
      if (!startedRef.current) {
        startedRef.current = true;
        setPhase(0);
      }
    }, 600);

    return () => {
      if (retryT) window.clearTimeout(retryT);
      window.clearTimeout(safetyT);
      cleanup?.();
    };
  }, [reduceMotion]);

  // Step through phases.
  useEffect(() => {
    if (phase < 0 || phase >= 4) return;
    const t = window.setTimeout(
      () => setPhase((p) => p + 1),
      APPROACH_PHASE_MS[phase]
    );
    return () => window.clearTimeout(t);
  }, [phase]);

  // Track viewport visibility for the soft-loop (separate from the kickoff
  // observer above). The loop only restarts the cycle if the user is
  // actively looking at the section.
  useEffect(() => {
    if (reduceMotion) return;
    if (typeof IntersectionObserver === "undefined") return;
    const el = document.getElementById("approach");
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { rootMargin: "0px", threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduceMotion]);

  // Soft-loop: when all 4 phases are done AND the section is still in view,
  // wait 4s and re-kick the cycle. Cancels cleanly if the user scrolls
  // away (inView flips to false). The reset uses a nested setTimeout to
  // briefly show "pending" between cycles — both timers MUST be tracked
  // so a mid-flight unmount doesn't fire setState on a dead component
  // (React 19 logs "Can't perform a React state update on a component
  // that hasn't mounted yet" for that pattern).
  useEffect(() => {
    if (reduceMotion) return;
    if (phase < 4) return;
    if (!inView) return;
    let innerT: number | undefined;
    const outerT = window.setTimeout(() => {
      setPhase(-1);
      innerT = window.setTimeout(() => setPhase(0), 80);
    }, 4000);
    return () => {
      window.clearTimeout(outerT);
      if (innerT !== undefined) window.clearTimeout(innerT);
    };
  }, [phase, inView, reduceMotion]);

  const replay = () => {
    setPhase(-1);
    window.setTimeout(() => setPhase(0), 80);
  };

  const statusFor = (i: number): PhaseStatus => {
    if (phase === -1) return "pending";
    if (phase > i) return "done";
    if (phase === i) return "running";
    return "pending";
  };

  const allDone = phase >= 4;
  const headerAction = allDone ? t.approach.actionReplay : t.approach.action;

  return (
    <Section id="approach" fsPath="/approach" mobile={mobile}>
      <SectionHeader
        n={9}
        t={t.approach.sectionLabel}
        action={headerAction}
        onActionClick={allDone ? replay : undefined}
      />
      <div style={{ marginBottom: mobile ? 40 : 56, maxWidth: 720 }}>
        <h2
          style={{
            fontSize: mobile ? "var(--text-h2-page-m)" : "var(--text-h2-page)",
            fontWeight: 500,
            letterSpacing: "var(--ls-display)",
            lineHeight: 1.05,
          }}
        >
          {t.approach.headline[0]}
          <span style={{ color: "var(--cyan)" }}>{t.approach.headline[1]}</span>
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)",
          gap: 0,
          borderTop: "1px solid var(--hairline)",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        {APPROACH.map((it, i) => (
          <ApproachCard
            key={it.n}
            n={it.n}
            t={pick(it.t, locale)}
            d={pick(it.d, locale)}
            cmd={it.cmd}
            status={statusFor(i)}
            mobile={mobile}
            isLast={i === APPROACH.length - 1}
            isFirst={i === 0}
          />
        ))}
      </div>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span className="mono" style={{ fontSize: "var(--text-mono)", color: "var(--muted)" }}>
          {t.approach.methodLabel}{" "}
          <span style={{ color: "var(--cyan)" }}>
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "var(--r-chip)",
                background: "var(--cyan)",
                marginRight: 8,
                verticalAlign: "middle",
                animation: allDone
                  ? "pipe-iterate 1.6s ease-in-out infinite"
                  : "none",
                opacity: allDone ? undefined : 0.45,
                boxShadow: allDone
                  ? "0 0 10px rgba(0,212,255,.6)"
                  : "none",
              }}
            />
            {t.approach.methodValue}
          </span>
        </span>
        <span className="mono" style={{ fontSize: "var(--text-mono)", color: "var(--muted)" }}>
          {t.approach.deliverablesLabel}{" "}
          <span style={{ color: "var(--fg)" }}>
            {t.approach.deliverablesValue}
          </span>
        </span>
      </div>
    </Section>
  );
}

function ApproachCard({
  n,
  t,
  d,
  cmd,
  status,
  mobile,
  isLast,
  isFirst,
}: {
  n: string;
  t: string;
  d: string;
  cmd: string;
  status: PhaseStatus;
  mobile: boolean;
  isLast: boolean;
  isFirst: boolean;
}) {
  const isRunning = status === "running";
  const isDone = status === "done";
  const isPending = status === "pending";

  const numberColor = isPending
    ? "rgba(0,212,255,.35)"
    : "var(--cyan)";

  const cmdBorder = isRunning
    ? "1px solid rgba(0,212,255,.7)"
    : isDone
      ? "1px solid var(--border-cyan-soft)"
      : "1px solid rgba(255,255,255,.08)";

  const cmdBg = isRunning
    ? "var(--cyan-tint)"
    : isDone
      ? "var(--cyan-tint-soft)"
      : "var(--surface-overlay)";

  const cmdColor = isPending
    ? "rgba(148,163,184,.6)"
    : "var(--cyan)";

  return (
    <div
      style={{
        position: "relative",
        padding: mobile ? "24px 0" : `32px 24px 32px ${isFirst ? 0 : 24}px`,
        borderRight: !mobile && !isLast ? "1px solid var(--hairline)" : "none",
        borderTop: mobile && !isFirst ? "1px solid var(--hairline)" : "none",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Status row — small mono indicator at the top of each card */}
      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "var(--text-mono-xs)",
          letterSpacing: "var(--ls-tag)",
          textTransform: "uppercase",
          marginBottom: 12,
          color: isRunning
            ? "var(--cyan)"
            : isDone
              ? "rgba(34,197,94,.95)"
              : "var(--muted)",
          transition: "color 0.3s ease",
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "var(--r-chip)",
            background: isRunning
              ? "var(--cyan)"
              : isDone
                ? "#22c55e"
                : "rgba(148,163,184,.5)",
            boxShadow: isRunning
              ? "0 0 10px rgba(0,212,255,.6)"
              : isDone
                ? "0 0 8px rgba(34,197,94,.5)"
                : "none",
            animation: isRunning
              ? "pipe-dot 0.9s ease-in-out infinite"
              : "none",
          }}
        />
        {isRunning ? "running" : isDone ? "done" : "pending"}
      </div>

      {/* Phase number */}
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono)",
          color: numberColor,
          letterSpacing: "var(--ls-tag)",
          marginBottom: 14,
          textShadow: isRunning
            ? "0 0 12px rgba(0,212,255,.5)"
            : "none",
          transition: "color 0.3s ease, text-shadow 0.3s ease",
        }}
      >
        {n}
      </div>

      <h3
        style={{
          fontSize: mobile ? "var(--text-h3-sm-m)" : "var(--text-h3-sm)",
          fontWeight: 500,
          letterSpacing: "var(--ls-tight)",
          marginBottom: 12,
          lineHeight: 1.2,
        }}
      >
        {t}
      </h3>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "var(--text-body-sm)",
          lineHeight: 1.55,
          marginBottom: 18,
        }}
      >
        {d}
      </p>

      {/* Command box — animates while running */}
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono-xs)",
          color: cmdColor,
          padding: "6px 10px",
          border: cmdBorder,
          borderRadius: 4,
          background: cmdBg,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          letterSpacing: ".02em",
          animation: isRunning
            ? "pipe-pulse 1.1s ease-in-out infinite"
            : "none",
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}
      >
        <span>$ {cmd}</span>
        {isRunning && (
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 6,
              height: 11,
              background: "var(--cyan)",
              animation: "pipe-cursor 0.9s steps(1) infinite",
            }}
          />
        )}
        {isDone && (
          <span aria-hidden style={{ color: "#22c55e" }}>
            ✓
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Contact ────────────────────────────────────────────── */
function Field({
  name,
  label,
  placeholder,
  textarea,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  placeholder: string;
  textarea?: boolean;
  type?: "text" | "email";
  required?: boolean;
}) {
  const sharedStyle: CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    background: "var(--surface-overlay)",
    border: "1px solid var(--hairline)",
    color: "var(--fg)",
    fontFamily: "inherit",
    fontSize: "var(--text-body)",
    resize: textarea ? "vertical" : "none",
    minHeight: textarea ? 120 : "auto",
    transition: "border-color .15s, background .15s",
  };
  return (
    <label style={{ display: "block" }}>
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono)",
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "var(--ls-tag)",
          marginBottom: 8,
        }}
      >
        {label}
        {required && <span style={{ color: "var(--cyan)", marginLeft: 4 }}>*</span>}
      </div>
      {textarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          required={required}
          style={sharedStyle}
        />
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          required={required}
          style={sharedStyle}
        />
      )}
    </label>
  );
}

function ContactForm() {
  const t = useT();
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "fallback"
  >("idle");

  const subjectFallback =
    locale === "en" ? "Contact from cobos.io" : "Contacto desde cobos.io";

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form || status === "sending") return;
    const data = new FormData(form);
    const from = String(data.get("from") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();
    const botcheck = String(data.get("botcheck") ?? ""); // honeypot

    // Build the mailto: fallback up front — used whenever the API isn't
    // provisioned or a request fails, so the form never dead-ends.
    const subjectLine = subject || subjectFallback;
    const bodyText = `${body}\n\n— ${from || "—"}${email ? ` <${email}>` : ""}`;
    const mailto = `mailto:${PROFILE.email}?subject=${encodeURIComponent(
      subjectLine
    )}&body=${encodeURIComponent(bodyText)}`;
    const openMailClient = () => {
      setStatus("fallback");
      window.setTimeout(() => window.location.assign(mailto), 220);
    };

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, email, subject, body, botcheck }),
      });
      const json = (await res.json().catch(() => null)) as {
        delivered?: boolean;
      } | null;
      if (res.ok && json?.delivered) {
        setStatus("sent");
        form.reset();
      } else {
        openMailClient();
      }
    } catch {
      openMailClient();
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      style={{
        border: "1px solid var(--hairline-strong)",
        borderRadius: "var(--r-card-sm)",
        padding: 24,
        background: "var(--panel-soft)",
        backdropFilter: "blur(12px) saturate(140%)",
        WebkitBackdropFilter: "blur(12px) saturate(140%)",
      }}
      noValidate={false}
    >
      <div
        className="mono"
        style={{
          fontSize: "var(--text-mono)",
          color: "var(--muted)",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          <span style={{ color: "var(--cyan)" }}>›</span> {t.contact.formTitle.replace(/^›\s*/, "")}
        </span>
        <span role="status" aria-live="polite" style={{ color: "var(--cyan)" }}>
          {status === "idle"
            ? ""
            : status === "sending"
              ? t.contact.sending
              : status === "sent"
                ? t.contact.sentOk
                : t.contact.sentFallback}
        </span>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {/* Honeypot — visually hidden, off-screen; bots fill it, humans don't.
         *  Named "botcheck" (not "website"/"url") so password managers and
         *  browser autofill don't populate it and trip a false positive. */}
        <input
          type="text"
          name="botcheck"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-9999px",
            width: 1,
            height: 1,
            opacity: 0,
          }}
        />
        <Field
          name="from"
          label={t.contact.fieldFrom}
          placeholder={t.contact.fieldFromPlaceholder}
          required
        />
        <Field
          name="email"
          type="email"
          label={t.contact.fieldEmail}
          placeholder={t.contact.fieldEmailPlaceholder}
        />
        <Field
          name="subject"
          label={t.contact.fieldSubject}
          placeholder={t.contact.fieldSubjectPlaceholder}
        />
        <Field
          name="body"
          label={t.contact.fieldBody}
          placeholder={t.contact.fieldBodyPlaceholder}
          textarea
          required
        />
        <button
          type="submit"
          className="btn-primary-violet"
          disabled={status === "sending"}
          style={{
            alignSelf: "flex-start",
            fontFamily: "var(--font-jetbrains-mono)",
            opacity: status === "sending" ? 0.6 : 1,
          }}
        >
          {status === "sending" ? t.contact.sending : t.contact.sendCta}{" "}
          <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  );
}

function Contact({ mobile }: { mobile: boolean }) {
  const t = useT();
  const locale = useLocale();
  const vw = useViewportWidth();
  const reduced = useReducedMotion();
  const topoW = mobile ? Math.min(vw, 600) : Math.min(vw - 96, 1440);
  return (
    <section
      id="contact"
      data-fs-path="/contact"
      data-fs-type="dir"
      style={{
        padding: mobile ? "48px 16px" : "80px 48px",
        background: "transparent",
        borderTop: "1px solid var(--hairline)",
        position: "relative",
        overflow: "hidden",
        scrollMarginTop: 52,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(0,212,255,.18), transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(124,58,237,.15), transparent 55%)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, opacity: 0.55 }}>
          <CloudTopology
            width={topoW}
            height={mobile ? 900 : 800}
            density={mobile ? 0.6 : 0.95}
            animate={!reduced}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(var(--surface-soft) 1px, transparent 1px), linear-gradient(90deg, var(--surface-soft) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
          }}
        />
      </div>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <SectionHeader
          n={10}
          t={t.contact.sectionLabel}
          action={t.contact.action}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
            gap: 24,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: mobile ? 32 : 56,
                fontWeight: 500,
                lineHeight: 0.95,
                marginBottom: 24,
                letterSpacing: "var(--ls-display)",
              }}
            >
              <span style={{ color: "var(--violet)" }}>{t.contact.headline[0]}</span>
              {t.contact.headline[1]}
              <br />
              <span style={{ color: "var(--violet)" }}>
                {t.contact.headline[2]}
                {t.contact.headline[3]}
              </span>
            </h2>
            <p
              style={{
                color: "var(--muted)",
                fontSize: "var(--text-body)",
                marginBottom: 32,
                maxWidth: 480,
              }}
            >
              {t.contact.blurb}
            </p>
            <div
              className="mono"
              style={{
                fontSize: "var(--text-meta)",
                lineHeight: 2.2,
                color: "var(--muted)",
              }}
            >
              <div>
                {t.contact.linkEmail}{"   "}
                <span style={{ color: "var(--cyan)" }}>{PROFILE.email}</span>
              </div>
              <div>
                {t.contact.linkGithub}{"  "}
                <span style={{ color: "var(--cyan)" }}>{PROFILE.github}</span>
              </div>
              <div>
                {t.contact.linkLi}
                {"      "}
                <span style={{ color: "var(--cyan)" }}>{PROFILE.linkedin}</span>
              </div>
              <div>
                {t.contact.linkBlog}
                {"    "}
                <span style={{ color: "var(--cyan)" }}>cobos.io/blog</span>
              </div>
              <div>
                {t.contact.linkCv}
                {"      "}
                <Link
                  href={locale === "en" ? "/en/cv" : "/cv"}
                  style={{ color: "var(--cyan)" }}
                >
                  cobos.io/cv
                </Link>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
        <div
          className="mono"
          style={{
            marginTop: mobile ? 48 : 80,
            paddingTop: 24,
            borderTop: "1px solid var(--hairline)",
            fontSize: "var(--text-mono)",
            color: "var(--muted)",
            display: "flex",
            flexDirection: mobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: mobile ? "flex-start" : "center",
            flexWrap: "wrap",
            gap: mobile ? 6 : 12,
          }}
        >
          <span style={{ color: "var(--cyan)" }}>{t.contact.connectionAlive}</span>
          <span>{t.contact.consoleVersion}</span>
          <span>$ exit 0 · © 2026 ernesto cobos</span>
        </div>
      </div>
    </section>
  );
}

/* ─── Root ───────────────────────────────────────────────── */
export default function Portfolio({ posts }: { posts: Post[] }) {
  const mobile = useIsMobile();
  return (
    <div className="cobos-art">
      <span id="top" aria-hidden style={{ position: "absolute" }} />
      <Hero mobile={mobile} />
      <Nav mobile={mobile} />
      <About mobile={mobile} />
      <ImpactStrip mobile={mobile} />
      <Stack mobile={mobile} />
      <Infra mobile={mobile} />
      <Work mobile={mobile} />
      <Experience mobile={mobile} />
      <Certifications mobile={mobile} />
      <Trends mobile={mobile} />
      <Blog mobile={mobile} posts={posts} />
      <Approach mobile={mobile} />
      <Contact mobile={mobile} />
      {LiveTerminal && <LiveTerminal />}
    </div>
  );
}
